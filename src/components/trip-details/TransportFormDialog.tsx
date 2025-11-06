import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  type: z.string().min(1, "Type is required"),
  from_location: z.string().min(1, "From location is required"),
  to_location: z.string().min(1, "To location is required"),
  departure_time: z.string().min(1, "Departure time is required"),
  arrival_time: z.string().optional(),
  cost: z.coerce.number().optional(),
  confirmation_number: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface TransportFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  item?: any;
}

export default function TransportFormDialog({ open, onOpenChange, tripId, item }: TransportFormDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: item ? {
      type: item.type,
      from_location: item.from_location,
      to_location: item.to_location,
      departure_time: item.departure_time,
      arrival_time: item.arrival_time || "",
      cost: item.cost || undefined,
      confirmation_number: item.confirmation_number || "",
      notes: item.notes || "",
    } : {
      type: "Flight",
      from_location: "",
      to_location: "",
      departure_time: "",
      arrival_time: "",
      cost: undefined,
      confirmation_number: "",
      notes: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: FormData) => {
      const payload = {
        trip_id: tripId,
        type: data.type,
        from_location: data.from_location,
        to_location: data.to_location,
        departure_time: data.departure_time,
        arrival_time: data.arrival_time || null,
        cost: data.cost || null,
        confirmation_number: data.confirmation_number || null,
        notes: data.notes || null,
      };

      if (item) {
        const { error } = await supabase.from("transports").update(payload).eq("id", item.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("transports").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transports", tripId] });
      toast({ title: item ? "Transport updated" : "Transport added" });
      onOpenChange(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save transport", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? "Edit Transport" : "Add Transport"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <FormField control={form.control} name="type" render={({ field }) => (
              <FormItem>
                <FormLabel>Transport Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Flight">Flight</SelectItem>
                    <SelectItem value="Train">Train</SelectItem>
                    <SelectItem value="Bus">Bus</SelectItem>
                    <SelectItem value="Car">Car</SelectItem>
                    <SelectItem value="Ferry">Ferry</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="from_location" render={({ field }) => (
                <FormItem>
                  <FormLabel>From</FormLabel>
                  <FormControl><Input {...field} placeholder="Origin" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="to_location" render={({ field }) => (
                <FormItem>
                  <FormLabel>To</FormLabel>
                  <FormControl><Input {...field} placeholder="Destination" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="departure_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Departure</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="arrival_time" render={({ field }) => (
                <FormItem>
                  <FormLabel>Arrival (optional)</FormLabel>
                  <FormControl><Input type="datetime-local" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="cost" render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost (optional)</FormLabel>
                  <FormControl><Input type="number" step="0.01" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="confirmation_number" render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmation # (optional)</FormLabel>
                  <FormControl><Input {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </div>
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl><Textarea {...field} rows={3} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
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
