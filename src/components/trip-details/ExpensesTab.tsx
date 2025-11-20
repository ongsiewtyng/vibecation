import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseFormDialog from "./ExpenseFormDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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
  const remaining = (budget || 0) - total;
  const percentSpent = budget ? (total / budget) * 100 : 0;

  // Group expenses by category
  const categoryTotals = items.reduce((acc, item) => {
    const category = item.category || "Other";
    acc[category] = (acc[category] || 0) + Number(item.amount);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
    name,
    value: Number(value.toFixed(2)),
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

  const budgetData = [
    { name: "Spent", amount: total },
    { name: "Remaining", amount: Math.max(0, remaining) },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Budget & Expenses</h2>
        <Button size="sm" onClick={() => { setEditItem(null); setDialogOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />Add Expense
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Budget</p>
              <p className="text-2xl font-bold">£{budget || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Spent</p>
              <p className="text-2xl font-bold text-primary">£{total.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">{percentSpent.toFixed(1)}% of budget</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-accent'}`}>
                £{remaining.toFixed(2)}
              </p>
              {remaining < 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-destructive mt-1">
                  <TrendingDown className="h-3 w-3" />
                  Over budget
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Spending by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `£${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Budget Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={budgetData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    formatter={(value) => `£${Number(value).toFixed(2)}`}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
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
