import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Search, MapPin, Star, Plus, Dices } from "lucide-react";
import { COUNTRIES } from "@/config/maps";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import GoogleMapComponent from "@/components/maps/GoogleMapComponent";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CityCombobox } from "@/components/explore/CityCombobox";
import { Badge } from "@/components/ui/badge";

const Explore = () => {
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAttraction, setSelectedAttraction] = useState<any>(null);
  const [showTripDialog, setShowTripDialog] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [randomPick, setRandomPick] = useState<{ country: string; city: string } | null>(null);

  const { data: trips = [] } = useQuery({
    queryKey: ["trips"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trips")
        .select("*")
        .order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: cities = [], isLoading: citiesLoading } = useQuery({
    queryKey: ["cities", selectedCountry],
    queryFn: async () => {
      if (!selectedCountry) return [];
      
      const { data, error } = await supabase.functions.invoke('cities-for-country', {
        body: { countryName: selectedCountry, limit: 30 }
      });

      if (error) {
        console.error('Error fetching cities:', error);
        return [];
      }
      return (data?.cities ?? []).map((c: any) => c.name);
    },
    enabled: !!selectedCountry,
  });

  const { data: attractions = [], refetch } = useQuery({
    queryKey: ["attractions", selectedCountry, selectedCity],
    queryFn: async () => {
      if (!selectedCountry) return [];
      
      let query = supabase
        .from("attractions")
        .select("*")
        .eq("country", selectedCountry);
      
      if (selectedCity) {
        query = query.eq("city", selectedCity);
      }
      
      const { data, error } = await query.order("rating", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!selectedCountry,
  });

  const handleRollDestination = async () => {
    setIsRolling(true);
    setRandomPick(null);
    
    try {
      // Pick random country
      const randomCountry = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)].name;
      setSelectedCountry(randomCountry);
      
      // Simulate loading for delight
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Fetch cities for that country
      const { data: citiesResp, error: citiesError } = await supabase.functions.invoke('cities-for-country', {
        body: { countryName: randomCountry, limit: 20 }
      });
      
      if (citiesError) throw citiesError;
      
      const cityList = citiesResp?.cities ?? [];
      if (cityList.length === 0) {
        toast.error(`No cities found for ${randomCountry}. Try again!`);
        setIsRolling(false);
        return;
      }
      
      // Pick random city
      const randomCity = cityList[Math.floor(Math.random() * cityList.length)].name;
      setSelectedCity(randomCity);
      setRandomPick({ country: randomCountry, city: randomCity });
      
      // Fetch attractions
      await handleFetchAttractions(randomCountry, randomCity);
      
      toast.success(`Picked ${randomCountry} → ${randomCity}!`);
    } catch (error) {
      console.error('Error rolling destination:', error);
      toast.error("Failed to pick random destination");
    } finally {
      setIsRolling(false);
    }
  };

  const handleFetchAttractions = async (country?: string, city?: string) => {
    const targetCountry = country || selectedCountry;
    const targetCity = city || selectedCity;
    
    if (!targetCountry) {
      toast.error("Please select a country");
      return;
    }

    const locationText = targetCity ? `${targetCity}, ${targetCountry}` : targetCountry;
    toast.info("Fetching attractions for " + locationText);
    
    try {
      const { data, error } = await supabase.functions.invoke('fetch-attractions', {
        body: { country: targetCountry, city: targetCity || undefined }
      });

      if (error) {
        const errorDetail = (error as any).message || "Unknown error";
        toast.error("Failed to fetch attractions: " + errorDetail);
        throw error;
      }
      
      toast.success(`Fetched ${data.attractions?.length || 0} attractions`);
      refetch();
    } catch (error) {
      console.error('Error fetching attractions:', error);
    }
  };

  const filteredAttractions = attractions.filter((attraction) =>
    attraction.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const mapCenter = attractions.length > 0 && attractions[0].lat && attractions[0].lng
    ? { lat: Number(attractions[0].lat), lng: Number(attractions[0].lng) }
    : { lat: 0, lng: 0 };

  const markers = filteredAttractions
    .filter((a) => a.lat && a.lng)
    .map((attraction) => ({
      position: { lat: Number(attraction.lat), lng: Number(attraction.lng) },
      title: attraction.name,
    }));

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <SidebarTrigger />
            <div>
              <h1 className="text-2xl font-bold">Explore Destinations</h1>
              <p className="text-sm text-muted-foreground">
                Discover popular attractions and landmarks
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6 space-y-6">
        {/* Random Pick Banner */}
        {randomPick && (
          <Card className="border-primary">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Dices className="h-5 w-5 text-primary" />
                <span className="text-sm font-medium">
                  Random Pick:
                </span>
                <Badge variant="secondary">
                  {randomPick.country} → {randomPick.city}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRollDestination}
                disabled={isRolling}
              >
                Roll Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Filter Destinations</h2>
              <Button 
                variant="outline" 
                onClick={handleRollDestination}
                disabled={isRolling}
                className="gap-2"
              >
                <Dices className={isRolling ? "animate-spin" : ""} />
                I'm Feeling Adventurous
              </Button>
            </div>
            
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Country</label>
                <Select 
                  value={selectedCountry} 
                  onValueChange={(value) => {
                    setSelectedCountry(value);
                    setSelectedCity("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country.code} value={country.name}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">City</label>
                <CityCombobox
                  value={selectedCity}
                  onChange={setSelectedCity}
                  options={cities}
                  disabled={!selectedCountry || citiesLoading}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Attractions</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <Button onClick={() => handleFetchAttractions()} disabled={!selectedCountry}>
              <Search className="mr-2 h-4 w-4" />
              Fetch Attractions from Google Places
            </Button>
          </CardContent>
        </Card>

        {/* Map View */}
        {selectedCountry && attractions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Map View</CardTitle>
            </CardHeader>
            <CardContent>
              <GoogleMapComponent
                center={mapCenter}
                zoom={10}
                markers={markers}
                className="w-full h-96 rounded-lg"
              />
            </CardContent>
          </Card>
        )}

        {/* Attractions Grid */}
        {selectedCountry && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredAttractions.length > 0 ? (
              filteredAttractions.map((attraction) => (
                <Card key={attraction.id}>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h3 className="font-semibold text-lg">{attraction.name}</h3>
                        {attraction.rating && (
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{attraction.rating}</span>
                          </div>
                        )}
                      </div>
                      {attraction.description && (
                        <p className="text-sm text-muted-foreground line-clamp-3">
                          {attraction.description}
                        </p>
                      )}
                      {attraction.types && Array.isArray(attraction.types) && attraction.types.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {attraction.types.slice(0, 3).map((type: string, idx: number) => (
                            <span
                              key={idx}
                              className="text-xs px-2 py-1 bg-secondary rounded-full"
                            >
                              {type.replace(/_/g, " ")}
                            </span>
                          ))}
                        </div>
                      )}
                      {attraction.user_ratings_total && (
                        <p className="text-xs text-muted-foreground">
                          {attraction.user_ratings_total.toLocaleString()} reviews
                        </p>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => {
                          setSelectedAttraction(attraction);
                          setShowTripDialog(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Trip
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No attractions found. Click "Fetch Attractions" to load data.
                </p>
              </div>
            )}
          </div>
        )}

        {!selectedCountry && (
          <div className="text-center py-16">
            <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Explore the World</h3>
            <p className="text-muted-foreground mb-6">
              Select a country to discover popular destinations and attractions
            </p>
          </div>
        )}
      </div>

      <Dialog open={showTripDialog} onOpenChange={setShowTripDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add to Trip</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Select a trip to add "{selectedAttraction?.name}" to its itinerary
            </p>
            <div className="space-y-2">
              {trips.map((trip) => (
                <Button
                  key={trip.id}
                  variant="outline"
                  className="w-full justify-start"
                  onClick={async () => {
                    try {
                      const { error } = await supabase.from("itinerary_items").insert({
                        trip_id: trip.id,
                        title: selectedAttraction.name,
                        description: selectedAttraction.description,
                        location: selectedAttraction.name,
                        date: trip.start_date,
                        day_number: 1,
                      });

                      if (error) throw error;

                      toast.success(`Added to ${trip.title}`);
                      setShowTripDialog(false);
                    } catch (error) {
                      console.error("Error adding to trip:", error);
                      toast.error("Failed to add to trip");
                    }
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{trip.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {trip.destination}, {trip.country}
                    </p>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Explore;
