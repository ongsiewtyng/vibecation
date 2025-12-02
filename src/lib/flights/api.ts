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
        .order("created_at", { ascending: false });

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
