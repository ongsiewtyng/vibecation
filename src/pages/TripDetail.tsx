import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ItineraryTab from "@/components/trip-details/ItineraryTab";
import AccommodationsTab from "@/components/trip-details/AccommodationsTab";
import TransportTab from "@/components/trip-details/TransportTab";
import ExpensesTab from "@/components/trip-details/ExpensesTab";
import PackingTab from "@/components/trip-details/PackingTab";
import AttachmentsTab from "@/components/trip-details/AttachmentsTab";
import { format, differenceInDays } from "date-fns";

const TripDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: trip } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (!trip) {
    return <div className="p-6">Loading...</div>;
  }

  const duration = differenceInDays(
    new Date(trip.end_date),
    new Date(trip.start_date)
  );

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <SidebarTrigger />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          </div>
          <div>
            <h1 className="text-3xl font-bold">{trip.title}</h1>
            <p className="text-muted-foreground mt-1">
              {trip.destination}, {trip.country} • {duration} days •{" "}
              {format(new Date(trip.start_date), "MMM d")} -{" "}
              {format(new Date(trip.end_date), "MMM d, yyyy")}
            </p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <Tabs defaultValue="itinerary" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto">
            <TabsTrigger value="itinerary">Itinerary</TabsTrigger>
            <TabsTrigger value="accommodations">Stays</TabsTrigger>
            <TabsTrigger value="transport">Transport</TabsTrigger>
            <TabsTrigger value="expenses">Budget</TabsTrigger>
            <TabsTrigger value="packing">Packing</TabsTrigger>
            <TabsTrigger value="attachments">Files</TabsTrigger>
          </TabsList>

          <TabsContent value="itinerary">
            <ItineraryTab tripId={id!} trip={trip} />
          </TabsContent>

          <TabsContent value="accommodations">
            <AccommodationsTab tripId={id!} />
          </TabsContent>

          <TabsContent value="transport">
            <TransportTab tripId={id!} />
          </TabsContent>

          <TabsContent value="expenses">
            <ExpensesTab tripId={id!} budget={trip.budget} />
          </TabsContent>

          <TabsContent value="packing">
            <PackingTab tripId={id!} />
          </TabsContent>

          <TabsContent value="attachments">
            <AttachmentsTab tripId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TripDetail;
