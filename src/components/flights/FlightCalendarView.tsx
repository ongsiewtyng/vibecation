import React, { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO, isSameDay, addMonths, subMonths } from "date-fns";
import type { FlightTicket } from "@/lib/flights/types";
import { ChevronLeft, ChevronRight, Plane } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlightCalendarViewProps {
    tickets: FlightTicket[];
    onTicketClick?: (ticket: FlightTicket) => void;
}

export const FlightCalendarView: React.FC<FlightCalendarViewProps> = ({
    tickets,
    onTicketClick,
}) => {
    const [currentMonth, setCurrentMonth] = React.useState(new Date());

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    const startDay = monthStart.getDay();
    const emptyDays = Array(startDay).fill(null);

    const ticketsByDate = useMemo(() => {
        const map = new Map<string, FlightTicket[]>();
        tickets.forEach((ticket) => {
            const dateKey = ticket.flightDate;
            if (!map.has(dateKey)) {
                map.set(dateKey, []);
            }
            map.get(dateKey)!.push(ticket);
        });
        return map;
    }, [tickets]);

    const upcomingFlights = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return tickets
            .filter((t) => parseISO(t.flightDate) >= today)
            .sort((a, b) => parseISO(a.flightDate).getTime() - parseISO(b.flightDate).getTime())
            .slice(0, 5);
    }, [tickets]);

    return (
        <div className="space-y-6">
            <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">
                        {format(currentMonth, "MMMM yyyy")}
                    </h3>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setCurrentMonth(new Date())}
                        >
                            Today
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-7 gap-px rounded-lg bg-border overflow-hidden">
                    {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div
                            key={day}
                            className="bg-muted px-2 py-2 text-center text-xs font-medium text-muted-foreground"
                        >
                            {day}
                        </div>
                    ))}

                    {emptyDays.map((_, i) => (
                        <div key={`empty-${i}`} className="bg-card min-h-[80px] sm:min-h-[100px]" />
                    ))}

                    {days.map((day) => {
                        const dateKey = format(day, "yyyy-MM-dd");
                        const dayTickets = ticketsByDate.get(dateKey) || [];
                        const hasFlights = dayTickets.length > 0;
                        const isPast = day < new Date() && !isToday(day);

                        return (
                            <div
                                key={dateKey}
                                className={cn(
                                    "bg-card min-h-[80px] sm:min-h-[100px] p-1 sm:p-2 relative",
                                    !isSameMonth(day, currentMonth) && "opacity-50",
                                    isPast && "opacity-60"
                                )}
                            >
                                <div
                                    className={cn(
                                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium",
                                        isToday(day) && "bg-primary text-primary-foreground",
                                        hasFlights && !isToday(day) && "bg-sky-500/20 text-sky-600 dark:text-sky-400"
                                    )}
                                >
                                    {format(day, "d")}
                                </div>

                                {hasFlights && (
                                    <div className="mt-1 space-y-0.5">
                                        <TooltipProvider>
                                            {dayTickets.slice(0, 2).map((ticket) => (
                                                <Tooltip key={ticket.id}>
                                                    <TooltipTrigger asChild>
                                                        <button
                                                            onClick={() => onTicketClick?.(ticket)}
                                                            className="w-full text-left truncate rounded px-1 py-0.5 text-[10px] font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                        >
                                                            <Plane className="inline h-2.5 w-2.5 mr-0.5" />
                                                            {ticket.fromCode}→{ticket.toCode}
                                                        </button>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <div className="text-xs">
                                                            <div className="font-semibold">{ticket.flightNumber}</div>
                                                            <div>{ticket.fromCity} → {ticket.toCity}</div>
                                                            <div className="text-muted-foreground">
                                                                {ticket.departureTime} - {ticket.arrivalTime}
                                                            </div>
                                                        </div>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ))}
                                            {dayTickets.length > 2 && (
                                                <div className="text-[10px] text-muted-foreground px-1">
                                                    +{dayTickets.length - 2} more
                                                </div>
                                            )}
                                        </TooltipProvider>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {upcomingFlights.length > 0 && (
                <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                        Upcoming Flights
                    </h3>
                    <div className="space-y-2">
                        {upcomingFlights.map((ticket) => {
                            const flightDate = parseISO(ticket.flightDate);
                            const daysUntil = Math.ceil((flightDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

                            return (
                                <button
                                    key={ticket.id}
                                    onClick={() => onTicketClick?.(ticket)}
                                    className="w-full flex items-center gap-3 rounded-lg p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
                                >
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Plane className="h-5 w-5 text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-foreground truncate">
                                            {ticket.fromCode} → {ticket.toCode}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {ticket.flightNumber} • {format(flightDate, "EEE, MMM d")}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className={cn(
                                            "text-xs font-medium",
                                            daysUntil <= 3 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"
                                        )}>
                                            {daysUntil === 0 ? "Today" : daysUntil === 1 ? "Tomorrow" : `${daysUntil} days`}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            {ticket.departureTime}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
