import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Calendar, Sparkles } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DateRange } from "react-day-picker";
import { format, addDays } from "date-fns";

interface TripTemplatesDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TripTemplatesDialog = ({ open, onClose, onSuccess }: TripTemplatesDialogProps) => {
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["tripTemplates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trip_templates")
        .select("*")
        .eq("is_featured", true)
        .order("name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const createFromTemplate = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !dateRange?.from || !dateRange?.to) {
        throw new Error("Please select dates");
      }

      // Create the trip
      const tripData = {
        title: `${selectedTemplate.destination}, ${selectedTemplate.country} — ${format(dateRange.from, "d MMM yyyy")} to ${format(dateRange.to, "d MMM yyyy")}`,
        destination: selectedTemplate.destination,
        country: selectedTemplate.country,
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
        notes: selectedTemplate.description,
      };

      const { data: trip, error: tripError } = await supabase
        .from("trips")
        .insert([tripData])
        .select()
        .single();

      if (tripError) throw tripError;

      // Fetch and copy template items
      const { data: itineraryItems } = await supabase
        .from("template_itinerary_items")
        .select("*")
        .eq("template_id", selectedTemplate.id);

      const { data: packingItems } = await supabase
        .from("template_packing_items")
        .select("*")
        .eq("template_id", selectedTemplate.id);

      // Insert itinerary items with adjusted dates
      if (itineraryItems && itineraryItems.length > 0) {
        const itineraryData = itineraryItems.map((item) => ({
          trip_id: trip.id,
          day_number: item.day_number,
          title: item.title,
          description: item.description,
          time: item.time,
          location: item.location,
          date: format(addDays(dateRange.from!, item.day_number - 1), "yyyy-MM-dd"),
        }));

        await supabase.from("itinerary_items").insert(itineraryData);
      }

      // Insert packing items
      if (packingItems && packingItems.length > 0) {
        const packingData = packingItems.map((item) => ({
          trip_id: trip.id,
          item: item.item,
          category: item.category,
          packed: false,
        }));

        await supabase.from("packing_items").insert(packingData);
      }

      return trip;
    },
    onSuccess: () => {
      toast.success("Trip created from template!");
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      setSelectedTemplate(null);
      setDateRange(undefined);
      onSuccess();
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create trip from template");
    },
  });

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Start from a Template
          </DialogTitle>
        </DialogHeader>

        {!selectedTemplate ? (
          <div className="space-y-4">
            {isLoading ? (
              <p className="text-muted-foreground">Loading templates...</p>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardHeader>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {template.destination}, {template.country}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <Calendar className="h-4 w-4" />
                        {template.duration_days} days
                        {template.season && ` • Best in ${template.season}`}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {template.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{selectedTemplate.name}</CardTitle>
                <CardDescription>
                  {selectedTemplate.destination}, {selectedTemplate.country}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  {selectedTemplate.description}
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Select Your Travel Dates *
                    </label>
                    <DateRangePicker
                      dateRange={dateRange}
                      onDateRangeChange={setDateRange}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedTemplate(null);
                  setDateRange(undefined);
                }}
              >
                Back
              </Button>
              <Button
                onClick={() => createFromTemplate.mutate()}
                disabled={!dateRange?.from || !dateRange?.to || createFromTemplate.isPending}
              >
                {createFromTemplate.isPending ? "Creating..." : "Create Trip"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TripTemplatesDialog;
