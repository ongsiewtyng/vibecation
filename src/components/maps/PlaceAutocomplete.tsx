import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";

interface PlaceAutocompleteProps {
  onPlaceSelect: (place: any) => void;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  types?: string[];
  country?: string;
}

const PlaceAutocomplete = ({
  onPlaceSelect,
  placeholder = "Search for a place...",
  value = "",
  onChange,
  types = [],
  country,
}: PlaceAutocompleteProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);

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
      const options: any = {
        types: types.length > 0 ? types : undefined,
        componentRestrictions: country ? { country } : undefined,
      };

      const autocomplete = new (window as any).google.maps.places.Autocomplete(
        inputRef.current,
        options
      );

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          onPlaceSelect(place);
        }
      });
    }
  }, [loading, onPlaceSelect, types, country]);

  return (
    <Input
      ref={inputRef}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={loading}
    />
  );
};

export default PlaceAutocomplete;
