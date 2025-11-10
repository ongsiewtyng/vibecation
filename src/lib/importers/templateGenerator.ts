import * as XLSX from 'xlsx';

/**
 * Generates a properly structured Excel template for travel data import
 * with separate sheets and example data
 */
export function generateImportTemplate(): void {
  const workbook = XLSX.utils.book_new();

  // 1. TRIPS SHEET
  const tripsData = [
    ['trip_ref', 'title', 'destination', 'country', 'start_date', 'end_date', 'budget', 'notes'],
    ['TRIP001', 'Summer Europe Trip', 'London', 'United Kingdom', '2026-05-25', '2026-06-08', '15000', 'Multi-city tour'],
    ['TRIP002', 'Tokyo Adventure', 'Tokyo', 'Japan', '2026-07-15', '2026-07-25', '8000', 'Business + leisure']
  ];
  const tripsSheet = XLSX.utils.aoa_to_sheet(tripsData);
  XLSX.utils.book_append_sheet(workbook, tripsSheet, 'Trips');

  // 2. ACCOMMODATIONS SHEET
  const accommodationsData = [
    ['trip_ref', 'name', 'address', 'check_in', 'check_out', 'confirmation_number', 'cost', 'notes'],
    ['TRIP001', 'Grand Plaza Hotel', '123 London Road, London', '2026-05-25', '2026-05-28', 'ABC123456', '2500', 'Near Bayswater station'],
    ['TRIP001', 'Paris Apartment', '45 Rue de Paris, Paris', '2026-05-29', '2026-06-02', 'XYZ789', '2400', 'Modern flat with parking']
  ];
  const accommodationsSheet = XLSX.utils.aoa_to_sheet(accommodationsData);
  XLSX.utils.book_append_sheet(workbook, accommodationsSheet, 'Accommodations');

  // 3. TRANSPORT SHEET
  const transportData = [
    ['trip_ref', 'type', 'from_location', 'to_location', 'departure_time', 'arrival_time', 'confirmation_number', 'cost', 'notes'],
    ['TRIP001', 'Flight', 'PEN', 'LHR', '2026-05-25 21:40', '2026-05-26 07:20', 'EMR123', '4223', 'Emirates via Dubai'],
    ['TRIP001', 'Train', 'London', 'Paris', '2026-05-29 13:31', '2026-05-29 16:59', 'EUR456', '250', 'Eurostar']
  ];
  const transportSheet = XLSX.utils.aoa_to_sheet(transportData);
  XLSX.utils.book_append_sheet(workbook, transportSheet, 'Transport');

  // 4. ITINERARY SHEET
  const itineraryData = [
    ['trip_ref', 'day_number', 'date', 'time', 'title', 'description', 'location'],
    ['TRIP001', '1', '2026-05-25', '14:00', 'Check-in at hotel', 'Arrive and settle in', 'Grand Plaza Hotel'],
    ['TRIP001', '1', '2026-05-25', '17:00', 'Evening walk', 'Explore Hyde Park', 'Hyde Park, London'],
    ['TRIP001', '2', '2026-05-26', '09:00', 'British Museum visit', 'See the Rosetta Stone', 'British Museum']
  ];
  const itinerarySheet = XLSX.utils.aoa_to_sheet(itineraryData);
  XLSX.utils.book_append_sheet(workbook, itinerarySheet, 'Itinerary');

  // 5. EXPENSES SHEET
  const expensesData = [
    ['trip_ref', 'category', 'description', 'amount', 'date', 'notes'],
    ['TRIP001', 'Food', 'Lunch at pub', '35', '2026-05-25', 'Fish and chips'],
    ['TRIP001', 'Entertainment', 'Museum tickets', '50', '2026-05-26', 'British Museum entry'],
    ['TRIP001', 'Transport', 'Oyster card top-up', '40', '2026-05-25', 'For tube travel']
  ];
  const expensesSheet = XLSX.utils.aoa_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(workbook, expensesSheet, 'Expenses');

  // 6. PACKING LIST SHEET
  const packingData = [
    ['trip_ref', 'item', 'category', 'packed'],
    ['TRIP001', 'Passport', 'Documents', 'true'],
    ['TRIP001', 'Travel adapter', 'Electronics', 'false'],
    ['TRIP001', 'Sunscreen', 'Toiletries', 'false'],
    ['TRIP001', 'Camera', 'Electronics', 'true']
  ];
  const packingSheet = XLSX.utils.aoa_to_sheet(packingData);
  XLSX.utils.book_append_sheet(workbook, packingSheet, 'Packing');

  // 7. WISHLIST SHEET (no trip_ref needed)
  const wishlistData = [
    ['place', 'country', 'priority', 'tags', 'notes'],
    ['Iceland', 'Iceland', '5', 'nature, adventure, northern lights', 'Winter trip to see aurora'],
    ['Santorini', 'Greece', '4', 'beach, romance, culture', 'Honeymoon destination'],
    ['New Zealand', 'New Zealand', '3', 'adventure, nature, hiking', 'Lord of the Rings tour']
  ];
  const wishlistSheet = XLSX.utils.aoa_to_sheet(wishlistData);
  XLSX.utils.book_append_sheet(workbook, wishlistSheet, 'Wishlist');

  // Generate and download the file
  const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Travel_Import_Template.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
