import React, { FormEvent, useState, useRef } from "react";
import { insertFlightTicket } from "@/lib/flights/api";
import type { FlightTicket } from "@/lib/flights/types";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddFlightTicketModalProps {
    open: boolean;
    onClose: () => void;
    onCreated: (ticket: FlightTicket) => void;
    userId?: string | null;
}

const emptyForm = {
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
    gate: "",
    terminal: "",
};

export const AddFlightTicketModal: React.FC<AddFlightTicketModalProps> = ({
    open,
    onClose,
    onCreated,
    userId,
}) => {
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [parsedFrom, setParsedFrom] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    if (!open) return null;

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (file: File, source: "scan" | "pdf") => {
        setParsing(true);
        setError(null);
        setParsedFrom(null);

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            
            await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
            });

            const base64Data = reader.result as string;

            const { data, error: fnError } = await supabase.functions.invoke(
                "parse-boarding-pass",
                {
                    body: {
                        fileData: base64Data,
                        fileType: file.type,
                    },
                }
            );

            if (fnError) throw fnError;

            if (data?.error) {
                throw new Error(data.error);
            }

            if (data?.success && data?.data) {
                const parsed = data.data;
                
                setForm((prev) => ({
                    ...prev,
                    airline: parsed.airline || prev.airline,
                    fromCode: parsed.fromCode || prev.fromCode,
                    fromCity: parsed.fromCity || prev.fromCity,
                    toCode: parsed.toCode || prev.toCode,
                    toCity: parsed.toCity || prev.toCity,
                    flightDate: parsed.flightDate || prev.flightDate,
                    departureTime: parsed.departureTime || prev.departureTime,
                    arrivalTime: parsed.arrivalTime || prev.arrivalTime,
                    seat: parsed.seat || prev.seat,
                    flightNumber: parsed.flightNumber || prev.flightNumber,
                    travelClass: parsed.travelClass || prev.travelClass,
                    passenger: parsed.passenger || prev.passenger,
                    bookingRef: parsed.bookingRef || prev.bookingRef,
                    gate: parsed.gate || prev.gate,
                    terminal: parsed.terminal || prev.terminal,
                }));

                setParsedFrom(source === "scan" ? "boarding pass" : "PDF");
                
                toast({
                    title: "Parsed successfully",
                    description: "Flight details extracted. Please verify and fill any missing fields.",
                });
            }
        } catch (err: any) {
            console.error("Parse error:", err);
            setError(err.message || "Failed to parse file");
            toast({
                title: "Parse failed",
                description: err.message || "Could not extract flight info. Please enter manually.",
                variant: "destructive",
            });
        } finally {
            setParsing(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleFileSelect = (source: "scan" | "pdf") => {
        if (fileInputRef.current) {
            fileInputRef.current.accept = source === "scan" ? "image/*" : "application/pdf";
            fileInputRef.current.onchange = (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    handleFileUpload(file, source);
                }
            };
            fileInputRef.current.click();
        }
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

            onCreated(ticket);
            setForm(emptyForm);
            setParsedFrom(null);
            onClose();
            
            toast({
                title: "Ticket added",
                description: "Flight ticket saved successfully.",
            });
        } catch (err: any) {
            setError(err.message ?? "Failed to add ticket.");
            toast({
                title: "Error",
                description: err.message ?? "Failed to add ticket.",
                variant: "destructive",
            });
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
                className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-wide text-foreground">
                        Add Flight Ticket
                    </h2>

                    <button
                        onClick={onClose}
                        className="text-2xl leading-none text-muted-foreground hover:text-foreground"
                    >
                        ×
                    </button>
                </div>

                <div className="mb-4 flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFileSelect("scan")}
                        disabled={parsing}
                        className="flex-1"
                    >
                        {parsing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Upload className="mr-2 h-4 w-4" />
                        )}
                        Scan Boarding Pass
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => handleFileSelect("pdf")}
                        disabled={parsing}
                        className="flex-1"
                    >
                        {parsing ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <FileText className="mr-2 h-4 w-4" />
                        )}
                        Import PDF
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                    />
                </div>

                {parsedFrom && (
                    <div className="mb-3 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
                        ✓ Parsed from {parsedFrom}. Please verify all fields.
                    </div>
                )}

                {error && (
                    <div className="mb-3 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                        {error}
                    </div>
                )}

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
                            ["gate", "Gate (optional)", form.gate],
                            ["terminal", "Terminal (optional)", form.terminal],
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
                                    required={!label.includes("optional")}
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
                            {submitting ? "Saving…" : "Save Ticket"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};
