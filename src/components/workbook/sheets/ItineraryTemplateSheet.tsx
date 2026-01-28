import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ItineraryTab from "@/components/trip-details/ItineraryTab";
import type { Sheet } from "@/types/workbook";

interface ItineraryTemplateSheetProps {
  sheet: Sheet;
}

const ItineraryTemplateSheet = ({ sheet }: ItineraryTemplateSheetProps) => {
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
      <ItineraryTab tripId={tripId} trip={trip} />
    </div>
  );
};

export default ItineraryTemplateSheet;
