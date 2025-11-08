import * as XLSX from "xlsx";
import { parse, isValid } from "date-fns";
import { supabase } from "@/integrations/supabase/client";

// ============= TYPES =============

export type SheetType =
  | "trips"
  | "itinerary_items"
  | "accommodations"
  | "transports"
  | "expenses"
  | "packing_items"
  | "wishlist"
  | "unknown";

export interface MappedHeaders {
  [canonicalName: string]: string; // canonical -> actual header in sheet
}

export interface ImportResult {
  summary: {
    [table: string]: {
      created: number;
      updated: number;
      skipped: number;
    };
  };
  errors: {
    sheet: string;
    row: number;
    reason: string;
    context?: string;
  }[];
  warnings: string[];
}

export interface ImportOptions {
  dryRun?: boolean;
}

interface NormalizedRow {
  [key: string]: any;
}

// ============= COLUMN SYNONYMS =============

const COLUMN_SYNONYMS: Record<string, string[]> = {
  // Trips
  title: ["title", "trip", "trip_title", "trip_name", "name"],
  destination: ["destination", "city", "place", "location"],
  country: ["country", "nation", "country_name"],
  start_date: ["start_date", "begin", "from", "date_from", "start", "departure"],
  end_date: ["end_date", "to", "date_to", "end", "return"],
  budget: ["budget", "price", "cost", "est_cost", "total_cost"],
  notes: ["notes", "remark", "remarks", "comments", "comment", "description"],
  trip_ref: ["trip_ref", "ref", "trip_id_ref", "group", "trip_code"],

  // Itinerary
  day_number: ["day", "day_no", "day_number", "dayno"],
  date: ["date", "day_date"],
  time: ["time", "hour", "at", "timing"],
  location: ["location", "place", "address", "where"],

  // Accommodations
  name: ["name", "hotel", "accommodation", "stay", "property"],
  address: ["address", "addr", "street"],
  check_in: ["check_in", "checkin", "start", "from", "arrival"],
  check_out: ["check_out", "checkout", "end", "to", "departure"],
  confirmation_number: ["confirmation_number", "confirmation", "booking_ref", "ref_no", "booking_number"],

  // Transports
  mode: ["mode", "transport", "type", "transport_type"],
  from: ["from", "origin", "depart", "start_location", "departure_location"],
  to: ["to", "destination", "arrive", "end_location", "arrival_location"],
  depart_time: ["depart_time", "departure", "leave_at", "departure_time"],
  arrival_time: ["arrival_time", "arrival", "arrive_at"],

  // Expenses
  category: ["category", "type", "expense_type"],
  description: ["description", "desc", "item", "expense_description"],
  amount: ["amount", "cost", "price", "fee", "value"],

  // Packing
  item: ["item", "thing", "object", "packing_item"],
  packed: ["packed", "is_packed", "done", "checked", "complete"],

  // Wishlist
  place: ["place", "location", "spot", "destination"],
  priority: ["priority", "prio", "rank", "importance"],
  tags: ["tags", "labels", "categories", "keywords"],
};

// ============= SHEET TYPE SIGNATURES =============

const SHEET_SIGNATURES: Record<SheetType, string[]> = {
  trips: ["title", "destination", "country", "start_date", "end_date"],
  itinerary_items: ["trip_ref", "day_number", "title", "date"],
  accommodations: ["trip_ref", "name", "check_in", "check_out"],
  transports: ["trip_ref", "mode", "from", "to", "depart_time"],
  expenses: ["trip_ref", "category", "description", "amount", "date"],
  packing_items: ["trip_ref", "item"],
  wishlist: ["place", "country"],
  unknown: [],
};

// ============= HELPERS =============

/**
 * Normalize header: lowercase, replace spaces/underscores with empty string
 */
function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/[\s_-]/g, "");
}

/**
 * Map actual headers to canonical names using synonyms
 */
export function detectAndMapColumns(headers: string[]): MappedHeaders {
  const mapped: MappedHeaders = {};
  const normalizedHeaders = headers.map((h) => ({
    original: h,
    normalized: normalizeHeader(h),
  }));

  for (const [canonical, synonyms] of Object.entries(COLUMN_SYNONYMS)) {
    for (const synonym of synonyms) {
      const normalizedSynonym = normalizeHeader(synonym);
      const found = normalizedHeaders.find((h) => h.normalized === normalizedSynonym);
      if (found) {
        mapped[canonical] = found.original;
        break;
      }
    }
  }

  return mapped;
}

/**
 * Infer sheet type by checking how many expected columns are present
 */
export function inferSheetType(headers: string[]): SheetType {
  const mapped = detectAndMapColumns(headers);
  const mappedKeys = new Set(Object.keys(mapped));

  let bestMatch: SheetType = "unknown";
  let bestScore = 0;

  for (const [sheetType, signature] of Object.entries(SHEET_SIGNATURES)) {
    if (sheetType === "unknown") continue;

    const matches = signature.filter((col) => mappedKeys.has(col)).length;
    const score = signature.length > 0 ? matches / signature.length : 0;

    if (score > bestScore) {
      bestScore = score;
      bestMatch = sheetType as SheetType;
    }
  }

  // Require at least 50% match
  return bestScore >= 0.5 ? bestMatch : "unknown";
}

/**
 * Parse date flexibly from various formats
 */
export function parseDateFlexible(dateValue: any): string | null {
  if (!dateValue) return null;

  // Already ISO format
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
    return dateValue.split("T")[0]; // Take date part only
  }

  // Try DD/MM/YYYY
  if (typeof dateValue === "string") {
    const ddmmyyyy = parse(dateValue, "dd/MM/yyyy", new Date());
    if (isValid(ddmmyyyy)) {
      return ddmmyyyy.toISOString().split("T")[0];
    }

    // Try MM/DD/YYYY
    const mmddyyyy = parse(dateValue, "MM/dd/yyyy", new Date());
    if (isValid(mmddyyyy)) {
      return mmddyyyy.toISOString().split("T")[0];
    }

    // Try YYYY/MM/DD
    const yyyymmdd = parse(dateValue, "yyyy/MM/dd", new Date());
    if (isValid(yyyymmdd)) {
      return yyyymmdd.toISOString().split("T")[0];
    }
  }

  // Excel serial number
  if (typeof dateValue === "number" && dateValue > 0) {
    try {
      const excelDate = XLSX.SSF.parse_date_code(dateValue);
      if (excelDate && excelDate.y && excelDate.m && excelDate.d) {
        return `${excelDate.y}-${String(excelDate.m).padStart(2, "0")}-${String(excelDate.d).padStart(2, "0")}`;
      }
    } catch (e) {
      // Fall through
    }
  }

  return null;
}

/**
 * Coerce value to boolean
 */
function toBoolean(value: any): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const lower = value.toLowerCase().trim();
    return ["true", "yes", "y", "1"].includes(lower);
  }
  return false;
}

/**
 * Normalize row based on sheet type and mapped headers
 */
export function normalizeRow(sheetType: SheetType, row: any, mapped: MappedHeaders): NormalizedRow {
  const normalized: NormalizedRow = {};

  for (const [canonical, actualHeader] of Object.entries(mapped)) {
    const value = row[actualHeader];
    if (value === undefined || value === null || value === "") continue;

    // Type coercion
    if (["start_date", "end_date", "date", "check_in", "check_out"].includes(canonical)) {
      normalized[canonical] = parseDateFlexible(value);
    } else if (["budget", "cost", "amount"].includes(canonical)) {
      normalized[canonical] = parseFloat(String(value).replace(/[^0-9.-]/g, "")) || null;
    } else if (canonical === "packed") {
      normalized[canonical] = toBoolean(value);
    } else if (canonical === "priority") {
      const num = parseInt(String(value), 10);
      normalized[canonical] = isNaN(num) ? 3 : Math.max(1, Math.min(5, num));
    } else if (canonical === "tags") {
      normalized[canonical] = typeof value === "string" ? value.split(",").map((t) => t.trim()) : [];
    } else if (["day_number"].includes(canonical)) {
      normalized[canonical] = parseInt(String(value), 10) || null;
    } else {
      normalized[canonical] = String(value).trim();
    }
  }

  return normalized;
}

// ============= BATCH OPERATIONS =============

async function batchInsert(table: string, rows: any[], batchSize = 100): Promise<number> {
  let inserted = 0;
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    // Use type assertion for dynamic table names
    const { data, error } = await (supabase.from as any)(table).insert(batch).select();
    if (!error && data) {
      inserted += data.length;
    }
  }
  return inserted;
}

// ============= MAIN IMPORT FUNCTION =============

export async function importWorkbook(file: File, options: ImportOptions = {}): Promise<ImportResult> {
  const { dryRun = false } = options;

  const result: ImportResult = {
    summary: {},
    errors: [],
    warnings: [],
  };

  try {
    // Read workbook
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });

    // Parse all sheets
    const sheetData: Array<{
      name: string;
      type: SheetType;
      mapped: MappedHeaders;
      rows: any[];
    }> = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);
      if (rows.length === 0) continue;

      const headers = Object.keys(rows[0]);
      const mapped = detectAndMapColumns(headers);
      const type = inferSheetType(headers);

      if (type === "unknown") {
        result.warnings.push(`Sheet "${sheetName}" has unknown structure, skipping`);
        continue;
      }

      sheetData.push({ name: sheetName, type, mapped, rows });
    }

    // Initialize summary
    const allTypes = new Set(sheetData.map((s) => s.type));
    for (const type of allTypes) {
      result.summary[type] = { created: 0, updated: 0, skipped: 0 };
    }

    // Trip ref mapping
    const tripRefMap = new Map<string, string>();

    // STEP 1: Import trips first
    const tripSheets = sheetData.filter((s) => s.type === "trips");
    for (const sheet of tripSheets) {
      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        try {
          const normalized = normalizeRow("trips", row, sheet.mapped);

          if (!normalized.title || !normalized.destination || !normalized.country) {
            result.errors.push({
              sheet: sheet.name,
              row: i + 2,
              reason: "Missing required fields: title, destination, or country",
            });
            result.summary.trips.skipped++;
            continue;
          }

          const tripData: any = {
            title: normalized.title,
            destination: normalized.destination,
            country: normalized.country,
            start_date: normalized.start_date,
            end_date: normalized.end_date,
            budget: normalized.budget,
            notes: normalized.notes,
          };

          if (!dryRun) {
            // Check if trip exists
            const { data: existing } = await supabase
              .from("trips")
              .select("id")
              .eq("title", tripData.title)
              .eq("start_date", tripData.start_date)
              .eq("destination", tripData.destination)
              .maybeSingle();

            if (existing) {
              await supabase.from("trips").update(tripData).eq("id", existing.id);
              result.summary.trips.updated++;
              if (normalized.trip_ref) {
                tripRefMap.set(String(normalized.trip_ref), existing.id);
              }
            } else {
              const { data: newTrip } = await supabase.from("trips").insert([tripData]).select().single();
              result.summary.trips.created++;
              if (newTrip && normalized.trip_ref) {
                tripRefMap.set(String(normalized.trip_ref), newTrip.id);
              }
            }
          } else {
            result.summary.trips.created++;
            if (normalized.trip_ref) {
              tripRefMap.set(String(normalized.trip_ref), `dry-run-${i}`);
            }
          }
        } catch (error: any) {
          result.errors.push({
            sheet: sheet.name,
            row: i + 2,
            reason: error.message || "Unknown error",
          });
        }
      }
    }

    // STEP 2: Import child tables with batching
    const childSheets = sheetData.filter((s) => s.type !== "trips" && s.type !== "wishlist");

    for (const sheet of childSheets) {
      const batchRows: any[] = [];

      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        try {
          const normalized = normalizeRow(sheet.type, row, sheet.mapped);

          // Resolve trip_id
          let tripId: string | null = null;
          if (normalized.trip_ref) {
            tripId = tripRefMap.get(String(normalized.trip_ref)) || null;
          }

          if (!tripId) {
            result.errors.push({
              sheet: sheet.name,
              row: i + 2,
              reason: `Cannot resolve trip_ref: ${normalized.trip_ref || "missing"}`,
            });
            result.summary[sheet.type].skipped++;
            continue;
          }

          // Build insert data based on type
          let insertData: any = { trip_id: tripId };

          switch (sheet.type) {
            case "itinerary_items":
              insertData = {
                ...insertData,
                day_number: normalized.day_number,
                date: normalized.date,
                time: normalized.time,
                title: normalized.title,
                description: normalized.description,
                location: normalized.location,
              };
              break;

            case "accommodations":
              insertData = {
                ...insertData,
                name: normalized.name,
                address: normalized.address,
                check_in: normalized.check_in,
                check_out: normalized.check_out,
                confirmation_number: normalized.confirmation_number,
                cost: normalized.cost,
                notes: normalized.notes,
              };
              break;

            case "transports":
              insertData = {
                ...insertData,
                type: normalized.mode,
                from_location: normalized.from,
                to_location: normalized.to,
                departure_time: normalized.depart_time,
                arrival_time: normalized.arrival_time,
                cost: normalized.cost,
                confirmation_number: normalized.confirmation_number,
                notes: normalized.notes,
              };
              break;

            case "expenses":
              insertData = {
                ...insertData,
                category: normalized.category,
                description: normalized.description,
                amount: normalized.amount,
                date: normalized.date,
                notes: normalized.notes,
              };
              break;

            case "packing_items":
              insertData = {
                ...insertData,
                item: normalized.item,
                category: normalized.category,
                packed: normalized.packed || false,
              };
              break;
          }

          batchRows.push(insertData);
        } catch (error: any) {
          result.errors.push({
            sheet: sheet.name,
            row: i + 2,
            reason: error.message || "Unknown error",
          });
        }
      }

      // Batch insert
      if (batchRows.length > 0 && !dryRun) {
        const inserted = await batchInsert(sheet.type, batchRows, 100);
        result.summary[sheet.type].created += inserted;
      } else if (dryRun) {
        result.summary[sheet.type].created += batchRows.length;
      }
    }

    // STEP 3: Import wishlist (no trip_id needed)
    const wishlistSheets = sheetData.filter((s) => s.type === "wishlist");
    for (const sheet of wishlistSheets) {
      const batchRows: any[] = [];

      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        try {
          const normalized = normalizeRow("wishlist", row, sheet.mapped);

          if (!normalized.place || !normalized.country) {
            result.errors.push({
              sheet: sheet.name,
              row: i + 2,
              reason: "Missing required fields: place or country",
            });
            result.summary.wishlist.skipped++;
            continue;
          }

          batchRows.push({
            place: normalized.place,
            country: normalized.country,
            priority: normalized.priority || 3,
            tags: normalized.tags || [],
            notes: normalized.notes,
          });
        } catch (error: any) {
          result.errors.push({
            sheet: sheet.name,
            row: i + 2,
            reason: error.message || "Unknown error",
          });
        }
      }

      if (batchRows.length > 0 && !dryRun) {
        const inserted = await batchInsert("wishlist", batchRows, 100);
        result.summary.wishlist.created += inserted;
      } else if (dryRun) {
        result.summary.wishlist.created += batchRows.length;
      }
    }

    return result;
  } catch (error: any) {
    result.errors.push({
      sheet: "N/A",
      row: 0,
      reason: `Fatal error: ${error.message}`,
    });
    return result;
  }
}
