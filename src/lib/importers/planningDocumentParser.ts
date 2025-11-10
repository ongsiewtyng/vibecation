import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { parseDateFlexible } from './travelImporter';

interface ParsedSection {
  type: 'accommodations' | 'transport' | 'flights';
  data: any[];
}

interface PlanningDocumentResult {
  success: boolean;
  summary: {
    accommodations: { created: number; updated: number };
    transport: { created: number; updated: number };
  };
  errors: string[];
  warnings: string[];
}

/**
 * Custom parser for planning documents with mixed-section layout
 * (like the user's Travel_Itinerary.xlsx)
 */
export async function parsePlanningDocument(
  file: File,
  tripRef?: string
): Promise<PlanningDocumentResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const result: PlanningDocumentResult = {
    success: false,
    summary: {
      accommodations: { created: 0, updated: 0 },
      transport: { created: 0, updated: 0 },
    },
    errors,
    warnings,
  };

  try {
    // Read the file
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    // Find sections by looking for section headers
    const sections = identifySections(rawData);

    // If no trip_ref provided, try to extract from date range or create default
    let resolvedTripRef = tripRef;
    if (!resolvedTripRef) {
      resolvedTripRef = extractTripRefFromDocument(rawData);
      warnings.push(`No trip_ref provided. Using auto-generated: ${resolvedTripRef}`);
    }

    // Get or create the trip
    const tripId = await resolveOrCreateTrip(resolvedTripRef, rawData, errors);
    if (!tripId) {
      errors.push('Could not resolve or create trip. Import aborted.');
      return result;
    }

    // Parse accommodations section
    if (sections.accommodations.start >= 0) {
      const accommodations = parseAccommodationsSection(
        rawData,
        sections.accommodations.start,
        sections.accommodations.end,
        tripId
      );
      result.summary.accommodations.created = await insertAccommodations(accommodations, errors);
    }

    // Parse transport/flights section
    if (sections.transport.start >= 0) {
      const transports = parseTransportSection(
        rawData,
        sections.transport.start,
        sections.transport.end,
        tripId
      );
      result.summary.transport.created = await insertTransports(transports, errors);
    }

    if (sections.flights.start >= 0) {
      const flights = parseFlightsSection(
        rawData,
        sections.flights.start,
        sections.flights.end,
        tripId
      );
      result.summary.transport.created += await insertTransports(flights, errors);
    }

    result.success = errors.length === 0;
    return result;
  } catch (error) {
    errors.push(`Fatal error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
}

/**
 * Identify section boundaries in the document
 */
function identifySections(data: any[][]): {
  accommodations: { start: number; end: number };
  transport: { start: number; end: number };
  flights: { start: number; end: number };
} {
  const sections = {
    accommodations: { start: -1, end: -1 },
    transport: { start: -1, end: -1 },
    flights: { start: -1, end: -1 },
  };

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const firstCell = row[0]?.toString().toLowerCase() || '';

    // Look for section headers
    if (firstCell.includes('accomodation') || firstCell.includes('accommodation')) {
      sections.accommodations.start = i + 1; // Data starts next row
    }
    if (firstCell.includes('train') && sections.transport.start === -1) {
      sections.transport.start = i + 1;
    }
    if (firstCell.includes('flight') && sections.flights.start === -1) {
      sections.flights.start = i + 1;
    }

    // Find section ends (empty rows or new sections)
    if (sections.accommodations.start > 0 && sections.accommodations.end === -1) {
      if (isEmptyRow(row) || i > sections.accommodations.start + 20) {
        sections.accommodations.end = i;
      }
    }
  }

  return sections;
}

function isEmptyRow(row: any[]): boolean {
  return !row || row.every(cell => !cell || cell.toString().trim() === '');
}

/**
 * Extract trip reference from document (e.g., date range "25 May - 8 June")
 */
function extractTripRefFromDocument(data: any[][]): string {
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    for (const cell of row) {
      if (cell) {
        const text = cell.toString();
        // Look for date patterns like "25 May - 8 June"
        if (text.match(/\d+\s+\w+\s*-\s*\d+\s+\w+/)) {
          return `TRIP_${text.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')}`;
        }
      }
    }
  }
  return `TRIP_${Date.now()}`;
}

/**
 * Resolve trip ID or create new trip
 */
async function resolveOrCreateTrip(
  tripRef: string,
  rawData: any[][],
  errors: string[]
): Promise<string | null> {
  try {
    // Try to find existing trip by notes containing trip_ref
    const { data: existingTrips } = await supabase
      .from('trips')
      .select('id')
      .ilike('notes', `%${tripRef}%`)
      .limit(1);

    if (existingTrips && existingTrips.length > 0) {
      return existingTrips[0].id;
    }

    // Create new trip
    const tripTitle = `Imported: ${tripRef}`;
    const { data: newTrip, error } = await supabase
      .from('trips')
      .insert({
        title: tripTitle,
        destination: 'Multiple Cities',
        country: 'Multiple Countries',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        notes: `trip_ref: ${tripRef}`,
      })
      .select('id')
      .single();

    if (error) {
      errors.push(`Failed to create trip: ${error.message}`);
      return null;
    }

    return newTrip.id;
  } catch (error) {
    errors.push(`Error resolving trip: ${error instanceof Error ? error.message : 'Unknown'}`);
    return null;
  }
}

/**
 * Parse accommodations section
 */
function parseAccommodationsSection(
  data: any[][],
  start: number,
  end: number,
  tripId: string
): any[] {
  const accommodations: any[] = [];
  
  // Find header row (contains "Name", "Check-In", etc.)
  let headerRow = -1;
  for (let i = start; i < Math.min(start + 5, data.length); i++) {
    const row = data[i];
    const hasName = row.some(c => c?.toString().toLowerCase().includes('name'));
    const hasCheckIn = row.some(c => c?.toString().toLowerCase().includes('check'));
    if (hasName && hasCheckIn) {
      headerRow = i;
      break;
    }
  }

  if (headerRow === -1) return accommodations;

  const headers = data[headerRow].map(h => h?.toString().toLowerCase().trim() || '');
  const nameIdx = headers.findIndex(h => h === 'name');
  const checkInIdx = headers.findIndex(h => h.includes('check-in') || h.includes('checkin'));
  const addressIdx = headers.findIndex(h => h.includes('address') || h.includes('map'));
  const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('total'));

  // Parse data rows
  for (let i = headerRow + 1; i < (end > 0 ? end : data.length); i++) {
    const row = data[i];
    if (isEmptyRow(row)) continue;

    const name = row[nameIdx]?.toString().trim();
    if (!name || name.length < 3) continue;

    // Extract dates from name if in format "Name (25 May - 28 May)"
    const dateMatch = name.match(/\((\d+\s+\w+)\s*-\s*(\d+\s+\w+)\)/);
    let checkIn = null;
    let checkOut = null;

    if (dateMatch) {
      checkIn = parseDateFlexible(dateMatch[1] + ' 2026');
      checkOut = parseDateFlexible(dateMatch[2] + ' 2026');
    }

    const accommodation = {
      trip_id: tripId,
      name: name.split('(')[0].trim(), // Remove date suffix
      address: addressIdx >= 0 ? row[addressIdx]?.toString() : null,
      check_in: checkIn || new Date().toISOString().split('T')[0],
      check_out: checkOut || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: priceIdx >= 0 ? parseFloat(row[priceIdx]?.toString().replace(/[^0-9.]/g, '') || '0') : null,
      notes: null,
    };

    accommodations.push(accommodation);
  }

  return accommodations;
}

/**
 * Parse transport/trains section
 */
function parseTransportSection(
  data: any[][],
  start: number,
  end: number,
  tripId: string
): any[] {
  const transports: any[] = [];

  for (let i = start; i < (end > 0 ? end : data.length); i++) {
    const row = data[i];
    if (isEmptyRow(row)) continue;

    const route = row[0]?.toString();
    if (!route || !route.includes('-')) continue;

    const [from, to] = route.split('-').map(s => s.trim());
    const cost = row[1]?.toString().replace(/[^0-9.]/g, '');
    const date = row[2]?.toString();
    const time = row[3]?.toString();

    transports.push({
      trip_id: tripId,
      type: 'Train',
      from_location: from,
      to_location: to,
      departure_time: parseDateFlexible(date + ' ' + time?.split('-')[0]),
      arrival_time: parseDateFlexible(date + ' ' + time?.split('-')[1]),
      cost: cost ? parseFloat(cost) : null,
      notes: row[4]?.toString() || null,
    });
  }

  return transports;
}

/**
 * Parse flights section
 */
function parseFlightsSection(
  data: any[][],
  start: number,
  end: number,
  tripId: string
): any[] {
  const flights: any[] = [];

  for (let i = start; i < Math.min(start + 10, data.length); i++) {
    const row = data[i];
    if (isEmptyRow(row)) continue;

    const airline = row[0]?.toString();
    if (!airline || airline.length < 3) continue;

    const destination = row[2]?.toString();
    const departFlight = row[3]?.toString();
    const price = row[6]?.toString()?.replace(/[^0-9.]/g, '');

    if (destination) {
      flights.push({
        trip_id: tripId,
        type: 'Flight',
        from_location: 'PEN',
        to_location: destination,
        departure_time: parseDateFlexible(departFlight),
        cost: price ? parseFloat(price) : null,
        notes: `Airline: ${airline}`,
      });
    }
  }

  return flights;
}

async function insertAccommodations(accommodations: any[], errors: string[]): Promise<number> {
  if (accommodations.length === 0) return 0;

  try {
    const { data, error } = await supabase
      .from('accommodations')
      .insert(accommodations)
      .select();

    if (error) {
      errors.push(`Accommodations insert error: ${error.message}`);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    errors.push(`Accommodations error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return 0;
  }
}

async function insertTransports(transports: any[], errors: string[]): Promise<number> {
  if (transports.length === 0) return 0;

  try {
    const { data, error } = await supabase
      .from('transports')
      .insert(transports)
      .select();

    if (error) {
      errors.push(`Transport insert error: ${error.message}`);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    errors.push(`Transport error: ${error instanceof Error ? error.message : 'Unknown'}`);
    return 0;
  }
}
