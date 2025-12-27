import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { CountryCombobox } from "@/components/shared/CountryCombobox";
import { Sparkles, Loader2, Plane, AlertCircle, MapPin, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { generateTripTemplate, createTripWithTemplate, TripTemplateResult } from "@/lib/tripTemplateGenerator";
import { format, differenceInDays } from "date-fns";
import { DateRange } from "react-day-picker";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import PlaceAutocomplete from "@/components/maps/PlaceAutocomplete";

interface SmartTripDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefillFromFlight?: {
    destination: string;
    destinationCode: string;
    flightNumber: string;
    fromCode: string;
    toCode: string;
    arrivalTime?: string;
    flightDate?: string;
  };
}

type GenerationStep = 'idle' | 'generating' | 'creating' | 'success' | 'error';

interface CityPhoto {
  url: string;
  attribution: string;
}

export function SmartTripDialog({ open, onClose, onSuccess, prefillFromFlight }: SmartTripDialogProps) {
  const navigate = useNavigate();
  const [country, setCountry] = useState<string>(prefillFromFlight?.destination ? "" : "");
  const [city, setCity] = useState<string>(prefillFromFlight?.destination || "");
  const [cityPhoto, setCityPhoto] = useState<CityPhoto | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    prefillFromFlight?.flightDate 
      ? { from: new Date(prefillFromFlight.flightDate), to: undefined }
      : undefined
  );
  const [budget, setBudget] = useState<string>("2000");
  const [currency] = useState<string>("MYR");
  const [step, setStep] = useState<GenerationStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [generatedTemplate, setGeneratedTemplate] = useState<TripTemplateResult | null>(null);

  // Fetch city photo when city changes
  useEffect(() => {
    if (!city || !country) {
      setCityPhoto(null);
      return;
    }
    
    async function fetchCityPhoto() {
      setLoadingPhoto(true);
      try {
        const { data, error } = await supabase.functions.invoke('fetch-attractions', {
          body: { 
            country: country,
            city: city,
            type: 'tourist_attraction'
          }
        });
        
        if (data?.attractions?.[0]?.photo_reference) {
          // Use Google Places photo API - photo_reference from v1 API is the full resource name
          const photoRef = data.attractions[0].photo_reference;
          // For Places API v1, we need to use the new photo endpoint
          setCityPhoto({
            url: `https://places.googleapis.com/v1/${photoRef}/media?maxWidthPx=800&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''}`,
            attribution: data.attractions[0].name || city
          });
        } else {
          // Use a fallback image based on destination
          setCityPhoto({
            url: `https://source.unsplash.com/800x400/?${encodeURIComponent(city + ' city skyline')}`,
            attribution: city
          });
        }
      } catch (error) {
        console.error('Error fetching city photo:', error);
        // Fallback to Unsplash
        setCityPhoto({
          url: `https://source.unsplash.com/800x400/?${encodeURIComponent(city + ' travel destination')}`,
          attribution: city
        });
      } finally {
        setLoadingPhoto(false);
      }
    }
    
    const debounce = setTimeout(fetchCityPhoto, 500);
    return () => clearTimeout(debounce);
  }, [city, country]);

  const handlePlaceSelect = (place: { name: string; lat: number; lng: number; formattedAddress?: string }) => {
    setCity(place.name);
    // Try to extract country from formatted address
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

  const handleGenerate = async () => {
    if (!city || !country || !dateRange?.from || !dateRange?.to) {
      toast.error("Please fill in all required fields");
      return;
    }

    const totalBudget = parseFloat(budget);
    if (isNaN(totalBudget) || totalBudget <= 0) {
      toast.error("Please enter a valid budget");
      return;
    }

    setStep('generating');
    setErrorMessage("");

    try {
      // Generate template using AI
      const template = await generateTripTemplate({
        destination: city,
        country: country,
        startDate: format(dateRange.from, 'yyyy-MM-dd'),
        endDate: format(dateRange.to, 'yyyy-MM-dd'),
        currency: currency,
        totalBudget: totalBudget,
        flightInfo: prefillFromFlight ? {
          flightNumber: prefillFromFlight.flightNumber,
          fromCode: prefillFromFlight.fromCode,
          toCode: prefillFromFlight.toCode,
          arrivalTime: prefillFromFlight.arrivalTime
        } : undefined
      });

      setGeneratedTemplate(template);
      setStep('creating');

      // Create trip with template data
      const numDays = differenceInDays(dateRange.to, dateRange.from) + 1;
      const tripTitle = `${city}, ${country} — ${format(dateRange.from, 'MMM d')} to ${format(dateRange.to, 'MMM d, yyyy')}`;
      
      const tripId = await createTripWithTemplate(
        {
          title: tripTitle,
          destination: city,
          country: country,
          startDate: format(dateRange.from, 'yyyy-MM-dd'),
          endDate: format(dateRange.to, 'yyyy-MM-dd'),
          budget: totalBudget,
          notes: `Smart template generated with ${template.itinerary.length} activities, ${template.stays.length} accommodation(s), and budget allocation across ${template.budget.length} categories.`
        },
        template
      );

      setStep('success');
      toast.success("Trip created with smart template!");
      
      onSuccess();
      onClose();
      
      // Navigate to the new trip
      navigate(`/trip/${tripId}`);

    } catch (error) {
      console.error('Error generating template:', error);
      setStep('error');
      setErrorMessage(error instanceof Error ? error.message : 'Failed to generate template');
      toast.error("Failed to generate trip template");
    }
  };

  const handleClose = () => {
    setStep('idle');
    setErrorMessage("");
    setGeneratedTemplate(null);
    setCityPhoto(null);
    onClose();
  };

  const numDays = dateRange?.from && dateRange?.to 
    ? differenceInDays(dateRange.to, dateRange.from) + 1 
    : 0;

  const isGenerating = step === 'generating' || step === 'creating';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Create Smart Trip
          </DialogTitle>
          <DialogDescription>
            AI will generate a complete itinerary, accommodation suggestions, and budget allocation based on your preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {prefillFromFlight && (
            <Alert className="bg-primary/10 border-primary/20">
              <Plane className="h-4 w-4" />
              <AlertDescription>
                Pre-filled from flight {prefillFromFlight.flightNumber} to {prefillFromFlight.destinationCode}
              </AlertDescription>
            </Alert>
          )}

          {/* City Preview Image */}
          {(city && country) && (
            <div className="relative rounded-lg overflow-hidden bg-muted aspect-[2/1]">
              {loadingPhoto ? (
                <Skeleton className="w-full h-full" />
              ) : cityPhoto ? (
                <>
                  <img 
                    src={cityPhoto.url} 
                    alt={`${city}, ${country}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback if image fails to load
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Country</Label>
              <CountryCombobox 
                value={country} 
                onChange={(v) => {
                  setCountry(v);
                  setCity('');
                  setCityPhoto(null);
                }}
                disabled={isGenerating}
              />
            </div>
            <div className="space-y-2">
              <Label>City / Destination</Label>
              <PlaceAutocomplete
                value={city}
                onChange={setCity}
                onPlaceSelect={handlePlaceSelect}
                placeholder="Search for a city..."
                disabled={isGenerating}
                restrictToCountry={country}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Travel Dates</Label>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              disabled={isGenerating}
            />
            {numDays > 0 && (
              <p className="text-sm text-muted-foreground">
                {numDays} day{numDays > 1 ? 's' : ''} trip
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Total Budget ({currency})</Label>
            <Input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Enter total budget"
              disabled={isGenerating}
            />
          </div>

          {step === 'error' && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorMessage}</AlertDescription>
            </Alert>
          )}

          {isGenerating && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="text-center">
                <p className="font-medium">
                  {step === 'generating' ? 'Generating your trip plan...' : 'Creating trip...'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {step === 'generating' 
                    ? 'AI is crafting personalized suggestions for ' + city
                    : 'Saving itinerary, stays, and budget...'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isGenerating}>
            Cancel
          </Button>
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !city || !country || !dateRange?.from || !dateRange?.to}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Smart Trip
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
