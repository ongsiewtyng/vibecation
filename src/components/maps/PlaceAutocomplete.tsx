import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: { name: string; lat: number; lng: number; formattedAddress?: string }) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  types?: string[];
  country?: string;
  restrictToCountry?: string;
  disabled?: boolean;
}

const PlaceAutocomplete = ({
  onPlaceSelect,
  placeholder = "Search for a place...",
  value = "",
  onChange,
  types = ["(cities)"],
  country,
  restrictToCountry,
  disabled = false,
}: PlaceAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [internalValue, setInternalValue] = useState(value);

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoading(false);
    
    if (!document.querySelector(`script[src="${script.src}"]`)) {
      document.head.appendChild(script);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && inputRef.current && (window as any).google) {
      // Clean up previous autocomplete
      if (autocompleteRef.current) {
        (window as any).google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }

      const countryRestriction = restrictToCountry || country;
      const options: any = {
        types: types.length > 0 ? types : ["(cities)"],
        fields: ["name", "geometry", "formatted_address", "address_components"],
      };
      
      // Only add country restriction if we have a valid ISO code
      if (countryRestriction) {
        // Try to get ISO code from country name
        const countryCode = getCountryCode(countryRestriction);
        if (countryCode) {
          options.componentRestrictions = { country: countryCode };
        }
      }

      autocompleteRef.current = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current.getPlace();
        if (place.geometry) {
          const cityName = place.name || place.address_components?.find((c: any) => c.types.includes('locality'))?.long_name || '';
          setInternalValue(cityName);
          onChange?.(cityName);
          onPlaceSelect({
            name: cityName,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            formattedAddress: place.formatted_address
          });
        }
      });
    }
  }, [loading, types, restrictToCountry, country]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      value={internalValue}
      onChange={handleInputChange}
      disabled={disabled || loading}
      className="w-full"
    />
  );
};

// Simple country name to ISO code mapping for common countries
function getCountryCode(countryName: string): string | null {
  const countryMap: Record<string, string> = {
    'afghanistan': 'af', 'albania': 'al', 'algeria': 'dz', 'argentina': 'ar',
    'australia': 'au', 'austria': 'at', 'bangladesh': 'bd', 'belgium': 'be',
    'brazil': 'br', 'canada': 'ca', 'chile': 'cl', 'china': 'cn',
    'colombia': 'co', 'croatia': 'hr', 'czech republic': 'cz', 'denmark': 'dk',
    'egypt': 'eg', 'finland': 'fi', 'france': 'fr', 'germany': 'de',
    'greece': 'gr', 'hong kong': 'hk', 'hungary': 'hu', 'iceland': 'is',
    'india': 'in', 'indonesia': 'id', 'ireland': 'ie', 'israel': 'il',
    'italy': 'it', 'japan': 'jp', 'jordan': 'jo', 'kenya': 'ke',
    'malaysia': 'my', 'maldives': 'mv', 'mexico': 'mx', 'morocco': 'ma',
    'nepal': 'np', 'netherlands': 'nl', 'new zealand': 'nz', 'norway': 'no',
    'pakistan': 'pk', 'peru': 'pe', 'philippines': 'ph', 'poland': 'pl',
    'portugal': 'pt', 'qatar': 'qa', 'romania': 'ro', 'russia': 'ru',
    'saudi arabia': 'sa', 'singapore': 'sg', 'south africa': 'za', 'south korea': 'kr',
    'spain': 'es', 'sri lanka': 'lk', 'sweden': 'se', 'switzerland': 'ch',
    'taiwan': 'tw', 'thailand': 'th', 'turkey': 'tr', 'uae': 'ae',
    'united arab emirates': 'ae', 'uk': 'gb', 'united kingdom': 'gb',
    'usa': 'us', 'united states': 'us', 'united states of america': 'us',
    'vietnam': 'vn'
  };
  
  const normalized = countryName.toLowerCase().trim();
  return countryMap[normalized] || null;
}

export default PlaceAutocomplete;
