import { useCallback, useEffect, useState } from "react";
import type { FlightTicket } from "@/lib/flights/types";
import { fetchFlightTickets } from "@/lib/flights/api";

export function useFlightTickets(userId?: string | null) {
    const [tickets, setTickets] = useState<FlightTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const refresh = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await fetchFlightTickets(userId);
            setTickets(data);
        } catch (err: any) {
            setError(err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                await refresh();
            } catch {
                // handled inside refresh
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [refresh]);

    return { tickets, setTickets, loading, error, refresh };
}
