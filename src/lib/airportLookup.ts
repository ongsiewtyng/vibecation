// src/lib/airportLookup.ts
import { supabase } from "@/integrations/supabase/client";

export interface AirportInfo {
    iata?: string;
    icao?: string;
    name?: string;
    city?: string;
    country?: string;
    [key: string]: any;
}

/**
 * Generic helper – pass any airport code (IATA or ICAO),
 * the edge function will decide how to handle it.
 */
export async function fetchAirportByCode(
    code: string
): Promise<AirportInfo | null> {
    if (!code) return null;

    const { data, error } = await supabase.functions.invoke("airport-lookup", {
        body: { code }, // 👈 matches the edge function we set up
    });

    if (error) {
        console.error("airport-lookup error", error);
        return null;
    }

    return data as AirportInfo;
}

/**
 * Backwards-compatible wrapper if you’re thinking in IATA (3-letter) codes.
 * Internally just calls fetchAirportByCode.
 */
export async function fetchAirportByIata(
    iata: string
): Promise<AirportInfo | null> {
    return fetchAirportByCode(iata);
}
