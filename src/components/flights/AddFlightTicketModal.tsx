import React, { FormEvent, useState } from "react";
import { insertFlightTicket } from "@/lib/flights/api";
import type { FlightTicket } from "@/lib/flights/types";

interface AddFlightTicketModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (ticket: FlightTicket) => void;
    userId?: string | null;
}

const emptyForm = {
    airline: "Blue Airline",
    fromCode: "",
    fromCity: "",
    toCode: "",
    toCity: "",
    flightDate: "",        // ISO string like 2025-11-26
    departureTime: "",
    arrivalTime: "",
    seat: "",
    flightNumber: "",
    travelClass: "ECONOMY",
    passenger: "",
    bookingRef: "",
};

export const AddFlightTicketModal: React.FC<AddFlightTicketModalProps> = ({
                                                                              open,
                                                                              onClose,
                                                                              onCreated,
                                                                              userId,
                                                                          }) => {
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!open) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const ticket = await insertFlightTicket({
                userId: userId ?? null,
                airline: form.airline,
                fromCode: form.fromCode.toUpperCase(),
                fromCity: form.fromCity,
                toCode: form.toCode.toUpperCase(),
                toCity: form.toCity,
                flightDate: form.flightDate,          // stored as ISO
                departureTime: form.departureTime,
                arrivalTime: form.arrivalTime,
                date: form.flightDate,                // if your API expects `date`
                seat: form.seat.toUpperCase(),
                flightNumber: form.flightNumber.toUpperCase(),
                travelClass: form.travelClass.toUpperCase(),
                passenger: form.passenger.toUpperCase(),
                bookingRef: form.bookingRef.toUpperCase(),
            });

            onCreated(ticket);
            setForm(emptyForm);
            onClose();
        } catch (err: any) {
            setError(err.message ?? "Failed to add ticket.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
            <div
                className="w-full max-w-2xl rounded-2xl border border-slate-200/40 bg-white/95 p-6 shadow-xl animate-[fadeIn_0.25s_ease] dark:border-slate-700/40 dark:bg-slate-900/95"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-wide text-slate-900 dark:text-slate-100">
                        Add Flight Ticket
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl leading-none text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                    >
                        ×
                    </button>
                </div>

                {/* Error */}
                {error && (
                    <div className="mb-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-300">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {[
                            ["airline", "Airline", form.airline],
                            ["flightNumber", "Flight No.", form.flightNumber],
                            ["fromCode", "From Code", form.fromCode],
                            ["fromCity", "From City", form.fromCity],
                            ["toCode", "To Code", form.toCode],
                            ["toCity", "To City", form.toCity],
                            ["departureTime", "Departure Time", form.departureTime],
                            ["arrivalTime", "Arrival Time", form.arrivalTime],
                            ["seat", "Seat", form.seat],
                            ["passenger", "Passenger", form.passenger],
                            ["bookingRef", "Booking Ref", form.bookingRef],
                        ].map(([name, label, value]) => (
                            <label
                                key={name}
                                className="flex flex-col text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300"
                            >
                                {label}
                                <input
                                    name={name}
                                    value={value as string}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                                />
                            </label>
                        ))}

                        {/* Date – dedicated date input */}
                        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Date
                            <input
                                type="date"
                                name="flightDate"
                                value={form.flightDate}
                                onChange={handleChange}
                                required
                                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            />
                        </label>

                        {/* Travel Class */}
                        <label className="flex flex-col text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                            Class
                            <select
                                name="travelClass"
                                value={form.travelClass}
                                onChange={handleChange}
                                className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                            >
                                <option value="ECONOMY">Economy</option>
                                <option value="ECONOMY PLUS">Economy Plus</option>
                                <option value="BUSINESS">Business</option>
                                <option value="FIRST">First</option>
                                <option value="LUXURY">Luxury</option>
                            </select>
                        </label>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full bg-slate-200 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:hover:bg-slate-600"
                            disabled={submitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-full bg-gradient-to-r from-sky-400 to-indigo-500 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-sky-500/40 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save Ticket"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
