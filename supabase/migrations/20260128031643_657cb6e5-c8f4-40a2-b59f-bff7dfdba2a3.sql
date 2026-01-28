-- Create enum for sheet types
CREATE TYPE public.sheet_type AS ENUM ('itinerary', 'blank', 'budget', 'places', 'packing');

-- Workbooks table (container for sheets)
CREATE TABLE public.workbooks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Workbook',
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  trip_id UUID REFERENCES public.trips(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sheets table (tabs within a workbook)
CREATE TABLE public.sheets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  workbook_id UUID NOT NULL REFERENCES public.workbooks(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Sheet 1',
  type public.sheet_type NOT NULL DEFAULT 'blank',
  position INTEGER NOT NULL DEFAULT 0,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sheet cells for blank/grid sheets (sparse storage - only stores non-empty cells)
CREATE TABLE public.sheet_cells (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE,
  row_index INTEGER NOT NULL,
  col_index INTEGER NOT NULL,
  value TEXT,
  formula TEXT,
  format JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sheet_id, row_index, col_index)
);

-- Sheet metadata for grid dimensions
CREATE TABLE public.sheet_grid_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sheet_id UUID NOT NULL REFERENCES public.sheets(id) ON DELETE CASCADE UNIQUE,
  row_count INTEGER NOT NULL DEFAULT 100,
  col_count INTEGER NOT NULL DEFAULT 26,
  frozen_rows INTEGER DEFAULT 0,
  frozen_cols INTEGER DEFAULT 0,
  column_widths JSONB DEFAULT '{}',
  row_heights JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_workbooks_owner ON public.workbooks(owner_id);
CREATE INDEX idx_workbooks_trip ON public.workbooks(trip_id);
CREATE INDEX idx_sheets_workbook ON public.sheets(workbook_id);
CREATE INDEX idx_sheets_position ON public.sheets(workbook_id, position);
CREATE INDEX idx_sheet_cells_sheet ON public.sheet_cells(sheet_id);
CREATE INDEX idx_sheet_cells_position ON public.sheet_cells(sheet_id, row_index, col_index);

-- Enable RLS
ALTER TABLE public.workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_grid_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workbooks (allow all for now since no auth required per project vision)
CREATE POLICY "Allow all on workbooks"
  ON public.workbooks FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sheets
CREATE POLICY "Allow all on sheets"
  ON public.sheets FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sheet_cells
CREATE POLICY "Allow all on sheet_cells"
  ON public.sheet_cells FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS Policies for sheet_grid_config
CREATE POLICY "Allow all on sheet_grid_config"
  ON public.sheet_grid_config FOR ALL
  USING (true)
  WITH CHECK (true);

-- Triggers for updated_at
CREATE TRIGGER update_workbooks_updated_at
  BEFORE UPDATE ON public.workbooks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sheets_updated_at
  BEFORE UPDATE ON public.sheets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sheet_cells_updated_at
  BEFORE UPDATE ON public.sheet_cells
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sheet_grid_config_updated_at
  BEFORE UPDATE ON public.sheet_grid_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();