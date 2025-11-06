import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInDays } from "date-fns";
import ItineraryFormDialog from "./ItineraryFormDialog";
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
        .order("day_number", { ascending: true });
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

  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{days} Day Itinerary</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Activity
        </Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No itinerary items yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium">Day {item.day_number}: {item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                    {item.description && <p className="text-sm mt-1">{item.description}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.time}</span>
                    <Button size="sm" variant="ghost" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <ItineraryFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={tripId} item={editItem} />
    </div>
  );
};

export default ItineraryTab;
