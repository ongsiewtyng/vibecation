import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BudgetAllocationTab } from "@/components/trip-details/BudgetAllocationTab";
import ExpensesTab from "@/components/trip-details/ExpensesTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Sheet } from "@/types/workbook";

interface BudgetTemplateSheetProps {
  sheet: Sheet;
}

const BudgetTemplateSheet = ({ sheet }: BudgetTemplateSheetProps) => {
  const tripId = sheet.config?.trip_id as string | undefined;
  
  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: async () => {
      if (!tripId) return null;
      
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!tripId,
  });
  
  if (!tripId) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <p>No trip linked to this sheet.</p>
        <p className="text-sm">Edit the sheet config to link a trip.</p>
      </div>
    );
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  if (!trip) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Trip not found</p>
      </div>
    );
  }
  
  return (
    <div className="h-full overflow-auto p-4">
      <Tabs defaultValue="allocation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="allocation">Budget Allocation</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
        </TabsList>
        
        <TabsContent value="allocation">
          <BudgetAllocationTab tripId={tripId} totalBudget={trip.budget} />
        </TabsContent>
        
        <TabsContent value="expenses">
          <ExpensesTab tripId={tripId} budget={trip.budget} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetTemplateSheet;
