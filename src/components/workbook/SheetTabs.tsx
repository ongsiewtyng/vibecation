import { useState, useRef } from "react";
import { MoreHorizontal, Pencil, Copy, Trash2, FileSpreadsheet, Calendar, Wallet, MapPin, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useUpdateSheet, useDeleteSheet, useDuplicateSheet } from "@/hooks/useWorkbook";
import type { Sheet, SheetType } from "@/types/workbook";

interface SheetTabsProps {
  sheets: Sheet[];
  activeSheetId: string | null;
  onSelectSheet: (id: string) => void;
  workbookId: string;
}

const sheetTypeIcons: Record<SheetType, React.ReactNode> = {
  blank: <FileSpreadsheet className="h-3.5 w-3.5" />,
  itinerary: <Calendar className="h-3.5 w-3.5" />,
  budget: <Wallet className="h-3.5 w-3.5" />,
  places: <MapPin className="h-3.5 w-3.5" />,
  packing: <Package className="h-3.5 w-3.5" />,
};

const SheetTabs = ({ sheets, activeSheetId, onSelectSheet, workbookId }: SheetTabsProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sheetToDelete, setSheetToDelete] = useState<Sheet | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  
  const updateSheet = useUpdateSheet();
  const deleteSheet = useDeleteSheet();
  const duplicateSheet = useDuplicateSheet();
  
  const handleStartEdit = (sheet: Sheet) => {
    setEditingId(sheet.id);
    setEditValue(sheet.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };
  
  const handleFinishEdit = (sheet: Sheet) => {
    setEditingId(null);
    if (editValue.trim() && editValue !== sheet.title) {
      updateSheet.mutate({ id: sheet.id, title: editValue.trim() });
    }
  };
  
  const handleDeleteClick = (sheet: Sheet) => {
    setSheetToDelete(sheet);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (sheetToDelete) {
      deleteSheet.mutate(
        { id: sheetToDelete.id, workbook_id: workbookId },
        {
          onSuccess: () => {
            // Select next sheet if deleting active
            if (sheetToDelete.id === activeSheetId) {
              const remaining = sheets.filter(s => s.id !== sheetToDelete.id);
              if (remaining.length > 0) {
                onSelectSheet(remaining[0].id);
              }
            }
          },
        }
      );
    }
    setDeleteDialogOpen(false);
    setSheetToDelete(null);
  };
  
  const handleDuplicate = (sheet: Sheet) => {
    duplicateSheet.mutate(
      { sheet },
      {
        onSuccess: (newSheet) => {
          onSelectSheet(newSheet.id);
        },
      }
    );
  };
  
  return (
    <>
      <div className="flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-thin">
        {sheets.map((sheet) => (
          <div
            key={sheet.id}
            className={cn(
              "group flex items-center gap-1.5 px-3 py-1.5 text-sm cursor-pointer border-b-2 transition-colors",
              activeSheetId === sheet.id
                ? "border-primary bg-background text-foreground"
                : "border-transparent hover:bg-muted/50 text-muted-foreground"
            )}
            onClick={() => onSelectSheet(sheet.id)}
            onDoubleClick={() => handleStartEdit(sheet)}
          >
            {sheetTypeIcons[sheet.type]}
            
            {editingId === sheet.id ? (
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={() => handleFinishEdit(sheet)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleFinishEdit(sheet);
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="h-5 w-24 text-xs px-1"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="max-w-[120px] truncate">{sheet.title}</span>
            )}
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                <DropdownMenuItem onClick={() => handleStartEdit(sheet)}>
                  <Pencil className="mr-2 h-3.5 w-3.5" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDuplicate(sheet)}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Duplicate
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => handleDeleteClick(sheet)}
                  disabled={sheets.length === 1}
                >
                  <Trash2 className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Sheet</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{sheetToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SheetTabs;
