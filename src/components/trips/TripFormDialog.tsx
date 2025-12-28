import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { CountryCombobox } from "@/components/shared/CountryCombobox";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, differenceInDays } from "date-fns";
import { Info, MapPin, ImageIcon } from "lucide-react";
import PlaceAutocomplete from "@/components/maps/PlaceAutocomplete";

interface CityPhoto {
  url: string;
  attribution: string;
}

interface TripFormDialogProps {
  open: boolean;
  onClose: () => void;
  trip?: any;
  onSuccess: () => void;
}

const TripFormDialog = ({ open, onClose, trip, onSuccess }: TripFormDialogProps) => {
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [budget, setBudget] = useState("");
  const [notes, setNotes] = useState("");
  const [autoTitle, setAutoTitle] = useState("");
  const [cityPhoto, setCityPhoto] = useState<CityPhoto | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);

  // Fetch city photo when city changes
  useEffect(() => {
    const trimmedCity = city.trim();

    if (!trimmedCity || !country) {
      setCityPhoto(null);
      return;
    }

    if (trimmedCity.length < 2) return;
    
    async function fetchCityPhoto() {
      setLoadingPhoto(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-city-photo', {
          body: { city: trimmedCity, country },
        });

        if (error) throw error;
        
        if (data?.photoUrl) {
          setCityPhoto({
            url: data.photoUrl,
            attribution: data.attribution || trimmedCity,
          });
        } else {
          setCityPhoto({
            url: `https://source.unsplash.com/800x400/?${encodeURIComponent(`${trimmedCity} ${country} skyline`)}`,
            attribution: trimmedCity
          });
        }
      } catch (error) {
        console.error('Error fetching city photo:', error);
        setCityPhoto({
          url: `https://source.unsplash.com/800x400/?${encodeURIComponent(`${trimmedCity} travel destination`)}`,
          attribution: trimmedCity
        });
      } finally {
        setLoadingPhoto(false);
      }
    }
    
    const debounce = setTimeout(fetchCityPhoto, 600);
    return () => clearTimeout(debounce);
  }, [city, country]);

  const handlePlaceSelect = (place: { name: string; lat: number; lng: number; formattedAddress?: string }) => {
    setCity(place.name);
    if (place.formattedAddress) {
      const parts = place.formattedAddress.split(',').map(p => p.trim());
      if (parts.length > 0) {
        const possibleCountry = parts[parts.length - 1];
        if (possibleCountry && !country) {
          setCountry(possibleCountry);
        }
      }
    }
  };

  // Auto-generate title when country, city, and dates change
  useEffect(() => {
    if (country && city && dateRange?.from && dateRange?.to) {
      const startDate = format(dateRange.from, "d MMM yyyy");
      const endDate = format(dateRange.to, "d MMM yyyy");
      const generatedTitle = `${city}, ${country} — ${startDate} to ${endDate}`;
      setAutoTitle(generatedTitle);
    } else {
      setAutoTitle("");
    }
  }, [country, city, dateRange]);

  // Calculate duration
  const duration = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;
  const nights = duration > 0 ? duration - 1 : 0;

  useEffect(() => {
    if (trip) {
      setCountry(trip.country || "");
      setCity(trip.destination || "");
      setBudget(trip.budget || "");
      setNotes(trip.notes || "");
      
      if (trip.start_date && trip.end_date) {
        setDateRange({
          from: new Date(trip.start_date),
          to: new Date(trip.end_date),
        });
      }
    } else {
      // Reset form
      setCountry("");
      setCity("");
      setDateRange(undefined);
      setBudget("");
      setNotes("");
      setAutoTitle("");
    }
  }, [trip, open]);

  // Clear city when country changes
  useEffect(() => {
    if (!trip) {
      setCity("");
      setCityPhoto(null);
    }
  }, [country, trip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!country || !city || !dateRange?.from || !dateRange?.to) {
      toast.error("Please fill in all required fields");
      return;
    }

    const data = {
      title: autoTitle,
      destination: city,
      country: country,
      start_date: format(dateRange.from, "yyyy-MM-dd"),
      end_date: format(dateRange.to, "yyyy-MM-dd"),
      budget: budget ? parseFloat(budget) : null,
      notes: notes || null,
    };

    if (trip) {
      const { error } = await supabase
        .from("trips")
        .update(data)
        .eq("id", trip.id);

      if (error) {
        toast.error("Failed to update trip");
        return;
      }
      toast.success("Trip updated");
    } else {
      const { error } = await supabase.from("trips").insert([data]);

      if (error) {
        toast.error("Failed to create trip");
        return;
      }
      toast.success("Trip created");
    }

    onSuccess();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trip ? "Edit Trip" : "Create New Trip"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Auto-generated title preview */}
          {autoTitle && (
            <div className="bg-muted/50 p-3 rounded-lg border border-border">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Trip Title (Auto-generated)</p>
                  <p className="text-sm text-muted-foreground mt-1">{autoTitle}</p>
                </div>
              </div>
            </div>
          )}

          {/* City Preview Image */}
          {(city && country) && (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-[3/1]">
              {loadingPhoto ? (
                <div className="w-full h-full animate-pulse bg-gradient-to-r from-muted via-muted-foreground/10 to-muted bg-[length:200%_100%] animate-shimmer" />
              ) : cityPhoto ? (
                <>
                  <img 
                    src={cityPhoto.url} 
                    alt={`${city}, ${country}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://source.unsplash.com/800x400/?${encodeURIComponent(city + ' travel')}`;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-3 text-white">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span className="font-semibold">{city}, {country}</span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Country *</Label>
              <CountryCombobox
                value={country}
                onChange={(v) => {
                  setCountry(v);
                  setCity('');
                  setCityPhoto(null);
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>City *</Label>
              <PlaceAutocomplete
                value={city}
                onChange={setCity}
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for a city..."
                restrictToCountry={country}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Travel Dates *</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
            {duration > 0 && (
              <p className="text-sm text-muted-foreground">
                Duration: {duration} {duration === 1 ? 'day' : 'days'}, {nights} {nights === 1 ? 'night' : 'nights'}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget (Optional)</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="Enter amount"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {trip ? "Update Trip" : "Create Trip"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TripFormDialog;
