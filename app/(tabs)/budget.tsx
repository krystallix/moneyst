import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { deleteBudget, getActiveBudgets } from "@/lib/supabase/budgets";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AlertCircle, Plus, Target, Trash2 } from "lucide-react-native";
import * as Icons from "lucide-react-native";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ConfirmModal } from "@/components/ConfirmModal";

function getProgressColor(percentage: number) {
    if (percentage >= 100) return "#E53935"; // Red
    if (percentage >= 80) return "#FF9800"; // Orange
    return "#3D9B35"; // Green
}

function getSafeIcon(iconName: string | undefined | null) {
    if (!iconName) return Target;
    const IconComp = (Icons as any)[iconName];
    return IconComp || Target;
}

export default function BudgetScreen() {
    const { user } = useAuth();
    const [budgets, setBudgets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());

    const toggleExpand = (id: string) => {
        setExpandedBudgets(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const fetchBudgets = useCallback(async () => {
        if (!user) return;
        try {
            // 1. Fetch budgets and their categories
            const data = await getActiveBudgets(user.id);

            // 2. Fetch transactions for the current month/period to calculate spent_amount on the fly
            // (Assuming all budgets are for the current month for simplicity, or we check each budget's dates)
            const enrichedBudgets = await Promise.all(data.map(async (budget: any) => {
                let query = supabase
                    .schema('moneyst')
                    .from('transactions')
                    .select('amount, category_id, type, date')
                    .eq('user_id', user.id)
                    .eq('type', 'expense')
                    .eq('is_deleted', false);

                if (budget.period !== 'lifetime') {
                    query = query.gte('date', budget.start_date);
                    if (budget.end_date) {
                        query = query.lte('date', budget.end_date);
                    } else {
                        query = query.lte('date', new Date().toISOString().split('T')[0]);
                    }
                }

                const { data: txs, error } = await query;

                let totalSpent = 0;
                const catSpent: Record<string, number> = {};

                if (txs) {
                    for (const tx of txs) {
                        const bcs = budget.budget_categories || [];
                        const isTracked = bcs.length === 0 ||
                            (tx.category_id && bcs.some((bc: any) => bc.category_id === tx.category_id));
                        
                        if (isTracked) {
                            totalSpent += Number(tx.amount);
                        }

                        if (tx.category_id) {
                            catSpent[tx.category_id] = (catSpent[tx.category_id] || 0) + Number(tx.amount);
                        }
                    }
                } else {
                    console.log("No txs found or error for budget:", budget.name, error);
                }
                
                console.log(`Budget: ${budget.name}, Start: ${budget.start_date}, End: ${budget.end_date}, Txs Count: ${txs?.length || 0}, Total Spent: ${totalSpent}`);

                return {
                    ...budget,
                    spent_amount: totalSpent,
                    budget_categories: (budget.budget_categories || []).map((bc: any) => ({
                        ...bc,
                        spent_amount: catSpent[bc.category_id] || 0
                    }))
                };
            }));

            setBudgets(enrichedBudgets);
        } catch (error) {
            console.error("Error fetching budgets:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            fetchBudgets();
        }, [fetchBudgets])
    );

    const executeDelete = async () => {
        if (!budgetToDelete) return;
        setIsDeleting(true);
        try {
            await deleteBudget(budgetToDelete);
            setBudgets(budgets.filter(b => b.id !== budgetToDelete));
        } catch (e) {
            console.error("Delete error:", e);
        } finally {
            setIsDeleting(false);
            setBudgetToDelete(null);
        }
    };

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-5 pb-4 flex-row justify-between items-center">
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-3xl text-foreground">
                        Budgets
                    </Text>
                    <Pressable
                        onPress={() => router.push('/budget/new')}
                        className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                    >
                        <Plus size={22} color="#2F2F2F" strokeWidth={2.5} />
                    </Pressable>
                </View>

                <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingBottom: 100 }}>
                    {loading ? (
                        <View className="flex-1 justify-center items-center">
                            <ActivityIndicator color="#3D9B35" />
                        </View>
                    ) : budgets.length === 0 ? (
                        <View className="flex-1 justify-center items-center opacity-60">
                            <Target size={48} color="#999" strokeWidth={1} className="mb-4" />
                            <Text className="text-muted-foreground text-center">
                                No budgets active right now.{"\n"}Set a budget to track your spending!
                            </Text>
                        </View>
                    ) : (
                        budgets.map((budget) => {
                            const pct = (budget.spent_amount / budget.total_limit) * 100;
                            const isAlert = pct >= budget.alert_threshold;

                            return (
                                <Pressable 
                                    key={budget.id} 
                                    onPress={() => toggleExpand(budget.id)}
                                    className="bg-card p-5 rounded-3xl shadow-sm border border-border mb-4 active:opacity-95"
                                >
                                    <View className="flex-row justify-between items-start mb-2">
                                        <View className="flex-1">
                                            <Text className="text-lg font-bold text-foreground">{budget.name}</Text>
                                            <View className="flex-row items-center mt-1">
                                                <Text className="text-xs text-muted-foreground uppercase mr-2">{budget.period}</Text>
                                                {budget.budget_categories?.length > 0 && (
                                                    <View className="flex-row items-center gap-1">
                                                        {budget.budget_categories.slice(0, 3).map((bc: any) => {
                                                            const Icon = getSafeIcon(bc.categories?.icon);
                                                            return (
                                                                <View key={bc.id} className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: `${bc.categories?.color || '#999'}20` }}>
                                                                    <Icon size={10} color={bc.categories?.color || '#999'} />
                                                                </View>
                                                            )
                                                        })}
                                                        {budget.budget_categories.length > 3 && (
                                                            <View className="w-5 h-5 rounded-full bg-gray-100 items-center justify-center">
                                                                <Text className="text-[8px] font-bold text-gray-500">+{budget.budget_categories.length - 3}</Text>
                                                            </View>
                                                        )}
                                                    </View>
                                                )}
                                            </View>
                                        </View>
                                        <View className="flex-row items-center gap-2">
                                            {isAlert && (
                                                <View className="flex-row items-center bg-red-50 px-2 py-1 rounded-full border border-red-100">
                                                    <AlertCircle size={12} color="#E53935" className="mr-1" />
                                                    <Text className="text-[10px] font-bold text-[#E53935]">Near Limit</Text>
                                                </View>
                                            )}
                                            <Pressable 
                                                onPress={() => router.push({ pathname: '/budget/[id]', params: { id: budget.id } })}
                                                className="w-8 h-8 rounded-full bg-[#F7F7F7] items-center justify-center active:opacity-70"
                                            >
                                                <Icons.Pencil size={12} color="#8E8E93" strokeWidth={2.5} />
                                            </Pressable>
                                        </View>
                                    </View>

                                    <View className="mt-4 mb-2">
                                        <View className="flex-row justify-between mb-1">
                                            <Text className="text-xs font-medium text-muted-foreground">
                                                {budget.currency} {budget.spent_amount.toLocaleString()} spent
                                            </Text>
                                            <Text className="text-xs font-bold text-foreground">
                                                {budget.currency} {budget.total_limit.toLocaleString()}
                                            </Text>
                                        </View>

                                        <View className="h-3 bg-secondary/30 rounded-full overflow-hidden flex-row">
                                            <View
                                                className="h-full rounded-full"
                                                style={{
                                                    width: `${Math.min(pct, 100)}%`,
                                                    backgroundColor: getProgressColor(pct)
                                                }}
                                            />
                                        </View>
                                    </View>

                                    {expandedBudgets.has(budget.id) && budget.budget_categories?.length > 0 && (
                                        <View className="mt-4 pt-4 border-t border-border">
                                            {budget.budget_categories.map((bc: any) => {
                                                const catPct = (bc.spent_amount / bc.limit_amount) * 100;
                                                return (
                                                    <View key={bc.id} className="mb-3 last:mb-0">
                                                        <View className="flex-row justify-between mb-1">
                                                            <Text className="text-xs text-foreground font-medium flex-1" numberOfLines={1}>
                                                                {bc.categories?.name}
                                                            </Text>
                                                            <Text className="text-[10px] text-muted-foreground">
                                                                {budget.currency} {bc.spent_amount.toLocaleString()} / {bc.limit_amount.toLocaleString()}
                                                            </Text>
                                                        </View>
                                                        <View className="h-1.5 bg-secondary/30 rounded-full overflow-hidden flex-row">
                                                            <View
                                                                className="h-full rounded-full"
                                                                style={{
                                                                    width: `${Math.min(catPct, 100)}%`,
                                                                    backgroundColor: getProgressColor(catPct)
                                                                }}
                                                            />
                                                        </View>
                                                    </View>
                                                )
                                            })}
                                        </View>
                                    )}
                                </Pressable>
                            )
                        })
                    )}
                </ScrollView>
            </SafeAreaView>

            <ConfirmModal
                visible={!!budgetToDelete}
                title="Delete Budget"
                description="Are you sure you want to delete this budget? This action cannot be undone."
                confirmText="Delete"
                isDestructive
                loading={isDeleting}
                onCancel={() => setBudgetToDelete(null)}
                onConfirm={executeDelete}
            />
        </View>
    );
}
