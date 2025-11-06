import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Calendar, Plane, MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import TripCard from "@/components/trips/TripCard";
import TripFormDialog from "@/components/trips/TripFormDialog";
import ImportDialog from "@/components/import/ImportDialog";
import { format, isPast, isFuture, differenceInDays } from "date-fns";

const Index = () => {
  const [showTripForm, setShowTripForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);

  const { data: trips = [], refetch } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  const upcomingTrips = trips.filter((trip) => isFuture(new Date(trip.start_date)));
  const pastTrips = trips.filter((trip) => isPast(new Date(trip.end_date)));
  const currentTrips = trips.filter(
    (trip) =>
      !isFuture(new Date(trip.start_date)) && !isPast(new Date(trip.end_date))
  );

  const handleEdit = (trip: any) => {
    setEditingTrip(trip);
    setShowTripForm(true);
  };

  const handleCloseForm = () => {
    setShowTripForm(false);
    setEditingTrip(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">My Trips</h1>
              <p className="text-sm text-muted-foreground">
                Plan and organize your adventures
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowImport(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setShowTripForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Trip
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-8">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-primary/10 p-3">
                <Plane className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingTrips.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-3">
                <MapPin className="h-6 w-6 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold">{currentTrips.length}</p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-secondary/10 p-3">
                <Calendar className="h-6 w-6 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Past</p>
                <p className="text-2xl font-bold">{pastTrips.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Current Trips */}
        {currentTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Current Trips</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {currentTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={handleEdit}
                  onRefetch={refetch}
                />
              ))}
            </div>
          </section>
        )}

        {/* Upcoming Trips */}
        {upcomingTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Upcoming Trips</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {upcomingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={handleEdit}
                  onRefetch={refetch}
                />
              ))}
            </div>
          </section>
        )}

        {/* Past Trips */}
        {pastTrips.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Past Trips</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pastTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onEdit={handleEdit}
                  onRefetch={refetch}
                />
              ))}
            </div>
          </section>
        )}

        {trips.length === 0 && (
          <div className="text-center py-16">
            <Navigation className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
            <p className="text-muted-foreground mb-6">
              Start planning your next adventure
            </p>
            <Button onClick={() => setShowTripForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Trip
            </Button>
          </div>
        )}
      </div>

      <TripFormDialog
        open={showTripForm}
        onClose={handleCloseForm}
        trip={editingTrip}
        onSuccess={refetch}
      />

      <ImportDialog
        open={showImport}
        onClose={() => setShowImport(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Index;
