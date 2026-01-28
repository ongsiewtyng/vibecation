import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileSpreadsheet, Trash2, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { useWorkbooks, useCreateWorkbook, useDeleteWorkbook } from "@/hooks/useWorkbook";
import type { Workbook } from "@/types/workbook";

const Workbooks = () => {
  const navigate = useNavigate();
  const { data: workbooks = [], isLoading } = useWorkbooks();
  const createWorkbook = useCreateWorkbook();
  const deleteWorkbook = useDeleteWorkbook();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [workbookToDelete, setWorkbookToDelete] = useState<Workbook | null>(null);
  
  const handleCreate = () => {
    createWorkbook.mutate(
      { title: "Untitled Workbook" },
      {
        onSuccess: (workbook) => {
          navigate(`/workbook/${workbook.id}`);
        },
      }
    );
  };
  
  const handleOpen = (id: string) => {
    navigate(`/workbook/${id}`);
  };
  
  const handleDeleteClick = (workbook: Workbook) => {
    setWorkbookToDelete(workbook);
    setDeleteDialogOpen(true);
  };
  
  const handleConfirmDelete = () => {
    if (workbookToDelete) {
      deleteWorkbook.mutate(workbookToDelete.id);
    }
    setDeleteDialogOpen(false);
    setWorkbookToDelete(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="container max-w-6xl py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Workbooks</h1>
          <p className="text-muted-foreground mt-1">
            Plan your trips with Excel-like flexibility
          </p>
        </div>
        
        <Button onClick={handleCreate} disabled={createWorkbook.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          New Workbook
        </Button>
      </div>
      
      {workbooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <FileSpreadsheet className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">No workbooks yet</h3>
            <p className="text-muted-foreground text-center mb-6">
              Create your first workbook to start planning like Excel
            </p>
            <Button onClick={handleCreate} disabled={createWorkbook.isPending}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workbook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workbooks.map((workbook) => (
            <Card
              key={workbook.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleOpen(workbook.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium line-clamp-1">{workbook.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        Updated {format(new Date(workbook.updated_at), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(workbook);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workbook</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{workbookToDelete?.title}"? This will also delete all sheets and data. This action cannot be undone.
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
    </div>
  );
};

export default Workbooks;
