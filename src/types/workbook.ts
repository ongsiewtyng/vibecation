export interface Workbook {
  id: string;
  title: string;
  owner_id: string | null;
  trip_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkbookWithSheets extends Workbook {
  sheets: Sheet[];
}

export interface Sheet {
  id: string;
  workbook_id: string;
  title: string;
  type: SheetType;
  position: number;
  config: SheetConfig;
  created_at: string;
  updated_at: string;
}

export type SheetType = 'itinerary' | 'blank' | 'budget' | 'places' | 'packing';

export interface SheetConfig {
  trip_id?: string;
  [key: string]: unknown;
}

export interface SheetCell {
  id: string;
  sheet_id: string;
  row_index: number;
  col_index: number;
  value: string | null;
  formula: string | null;
  format: CellFormat;
  created_at: string;
  updated_at: string;
}

export interface CellFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  align?: 'left' | 'center' | 'right';
  [key: string]: unknown;
}

export interface SheetGridConfig {
  id: string;
  sheet_id: string;
  row_count: number;
  col_count: number;
  frozen_rows: number;
  frozen_cols: number;
  column_widths: Record<number, number>;
  row_heights: Record<number, number>;
  created_at: string;
  updated_at: string;
}

// Grid data representation for UI (sparse to dense conversion)
export interface GridData {
  cells: Map<string, SheetCell>; // key: "row,col"
  gridConfig: SheetGridConfig;
}

// For batch operations
export interface CellUpdate {
  row_index: number;
  col_index: number;
  value: string | null;
  formula?: string | null;
  format?: CellFormat;
}

export interface SheetCreateInput {
  workbook_id: string;
  title?: string;
  type?: SheetType;
  position?: number;
  config?: SheetConfig;
}

export interface WorkbookCreateInput {
  title?: string;
  owner_id?: string | null;
  trip_id?: string | null;
}
