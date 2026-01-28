import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  Workbook, 
  Sheet, 
  SheetCreateInput, 
  WorkbookCreateInput,
  SheetType,
  SheetConfig
} from "@/types/workbook";
import type { Json } from "@/integrations/supabase/types";

// Fetch all workbooks
export function useWorkbooks() {
  return useQuery({
    queryKey: ["workbooks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workbooks")
        .select("*")
        .order("updated_at", { ascending: false });
      
      if (error) throw error;
      return data as Workbook[];
    },
  });
}

// Fetch single workbook with sheets
export function useWorkbook(workbookId: string | undefined) {
  return useQuery({
    queryKey: ["workbook", workbookId],
    queryFn: async () => {
      if (!workbookId) return null;
      
      const { data, error } = await supabase
        .from("workbooks")
        .select("*")
        .eq("id", workbookId)
        .maybeSingle();
      
      if (error) throw error;
      return data as Workbook | null;
    },
    enabled: !!workbookId,
  });
}

// Fetch sheets for a workbook
export function useSheets(workbookId: string | undefined) {
  return useQuery({
    queryKey: ["sheets", workbookId],
    queryFn: async () => {
      if (!workbookId) return [];
      
      const { data, error } = await supabase
        .from("sheets")
        .select("*")
        .eq("workbook_id", workbookId)
        .order("position", { ascending: true });
      
      if (error) throw error;
      return data as Sheet[];
    },
    enabled: !!workbookId,
  });
}

// Create workbook mutation
export function useCreateWorkbook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: WorkbookCreateInput) => {
      const { data, error } = await supabase
        .from("workbooks")
        .insert({
          title: input.title || "Untitled Workbook",
          owner_id: input.owner_id || null,
          trip_id: input.trip_id || null,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create default sheet
      const { error: sheetError } = await supabase
        .from("sheets")
        .insert({
          workbook_id: data.id,
          title: "Sheet 1",
          type: "blank",
          position: 0,
        });
      
      if (sheetError) throw sheetError;
      
      return data as Workbook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbooks"] });
    },
  });
}

// Update workbook mutation
export function useUpdateWorkbook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Workbook> & { id: string }) => {
      const { data, error } = await supabase
        .from("workbooks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Workbook;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["workbooks"] });
      queryClient.invalidateQueries({ queryKey: ["workbook", data.id] });
    },
  });
}

// Delete workbook mutation
export function useDeleteWorkbook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("workbooks")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workbooks"] });
    },
  });
}

// Create sheet mutation
export function useCreateSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: SheetCreateInput) => {
      // Get current max position
      const { data: existingSheets } = await supabase
        .from("sheets")
        .select("position")
        .eq("workbook_id", input.workbook_id)
        .order("position", { ascending: false })
        .limit(1);
      
      const nextPosition = existingSheets && existingSheets.length > 0 
        ? existingSheets[0].position + 1 
        : 0;
      
      const configJson = (input.config || {}) as Json;
      
      const { data, error } = await supabase
        .from("sheets")
        .insert({
          workbook_id: input.workbook_id,
          title: input.title || `Sheet ${nextPosition + 1}`,
          type: input.type || "blank",
          position: input.position ?? nextPosition,
          config: configJson,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If blank sheet, create grid config
      if (data.type === "blank") {
        await supabase.from("sheet_grid_config").insert({
          sheet_id: data.id,
          row_count: 100,
          col_count: 26,
        });
      }
      
      return data as Sheet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheets", data.workbook_id] });
    },
  });
}

// Update sheet mutation
export function useUpdateSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, config, ...updates }: Partial<Sheet> & { id: string }) => {
      const updatePayload: Record<string, unknown> = { ...updates };
      if (config !== undefined) {
        updatePayload.config = config as Json;
      }
      
      const { data, error } = await supabase
        .from("sheets")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data as Sheet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheets", data.workbook_id] });
    },
  });
}

// Delete sheet mutation
export function useDeleteSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, workbook_id }: { id: string; workbook_id: string }) => {
      const { error } = await supabase
        .from("sheets")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { workbook_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheets", data.workbook_id] });
    },
  });
}

// Reorder sheets mutation
export function useReorderSheets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      workbook_id, 
      sheet_ids 
    }: { 
      workbook_id: string; 
      sheet_ids: string[] 
    }) => {
      const updates = sheet_ids.map((id, index) => ({
        id,
        position: index,
      }));
      
      for (const update of updates) {
        const { error } = await supabase
          .from("sheets")
          .update({ position: update.position })
          .eq("id", update.id);
        
        if (error) throw error;
      }
      
      return { workbook_id };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheets", data.workbook_id] });
    },
  });
}

// Duplicate sheet mutation
export function useDuplicateSheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sheet, newTitle }: { sheet: Sheet; newTitle?: string }) => {
      // Get max position
      const { data: existingSheets } = await supabase
        .from("sheets")
        .select("position")
        .eq("workbook_id", sheet.workbook_id)
        .order("position", { ascending: false })
        .limit(1);
      
      const nextPosition = existingSheets && existingSheets.length > 0 
        ? existingSheets[0].position + 1 
        : 0;
      
      const configJson = (sheet.config || {}) as Json;
      
      // Create new sheet
      const { data: newSheet, error } = await supabase
        .from("sheets")
        .insert({
          workbook_id: sheet.workbook_id,
          title: newTitle || `${sheet.title} (Copy)`,
          type: sheet.type,
          position: nextPosition,
          config: configJson,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // If blank sheet, copy cells and config
      if (sheet.type === "blank") {
        // Copy grid config
        const { data: gridConfig } = await supabase
          .from("sheet_grid_config")
          .select("*")
          .eq("sheet_id", sheet.id)
          .maybeSingle();
        
        if (gridConfig) {
          await supabase.from("sheet_grid_config").insert({
            sheet_id: newSheet.id,
            row_count: gridConfig.row_count,
            col_count: gridConfig.col_count,
            frozen_rows: gridConfig.frozen_rows,
            frozen_cols: gridConfig.frozen_cols,
            column_widths: gridConfig.column_widths,
            row_heights: gridConfig.row_heights,
          });
        }
        
        // Copy cells
        const { data: cells } = await supabase
          .from("sheet_cells")
          .select("*")
          .eq("sheet_id", sheet.id);
        
        if (cells && cells.length > 0) {
          const newCells = cells.map(cell => ({
            sheet_id: newSheet.id,
            row_index: cell.row_index,
            col_index: cell.col_index,
            value: cell.value,
            formula: cell.formula,
            format: cell.format,
          }));
          
          await supabase.from("sheet_cells").insert(newCells);
        }
      }
      
      return newSheet as Sheet;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheets", data.workbook_id] });
    },
  });
}
