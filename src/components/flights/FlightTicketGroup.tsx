import React, { useState } from "react";
import { format, parseISO } from "date-fns";
import type { FlightTicket } from "@/lib/flights/types";
import { FlightTicketCard } from "./FlightTicketCard";
import { FlightStatusBadge } from "./FlightStatusBadge";
import { ChevronDown, ChevronRight, Plane, Edit2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FlightTicketGroupProps {
    monthKey: string;
    tickets: FlightTicket[];
    onEdit: (ticket: FlightTicket) => void;
    onDelete: (ticket: FlightTicket) => void;
    defaultExpanded?: boolean;
}

export const FlightTicketGroup: React.FC<FlightTicketGroupProps> = ({
    monthKey,
    tickets,
    onEdit,
    onDelete,
    defaultExpanded = true,
}) => {
    const [expanded, setExpanded] = useState(defaultExpanded);

    const monthDate = parseISO(`${monthKey}-01`);
    const monthLabel = format(monthDate, "MMMM yyyy");
    const flightCount = tickets.length;

    const isCurrentMonth = format(new Date(), "yyyy-MM") === monthKey;
    const isPastMonth = monthKey < format(new Date(), "yyyy-MM");

    return (
        <div className="rounded-xl border border-border bg-card/50 overflow-hidden">
            <button
                onClick={() => setExpanded(!expanded)}
                className={cn(
                    "w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors",
                    expanded && "border-b border-border"
                )}
            >
                <div className="flex items-center gap-3">
                    {expanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div className="flex items-center gap-2">
                        <Plane className={cn(
                            "h-4 w-4",
                            isCurrentMonth ? "text-primary" : isPastMonth ? "text-muted-foreground" : "text-foreground"
                        )} />
                        <span className={cn(
                            "font-semibold",
                            isCurrentMonth ? "text-primary" : isPastMonth ? "text-muted-foreground" : "text-foreground"
                        )}>
                            {monthLabel}
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                        {flightCount} {flightCount === 1 ? "flight" : "flights"}
                    </span>
                </div>
            </button>

            {expanded && (
                <div className="p-4 space-y-4">
                    {tickets.map((ticket, index) => (
                        <div key={ticket.id} className="relative group">
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="h-8 w-8 shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEdit(ticket);
                                    }}
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                    variant="destructive"
                                    size="icon"
                                    className="h-8 w-8 shadow-md"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(ticket);
                                    }}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <div className="absolute top-2 left-2 z-10">
                                <FlightStatusBadge
                                    flightNumber={ticket.flightNumber}
                                    flightDate={ticket.flightDate}
                                    showDetails
                                />
                            </div>
                            <FlightTicketCard ticket={ticket} index={index} />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
