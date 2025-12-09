import React, { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { FlightTicketCard } from "@/components/flights/FlightTicketCard";
import { AddFlightTicketModal } from "@/components/flights/AddFlightTicketModal";
import { EditFlightTicketModal } from "@/components/flights/EditFlightTicketModal";
import { DeleteFlightConfirmDialog } from "@/components/flights/DeleteFlightConfirmDialog";
import { FlightTicketGroup } from "@/components/flights/FlightTicketGroup";
import { FlightCalendarView } from "@/components/flights/FlightCalendarView";
import { useFlightTickets } from "@/hooks/useFlightTickets";
import { deleteFlightTicket } from "@/lib/flights/api";
import type { FlightTicket } from "@/lib/flights/types";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, List, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const sampleTicket: FlightTicket = {
    id: "sample",
    userId: null as any,
    airline: "Emirates",
    fromCode: "CHQ",
    fromCity: "Chania International Airport",
    toCode: "MXP",
    toCity: "Milan Malpensa Airport",
    departureTime: "18:30",
    arrivalTime: "19:30",
    flightDate: "2023-09-07",
    date: "07 SEP 2023",
    seat: "3A",
    flightNumber: "EK108",
    travelClass: "LUXURY",
    passenger: "ADAM SMITH",
    bookingRef: "ZLE23Q",
    createdAt: new Date().toISOString(),
} as any;

const FlightTickets: React.FC = () => {
    const userId = null;
    const { tickets, setTickets, loading, error, refresh } = useFlightTickets(userId);
    const [isAdding, setIsAdding] = useState(false);
    const [editingTicket, setEditingTicket] = useState<FlightTicket | null>(null);
    const [deletingTicket, setDeletingTicket] = useState<FlightTicket | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [view, setView] = useState<"list" | "calendar">("list");
    const { toast } = useToast();

    const showSample = !loading && !error && tickets.length === 0;

    const groupedTickets = useMemo(() => {
        const groups = new Map<string, FlightTicket[]>();
        
        const sortedTickets = [...tickets].sort((a, b) => 
            parseISO(b.flightDate).getTime() - parseISO(a.flightDate).getTime()
        );

        sortedTickets.forEach((ticket) => {
            const monthKey = format(parseISO(ticket.flightDate), "yyyy-MM");
            if (!groups.has(monthKey)) {
                groups.set(monthKey, []);
            }
            groups.get(monthKey)!.push(ticket);
        });

        return Array.from(groups.entries()).sort((a, b) => b[0].localeCompare(a[0]));
    }, [tickets]);

    const handleEdit = (ticket: FlightTicket) => {
        setEditingTicket(ticket);
    };

    const handleDelete = (ticket: FlightTicket) => {
        setDeletingTicket(ticket);
    };

    const confirmDelete = async () => {
        if (!deletingTicket) return;
        
        setIsDeleting(true);
        try {
            await deleteFlightTicket(deletingTicket.id);
            setTickets((prev) => prev.filter((t) => t.id !== deletingTicket.id));
            toast({
                title: "Ticket deleted",
                description: "Flight ticket removed successfully.",
            });
        } catch (err: any) {
            toast({
                title: "Error",
                description: err.message ?? "Failed to delete ticket.",
                variant: "destructive",
            });
        } finally {
            setIsDeleting(false);
            setDeletingTicket(null);
        }
    };

    const handleTicketUpdated = (updated: FlightTicket) => {
        setTickets((prev) =>
            prev.map((t) => (t.id === updated.id ? updated : t))
        );
    };

    const handleCalendarTicketClick = (ticket: FlightTicket) => {
        setEditingTicket(ticket);
    };

    return (
        <main className="min-h-screen bg-background px-4 py-10 transition-colors duration-300">
            <div className="mx-auto max-w-5xl space-y-6">
                <section className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-primary">
                            ✈ Flight History
                        </div>
                        <h1 className="mt-3 text-3xl font-semibold uppercase tracking-[0.18em] text-foreground">
                            Flight Tickets
                        </h1>
                        <p className="mt-2 text-sm text-muted-foreground">
                            A beautiful archive of every trip you've taken
                        </p>
                    </div>

                    <Button
                        onClick={() => setIsAdding(true)}
                        className="gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Add ticket
                    </Button>
                </section>

                <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")} className="w-full">
                    <TabsList className="grid w-full max-w-xs grid-cols-2">
                        <TabsTrigger value="list" className="gap-2">
                            <List className="h-4 w-4" />
                            List
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="gap-2">
                            <Calendar className="h-4 w-4" />
                            Calendar
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="list" className="mt-6">
                        <section className="space-y-4">
                            {error && (
                                <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                                    Failed to load tickets:{" "}
                                    <span className="font-medium">{error.message}</span>
                                </div>
                            )}

                            {loading && !error && (
                                <div className="space-y-4">
                                    {[0, 1].map((i) => (
                                        <div
                                            key={i}
                                            className="h-[160px] animate-pulse rounded-2xl bg-muted"
                                        />
                                    ))}
                                </div>
                            )}

                            {!loading && !error && tickets.length > 0 && (
                                <div className="space-y-6">
                                    {groupedTickets.map(([monthKey, monthTickets], groupIndex) => (
                                        <FlightTicketGroup
                                            key={monthKey}
                                            monthKey={monthKey}
                                            tickets={monthTickets}
                                            onEdit={handleEdit}
                                            onDelete={handleDelete}
                                            defaultExpanded={groupIndex < 2}
                                        />
                                    ))}
                                </div>
                            )}

                            {showSample && (
                                <div className="space-y-3">
                                    <FlightTicketCard ticket={sampleTicket} index={0} />
                                    <p className="text-xs text-muted-foreground">
                                        This is a sample ticket to preview the design. Add your own
                                        tickets to replace this view.
                                    </p>
                                </div>
                            )}
                        </section>
                    </TabsContent>

                    <TabsContent value="calendar" className="mt-6">
                        <FlightCalendarView
                            tickets={tickets}
                            onTicketClick={handleCalendarTicketClick}
                        />
                    </TabsContent>
                </Tabs>
            </div>

            <AddFlightTicketModal
                open={isAdding}
                onClose={() => setIsAdding(false)}
                onCreated={(ticket) => setTickets((prev) => [ticket, ...prev])}
                userId={userId}
            />

            <EditFlightTicketModal
                open={!!editingTicket}
                onClose={() => setEditingTicket(null)}
                onUpdated={handleTicketUpdated}
                ticket={editingTicket}
            />

            <DeleteFlightConfirmDialog
                open={!!deletingTicket}
                onOpenChange={(open) => !open && setDeletingTicket(null)}
                ticket={deletingTicket}
                onConfirm={confirmDelete}
                isDeleting={isDeleting}
            />
        </main>
    );
};

export default FlightTickets;
