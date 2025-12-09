import { supabase } from "@/integrations/supabase/client";
import type { FlightTicket } from "./types";

function mapRowToTicket(row: any): FlightTicket {
    return {
        id: row.id,
        userId: row.user_id,
        airline: row.airline,
        fromCode: row.from_code,
        fromCity: row.from_city,
        toCode: row.to_code,
        toCity: row.to_city,
        departureTime: row.departure_time,
        arrivalTime: row.arrival_time,
        date: row.date,
        flightDate: row.flight_date,
        seat: row.seat,
        flightNumber: row.flight_number,
        travelClass: row.travel_class,
        passenger: row.passenger,
        bookingRef: row.booking_ref,
        createdAt: row.created_at,
    };
}

export async function fetchFlightTickets(userId?: string | null) {
    let query = supabase
        .from("flight_tickets")
        .select("*")
        .order("flight_date", { ascending: false });

    if (userId) {
        query = query.eq("user_id", userId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data ?? []).map(mapRowToTicket);
}

export type NewFlightTicketInput = Omit<
    FlightTicket,
    "id" | "createdAt" | "userId"
> & { userId?: string | null };

export async function insertFlightTicket(input: NewFlightTicketInput) {
    const { userId, ...rest } = input;

    const { data, error } = await supabase
        .from("flight_tickets")
        .insert({
            user_id: userId ?? null,
            airline: rest.airline,
            from_code: rest.fromCode,
            from_city: rest.fromCity,
            to_code: rest.toCode,
            to_city: rest.toCity,
            departure_time: rest.departureTime,
            arrival_time: rest.arrivalTime,
            flight_date: rest.flightDate,
            seat: rest.seat,
            flight_number: rest.flightNumber,
            travel_class: rest.travelClass,
            passenger: rest.passenger,
            booking_ref: rest.bookingRef,
        })
        .select("*")
        .single();

    if (error) throw error;
    return mapRowToTicket(data);
}

export async function updateFlightTicket(id: string, input: Partial<NewFlightTicketInput>) {
    const updateData: Record<string, any> = {};
    
    if (input.airline !== undefined) updateData.airline = input.airline;
    if (input.fromCode !== undefined) updateData.from_code = input.fromCode;
    if (input.fromCity !== undefined) updateData.from_city = input.fromCity;
    if (input.toCode !== undefined) updateData.to_code = input.toCode;
    if (input.toCity !== undefined) updateData.to_city = input.toCity;
    if (input.departureTime !== undefined) updateData.departure_time = input.departureTime;
    if (input.arrivalTime !== undefined) updateData.arrival_time = input.arrivalTime;
    if (input.flightDate !== undefined) updateData.flight_date = input.flightDate;
    if (input.seat !== undefined) updateData.seat = input.seat;
    if (input.flightNumber !== undefined) updateData.flight_number = input.flightNumber;
    if (input.travelClass !== undefined) updateData.travel_class = input.travelClass;
    if (input.passenger !== undefined) updateData.passenger = input.passenger;
    if (input.bookingRef !== undefined) updateData.booking_ref = input.bookingRef;

    const { data, error } = await supabase
        .from("flight_tickets")
        .update(updateData)
        .eq("id", id)
        .select("*")
        .single();

    if (error) throw error;
    return mapRowToTicket(data);
}

export async function deleteFlightTicket(id: string) {
    const { error } = await supabase
        .from("flight_tickets")
        .delete()
        .eq("id", id);

    if (error) throw error;
}

export interface FlightStatus {
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

export async function fetchFlightStatus(flightNumber: string, date?: string): Promise<FlightStatus | null> {
    try {
        const { data, error } = await supabase.functions.invoke("flight-status", {
            body: { flightNumber, date },
        });

        if (error) {
            console.error("Flight status error:", error);
            return null;
        }

        return data as FlightStatus;
    } catch (err) {
        console.error("Failed to fetch flight status:", err);
        return null;
    }
}
