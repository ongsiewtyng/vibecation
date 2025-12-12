import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInDays } from "date-fns";
import ItineraryFormDialog from "./ItineraryFormDialog";
import ItineraryTimeline from "./ItineraryTimeline";
import { useToast } from "@/hooks/use-toast";

const ItineraryTab = ({ tripId, trip }: { tripId: string; trip: any }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("day_number", { ascending: true })
        .order("time", { ascending: true, nullsFirst: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ["accommodations", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .eq("trip_id", tripId)
        .order("check_in", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("itinerary_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
      toast({ title: "Activity deleted" });
    },
  });

  const handleEditItem = (item: any) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    deleteMutation.mutate(id);
  };

  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{days} Day Itinerary</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Activity
        </Button>
      </div>

      {items.length === 0 && accommodations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">No itinerary items yet</p>
            <Button variant="outline" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Add your first activity
            </Button>
          </CardContent>
        </Card>
      ) : (
        <ItineraryTimeline
          items={items}
          accommodations={accommodations}
          tripStartDate={trip.start_date}
          onEditItem={handleEditItem}
          onDeleteItem={handleDeleteItem}
        />
      )}

      <ItineraryFormDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        tripId={tripId} 
        item={editItem} 
      />
    </div>
  );
};

export default ItineraryTab;
