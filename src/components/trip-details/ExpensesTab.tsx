import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ExpenseFormDialog from "./ExpenseFormDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const ExpensesTab = ({ tripId, budget }: { tripId: string; budget: number | null }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items = [] } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("expenses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", tripId] });
      toast({ title: "Expense deleted" });
    },
  });

  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budget & Expenses</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Expense
        </Button>
      </div>
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-xl font-semibold">£{budget || 0}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-xl font-semibold">£{total.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className="text-xl font-semibold">£{((budget || 0) - total).toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {items.map((item) => (
        <Card key={item.id}>
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="font-medium">{item.description}</p>
                <p className="text-sm text-muted-foreground">{item.category} • {format(new Date(item.date), "MMM d, yyyy")}</p>
                {item.notes && <p className="text-sm mt-1">{item.notes}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">£{Number(item.amount).toFixed(2)}</span>
                <Button size="sm" variant="ghost" onClick={() => { setEditItem(item); setDialogOpen(true); }}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      <ExpenseFormDialog open={dialogOpen} onOpenChange={setDialogOpen} tripId={tripId} item={editItem} />
    </div>
  );
};

export default ExpensesTab;
