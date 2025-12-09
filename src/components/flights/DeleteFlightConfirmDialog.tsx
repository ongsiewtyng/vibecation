import React from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { FlightTicket } from "@/lib/flights/types";

interface DeleteFlightConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ticket: FlightTicket | null;
    onConfirm: () => void;
    isDeleting: boolean;
}

export const DeleteFlightConfirmDialog: React.FC<DeleteFlightConfirmDialogProps> = ({
    open,
    onOpenChange,
    ticket,
    onConfirm,
    isDeleting,
}) => {
    if (!ticket) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Flight Ticket</AlertDialogTitle>
                    <AlertDialogDescription>
                        Are you sure you want to delete this flight ticket?
                        <div className="mt-3 p-3 rounded-lg bg-muted text-foreground text-sm">
                            <div className="font-semibold">{ticket.flightNumber}</div>
                            <div className="text-muted-foreground">
                                {ticket.fromCode} → {ticket.toCode} • {ticket.flightDate}
                            </div>
                        </div>
                        This action cannot be undone.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting ? "Deleting…" : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};
