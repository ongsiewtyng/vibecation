import { useEffect, useRef, useState } from "react";
import { GOOGLE_MAPS_API_KEY } from "@/config/maps";
import { Loader2 } from "lucide-react";

/// <reference types="@types/google.maps" />

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title: string;
    onClick?: () => void;
  }>;
  className?: string;
}

const GoogleMapComponent = ({
  center = { lat: 0, lng: 0 },
  zoom = 8,
  markers = [],
  className = "w-full h-96",
}: GoogleMapComponentProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoading(false);
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    if (!loading && mapRef.current && !map && (window as any).google) {
      const newMap = new (window as any).google.maps.Map(mapRef.current, {
        center,
        zoom,
      });
      setMap(newMap);
    }
  }, [loading, map, center, zoom]);

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center]);

  useEffect(() => {
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      const marker = new (window as any).google.maps.Marker({
        position: markerData.position,
        map,
        title: markerData.title,
      });

      if (markerData.onClick) {
        marker.addListener("click", markerData.onClick);
      }

      markersRef.current.push(marker);
    });
  }, [map, markers]);

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-muted`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <div ref={mapRef} className={className} />;
};

export default GoogleMapComponent;
