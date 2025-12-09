import React, { FormEvent, useState, useEffect } from "react";
import { updateFlightTicket } from "@/lib/flights/api";
import type { FlightTicket } from "@/lib/flights/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface EditFlightTicketModalProps {
    open: boolean;
    onClose: () => void;
    onUpdated: (ticket: FlightTicket) => void;
    ticket: FlightTicket | null;
}

export const EditFlightTicketModal: React.FC<EditFlightTicketModalProps> = ({
    open,
    onClose,
    onUpdated,
    ticket,
}) => {
    const [form, setForm] = useState({
        airline: "",
        fromCode: "",
        fromCity: "",
        toCode: "",
        toCity: "",
        flightDate: "",
        departureTime: "",
        arrivalTime: "",
        seat: "",
        flightNumber: "",
        travelClass: "ECONOMY",
        passenger: "",
        bookingRef: "",
    });
    const [submitting, setSubmitting] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (ticket) {
            setForm({
                airline: ticket.airline || "",
                fromCode: ticket.fromCode || "",
                fromCity: ticket.fromCity || "",
                toCode: ticket.toCode || "",
                toCity: ticket.toCity || "",
                flightDate: ticket.flightDate || "",
                departureTime: ticket.departureTime || "",
                arrivalTime: ticket.arrivalTime || "",
                seat: ticket.seat || "",
                flightNumber: ticket.flightNumber || "",
                travelClass: ticket.travelClass || "ECONOMY",
                passenger: ticket.passenger || "",
                bookingRef: ticket.bookingRef || "",
            });
        }
    }, [ticket]);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!ticket) return;
        
        setSubmitting(true);

        try {
            const updated = await updateFlightTicket(ticket.id, {
                airline: form.airline,
                fromCode: form.fromCode.toUpperCase(),
                fromCity: form.fromCity,
                toCode: form.toCode.toUpperCase(),
                toCity: form.toCity,
                flightDate: form.flightDate,
                departureTime: form.departureTime,
                arrivalTime: form.arrivalTime,
                date: form.flightDate,
                seat: form.seat.toUpperCase(),
                flightNumber: form.flightNumber.toUpperCase(),
                travelClass: form.travelClass.toUpperCase(),
                passenger: form.passenger.toUpperCase(),
                bookingRef: form.bookingRef.toUpperCase(),
            });

            onUpdated(updated);
            onClose();
            
            toast({
                title: "Ticket updated",
                description: "Flight ticket saved successfully.",
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message ?? "Failed to update ticket.",
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Flight Ticket</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 mt-4">
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
                                className="flex flex-col text-xs uppercase tracking-wide text-muted-foreground"
                            >
                                {label}
                                <input
                                    name={name}
                                    value={value as string}
                                    onChange={handleChange}
                                    required
                                    className="mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                />
                            </label>
                        ))}

                        <label className="flex flex-col text-xs uppercase tracking-wide text-muted-foreground">
                            Date
                            <input
                                type="date"
                                name="flightDate"
                                value={form.flightDate}
                                onChange={handleChange}
                                required
                                className="mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </label>

                        <label className="flex flex-col text-xs uppercase tracking-wide text-muted-foreground">
                            Class
                            <select
                                name="travelClass"
                                value={form.travelClass}
                                onChange={handleChange}
                                className="mt-1 rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            >
                                <option value="ECONOMY">Economy</option>
                                <option value="ECONOMY PLUS">Economy Plus</option>
                                <option value="BUSINESS">Business</option>
                                <option value="FIRST">First</option>
                                <option value="LUXURY">Luxury</option>
                            </select>
                        </label>
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={submitting}
                        >
                            Cancel
                        </Button>

                        <Button
                            type="submit"
                            disabled={submitting}
                        >
                            {submitting ? "Saving…" : "Update Ticket"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
