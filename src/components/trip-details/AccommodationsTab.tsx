import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import AccommodationFormDialog from "./AccommodationFormDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useHomeCurrency } from "@/lib/useHomeCurrency";

const AccommodationsTab = ({ tripId }: { tripId: string }) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { homeCurrencySymbol } = useHomeCurrency();

    const { data: items = [] } = useQuery({
        queryKey: ["accommodations", tripId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("accommodations")
                .select("*")
                .eq("trip_id", tripId);
            if (error) throw error;
            return data;
        },
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase.from("accommodations").delete().eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["accommodations", tripId] });
            toast({ title: "Accommodation deleted" });
        },
    });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Accommodations</h2>
                <Button
                    size="sm"
                    onClick={() => {
                        setEditItem(null);
                        setDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Accommodation
                </Button>
            </div>

            {items.length === 0 ? (
                <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                        No accommodations added
                    </CardContent>
                </Card>
            ) : (
                items.map((item) => (
                    <Card key={item.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <p className="font-medium">{item.name}</p>
                                    <p className="text-sm text-muted-foreground">{item.address}</p>
                                    <p className="text-sm mt-1">
                                        {format(new Date(item.check_in), "MMM d")} -{" "}
                                        {format(new Date(item.check_out), "MMM d, yyyy")}
                                    </p>

                                    {item.cost != null && (
                                        <p className="text-sm">
                                            Cost: {homeCurrencySymbol}
                                            {Number(item.cost).toFixed(2)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                            setEditItem(item);
                                            setDialogOpen(true);
                                        }}
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteMutation.mutate(item.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))
            )}

            <AccommodationFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tripId={tripId}
                item={editItem}
            />
        </div>
    );
};

export default AccommodationsTab;
