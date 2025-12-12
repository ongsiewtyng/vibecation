import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Sparkles, Wallet, PiggyBank, Check, X } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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

interface BudgetAllocationTabProps {
  tripId: string;
  totalBudget: number | null;
  currency?: string;
}

interface BudgetCategory {
  id: string;
  trip_id: string;
  category: string;
  allocated_amount: number;
  currency: string;
  is_ai_suggested: boolean;
  created_at: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Flights/Transport': '#3b82f6',
  'Accommodation': '#8b5cf6',
  'Food & Dining': '#f59e0b',
  'Activities & Attractions': '#10b981',
  'Local Transport': '#6366f1',
  'Shopping & Misc': '#ec4899',
  'default': '#64748b'
};

export function BudgetAllocationTab({ tripId, totalBudget, currency = 'MYR' }: BudgetAllocationTabProps) {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<BudgetCategory | null>(null);
  const [deleteItem, setDeleteItem] = useState<BudgetCategory | null>(null);
  const [formData, setFormData] = useState({ category: '', amount: '' });

  const { data: budgetCategories = [], isLoading } = useQuery({
    queryKey: ['trip-budget-categories', tripId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('trip_budget_categories')
        .select('*')
        .eq('trip_id', tripId)
        .order('allocated_amount', { ascending: false });
      
      if (error) throw error;
      return data as BudgetCategory[];
    }
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: { id?: string; category: string; amount: number }) => {
      if (data.id) {
        const { error } = await supabase
          .from('trip_budget_categories')
          .update({ 
            category: data.category, 
            allocated_amount: data.amount,
            is_ai_suggested: false 
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('trip_budget_categories')
          .insert({
            trip_id: tripId,
            category: data.category,
            allocated_amount: data.amount,
            currency: currency,
            is_ai_suggested: false
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-budget-categories', tripId] });
      setDialogOpen(false);
      setEditItem(null);
      setFormData({ category: '', amount: '' });
      toast.success(editItem ? 'Budget category updated' : 'Budget category added');
    },
    onError: (error) => {
      toast.error('Failed to save budget category');
      console.error(error);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('trip_budget_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['trip-budget-categories', tripId] });
      setDeleteDialogOpen(false);
      setDeleteItem(null);
      toast.success('Budget category deleted');
    },
    onError: () => {
      toast.error('Failed to delete budget category');
    }
  });

  const totalAllocated = budgetCategories.reduce((sum, cat) => sum + cat.allocated_amount, 0);
  const remaining = (totalBudget || 0) - totalAllocated;
  const percentUsed = totalBudget ? Math.round((totalAllocated / totalBudget) * 100) : 0;

  const chartData = budgetCategories.map(cat => ({
    name: cat.category,
    value: cat.allocated_amount,
    color: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.default
  }));

  const handleEdit = (item: BudgetCategory) => {
    setEditItem(item);
    setFormData({ category: item.category, amount: item.allocated_amount.toString() });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditItem(null);
    setFormData({ category: '', amount: '' });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.category || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }
    upsertMutation.mutate({
      id: editItem?.id,
      category: formData.category,
      amount: parseFloat(formData.amount)
    });
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Loading budget allocation...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold">{currency} {totalBudget?.toLocaleString() || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <PiggyBank className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Allocated</p>
                <p className="text-2xl font-bold">{currency} {totalAllocated.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">{percentUsed}% of budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={remaining < 0 ? 'border-destructive' : ''}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${remaining < 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                {remaining >= 0 ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <X className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className={`text-2xl font-bold ${remaining < 0 ? 'text-destructive' : 'text-green-600'}`}>
                  {currency} {remaining.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart */}
        {budgetCategories.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${currency} ${value.toLocaleString()}`, 'Amount']}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Categories List */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Budget Categories</CardTitle>
            <Button size="sm" onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-1" />
              Add Category
            </Button>
          </CardHeader>
          <CardContent>
            {budgetCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <PiggyBank className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No budget allocation yet</p>
                <p className="text-sm">Add categories to plan your spending</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgetCategories.map((cat) => (
                  <div 
                    key={cat.id} 
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CATEGORY_COLORS[cat.category] || CATEGORY_COLORS.default }}
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{cat.category}</span>
                          {cat.is_ai_suggested && (
                            <Badge variant="secondary" className="text-xs gap-1">
                              <Sparkles className="h-3 w-3" />
                              AI Suggested
                            </Badge>
                          )}
                        </div>
                        <span className="text-lg font-semibold">
                          {currency} {cat.allocated_amount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(cat)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive hover:text-destructive"
                        onClick={() => {
                          setDeleteItem(cat);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Budget Category' : 'Add Budget Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category Name</Label>
              <Input
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="e.g., Food & Dining"
              />
            </div>
            <div className="space-y-2">
              <Label>Allocated Amount ({currency})</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={upsertMutation.isPending}>
              {editItem ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Budget Category?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.category}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteItem && deleteMutation.mutate(deleteItem.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
