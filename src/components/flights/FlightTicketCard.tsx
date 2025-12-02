import React, { useState, useEffect } from "react";
import type { FlightTicket } from "@/lib/flights/types";
import { fetchAirportByCode, type AirportInfo } from "@/lib/airportLookup";
import { Plane, Calendar, User, CreditCard } from "lucide-react";
import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import "./FlightTicketCard.css";

countries.registerLocale(en);

interface FlightTicketCardProps {
    ticket: FlightTicket;
    index?: number;
}

function formatFlightDate(raw?: string | null) {
    if (!raw) return "";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    }).toUpperCase();
}

function getFlagUrl(countryName?: string) {
    if (!countryName) return null;
    const iso2 = countries.getAlpha2Code(countryName, "en");
    if (!iso2) return null;
    return `https://flagcdn.com/48x36/${iso2.toLowerCase()}.png`;
}

function getAirlineCode(flightNumber?: string) {
    if (!flightNumber) return null;
    const cleaned = flightNumber.replace(/[^A-Za-z]/g, "");
    if (cleaned.length < 2) return null;
    return cleaned.slice(0, 2).toUpperCase();
}

function getAirlineLogoUrl(iata: string, width = 240, height = 80): string {
    return `https://img.wway.io/pics/root/${iata}@png?exar=1&rs=fit:${width}:${height}`;
}

export const FlightTicketCard: React.FC<FlightTicketCardProps> = ({ ticket, index = 0 }) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [fromAirport, setFromAirport] = useState<AirportInfo | null>(null);
    const [toAirport, setToAirport] = useState<AirportInfo | null>(null);

    const handleToggle = () => setIsFlipped((prev) => !prev);

    const rawDate = (ticket as any).flightDate ?? (ticket as any).date ?? "";
    const dateDisplay = formatFlightDate(rawDate);

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

    const fromCode = (fromAirport?.iata || ticket.fromCode).toUpperCase();
    const toCode = (toAirport?.iata || ticket.toCode).toUpperCase();
    const fromCity = fromAirport?.city || ticket.fromCity;
    const toCity = toAirport?.city || ticket.toCity;
    const fromAirportName = fromAirport?.name;
    const toAirportName = toAirport?.name;
    const fromFlag = getFlagUrl(fromAirport?.country);
    const toFlag = getFlagUrl(toAirport?.country);

    const airlineCode = getAirlineCode(ticket.flightNumber);
    const airlineLogo1x = airlineCode ? getAirlineLogoUrl(airlineCode, 240, 80) : null;
    const airlineLogo2x = airlineCode ? getAirlineLogoUrl(airlineCode, 480, 160) : null;

    return (
        <article
            className="relative mx-auto max-w-sm cursor-pointer"
            onClick={handleToggle}
            style={{ transitionDelay: `${index * 40}ms` }}
        >
            <div className="group relative [perspective:1400px]">
                <div
                    className={`relative h-[560px] transition-transform duration-700 [transform-style:preserve-3d] ease-[cubic-bezier(0.22,1,0.36,1)] ${
                        isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                >
                    {/* FRONT */}
                    <div className="absolute inset-0 [backface-visibility:hidden]">
                        <div className="absolute inset-0 rounded-[30px] bg-card border border-border shadow-xl">
                            <div className="absolute left-4 top-5 bottom-5 w-[26%] rounded-[24px] bg-muted border border-border px-3 py-4 flex flex-col justify-between">
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground">From</p>
                                        <p className="text-sm font-semibold text-foreground">{fromCode}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            {fromFlag && <img src={fromFlag} className="w-3 h-2 rounded-sm" alt="" />}
                                            <span className="line-clamp-1">{String(fromCity)}</span>
                                        </div>
                                        {fromAirportName && (
                                            <p className="text-[9px] text-muted-foreground/70 line-clamp-1">{fromAirportName}</p>
                                        )}
                                    </div>

                                    <div>
                                        <p className="text-[10px] uppercase text-muted-foreground">To</p>
                                        <p className="text-sm font-semibold text-foreground">{toCode}</p>
                                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                            {toFlag && <img src={toFlag} className="w-3 h-2 rounded-sm" alt="" />}
                                            <span className="line-clamp-1">{String(toCity)}</span>
                                        </div>
                                        {toAirportName && (
                                            <p className="text-[9px] text-muted-foreground/70 line-clamp-1">{toAirportName}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <p className="text-[10px] uppercase text-muted-foreground">Date</p>
                                    <p className="text-[11px] font-semibold text-foreground">{dateDisplay}</p>
                                    <p className="text-[10px] uppercase text-muted-foreground">Seat {ticket.seat}</p>
                                </div>
                            </div>
                        </div>

                        <div className="absolute top-5 bottom-5 left-6 right-4 rounded-[28px] bg-card text-foreground border border-border shadow-2xl overflow-hidden transition-transform duration-500 ease-out group-hover:translate-x-5 group-hover:-translate-y-3 group-hover:rotate-[3deg]">
                            <div className="relative flex h-full flex-col justify-between px-6 py-7">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        {airlineLogo1x ? (
                                            <img
                                                src={airlineLogo1x}
                                                srcSet={airlineLogo2x ? `${airlineLogo1x} 1x, ${airlineLogo2x} 2x` : undefined}
                                                className="h-12 w-auto object-contain rounded-2xl px-2 py-1"
                                                alt={ticket.airline || airlineCode || "Airline logo"}
                                            />
                                        ) : (
                                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 text-2xl">
                                                ✈
                                            </div>
                                        )}

                                        <div>
                                            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Airline</p>
                                            <p className="text-lg font-semibold tracking-[0.2em] uppercase text-foreground">
                                                {ticket.airline || airlineCode || "Airline"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 text-xs">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[10px] uppercase text-muted-foreground">Passenger</p>
                                                <p className="text-sm font-semibold text-foreground">{ticket.passenger}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase text-muted-foreground">Flight</p>
                                                <p className="text-sm font-semibold text-foreground">{ticket.flightNumber}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-primary">
                                            <span>{fromCode}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="h-px w-8 bg-primary/30" />✈<span className="h-px w-8 bg-primary/30" />
                                            </div>
                                            <span>{toCode}</span>
                                        </div>

                                        <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground">
                                            <span>{dateDisplay}</span>
                                            <span>{ticket.departureTime} → {ticket.arrivalTime}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center justify-between text-[10px] uppercase text-muted-foreground/50 tracking-widest">
                                    <span>Hover to peek</span>
                                    <span>Click to flip</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* BACK */}
                    <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="h-full rounded-[30px] bg-card text-foreground border border-border px-6 pt-6 pb-7 flex flex-col shadow-xl">
                            <div className="mb-6 border-b border-dashed border-border pb-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Boarding Pass</div>
                                        <div className="mt-1 text-lg font-bold tracking-tight text-foreground">{ticket.airline}</div>
                                    </div>
                                    {airlineLogo1x && (
                                        <img
                                            src={airlineLogo1x}
                                            className="h-12 w-auto object-contain rounded-lg bg-muted/30 p-2"
                                            alt={ticket.airline}
                                        />
                                    )}
                                </div>
                            </div>

                            <div className="mb-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-0.5 text-primary" />
                                    <div className="flex-1">
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Passenger</div>
                                        <div className="mt-0.5 text-sm font-semibold text-foreground">{ticket.passenger}</div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 mt-0.5 text-primary" />
                                    <div className="flex-1">
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Date</div>
                                        <div className="mt-0.5 text-sm font-semibold text-foreground">{dateDisplay}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6 grid grid-cols-2 gap-4 rounded-lg bg-muted/30 p-4">
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Flight</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{ticket.flightNumber}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Class</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{ticket.travelClass}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Seat</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{ticket.seat}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Boarding</div>
                                    <div className="mt-1 text-sm font-semibold text-foreground">{ticket.departureTime}</div>
                                </div>
                                {ticket.gate && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Gate</div>
                                        <div className="mt-1 text-sm font-semibold text-foreground">{ticket.gate}</div>
                                    </div>
                                )}
                                {ticket.terminal && (
                                    <div>
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">Terminal</div>
                                        <div className="mt-1 text-sm font-semibold text-foreground">{ticket.terminal}</div>
                                    </div>
                                )}
                            </div>

                            <div className="mb-6 space-y-3">
                                <div className="flex items-start gap-3">
                                    <Plane className="h-4 w-4 mt-0.5 text-primary rotate-45" />
                                    <div className="flex-1">
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">From</div>
                                        <div className="mt-0.5 text-sm font-semibold text-foreground">
                                            {fromCode} - {fromAirportName || fromCity}
                                        </div>
                                        {fromAirport?.country && typeof fromAirport.country === 'string' && (
                                            <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                                                {fromFlag && <img src={fromFlag} className="w-3 h-2 rounded-sm" alt="" />}
                                                {fromAirport.country}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-foreground">{ticket.departureTime}</div>
                                </div>

                                <div className="flex items-start gap-3">
                                    <Plane className="h-4 w-4 mt-0.5 text-primary -rotate-45" />
                                    <div className="flex-1">
                                        <div className="text-xs uppercase tracking-wider text-muted-foreground">To</div>
                                        <div className="mt-0.5 text-sm font-semibold text-foreground">
                                            {toCode} - {toAirportName || toCity}
                                        </div>
                                        {toAirport?.country && typeof toAirport.country === 'string' && (
                                            <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1">
                                                {toFlag && <img src={toFlag} className="w-3 h-2 rounded-sm" alt="" />}
                                                {toAirport.country}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-medium text-foreground">{ticket.arrivalTime}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 border-t border-dashed border-border pt-4">
                                <CreditCard className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                    <div className="text-xs uppercase tracking-wider text-muted-foreground">Booking Reference</div>
                                    <div className="mt-0.5 text-lg font-bold tracking-[0.2em] text-foreground">{ticket.bookingRef}</div>
                                </div>
                            </div>

                            <div className="mt-6 rounded-lg bg-muted/20 p-4 text-center">
                                <div className="mb-2 font-mono text-xs tracking-widest text-muted-foreground">
                                    {ticket.flightNumber} • {ticket.bookingRef}
                                </div>
                                <div className="h-16 rounded bg-gradient-to-r from-transparent via-foreground/10 to-transparent" />
                            </div>

                            <div className="mt-4 text-center text-xs text-muted-foreground/50">Click to flip back</div>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    );
};
