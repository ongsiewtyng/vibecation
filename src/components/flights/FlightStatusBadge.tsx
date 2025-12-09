import React, { useState, useEffect } from "react";
import { fetchFlightStatus, type FlightStatus } from "@/lib/flights/api";
import { Plane, Clock, AlertTriangle, CheckCircle, XCircle, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface FlightStatusBadgeProps {
    flightNumber: string;
    flightDate: string;
    className?: string;
    showDetails?: boolean;
}

const statusConfig: Record<FlightStatus["status"], { 
    label: string; 
    icon: React.ElementType; 
    className: string;
    bgClass: string;
}> = {
    scheduled: {
        label: "Scheduled",
        icon: Clock,
        className: "text-sky-600 dark:text-sky-400",
        bgClass: "bg-sky-500/10",
    },
    active: {
        label: "In Flight",
        icon: Plane,
        className: "text-green-600 dark:text-green-400",
        bgClass: "bg-green-500/10",
    },
    landed: {
        label: "Landed",
        icon: CheckCircle,
        className: "text-emerald-600 dark:text-emerald-400",
        bgClass: "bg-emerald-500/10",
    },
    delayed: {
        label: "Delayed",
        icon: AlertTriangle,
        className: "text-amber-600 dark:text-amber-400",
        bgClass: "bg-amber-500/10",
    },
    cancelled: {
        label: "Cancelled",
        icon: XCircle,
        className: "text-red-600 dark:text-red-400",
        bgClass: "bg-red-500/10",
    },
    diverted: {
        label: "Diverted",
        icon: AlertTriangle,
        className: "text-orange-600 dark:text-orange-400",
        bgClass: "bg-orange-500/10",
    },
    unknown: {
        label: "Unknown",
        icon: Clock,
        className: "text-muted-foreground",
        bgClass: "bg-muted",
    },
};

export const FlightStatusBadge: React.FC<FlightStatusBadgeProps> = ({
    flightNumber,
    flightDate,
    className,
    showDetails = false,
}) => {
    const [status, setStatus] = useState<FlightStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const loadStatus = async () => {
        setLoading(true);
        setError(false);
        try {
            const result = await fetchFlightStatus(flightNumber, flightDate);
            setStatus(result);
        } catch {
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStatus();
    }, [flightNumber, flightDate]);

    if (loading) {
        return (
            <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Loading...</span>
            </div>
        );
    }

    if (error || !status) {
        return null;
    }

    const config = statusConfig[status.status];
    const Icon = config.icon;

    const badge = (
        <div
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
                config.bgClass,
                config.className,
                className
            )}
        >
            <Icon className="h-3 w-3" />
            <span>{config.label}</span>
            {status.delay && status.delay > 0 && (
                <span className="opacity-75">+{status.delay}min</span>
            )}
        </div>
    );

    if (!showDetails) {
        return badge;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="inline-flex items-center gap-2">
                        {badge}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                loadStatus();
                            }}
                        >
                            <RefreshCw className="h-3 w-3" />
                        </Button>
                    </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                    <div className="space-y-1.5 text-xs">
                        {status.departureGate && (
                            <div>Gate: <span className="font-semibold">{status.departureGate}</span></div>
                        )}
                        {status.departureTerminal && (
                            <div>Terminal: <span className="font-semibold">{status.departureTerminal}</span></div>
                        )}
                        {status.delay && status.delay > 0 && (
                            <div className="text-amber-500">Delay: {status.delay} minutes</div>
                        )}
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
