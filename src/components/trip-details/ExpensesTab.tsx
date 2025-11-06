import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const ExpensesTab = ({ tripId, budget }: { tripId: string; budget: number | null }) => {
  const { data: items = [] } = useQuery({
    queryKey: ["expenses", tripId],
    queryFn: async () => {
      const { data, error } = await supabase.from("expenses").select("*").eq("trip_id", tripId);
      if (error) throw error;
      return data;
    },
  });

  const total = items.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budget & Expenses</h2>
        <Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Expense</Button>
      </div>
      <Card><CardContent className="p-4">
        <p>Budget: £{budget || 0} | Spent: £{total.toFixed(2)} | Remaining: £{((budget || 0) - total).toFixed(2)}</p>
      </CardContent></Card>
      {items.map((item) => (
        <Card key={item.id}><CardContent className="p-4">{item.description}: £{item.amount}</CardContent></Card>
      ))}
    </div>
  );
};

export default ExpensesTab;
