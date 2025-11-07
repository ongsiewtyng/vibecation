import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { format, differenceInDays, parseISO } from "date-fns";
import { Calendar, MapPin, Home, Plane, DollarSign, Package, FileText, Clock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import GoogleMapComponent from "@/components/maps/GoogleMapComponent";

const SharedTripView = () => {
  const { token } = useParams();

  const { data: tripLink, isLoading: linkLoading } = useQuery({
    queryKey: ["public-trip-link", token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("public_trip_links")
        .select("*")
        .eq("share_token", token)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      
      // Check if link is expired
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        throw new Error("This link has expired");
      }
      
      return data;
    },
  });

  const { data: trip } = useQuery({
    queryKey: ["shared-trip", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", tripLink?.trip_id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  const { data: itineraryItems = [] } = useQuery({
    queryKey: ["shared-itinerary", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("itinerary_items")
        .select("*")
        .eq("trip_id", tripLink?.trip_id)
        .order("date", { ascending: true })
        .order("time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  const { data: accommodations = [] } = useQuery({
    queryKey: ["shared-accommodations", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("accommodations")
        .select("*")
        .eq("trip_id", tripLink?.trip_id)
        .order("check_in", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  const { data: transports = [] } = useQuery({
    queryKey: ["shared-transports", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transports")
        .select("*")
        .eq("trip_id", tripLink?.trip_id)
        .order("departure_time", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  const { data: expenses = [] } = useQuery({
    queryKey: ["shared-expenses", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .eq("trip_id", tripLink?.trip_id)
        .order("date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  const { data: packingItems = [] } = useQuery({
    queryKey: ["shared-packing", tripLink?.trip_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("packing_items")
        .select("*")
        .eq("trip_id", tripLink?.trip_id)
        .order("category");
      if (error) throw error;
      return data;
    },
    enabled: !!tripLink?.trip_id,
  });

  if (linkLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading trip...</p>
      </div>
    );
  }

  if (!tripLink || !trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Trip Not Found</h2>
            <p className="text-muted-foreground">
              This trip link is invalid or has expired.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const duration = differenceInDays(
    new Date(trip.end_date),
    new Date(trip.start_date)
  );

  const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);

  // Combine all timeline items
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
  ].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time || "00:00"}`);
    const dateB = new Date(`${b.date}T${b.time || "00:00"}`);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <MapPin className="h-4 w-4" />
            <span>Shared Trip View</span>
          </div>
          <h1 className="text-3xl font-bold">{trip.title}</h1>
          <p className="text-muted-foreground mt-2">
            {trip.destination}, {trip.country} • {duration} days •{" "}
            {format(new Date(trip.start_date), "MMM d")} -{" "}
            {format(new Date(trip.end_date), "MMM d, yyyy")}
          </p>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="timeline" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6 lg:w-auto">
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="accommodations">Stays</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="expenses">Budget</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline">
            <div className="space-y-4">
              {timelineItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No timeline items available
                  </CardContent>
                </Card>
              ) : (
                timelineItems.map((item, index) => {
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
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="accommodations">
            <div className="grid gap-4">
              {accommodations.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No accommodations added yet
                  </CardContent>
                </Card>
              ) : (
                accommodations.map((accommodation) => (
                  <Card key={accommodation.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Home className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{accommodation.name}</h3>
                          {accommodation.address && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {accommodation.address}
                            </p>
                          )}
                          <div className="flex gap-4 text-sm">
                            <span>
                              Check-in: {format(parseISO(accommodation.check_in), "MMM d, yyyy")}
                            </span>
                            <span>
                              Check-out: {format(parseISO(accommodation.check_out), "MMM d, yyyy")}
                            </span>
                          </div>
                          {accommodation.cost && (
                            <p className="text-sm mt-2">Cost: ${Number(accommodation.cost).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="transport">
            <div className="grid gap-4">
              {transports.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No transport added yet
                  </CardContent>
                </Card>
              ) : (
                transports.map((transport) => (
                  <Card key={transport.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Plane className="h-5 w-5 text-primary mt-1" />
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{transport.type}</h3>
                          <p className="text-sm text-muted-foreground mb-2">
                            {transport.from_location} → {transport.to_location}
                          </p>
                          <div className="text-sm space-y-1">
                            <p>
                              Departure: {format(parseISO(transport.departure_time), "MMM d, yyyy h:mm a")}
                            </p>
                            {transport.arrival_time && (
                              <p>
                                Arrival: {format(parseISO(transport.arrival_time), "MMM d, yyyy h:mm a")}
                              </p>
                            )}
                          </div>
                          {transport.cost && (
                            <p className="text-sm mt-2">Cost: ${Number(transport.cost).toFixed(2)}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="expenses">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Budget</p>
                      <p className="text-2xl font-bold">
                        ${trip.budget ? Number(trip.budget).toFixed(2) : "0.00"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-2xl font-bold">${totalExpenses.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold">
                        ${trip.budget ? (Number(trip.budget) - totalExpenses).toFixed(2) : `-${totalExpenses.toFixed(2)}`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4">
                {expenses.map((expense) => (
                  <Card key={expense.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {expense.category} • {format(parseISO(expense.date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <p className="font-semibold">${Number(expense.amount).toFixed(2)}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="packing">
            <div className="space-y-4">
              {packingItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No packing items added yet
                  </CardContent>
                </Card>
              ) : (
                Object.entries(
                  packingItems.reduce((acc, item) => {
                    const category = item.category || "Uncategorized";
                    if (!acc[category]) acc[category] = [];
                    acc[category].push(item);
                    return acc;
                  }, {} as Record<string, typeof packingItems>)
                ).map(([category, items]) => (
                  <Card key={category}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        {category}
                      </h3>
                      <ul className="space-y-2">
                        {items.map((item) => (
                          <li key={item.id} className="flex items-center gap-2 text-sm">
                            <span className={item.packed ? "line-through text-muted-foreground" : ""}>
                              {item.item}
                            </span>
                            {item.packed && <span className="text-xs text-green-500">✓ Packed</span>}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="itinerary">
            <div className="space-y-4">
              {itineraryItems.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center text-muted-foreground">
                    No itinerary items added yet
                  </CardContent>
                </Card>
              ) : (
                Object.entries(
                  itineraryItems.reduce((acc, item) => {
                    const day = `Day ${item.day_number} - ${format(parseISO(item.date), "MMM d, yyyy")}`;
                    if (!acc[day]) acc[day] = [];
                    acc[day].push(item);
                    return acc;
                  }, {} as Record<string, typeof itineraryItems>)
                ).map(([day, items]) => (
                  <Card key={day}>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">{day}</h3>
                      <div className="space-y-4">
                        {items.map((item) => (
                          <div key={item.id} className="flex gap-4 pb-4 border-b last:border-0">
                            <div className="flex flex-col items-center">
                              <Calendar className="h-5 w-5 text-primary" />
                              {item.time && (
                                <span className="text-xs text-muted-foreground mt-1">
                                  {item.time}
                                </span>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{item.title}</h4>
                              {item.location && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                  <MapPin className="h-3 w-3" />
                                  {item.location}
                                </p>
                              )}
                              {item.description && (
                                <p className="text-sm mt-2">{item.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SharedTripView;
