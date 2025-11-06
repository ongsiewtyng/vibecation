import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";

const PackingTab = ({ tripId }: { tripId: string }) => {
  const { data: items = [], refetch } = useQuery({
    queryKey: ["packing", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("packing_items").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const togglePacked = async (id: string, packed: boolean) => {
    await supabase.from("packing_items").update({ packed: !packed }).eq("id", id);
    refetch();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Packing List</h2>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Item</Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No packing items</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}><CardContent className="p-4 flex items-center gap-3">
            <Checkbox checked={item.packed} onCheckedChange={() => togglePacked(item.id, item.packed)} />
            <span className={item.packed ? "line-through text-muted-foreground" : ""}>{item.item}</span>
          </CardContent></Card>
        ))
      )}
    </div>
  );
};

export default PackingTab;
