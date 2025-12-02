import React, { useState } from "react";
import { FlightTicketCard } from "@/components/flights/FlightTicketCard";
import { AddFlightTicketModal } from "@/components/flights/AddFlightTicketModal";
import { useFlightTickets } from "@/hooks/useFlightTickets";
import type { FlightTicket } from "@/lib/flights/types";
// import { useSession } from "@/wherever/auth";

const sampleTicket: FlightTicket = {
    id: "sample",
    userId: null as any,

    // REAL airline name
    airline: "Emirates",

    // REAL IATA airport codes
    fromCode: "CHQ",                           // Crete (Chania) = CHQ
    fromCity: "Chania International Airport",

    toCode: "MXP",                             // Milan Malpensa = MXP
    toCity: "Milan Malpensa Airport",

    departureTime: "18:30",
    arrivalTime: "19:30",

    // DATE FIELDS
    flightDate: "2023-09-07",
    date: "07 SEP 2023",

    seat: "3A",

    // MUST BE NO SPACE OR DASH (for airline logos)
    flightNumber: "EK108",                     // Emirates = EK

    travelClass: "LUXURY",
    passenger: "ADAM SMITH",
    bookingRef: "ZLE23Q",

    createdAt: new Date().toISOString(),
} as any;
 // `as any` in case your FlightTicket type differs slightly

const FlightTickets: React.FC = () => {
    // const { session } = useSession();
    // const userId = session?.user?.id ?? null;
    const userId = null;

    const { tickets, setTickets, loading, error } = useFlightTickets(userId);
    const [isAdding, setIsAdding] = useState(false);

    const showSample = !loading && !error && tickets.length === 0;

    return (
        <main className="min-h-screen bg-slate-100 px-4 py-10 transition-colors duration-300 dark:bg-slate-950">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* Header */}
                <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-slate-200 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-sky-700 dark:bg-slate-900/70 dark:text-sky-300">
                            ✈ Flight History
                        </div>
                        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-[0.18em] text-slate-900 dark:text-slate-50">
                            Flight Tickets
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300/80">
                            A beautiful archive of every trip you’ve taken
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setIsAdding(true)}
                        className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/40 transition hover:shadow-xl hover:brightness-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 dark:focus-visible:ring-sky-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100 dark:focus-visible:ring-offset-slate-950"
                    >
                        <span className="mr-1 text-lg">＋</span>
                        <span>Add ticket</span>
                    </button>
                </section>

                {/* Content */}
                <section className="space-y-4">
                    {/* Error */}
                    {error && (
                        <div className="rounded-xl border border-red-400/40 bg-red-100 px-4 py-3 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/60 dark:text-red-100">
                            Failed to load tickets:{" "}
                            <span className="font-medium">{error.message}</span>
                        </div>
                    )}

                    {/* Loading skeleton */}
                    {loading && !error && (
                        <div className="space-y-4">
                            {[0, 1].map((i) => (
                                <div
                                    key={i}
                                    className="h-[160px] animate-pulse rounded-2xl bg-slate-300 transition-colors dark:bg-slate-900/70"
                                />
                            ))}
                        </div>
                    )}

                    {/* Real tickets */}
                    {!loading && !error && tickets.length > 0 && (
                        <div className="space-y-5">
                            {tickets.map((ticket, index) => (
                                <FlightTicketCard key={ticket.id} ticket={ticket} index={index} />
                            ))}
                        </div>
                    )}

                    {/* Sample ticket when none saved yet */}
                    {showSample && (
                        <div className="space-y-3">
                            <FlightTicketCard ticket={sampleTicket} index={0} />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                This is a sample ticket to preview the design. Add your own
                                tickets to replace this view.
                            </p>
                        </div>
                    )}
                </section>
            </div>

            <AddFlightTicketModal
                open={isAdding}
                onClose={() => setIsAdding(false)}
                onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])}
                userId={userId}
            />
        </main>
    );
};

export default FlightTickets;
