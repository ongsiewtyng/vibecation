import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import TransportFormDialog from "./TransportFormDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const TransportTab = ({ tripId }: { tripId: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["transports", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("transports").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transports").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transports", tripId] });
      toast({ title: "Transport deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Transport</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Transport
        </Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No transport added</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium">{item.type}: {item.from_location} → {item.to_location}</p>
                  <p className="text-sm text-muted-foreground">
                    Departs: {format(new Date(item.departure_time), "PPp")}
                  </p>
                  {item.arrival_time && (
                    <p className="text-sm text-muted-foreground">
                      Arrives: {format(new Date(item.arrival_time), "PPp")}
                    </p>
                  )}
                  {item.cost && <p className="text-sm">Cost: £{Number(item.cost).toFixed(2)}</p>}
                </div>
                <div className="flex gap-2">
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
        ))
      )}
      <TransportFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={tripId} item={editItem} />
    </div>
  );
};

export default TransportTab;
