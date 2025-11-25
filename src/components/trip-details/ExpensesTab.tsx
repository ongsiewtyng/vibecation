import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ExpenseFormDialog from "./ExpenseFormDialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { useHomeCurrency } from "@/lib/useHomeCurrency";
import { convertCurrency } from "@/config/currency";

interface ExpensesTabProps {
    tripId: string;
    budget: number | null;
    /**
     * Symbol of the trip currency (e.g. "£")
     */
    currencySymbol?: string;
    /**
     * Code of the trip currency (e.g. "GBP").
     * Optional – defaults to "GBP" if not provided.
     */
    tripCurrencyCode?: string;
}

const ExpensesTab = ({
                         tripId,
                         budget,
                         currencySymbol = "£",
                         tripCurrencyCode = "GBP",
                     }: ExpensesTabProps) => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editItem, setEditItem] = useState<any | null>(null);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    // Global "home currency"
    const { homeCurrencyCode, homeCurrencySymbol } = useHomeCurrency();
    const showHomeCurrency =
        homeCurrencyCode && homeCurrencyCode.toUpperCase() !== tripCurrencyCode.toUpperCase();

    // FX rate: 1 tripCurrency -> homeCurrency
    const [fxRate, setFxRate] = useState<number | null>(null);
    const [isLoadingFx, setIsLoadingFx] = useState(false);
    const [fxError, setFxError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const loadFxRate = async () => {
            if (!showHomeCurrency) {
                setFxRate(null);
                setFxError(null);
                return;
            }

            try {
                setIsLoadingFx(true);
                setFxError(null);
                const rate = await convertCurrency(1, tripCurrencyCode, homeCurrencyCode);
                if (!cancelled) {
                    setFxRate(rate);
                }
            } catch (err) {
                console.error("Failed to load FX rate", err);
                if (!cancelled) {
                    setFxError("Unable to load latest exchange rate");
                    setFxRate(null);
                }
            } finally {
                if (!cancelled) {
                    setIsLoadingFx(false);
                }
            }
        };

        loadFxRate();

        return () => {
            cancelled = true;
        };
    }, [tripCurrencyCode, homeCurrencyCode, showHomeCurrency]);

    const { data: items = [] } = useQuery({
        queryKey: ["expenses", tripId],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("expenses")
                .select("*")
                .eq("trip_id", tripId);

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
        onError: () => {
            toast({
                title: "Error deleting expense",
                variant: "destructive",
            });
        },
    });

    // Totals in trip currency
    const total = items.reduce((sum, item: any) => sum + Number(item.amount || 0), 0);
    const remaining = (budget || 0) - total;
    const percentSpent = budget ? (total / budget) * 100 : 0;

    // Totals in home currency (converted)
    const totalHome =
        showHomeCurrency && fxRate != null ? total * fxRate : null;
    const remainingHome =
        showHomeCurrency && fxRate != null ? remaining * fxRate : null;
    const budgetHome =
        showHomeCurrency && fxRate != null && budget != null
            ? budget * fxRate
            : null;

    // Group expenses by category
    const categoryTotals = items.reduce(
        (acc: Record<string, number>, item: any) => {
            const category = item.category || "Other";
            acc[category] = (acc[category] || 0) + Number(item.amount || 0);
            return acc;
        },
        {} as Record<string, number>
    );

    const categoryData = Object.entries(categoryTotals).map(([name, value]) => ({
        name,
        value: Number((value as number).toFixed(2)),
    }));

    const COLORS = [
        "hsl(var(--primary))",
        "hsl(var(--secondary))",
        "hsl(var(--accent))",
        "hsl(var(--destructive))",
        "hsl(var(--muted-foreground))",
    ];

    const budgetData = [
        { name: "Spent", amount: total },
        { name: "Remaining", amount: Math.max(0, remaining) },
    ];

    return (
        <div className="space-y-4">
            {/* Header row: title + add button + small currency hint */}
            <div className="flex justify-between items-center gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-semibold">Budget &amp; Expenses</h2>
                    <p className="text-xs text-muted-foreground">
                        Trip currency: {tripCurrencyCode} ({currencySymbol}){" · "}
                        Home currency: {homeCurrencyCode}
                        {showHomeCurrency && ` (${homeCurrencySymbol})`}
                    </p>
                    {fxError && (
                        <p className="text-xs text-destructive">{fxError}</p>
                    )}
                    {isLoadingFx && showHomeCurrency && !fxError && (
                        <p className="text-xs text-muted-foreground">
                            Updating exchange rate…
                        </p>
                    )}
                </div>

                <Button
                    size="sm"
                    onClick={() => {
                        setEditItem(null);
                        setDialogOpen(true);
                    }}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Expense
                </Button>
            </div>

            {/* Top 3 cards */}
            <div className="grid gap-4 md:grid-cols-3">
                {/* Budget */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center space-y-1">
                            <p className="text-sm text-muted-foreground">Budget</p>
                            <p className="text-2xl font-bold">
                                {currencySymbol}
                                {budget || 0}
                            </p>
                            {showHomeCurrency && budgetHome != null && (
                                <p className="text-xs text-muted-foreground">
                                    ≈ {homeCurrencySymbol}
                                    {budgetHome.toFixed(2)} {homeCurrencyCode}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Spent */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center space-y-1">
                            <p className="text-sm text-muted-foreground">Spent</p>
                            <p className="text-2xl font-bold text-primary">
                                {currencySymbol}
                                {total.toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                {percentSpent.toFixed(1)}% of budget
                            </p>
                            {showHomeCurrency && totalHome != null && (
                                <p className="text-xs text-muted-foreground">
                                    ≈ {homeCurrencySymbol}
                                    {totalHome.toFixed(2)} {homeCurrencyCode}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Remaining */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center space-y-1">
                            <p className="text-sm text-muted-foreground">Remaining</p>
                            <p
                                className={`text-2xl font-bold ${
                                    remaining < 0 ? "text-destructive" : "text-accent"
                                }`}
                            >
                                {currencySymbol}
                                {remaining.toFixed(2)}
                            </p>
                            {remaining < 0 && (
                                <div className="flex items-center justify-center gap-1 text-xs text-destructive mt-1">
                                    <TrendingDown className="h-3 w-3" />
                                    Over budget
                                </div>
                            )}
                            {showHomeCurrency && remainingHome != null && (
                                <p className="text-xs text-muted-foreground">
                                    ≈ {homeCurrencySymbol}
                                    {remainingHome.toFixed(2)} {homeCurrencyCode}
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            {items.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Category pie chart */}
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
                                        label={({ name, percent }) =>
                                            `${name} ${(percent * 100).toFixed(0)}%`
                                        }
                                        outerRadius={80}
                                        dataKey="value"
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: any) => {
                                            const base = Number(value) || 0;
                                            if (!showHomeCurrency || fxRate == null) {
                                                return `${currencySymbol}${base.toFixed(2)}`;
                                            }
                                            const converted = base * fxRate;
                                            return `${currencySymbol}${base.toFixed(
                                                2
                                            )} (≈ ${homeCurrencySymbol}${converted.toFixed(
                                                2
                                            )} ${homeCurrencyCode})`;
                                        }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "0.5rem",
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Budget overview bar chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Budget Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={budgetData}>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="hsl(var(--border))"
                                    />
                                    <XAxis
                                        dataKey="name"
                                        stroke="hsl(var(--muted-foreground))"
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" />
                                    <Tooltip
                                        formatter={(value: any) => {
                                            const base = Number(value) || 0;
                                            if (!showHomeCurrency || fxRate == null) {
                                                return `${currencySymbol}${base.toFixed(2)}`;
                                            }
                                            const converted = base * fxRate;
                                            return `${currencySymbol}${base.toFixed(
                                                2
                                            )} (≈ ${homeCurrencySymbol}${converted.toFixed(
                                                2
                                            )} ${homeCurrencyCode})`;
                                        }}
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "0.5rem",
                                        }}
                                    />
                                    <Bar
                                        dataKey="amount"
                                        fill="hsl(var(--primary))"
                                        radius={[8, 8, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Expense list */}
            {items.map((item: any) => {
                const baseAmount = Number(item.amount || 0);
                const homeAmount =
                    showHomeCurrency && fxRate != null ? baseAmount * fxRate : null;

                return (
                    <Card key={item.id}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1">
                                    <p className="font-medium">{item.description}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {item.category} •{" "}
                                        {format(new Date(item.date), "MMM d, yyyy")}
                                    </p>
                                    {item.notes && (
                                        <p className="text-sm mt-1 break-words">{item.notes}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right mr-1">
                                        <div className="font-semibold">
                                            {currencySymbol}
                                            {baseAmount.toFixed(2)}
                                        </div>
                                        {showHomeCurrency && homeAmount != null && (
                                            <div className="text-xs text-muted-foreground">
                                                ≈ {homeCurrencySymbol}
                                                {homeAmount.toFixed(2)} {homeCurrencyCode}
                                            </div>
                                        )}
                                    </div>
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
                );
            })}

            <ExpenseFormDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                tripId={tripId}
                item={editItem}
            />
        </div>
    );
};

export default ExpensesTab;
