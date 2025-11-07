import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { Calendar, MapPin, Plane, Home, DollarSign, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface TripTimelineProps {
  tripId: string;
}

const TripTimeline = ({ tripId }: TripTimelineProps) => {
  const { data: itineraryItems = [] } = useQuery({
    queryKey: ["itinerary", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripId)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
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

  const { data: transports = [] } = useQuery({
    queryKey: ["transports", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transports")
        .select("*")
        .eq("trip_id", tripId)
        .order("departure_time", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripId)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Combine all items into timeline
  const timelineItems = [
    ...itineraryItems.map((item) => ({
      type: "itinerary",
      date: item.date,
      time: item.time,
      title: item.title,
      description: item.description,
      location: item.location,
      icon: Calendar,
    })),
    ...accommodations.map((item) => ({
      type: "accommodation",
      date: item.check_in,
      time: null,
      title: item.name,
      description: `Check-in: ${format(parseISO(item.check_in), "MMM d")} - Check-out: ${format(parseISO(item.check_out), "MMM d")}`,
      location: item.address,
      icon: Home,
    })),
    ...transports.map((item) => ({
      type: "transport",
      date: item.departure_time.split("T")[0],
      time: item.departure_time.split("T")[1],
      title: `${item.type} - ${item.from_location} to ${item.to_location}`,
      description: item.arrival_time
        ? `Arrives: ${format(parseISO(item.arrival_time), "MMM d, h:mm a")}`
        : "",
      location: item.from_location,
      icon: Plane,
    })),
    ...expenses.map((item) => ({
      type: "expense",
      date: item.date,
      time: null,
      title: `${item.description} - $${Number(item.amount).toFixed(2)}`,
      description: item.category,
      location: null,
      icon: DollarSign,
    })),
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dateA.getTime() - dateB.getTime();
  });

  if (timelineItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No timeline items yet. Add itinerary, accommodations, or transport to see your trip timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {timelineItems.map((item, index) => {
        const Icon = item.icon;
        return (
          <div key={index} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className="rounded-full bg-primary/10 p-2">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              {index < timelineItems.length - 1 && (
                <Separator orientation="vertical" className="h-full min-h-[40px] my-1" />
              )}
            </div>
            <Card className="flex-1 mb-2">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">
                        {format(parseISO(item.date), "MMM d, yyyy")}
                      </span>
                      {item.time && (
                        <>
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {item.time}
                          </span>
                        </>
                      )}
                    </div>
                    <h4 className="font-semibold mb-1">{item.title}</h4>
                    {item.description && (
                      <p className="text-sm text-muted-foreground mb-1">
                        {item.description}
                      </p>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{item.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })}
    </div>
  );
};

export default TripTimeline;
