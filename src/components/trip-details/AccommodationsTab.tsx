import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const AccommodationsTab = ({ tripId }: { tripId: string }) => {
  const { data: items = [] } = useQuery({
    queryKey: ["accommodations", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("accommodations").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Accommodations</h2>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Accommodation</Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No accommodations added</CardContent></Card>
      ) : (
        items.map((item) => (
          <Card key={item.id}><CardContent className="p-4">{item.name}</CardContent></Card>
        ))
      )}
    </div>
  );
};

export default AccommodationsTab;
