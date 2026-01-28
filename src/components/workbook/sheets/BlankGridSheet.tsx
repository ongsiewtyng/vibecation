import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useSheetCells, useSheetGridConfig, useBatchCellUpdates } from "@/hooks/useSheetCells";
import type { CellUpdate } from "@/types/workbook";

interface BlankGridSheetProps {
  sheetId: string;
}

// Convert column index to Excel-style letter (0 = A, 25 = Z, 26 = AA)
const getColumnLabel = (index: number): string => {
  let label = "";
  let i = index;
  while (i >= 0) {
    label = String.fromCharCode(65 + (i % 26)) + label;
    i = Math.floor(i / 26) - 1;
  }
  return label;
};

const BlankGridSheet = ({ sheetId }: BlankGridSheetProps) => {
  const { data: cells = [], isLoading: cellsLoading } = useSheetCells(sheetId);
  const { data: gridConfig } = useSheetGridConfig(sheetId);
  const { queueUpdate, queueBatchUpdates, flushUpdates } = useBatchCellUpdates(sheetId);
  
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [selectionRange, setSelectionRange] = useState<{
    startRow: number;
    startCol: number;
    endRow: number;
    endCol: number;
  } | null>(null);
  
  const gridRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Local cell values (for optimistic updates)
  const [localCells, setLocalCells] = useState<Map<string, string>>(new Map());
  
  // Sync with server data
  useEffect(() => {
    const cellMap = new Map<string, string>();
    cells.forEach(cell => {
      cellMap.set(`${cell.row_index},${cell.col_index}`, cell.value || "");
    });
    setLocalCells(cellMap);
  }, [cells]);
  
  const rowCount = gridConfig?.row_count || 100;
  const colCount = gridConfig?.col_count || 26;
  
  const getCellValue = useCallback((row: number, col: number): string => {
    return localCells.get(`${row},${col}`) || "";
  }, [localCells]);
  
  const setCellValue = useCallback((row: number, col: number, value: string) => {
    const key = `${row},${col}`;
    setLocalCells(prev => {
      const next = new Map(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
    
    queueUpdate({ row_index: row, col_index: col, value: value || null });
  }, [queueUpdate]);
  
  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    if (e.shiftKey && selectedCell) {
      // Extend selection
      setSelectionRange({
        startRow: Math.min(selectedCell.row, row),
        startCol: Math.min(selectedCell.col, col),
        endRow: Math.max(selectedCell.row, row),
        endCol: Math.max(selectedCell.col, col),
      });
    } else {
      setSelectedCell({ row, col });
      setSelectionRange(null);
    }
    setEditingCell(null);
  };
  
  const handleCellDoubleClick = (row: number, col: number) => {
    setEditingCell({ row, col });
    setEditValue(getCellValue(row, col));
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
  const handleEditFinish = () => {
    if (editingCell) {
      setCellValue(editingCell.row, editingCell.col, editValue);
      setEditingCell(null);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell) return;
    
    const { row, col } = selectedCell;
    
    if (editingCell) {
      if (e.key === "Enter") {
        handleEditFinish();
        setSelectedCell({ row: row + 1, col });
      } else if (e.key === "Escape") {
        setEditingCell(null);
      } else if (e.key === "Tab") {
        e.preventDefault();
        handleEditFinish();
        setSelectedCell({ row, col: col + 1 });
      }
      return;
    }
    
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        if (row > 0) setSelectedCell({ row: row - 1, col });
        break;
      case "ArrowDown":
        e.preventDefault();
        if (row < rowCount - 1) setSelectedCell({ row: row + 1, col });
        break;
      case "ArrowLeft":
        e.preventDefault();
        if (col > 0) setSelectedCell({ row, col: col - 1 });
        break;
      case "ArrowRight":
        e.preventDefault();
        if (col < colCount - 1) setSelectedCell({ row, col: col + 1 });
        break;
      case "Enter":
        e.preventDefault();
        handleCellDoubleClick(row, col);
        break;
      case "Tab":
        e.preventDefault();
        if (col < colCount - 1) {
          setSelectedCell({ row, col: col + 1 });
        } else if (row < rowCount - 1) {
          setSelectedCell({ row: row + 1, col: 0 });
        }
        break;
      case "Delete":
      case "Backspace":
        if (selectionRange) {
          // Clear selection
          const updates: CellUpdate[] = [];
          for (let r = selectionRange.startRow; r <= selectionRange.endRow; r++) {
            for (let c = selectionRange.startCol; c <= selectionRange.endCol; c++) {
              updates.push({ row_index: r, col_index: c, value: null });
            }
          }
          queueBatchUpdates(updates);
          setLocalCells(prev => {
            const next = new Map(prev);
            updates.forEach(u => next.delete(`${u.row_index},${u.col_index}`));
            return next;
          });
        } else {
          setCellValue(row, col, "");
        }
        break;
      default:
        // Start typing in cell
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
          setEditingCell({ row, col });
          setEditValue(e.key);
          setTimeout(() => inputRef.current?.focus(), 0);
        }
    }
  };
  
  // Handle paste
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!selectedCell) return;
    
    e.preventDefault();
    const text = e.clipboardData?.getData("text/plain");
    if (!text) return;
    
    const rows = text.split("\n").map(row => row.split("\t"));
    const updates: CellUpdate[] = [];
    
    rows.forEach((rowData, rowOffset) => {
      rowData.forEach((cellValue, colOffset) => {
        const targetRow = selectedCell.row + rowOffset;
        const targetCol = selectedCell.col + colOffset;
        
        if (targetRow < rowCount && targetCol < colCount) {
          updates.push({
            row_index: targetRow,
            col_index: targetCol,
            value: cellValue.trim() || null,
          });
        }
      });
    });
    
    // Optimistic update
    setLocalCells(prev => {
      const next = new Map(prev);
      updates.forEach(u => {
        if (u.value) {
          next.set(`${u.row_index},${u.col_index}`, u.value);
        } else {
          next.delete(`${u.row_index},${u.col_index}`);
        }
      });
      return next;
    });
    
    queueBatchUpdates(updates);
  }, [selectedCell, rowCount, colCount, queueBatchUpdates]);
  
  // Handle copy
  const handleCopy = useCallback((e: ClipboardEvent) => {
    if (!selectionRange && !selectedCell) return;
    
    e.preventDefault();
    
    const range = selectionRange || {
      startRow: selectedCell!.row,
      startCol: selectedCell!.col,
      endRow: selectedCell!.row,
      endCol: selectedCell!.col,
    };
    
    const rows: string[] = [];
    for (let r = range.startRow; r <= range.endRow; r++) {
      const cols: string[] = [];
      for (let c = range.startCol; c <= range.endCol; c++) {
        cols.push(getCellValue(r, c));
      }
      rows.push(cols.join("\t"));
    }
    
    e.clipboardData?.setData("text/plain", rows.join("\n"));
  }, [selectionRange, selectedCell, getCellValue]);
  
  // Register clipboard handlers
  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    document.addEventListener("copy", handleCopy);
    return () => {
      document.removeEventListener("paste", handlePaste);
      document.removeEventListener("copy", handleCopy);
    };
  }, [handlePaste, handleCopy]);
  
  // Flush on unmount
  useEffect(() => {
    return () => {
      flushUpdates();
    };
  }, [flushUpdates]);
  
  const isCellSelected = (row: number, col: number) => {
    if (selectionRange) {
      return (
        row >= selectionRange.startRow &&
        row <= selectionRange.endRow &&
        col >= selectionRange.startCol &&
        col <= selectionRange.endCol
      );
    }
    return selectedCell?.row === row && selectedCell?.col === col;
  };
  
  const isCellActive = (row: number, col: number) => {
    return selectedCell?.row === row && selectedCell?.col === col;
  };
  
  // Visible rows for virtualization (simple windowing)
  const VISIBLE_ROWS = 50;
  const VISIBLE_COLS = colCount;
  
  if (cellsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div
      ref={gridRef}
      className="h-full overflow-auto focus:outline-none"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <table className="border-collapse text-sm">
        <thead className="sticky top-0 z-10 bg-muted">
          <tr>
            {/* Row number header */}
            <th className="w-12 min-w-12 h-7 border border-border bg-muted sticky left-0 z-20" />
            
            {/* Column headers */}
            {Array.from({ length: VISIBLE_COLS }, (_, i) => (
              <th
                key={i}
                className="min-w-[80px] h-7 px-2 border border-border bg-muted text-center font-medium text-muted-foreground"
              >
                {getColumnLabel(i)}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {Array.from({ length: VISIBLE_ROWS }, (_, rowIndex) => (
            <tr key={rowIndex}>
              {/* Row number */}
              <td className="w-12 min-w-12 h-6 px-2 border border-border bg-muted text-center text-xs text-muted-foreground sticky left-0 z-10">
                {rowIndex + 1}
              </td>
              
              {/* Cells */}
              {Array.from({ length: VISIBLE_COLS }, (_, colIndex) => {
                const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                const isActive = isCellActive(rowIndex, colIndex);
                const isSelected = isCellSelected(rowIndex, colIndex);
                
                return (
                  <ContextMenu key={colIndex}>
                    <ContextMenuTrigger asChild>
                      <td
                        className={cn(
                          "min-w-[80px] h-6 px-1 border border-border bg-background cursor-cell transition-colors",
                          isSelected && !isActive && "bg-primary/10",
                          isActive && "ring-2 ring-primary ring-inset bg-background"
                        )}
                        onClick={(e) => handleCellClick(rowIndex, colIndex, e)}
                        onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
                      >
                        {isEditing ? (
                          <input
                            ref={inputRef}
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleEditFinish}
                            className="w-full h-full bg-transparent outline-none text-sm"
                          />
                        ) : (
                          <span className="block truncate text-sm">
                            {getCellValue(rowIndex, colIndex)}
                          </span>
                        )}
                      </td>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem onClick={() => handleCellDoubleClick(rowIndex, colIndex)}>
                        Edit Cell
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => setCellValue(rowIndex, colIndex, "")}>
                        Clear Cell
                      </ContextMenuItem>
                      <ContextMenuSeparator />
                      <ContextMenuItem onClick={() => {
                        // Insert row below
                        // For MVP, we just add rows to visible area
                      }}>
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Insert Row Below
                      </ContextMenuItem>
                      <ContextMenuItem onClick={() => {
                        // Insert column right
                      }}>
                        <Plus className="mr-2 h-3.5 w-3.5" />
                        Insert Column Right
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BlankGridSheet;
