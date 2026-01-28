import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCallback, useRef } from "react";
import type { SheetCell, SheetGridConfig, CellUpdate, CellFormat } from "@/types/workbook";
import type { Json } from "@/integrations/supabase/types";

// Fetch cells for a sheet
export function useSheetCells(sheetId: string | undefined) {
  return useQuery({
    queryKey: ["sheet-cells", sheetId],
    queryFn: async () => {
      if (!sheetId) return [];
      
      const { data, error } = await supabase
        .from("sheet_cells")
        .select("*")
        .eq("sheet_id", sheetId);
      
      if (error) throw error;
      return data as SheetCell[];
    },
    enabled: !!sheetId,
  });
}

// Fetch grid config for a sheet
export function useSheetGridConfig(sheetId: string | undefined) {
  return useQuery({
    queryKey: ["sheet-grid-config", sheetId],
    queryFn: async () => {
      if (!sheetId) return null;
      
      const { data, error } = await supabase
        .from("sheet_grid_config")
        .select("*")
        .eq("sheet_id", sheetId)
        .maybeSingle();
      
      if (error) throw error;
      
      // Return default if not found
      if (!data) {
        return {
          id: "",
          sheet_id: sheetId,
          row_count: 100,
          col_count: 26,
          frozen_rows: 0,
          frozen_cols: 0,
          column_widths: {},
          row_heights: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as SheetGridConfig;
      }
      
      return data as SheetGridConfig;
    },
    enabled: !!sheetId,
  });
}

// Update grid config
export function useUpdateGridConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sheetId, 
      updates 
    }: { 
      sheetId: string; 
      updates: Partial<SheetGridConfig> 
    }) => {
      const { data, error } = await supabase
        .from("sheet_grid_config")
        .update(updates)
        .eq("sheet_id", sheetId)
        .select()
        .single();
      
      if (error) throw error;
      return data as SheetGridConfig;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-grid-config", data.sheet_id] });
    },
  });
}

// Batch cell updates with debouncing
export function useBatchCellUpdates(sheetId: string) {
  const queryClient = useQueryClient();
  const pendingUpdates = useRef<Map<string, CellUpdate>>(new Map());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const flushUpdates = useCallback(async () => {
    if (pendingUpdates.current.size === 0) return;
    
    const updates = Array.from(pendingUpdates.current.values());
    pendingUpdates.current.clear();
    
    // Separate into upserts and deletes
    const upserts = updates.filter(u => u.value !== null && u.value !== "");
    const deletes = updates.filter(u => u.value === null || u.value === "");
    
    try {
      // Upsert non-empty cells
      if (upserts.length > 0) {
        const { error } = await supabase
          .from("sheet_cells")
          .upsert(
            upserts.map(u => ({
              sheet_id: sheetId,
              row_index: u.row_index,
              col_index: u.col_index,
              value: u.value,
              formula: u.formula ?? null,
              format: (u.format ?? {}) as Json,
            })),
            { onConflict: "sheet_id,row_index,col_index" }
          );
        
        if (error) throw error;
      }
      
      // Delete empty cells
      if (deletes.length > 0) {
        for (const d of deletes) {
          await supabase
            .from("sheet_cells")
            .delete()
            .eq("sheet_id", sheetId)
            .eq("row_index", d.row_index)
            .eq("col_index", d.col_index);
        }
      }
      
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", sheetId] });
    } catch (error) {
      console.error("Failed to save cells:", error);
    }
  }, [sheetId, queryClient]);
  
  const queueUpdate = useCallback((update: CellUpdate) => {
    const key = `${update.row_index},${update.col_index}`;
    pendingUpdates.current.set(key, update);
    
    // Debounce: flush after 500ms of no changes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(flushUpdates, 500);
  }, [flushUpdates]);
  
  const queueBatchUpdates = useCallback((updates: CellUpdate[]) => {
    updates.forEach(update => {
      const key = `${update.row_index},${update.col_index}`;
      pendingUpdates.current.set(key, update);
    });
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(flushUpdates, 500);
  }, [flushUpdates]);
  
  return { queueUpdate, queueBatchUpdates, flushUpdates };
}

// Direct cell update (non-debounced, for single cell edits)
export function useUpdateCell() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sheetId, 
      rowIndex, 
      colIndex, 
      value, 
      formula, 
      format 
    }: { 
      sheetId: string;
      rowIndex: number;
      colIndex: number;
      value: string | null;
      formula?: string | null;
      format?: CellFormat;
    }) => {
      if (value === null || value === "") {
        // Delete cell if empty
        const { error } = await supabase
          .from("sheet_cells")
          .delete()
          .eq("sheet_id", sheetId)
          .eq("row_index", rowIndex)
          .eq("col_index", colIndex);
        
        if (error) throw error;
        return null;
      }
      
      const { data, error } = await supabase
        .from("sheet_cells")
        .upsert({
          sheet_id: sheetId,
          row_index: rowIndex,
          col_index: colIndex,
          value,
          formula: formula ?? null,
          format: (format ?? {}) as Json,
        }, { onConflict: "sheet_id,row_index,col_index" })
        .select()
        .single();
      
      if (error) throw error;
      return data as SheetCell;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", variables.sheetId] });
    },
  });
}

// Add row mutation
export function useAddRow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sheetId, afterRowIndex }: { sheetId: string; afterRowIndex: number }) => {
      // Shift all cells below the new row down by 1
      const { data: cells, error: fetchError } = await supabase
        .from("sheet_cells")
        .select("*")
        .eq("sheet_id", sheetId)
        .gt("row_index", afterRowIndex)
        .order("row_index", { ascending: false });
      
      if (fetchError) throw fetchError;
      
      // Update cells from bottom to top to avoid conflicts
      for (const cell of cells || []) {
        await supabase
          .from("sheet_cells")
          .update({ row_index: cell.row_index + 1 })
          .eq("id", cell.id);
      }
      
      // Update grid config row count (increment manually)
      const { data: gridConfig } = await supabase
        .from("sheet_grid_config")
        .select("row_count")
        .eq("sheet_id", sheetId)
        .maybeSingle();
      
      if (gridConfig) {
        await supabase
          .from("sheet_grid_config")
          .update({ row_count: gridConfig.row_count + 1 })
          .eq("sheet_id", sheetId);
      }
      
      return { sheetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", data.sheetId] });
      queryClient.invalidateQueries({ queryKey: ["sheet-grid-config", data.sheetId] });
    },
  });
}

// Add column mutation
export function useAddColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sheetId, afterColIndex }: { sheetId: string; afterColIndex: number }) => {
      // Shift all cells to the right of the new column
      const { data: cells, error: fetchError } = await supabase
        .from("sheet_cells")
        .select("*")
        .eq("sheet_id", sheetId)
        .gt("col_index", afterColIndex)
        .order("col_index", { ascending: false });
      
      if (fetchError) throw fetchError;
      
      for (const cell of cells || []) {
        await supabase
          .from("sheet_cells")
          .update({ col_index: cell.col_index + 1 })
          .eq("id", cell.id);
      }
      
      return { sheetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", data.sheetId] });
      queryClient.invalidateQueries({ queryKey: ["sheet-grid-config", data.sheetId] });
    },
  });
}

// Delete row mutation
export function useDeleteRow() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sheetId, rowIndex }: { sheetId: string; rowIndex: number }) => {
      // Delete cells in the row
      await supabase
        .from("sheet_cells")
        .delete()
        .eq("sheet_id", sheetId)
        .eq("row_index", rowIndex);
      
      // Shift cells above down
      const { data: cells } = await supabase
        .from("sheet_cells")
        .select("*")
        .eq("sheet_id", sheetId)
        .gt("row_index", rowIndex)
        .order("row_index", { ascending: true });
      
      for (const cell of cells || []) {
        await supabase
          .from("sheet_cells")
          .update({ row_index: cell.row_index - 1 })
          .eq("id", cell.id);
      }
      
      return { sheetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", data.sheetId] });
    },
  });
}

// Delete column mutation
export function useDeleteColumn() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ sheetId, colIndex }: { sheetId: string; colIndex: number }) => {
      // Delete cells in the column
      await supabase
        .from("sheet_cells")
        .delete()
        .eq("sheet_id", sheetId)
        .eq("col_index", colIndex);
      
      // Shift cells to the right left
      const { data: cells } = await supabase
        .from("sheet_cells")
        .select("*")
        .eq("sheet_id", sheetId)
        .gt("col_index", colIndex)
        .order("col_index", { ascending: true });
      
      for (const cell of cells || []) {
        await supabase
          .from("sheet_cells")
          .update({ col_index: cell.col_index - 1 })
          .eq("id", cell.id);
      }
      
      return { sheetId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sheet-cells", data.sheetId] });
    },
  });
}
