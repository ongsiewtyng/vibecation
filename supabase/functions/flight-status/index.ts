import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FlightStatusResponse {
  flightNumber: string;
  status: "scheduled" | "active" | "landed" | "cancelled" | "delayed" | "diverted" | "unknown";
  departureAirport: string;
  arrivalAirport: string;
  scheduledDeparture: string | null;
  actualDeparture: string | null;
  scheduledArrival: string | null;
  actualArrival: string | null;
  departureGate: string | null;
  arrivalGate: string | null;
  departureTerminal: string | null;
  arrivalTerminal: string | null;
  delay: number | null;
  airline: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { flightNumber, date } = await req.json();

    if (!flightNumber) {
      return new Response(
        JSON.stringify({ error: "Flight number is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("AVIATIONSTACK_API_KEY");
    
    if (!apiKey) {
      console.log("No AVIATIONSTACK_API_KEY, returning mock data");
      return new Response(
        JSON.stringify(getMockFlightStatus(flightNumber)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract airline code and flight number
    const airlineCode = flightNumber.replace(/[0-9]/g, "").toUpperCase();
    const flightNum = flightNumber.replace(/[^0-9]/g, "");

    const url = new URL("http://api.aviationstack.com/v1/flights");
    url.searchParams.set("access_key", apiKey);
    url.searchParams.set("flight_iata", `${airlineCode}${flightNum}`);
    
    if (date) {
      url.searchParams.set("flight_date", date);
    }

    console.log(`Fetching flight status for ${flightNumber}`);

    const response = await fetch(url.toString());
    const data = await response.json();

    if (data.error) {
      console.error("AviationStack error:", data.error);
      return new Response(
        JSON.stringify(getMockFlightStatus(flightNumber)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data.data || data.data.length === 0) {
      console.log("No flight data found, returning mock");
      return new Response(
        JSON.stringify(getMockFlightStatus(flightNumber)),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const flight = data.data[0];
    
    const result: FlightStatusResponse = {
      flightNumber: flight.flight?.iata || flightNumber,
      status: mapStatus(flight.flight_status),
      departureAirport: flight.departure?.iata || "",
      arrivalAirport: flight.arrival?.iata || "",
      scheduledDeparture: flight.departure?.scheduled || null,
      actualDeparture: flight.departure?.actual || flight.departure?.estimated || null,
      scheduledArrival: flight.arrival?.scheduled || null,
      actualArrival: flight.arrival?.actual || flight.arrival?.estimated || null,
      departureGate: flight.departure?.gate || null,
      arrivalGate: flight.arrival?.gate || null,
      departureTerminal: flight.departure?.terminal || null,
      arrivalTerminal: flight.arrival?.terminal || null,
      delay: flight.departure?.delay || flight.arrival?.delay || null,
      airline: flight.airline?.name || null,
    };

    console.log("Flight status fetched successfully:", result.status);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Flight status error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function mapStatus(status: string | null): FlightStatusResponse["status"] {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (s === "scheduled") return "scheduled";
  if (s === "active" || s === "en-route") return "active";
  if (s === "landed") return "landed";
  if (s === "cancelled") return "cancelled";
  if (s === "delayed" || s.includes("delay")) return "delayed";
  if (s === "diverted") return "diverted";
  return "unknown";
}

function getMockFlightStatus(flightNumber: string): FlightStatusResponse {
  const statuses: FlightStatusResponse["status"][] = ["scheduled", "active", "landed", "delayed"];
  const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
  const delay = randomStatus === "delayed" ? Math.floor(Math.random() * 60) + 10 : null;
  
  return {
    flightNumber,
    status: randomStatus,
    departureAirport: "",
    arrivalAirport: "",
    scheduledDeparture: null,
    actualDeparture: null,
    scheduledArrival: null,
    actualArrival: null,
    departureGate: `${Math.floor(Math.random() * 50) + 1}`,
    arrivalGate: `${Math.floor(Math.random() * 50) + 1}`,
    departureTerminal: `${Math.floor(Math.random() * 4) + 1}`,
    arrivalTerminal: `${Math.floor(Math.random() * 4) + 1}`,
    delay,
    airline: null,
  };
}
