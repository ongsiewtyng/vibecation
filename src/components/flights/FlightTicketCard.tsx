import React, { useState, useEffect } from "react";
import type { FlightTicket } from "@/lib/flights/types";
import {
    fetchAirportByCode,
    type AirportInfo,
} from "@/lib/airportLookup";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";

countries.registerLocale(en);

interface FlightTicketCardProps {
    ticket: FlightTicket;
    index?: number;
}

function formatFlightDate(raw?: string | null) {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d
        .toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        .toUpperCase();
}

function getFlagUrl(countryName?: string) {
    if (!countryName) return null;
    const iso2 = countries.getAlpha2Code(countryName, "en");
    if (!iso2) return null;
    return `https://flagcdn.com/48x36/${iso2.toLowerCase()}.png`;
}

/**
 * Extract the airline IATA code from a flight number.
 * e.g. "EK108" -> "EK", "BA 412" -> "BA"
 */
function getAirlineCode(flightNumber?: string) {
    if (!flightNumber) return null;
    // Take first two letters ignoring spaces/dashes
    const cleaned = flightNumber.replace(/[^A-Za-z]/g, "");
    if (cleaned.length < 2) return null;
    return cleaned.slice(0, 2).toUpperCase();
}

/**
 * Aviasales airline logo URL.
 * Docs: http(s)://img.wway.io/pics/root/{IATA}@png?exar=1&rs=fit:{width}:{height}
 */
function getAirlineLogoUrl(
    iata: string,
    width = 240,
    height = 80
): string {
    return `https://img.wway.io/pics/root/${iata}@png?exar=1&rs=fit:${width}:${height}`;
}

export const FlightTicketCard: React.FC<FlightTicketCardProps> = ({
                                                                      ticket,
                                                                      index = 0,
                                                                  }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    const [fromAirport, setFromAirport] = useState<AirportInfo | null>(null);
    const [toAirport, setToAirport] = useState<AirportInfo | null>(null);

    const handleToggle = () => setIsFlipped((prev) => !prev);

    const rawDate =
        (ticket as any).flightDate ??
        (ticket as any).date ??
        (ticket as any).flight_date ??
        "";
    const dateDisplay = formatFlightDate(rawDate);

    // ---- Airport lookup (via Supabase edge + AirportDB) ----
    useEffect(() => {
        let cancelled = false;

        async function load() {
            try {
                const [from, to] = await Promise.all([
                    fetchAirportByCode(ticket.fromCode),
                    fetchAirportByCode(ticket.toCode),
                ]);

                if (cancelled) return;
                if (from) setFromAirport(from);
                if (to) setToAirport(to);
            } catch (err) {
                if (!cancelled) {
                    console.error("airport lookup failed", err);
                }
            }
        }

        load();
        return () => {
            cancelled = true;
        };
    }, [ticket.fromCode, ticket.toCode]);

    // Fallback values if lookup fails
    const fromCode = (fromAirport?.iata || ticket.fromCode).toUpperCase();
    const toCode = (toAirport?.iata || ticket.toCode).toUpperCase();

    const fromCity = fromAirport?.city || ticket.fromCity;
    const toCity = toAirport?.city || ticket.toCity;

    const fromAirportName = fromAirport?.name;
    const toAirportName = toAirport?.name;

    const fromFlag = getFlagUrl(fromAirport?.country);
    const toFlag = getFlagUrl(toAirport?.country);

    // ---- Airline logo (Aviasales) ----
    const airlineCode = getAirlineCode(ticket.flightNumber);
    const airlineLogo1x = airlineCode
        ? getAirlineLogoUrl(airlineCode, 240, 80)
        : null;
    const airlineLogo2x = airlineCode
        ? getAirlineLogoUrl(airlineCode, 480, 160)
        : null;

    return (
        <article
            className="relative mx-auto max-w-sm cursor-pointer"
            onClick={handleToggle}
            style={{ transitionDelay: `${index * 40}ms` }}
        >
            <div className="group relative [perspective:1400px]">
                {/* 3D FLIP WRAPPER */}
                <div
                    className={`
            relative h-[560px]
            transition-transform duration-700
            [transform-style:preserve-3d]
            ease-[cubic-bezier(0.22,1,0.36,1)]
            ${isFlipped ? "[transform:rotateY(180deg)]" : ""}
        `}
                >
                    {/* =================== FRONT =================== */}
                    <div className="absolute inset-0 [backface-visibility:hidden]">
                        {/* underlayer */}
                        <div className="absolute inset-0 rounded-[30px] bg-slate-900 border border-slate-800 shadow-xl">
                            {/* Side strip */}
                            <div className="absolute left-4 top-5 bottom-5 w-[26%] rounded-[24px] bg-slate-900 border border-slate-700 px-3 py-4 flex flex-col justify-between">
                                {/* Origin */}
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400">
                                            From
                                        </p>
                                        <p className="text-sm font-semibold text-slate-50">
                                            {fromCode}
                                        </p>

                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            {fromFlag && (
                                                <img
                                                    src={fromFlag}
                                                    className="w-3 h-2 rounded-sm"
                                                    alt=""
                                                />
                                            )}
                                            <span className="line-clamp-1">{fromCity}</span>
                                        </div>
                                        {fromAirportName && (
                                            <p className="text-[9px] text-slate-500 line-clamp-1">
                                                {fromAirportName}
                                            </p>
                                        )}
                                    </div>

                                    {/* Destination */}
                                    <div>
                                        <p className="text-[10px] uppercase text-slate-400">
                                            To
                                        </p>
                                        <p className="text-sm font-semibold text-slate-50">
                                            {toCode}
                                        </p>

                                        <div className="flex items-center gap-1 text-[10px] text-slate-400">
                                            {toFlag && (
                                                <img
                                                    src={toFlag}
                                                    className="w-3 h-2 rounded-sm"
                                                    alt=""
                                                />
                                            )}
                                            <span className="line-clamp-1">{toCity}</span>
                                        </div>

                                        {toAirportName && (
                                            <p className="text-[9px] text-slate-500 line-clamp-1">
                                                {toAirportName}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Date */}
                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-slate-400">
                                        Date
                                    </p>
                                    <p className="text-[11px] font-semibold text-slate-50">
                                        {dateDisplay}
                                    </p>
                                    <p className="text-[10px] uppercase text-slate-400">
                                        Seat {ticket.seat}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* COVER */}
                        <div className="absolute top-5 bottom-5 left-6 right-4 rounded-[28px] bg-slate-950 text-slate-50 border border-slate-800 shadow-2xl overflow-hidden transition-transform duration-500 ease-out group-hover:translate-x-5 group-hover:-translate-y-3 group-hover:rotate-[3deg]">
                            <div className="relative flex h-full flex-col justify-between px-6 py-7">
                                {/* Airline */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {airlineLogo1x ? (
                                            <img
                                                src={airlineLogo1x}
                                                srcSet={
                                                    airlineLogo2x
                                                        ? `${airlineLogo1x} 1x, ${airlineLogo2x} 2x`
                                                        : undefined
                                                }
                                                className="h-12 w-auto object-contain rounded-2xl px-2 py-1"
                                                alt={ticket.airline || airlineCode || "Airline logo"}
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-300 bg-sky-400/20 text-2xl">
                                                ✈
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-[11px] uppercase tracking-widest text-slate-400">
                                                Airline
                                            </p>
                                            <p className="text-lg font-semibold tracking-[0.2em] uppercase">
                                                {ticket.airline || airlineCode || "Airline"}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase text-slate-400">
                                                    Passenger
                                                </p>
                                                <p className="text-sm font-semibold">
                                                    {ticket.passenger}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-slate-400">
                                                    Flight
                                                </p>
                                                <p className="text-sm font-semibold">
                                                    {ticket.flightNumber}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-sky-100">
                                            <span>{fromCode}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="h-px w-8 bg-sky-300" />
                                                ✈
                                                <span className="h-px w-8 bg-sky-300" />
                                            </div>
                                            <span>{toCode}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] uppercase text-slate-300">
                                            <span>{dateDisplay}</span>
                                            <span>
                        {ticket.departureTime} → {ticket.arrivalTime}
                      </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-[10px] uppercase text-slate-400 tracking-widest">
                                    <span>Hover to peek</span>
                                    <span>Click to flip</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* =================== BACK =================== */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="h-full rounded-[30px] bg-slate-950 text-slate-50 border border-slate-800 px-6 pt-6 pb-7 flex flex-col">
                            {/* TOP INFO */}
                            <div className="grid grid-cols-2 gap-x-10 gap-y-3 text-xs uppercase tracking-widest">
                                <div>
                                    <p className="text-slate-400">Seat</p>
                                    <p className="text-sm font-semibold">{ticket.seat}</p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Flight</p>
                                    <p className="text-sm font-semibold">
                                        {ticket.flightNumber}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Class</p>
                                    <p className="text-sm font-semibold">
                                        {ticket.travelClass}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-slate-400">Date</p>
                                    <p className="text-sm font-semibold">{dateDisplay}</p>
                                </div>
                            </div>

                            {/* MIDDLE STRIP */}
                            <div className="mt-8 flex items-center gap-6">
                                {/* ORIGIN */}
                                <div className="flex-1 flex flex-col">
                  <span className="text-[11px] uppercase text-slate-400">
                    {ticket.departureTime}
                  </span>
                                    <span className="mt-1 text-3xl font-bold tracking-[0.35em]">
                    {fromCode}
                  </span>

                                    <div className="flex items-center gap-1 text-[11px] text-slate-300">
                                        {fromFlag && (
                                            <img
                                                src={fromFlag}
                                                className="w-4 h-3 rounded-sm"
                                                alt=""
                                            />
                                        )}
                                        <span>{fromCity}</span>
                                    </div>

                                    {fromAirportName && (
                                        <span className="text-[10px] text-slate-500">
                      {fromAirportName}
                    </span>
                                    )}
                                </div>

                                {/* MIDDLE AIRLINE PILL */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="px-6 py-2 rounded-full border border-slate-700 bg-slate-900/60 flex items-center gap-2">
                                        ✈
                                    </div>
                                    {airlineLogo1x && (
                                        <img
                                            src={airlineLogo1x}
                                            srcSet={
                                                airlineLogo2x
                                                    ? `${airlineLogo1x} 1x, ${airlineLogo2x} 2x`
                                                    : undefined
                                            }
                                            className="h-6 w-auto object-contain opacity-80"
                                            alt={ticket.airline || airlineCode || "Airline logo"}
                                        />
                                    )}
                                </div>

                                {/* DESTINATION */}
                                <div className="flex-1 flex flex-col items-end">
                  <span className="text-[11px] uppercase text-slate-400">
                    {ticket.arrivalTime}
                  </span>
                                    <span className="mt-1 text-3xl font-bold tracking-[0.35em]">
                    {toCode}
                  </span>

                                    <div className="flex items-center gap-1 text-[11px] text-slate-300">
                                        {toFlag && (
                                            <img
                                                src={toFlag}
                                                className="w-4 h-3 rounded-sm"
                                                alt=""
                                            />
                                        )}
                                        <span>{toCity}</span>
                                    </div>

                                    {toAirportName && (
                                        <span className="text-[10px] text-slate-500">
                      {toAirportName}
                    </span>
                                    )}
                                </div>
                            </div>

                            {/* PASSENGER + BOOKING */}
                            <div className="mt-auto pt-10">
                                <div className="grid grid-cols-2 gap-6 text-xs uppercase tracking-widest">
                                    <div>
                                        <p className="text-slate-400">Passenger</p>
                                        <p className="mt-1 text-sm font-semibold">
                                            {ticket.passenger}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Booking Ref</p>
                                        <p className="mt-1 text-sm font-semibold">
                                            {ticket.bookingRef}
                                        </p>
                                    </div>
                                </div>

                                {/* Tear line */}
                                <div className="relative mt-6">
                                    <div className="border-t border-dashed border-slate-700" />
                                    <div className="absolute left-0 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950" />
                                    <div className="absolute right-0 top-1/2 h-4 w-4 translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950" />
                                </div>

                                {/* BARCODE */}
                                <div className="mt-4">
                                    <div className="h-12 w-full rounded-md bg-[repeating-linear-gradient(90deg,#e5e7eb_0,#e5e7eb_2px,transparent_2px,transparent_4px)] opacity-80" />
                                    <p className="mt-2 text-[10px] uppercase text-slate-500 text-center">
                                        Serial Number 123456
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* =================== END BACK =================== */}
                </div>
            </div>
        </article>
    );
};
