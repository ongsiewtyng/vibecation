import { useEffect, useMemo, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    addDays,
    differenceInCalendarDays,
    format,
    parseISO,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { Clock } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { cn } from "@/lib/utils";

const formSchema = z.object({
    day_number: z.coerce.number().min(1),
    date: z.date(),
    time: z.string().optional(),
    title: z.string().min(1, "Title is required"),
    location: z.string().optional(),
    description: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ItineraryFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    tripId: string;
    item?: any;

    // ✅ NEW
    tripStartDate: string;
    tripEndDate: string;
}

function toDateOnlyIso(value: string) {
    // Handles "YYYY-MM-DD" and ISO timestamps
    return value.includes("T") ? value.split("T")[0] : value;
}

function clamp(n: number, min: number, max: number) {
    return Math.min(max, Math.max(min, n));
}

export default function ItineraryFormDialog({
                                                open,
                                                onOpenChange,
                                                tripId,
                                                item,
                                                tripStartDate,
                                                tripEndDate,
                                            }: ItineraryFormDialogProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // ✅ Normalize trip dates to date-only keys to avoid timezone issues
    const tripStart = useMemo(
        () => parseISO(toDateOnlyIso(tripStartDate)),
        [tripStartDate]
    );
    const tripEnd = useMemo(
        () => parseISO(toDateOnlyIso(tripEndDate)),
        [tripEndDate]
    );

    const tripDays = useMemo(() => {
        const d = differenceInCalendarDays(tripEnd, tripStart) + 1;
        return d > 0 ? d : 1;
    }, [tripStart, tripEnd]);

    const defaultValues: FormData = item
        ? {
            day_number: item.day_number,
            date: new Date(item.date),
            time: item.time || "",
            title: item.title,
            location: item.location || "",
            description: item.description || "",
        }
        : {
            day_number: 1,
            date: tripStart, // ✅ default date = trip start
            time: "",
            title: "",
            location: "",
            description: "",
        };

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    // react-hook-form only reads defaultValues on first render → reset on open/item change
    useEffect(() => {
        if (!open) return;

        if (item) {
            form.reset({
                day_number: item.day_number,
                date: new Date(item.date),
                time: item.time || "",
                title: item.title,
                location: item.location || "",
                description: item.description || "",
            });
        } else {
            form.reset({
                day_number: 1,
                date: tripStart,
                time: "",
                title: "",
                location: "",
                description: "",
            });
        }
    }, [open, item, form, tripStart]);

    // ✅ Sync day_number <-> date without infinite loops
    const lastChangedRef = useRef<"day" | "date" | null>(null);
    const day = form.watch("day_number");
    const date = form.watch("date");

    // When day changes -> update date
    useEffect(() => {
        if (!open) return;
        if (!day || Number.isNaN(day)) return;
        if (lastChangedRef.current === "date") return;

        lastChangedRef.current = "day";

        const clampedDay = clamp(day, 1, tripDays);
        if (clampedDay !== day) {
            form.setValue("day_number", clampedDay, { shouldDirty: true });
        }

        const newDate = addDays(tripStart, clampedDay - 1);
        const currentDateKey = format(date ?? tripStart, "yyyy-MM-dd");
        const newDateKey = format(newDate, "yyyy-MM-dd");

        if (currentDateKey !== newDateKey) {
            form.setValue("date", newDate, { shouldDirty: true });
        }

        lastChangedRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [day, tripDays, tripStart, open]);

    // When date changes -> update day
    useEffect(() => {
        if (!open) return;
        if (!date) return;
        if (lastChangedRef.current === "day") return;

        lastChangedRef.current = "date";

        // clamp date to trip range
        const dateKey = format(date, "yyyy-MM-dd");
        const startKey = format(tripStart, "yyyy-MM-dd");
        const endKey = format(tripEnd, "yyyy-MM-dd");

        let safeDate = date;
        if (dateKey < startKey) safeDate = tripStart;
        if (dateKey > endKey) safeDate = tripEnd;

        if (format(safeDate, "yyyy-MM-dd") !== dateKey) {
            form.setValue("date", safeDate, { shouldDirty: true });
        }

        const computedDay = differenceInCalendarDays(safeDate, tripStart) + 1;
        const clampedDay = clamp(computedDay, 1, tripDays);

        if (clampedDay !== day) {
            form.setValue("day_number", clampedDay, { shouldDirty: true });
        }

        lastChangedRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [date, tripStart, tripEnd, tripDays, open]);

    const mutation = useMutation({
        mutationFn: async (data: FormData) => {
            const payload = {
                trip_id: tripId,
                day_number: clamp(data.day_number, 1, tripDays),
                date: format(data.date, "yyyy-MM-dd"),
                time: data.time || null,
                title: data.title,
                location: data.location || null,
                description: data.description || null,
            };

            if (item) {
                const { error } = await supabase
                    .from("itinerary_items")
                    .update(payload)
                    .eq("id", item.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from("itinerary_items").insert(payload);
                if (error) throw error;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["itinerary", tripId] });
            toast({ title: item ? "Activity updated" : "Activity added" });
            onOpenChange(false);
            form.reset();
        },
        onError: () => {
            toast({
                title: "Error",
                description: "Failed to save activity",
                variant: "destructive",
            });
        },
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item ? "Edit Activity" : "Add Activity"}</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit((data) => mutation.mutate(data))}
                        className="space-y-4"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="day_number"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Day Number</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min={1}
                                                max={tripDays}
                                                {...field}
                                            />
                                        </FormControl>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            1 to {tripDays}
                                        </p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        className={cn(
                                                            "pl-3 text-left font-normal",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={(d) => d && field.onChange(d)}
                                                    initialFocus
                                                    className="pointer-events-auto"
                                                    // ✅ lock to trip range
                                                    disabled={(d) =>
                                                        d < tripStart || d > tripEnd
                                                    }
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="time"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Time (optional)</FormLabel>
                                    <FormControl>
                                        <div>
                                            <Input
                                                type="time"
                                                placeholder="Select time"
                                                {...field}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Activity Title</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Location (optional)</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description (optional)</FormLabel>
                                    <FormControl>
                                        <Textarea {...field} rows={3} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={mutation.isPending}>
                                {mutation.isPending ? "Saving..." : "Save"}
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
