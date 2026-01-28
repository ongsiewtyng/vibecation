import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, ArrowLeft, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkbook, useUpdateWorkbook, useSheets, useCreateSheet } from "@/hooks/useWorkbook";
import SheetTabs from "./SheetTabs";
import SheetRenderer from "./SheetRenderer";
import type { Sheet } from "@/types/workbook";

const WorkbookPage = () => {
  const { id: workbookId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: workbook, isLoading: workbookLoading } = useWorkbook(workbookId);
  const { data: sheets = [], isLoading: sheetsLoading } = useSheets(workbookId);
  const updateWorkbook = useUpdateWorkbook();
  const createSheet = useCreateSheet();
  
  const [activeSheetId, setActiveSheetId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState("");
  
  // Set active sheet when sheets load
  useEffect(() => {
    if (sheets.length > 0 && !activeSheetId) {
      setActiveSheetId(sheets[0].id);
    }
  }, [sheets, activeSheetId]);
  
  // Update title input when workbook loads
  useEffect(() => {
    if (workbook) {
      setTitleInput(workbook.title);
    }
  }, [workbook]);
  
  const handleTitleBlur = () => {
    setIsEditingTitle(false);
    if (workbook && titleInput !== workbook.title) {
      updateWorkbook.mutate({ id: workbook.id, title: titleInput });
    }
  };
  
  const handleAddSheet = () => {
    if (!workbookId) return;
    createSheet.mutate(
      { workbook_id: workbookId },
      {
        onSuccess: (newSheet) => {
          setActiveSheetId(newSheet.id);
        },
      }
    );
  };
  
  const activeSheet = sheets.find(s => s.id === activeSheetId);
  
  if (workbookLoading || sheetsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!workbook) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">Workbook not found</p>
        <Button onClick={() => navigate("/workbooks")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Workbooks
        </Button>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b bg-card">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/workbooks")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          {isEditingTitle ? (
            <Input
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              onBlur={handleTitleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleTitleBlur()}
              className="h-8 w-64 font-semibold"
              autoFocus
            />
          ) : (
            <h1
              className="text-lg font-semibold cursor-pointer hover:bg-muted px-2 py-1 rounded"
              onClick={() => setIsEditingTitle(true)}
            >
              {workbook.title}
            </h1>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>
      
      {/* Sheet Tabs */}
      <div className="flex items-center border-b bg-muted/30">
        <SheetTabs
          sheets={sheets}
          activeSheetId={activeSheetId}
          onSelectSheet={setActiveSheetId}
          workbookId={workbookId!}
        />
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 ml-1"
          onClick={handleAddSheet}
          disabled={createSheet.isPending}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Sheet Content */}
      <div className="flex-1 overflow-hidden">
        {activeSheet ? (
          <SheetRenderer sheet={activeSheet} />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>No sheets. Click + to add one.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkbookPage;
