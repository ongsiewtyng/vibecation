import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Upload, Calendar, Plane, MapPin, Navigation, Search, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarTrigger } from "@/components/ui/sidebar";
import TripCard from "@/components/trips/TripCard";
import TripFormDialog from "@/components/trips/TripFormDialog";
import TripTemplatesDialog from "@/components/trips/TripTemplatesDialog";
import { SmartTripDialog } from "@/components/trips/SmartTripDialog";
import ImportDialog from "@/components/import/ImportDialog";
import { format, isPast, isFuture, differenceInDays } from "date-fns";

const Index = () => {
  const [showTripForm, setShowTripForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showSmartTrip, setShowSmartTrip] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "upcoming" | "current" | "past">("all");

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

  // Filter by search query
  const filteredTrips = trips.filter((trip) => {
    const matchesSearch =
      trip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
      trip.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const upcomingTrips = filteredTrips.filter((trip) => isFuture(new Date(trip.start_date)));
  const pastTrips = filteredTrips.filter((trip) => isPast(new Date(trip.end_date)));
  const currentTrips = filteredTrips.filter(
    (trip) =>
      !isFuture(new Date(trip.start_date)) && !isPast(new Date(trip.end_date))
  );

  // Apply status filter
  const displayTrips =
    filterStatus === "all"
      ? filteredTrips
      : filterStatus === "upcoming"
      ? upcomingTrips
      : filterStatus === "current"
      ? currentTrips
      : pastTrips;

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
            <Button onClick={() => setShowSmartTrip(true)} className="bg-gradient-to-r from-primary to-accent">
              <Wand2 className="mr-2 h-4 w-4" />
              Smart Trip
            </Button>
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              Templates
            </Button>
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
        {/* Search and Filter */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trips by title, destination, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trips</SelectItem>
              <SelectItem value="current">Current Trips</SelectItem>
              <SelectItem value="upcoming">Upcoming Trips</SelectItem>
              <SelectItem value="past">Past Trips</SelectItem>
            </SelectContent>
          </Select>
        </div>

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

        {/* Filtered Trips */}
        {filterStatus === "all" ? (
          <>
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
          </>
        ) : (
          <section>
            <h2 className="text-xl font-semibold mb-4 capitalize">{filterStatus} Trips</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {displayTrips.map((trip) => (
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

      <TripTemplatesDialog
        open={showTemplates}
        onClose={() => setShowTemplates(false)}
        onSuccess={refetch}
      />

      <SmartTripDialog
        open={showSmartTrip}
        onClose={() => setShowSmartTrip(false)}
        onSuccess={refetch}
      />
    </div>
  );
};

export default Index;
