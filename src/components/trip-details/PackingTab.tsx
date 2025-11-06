import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import PackingFormDialog from "./PackingFormDialog";
import { useToast } from "@/hooks/use-toast";

const PackingTab = ({ tripId }: { tripId: string }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["packing", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("packing_items").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, packed }: { id: string; packed: boolean }) => {
      const { error } = await supabase.from("packing_items").update({ packed: !packed }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("packing_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["packing", tripId] });
      toast({ title: "Item deleted" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Packing List</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Item
        </Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No packing items</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <Checkbox 
                  checked={item.packed} 
                  onCheckedChange={() => toggleMutation.mutate({ id: item.id, packed: item.packed })} 
                />
                <div>
                  <span className={item.packed ? "line-through text-muted-foreground" : ""}>{item.item}</span>
                  {item.category && <span className="text-sm text-muted-foreground ml-2">• {item.category}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
      <PackingFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={tripId} item={editItem} />
    </div>
  );
};

export default PackingTab;
