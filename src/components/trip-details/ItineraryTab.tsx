import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { format, differenceInDays } from "date-fns";

const ItineraryTab = ({ tripId, trip }: { tripId: string; trip: any }) => {
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

  const days = differenceInDays(new Date(trip.end_date), new Date(trip.start_date)) + 1;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">{days} Day Itinerary</h2>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Activity</Button>
      </div>
      {items.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-muted-foreground">No itinerary items yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Day {item.day_number}: {item.title}</p>
                    <p className="text-sm text-muted-foreground">{item.location}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{item.time}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItineraryTab;
