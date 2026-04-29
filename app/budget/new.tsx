import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { addBudgetCategories, createBudget } from "@/lib/supabase/budgets";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Icons from "lucide-react-native";
import { Check, ChevronLeft, HelpCircle, Plus, Trash2 } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView, Platform,
    Pressable,
    ScrollView,
    Text, TextInput,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ConfirmModal, ConfirmModalProps } from "@/components/ConfirmModal";

function getSafeIcon(iconName: string | undefined | null) {
    if (!iconName) return HelpCircle;
    const IconComp = (Icons as any)[iconName];
    return IconComp || HelpCircle;
}

export default function NewBudgetScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [period, setPeriod] = useState<'monthly' | 'weekly' | 'yearly' | 'lifetime'>("monthly");

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<Array<{
        category_id: string;
        limit_amount: string;   // empty string = "auto" (will use default split)
        isManual: boolean;      // true = user typed a value, false = auto
        name: string;
        icon: string | null;
        color: string | null;
    }>>([]); 

    const [isSaving, setIsSaving] = useState(false);
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    
    type ModalState = Omit<ConfirmModalProps, 'visible'>;
    const [modalState, setModalState] = useState<ModalState | null>(null);

    // Parsed total budget amount (0 if not set yet)
    const parsedAmount = (() => {
        const n = parseFloat(amount.replace(/[^0-9]/g, ''));
        return isNaN(n) ? 0 : n;
    })();

    // Equal-split default limit per category
    const defaultCategoryLimit = selectedCategories.length > 0 && parsedAmount > 0
        ? Math.floor(parsedAmount / selectedCategories.length)
        : 0;

    useEffect(() => {
        const fetchCategories = async () => {
            if (!user) return;
            const { data } = await supabase
                .schema('moneyst')
                .from('categories')
                .select('*')
                .eq('user_id', user.id)
                .eq('type', 'expense')
                .eq('is_active', true)
                .order('name');
            if (data) setCategories(data);
        };
        fetchCategories();
    }, [user]);

    const handleSave = async () => {
        if (!user || !name || !amount) return;
        if (selectedCategories.length === 0) {
            setModalState({
                title: "Missing Categories",
                description: "Please select at least one category for this budget.",
                singleButton: true,
                onConfirm: () => setModalState(null)
            });
            return;
        }

        const numAmount = parseFloat(amount.replace(/[^0-9]/g, ''));
        if (isNaN(numAmount) || numAmount <= 0) {
            setModalState({
                title: "Invalid Amount",
                description: "Please enter a valid budget amount.",
                singleButton: true,
                onConfirm: () => setModalState(null)
            });
            return;
        }

        // Resolve each category limit: manual value OR equal split fallback
        const equalSplit = Math.floor(numAmount / selectedCategories.length);
        const resolvedCats = selectedCategories.map(c => {
            const manualVal = parseFloat(c.limit_amount.replace(/[^0-9]/g, ''));
            return {
                ...c,
                resolvedLimit: (c.isManual && !isNaN(manualVal) && manualVal > 0)
                    ? manualVal
                    : equalSplit
            };
        });

        // Warn if any manual limit exceeds total (soft warning, still allow save)
        const totalCatLimits = resolvedCats.reduce((sum, c) => sum + c.resolvedLimit, 0);
        if (totalCatLimits > numAmount) {
            setModalState({
                title: "Limits Exceed Budget",
                description: `The sum of category limits (Rp ${totalCatLimits.toLocaleString('id-ID')}) exceeds the total budget (Rp ${numAmount.toLocaleString('id-ID')}). Do you want to continue anyway?`,
                cancelText: "Cancel",
                confirmText: "Continue",
                onCancel: () => setModalState(null),
                onConfirm: () => {
                    setModalState(null);
                    doSave(numAmount, resolvedCats);
                }
            });
            return;
        }

        doSave(numAmount, resolvedCats);
    };

    const doSave = async (numAmount: number, resolvedCats: Array<any>) => {
        setIsSaving(true);
        try {
            const now = new Date();
            let startDate = now.toISOString().split('T')[0];
            let endDate: string | null = null;

            if (period === 'monthly') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (period === 'weekly') {
                const day = now.getDay() || 7;
                const diff = now.getDate() - day + 1;
                const mon = new Date(now.setDate(diff));
                startDate = mon.toISOString().split('T')[0];
                const sun = new Date(now.setDate(mon.getDate() + 6));
                endDate = sun.toISOString().split('T')[0];
            } else if (period === 'yearly') {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            } else if (period === 'lifetime') {
                startDate = now.toISOString().split('T')[0];
                endDate = null;
            }

            const newBudget = await createBudget({
                user_id: user!.id,
                name,
                period,
                start_date: startDate,
                end_date: endDate,
                total_limit: numAmount,
                currency: 'IDR',
                rollover: false,
                alert_threshold: 80,
                is_active: true,
                notes: null
            });

            const budgetCats = resolvedCats.map(c => ({
                budget_id: newBudget.id,
                category_id: c.category_id,
                limit_amount: c.resolvedLimit,
                spent_amount: 0
            }));

            await addBudgetCategories(budgetCats);

            router.back();
        } catch (e) {
            console.error("Save budget error:", e);
            setModalState({
                title: "Error",
                description: "Failed to save budget. Please try again.",
                singleButton: true,
                onConfirm: () => setModalState(null)
            });
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = (cat: any) => {
        if (!selectedCategories.find(c => c.category_id === cat.id)) {
            setSelectedCategories(prev => [...prev, {
                category_id: cat.id,
                limit_amount: "",   // blank = auto
                isManual: false,
                name: cat.name,
                icon: cat.icon,
                color: cat.color
            }]);
        }
        setShowCategorySelector(false);
    };

    const removeCategory = (id: string) => {
        setSelectedCategories(prev => prev.filter(c => c.category_id !== id));
    };

    const updateCategoryLimit = (id: string, val: string) => {
        setSelectedCategories(prev => prev.map(c => {
            if (c.category_id !== id) return c;
            // Empty value = revert to auto
            return { ...c, limit_amount: val, isManual: val.length > 0 };
        }));
    };

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>

                {/* ── HEADER ── */}
                <View className="px-6 pt-5 pb-3 flex-row items-center justify-center relative">
                    <View className="absolute left-6">
                        <Pressable
                            onPress={() => { router.back() }}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border"
                        >
                            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-3xl">
                        New Budget
                    </Text>
                    <View className="absolute right-6">
                        <Pressable
                            onPress={handleSave}
                            disabled={!name || !amount || isSaving}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${(!name || !amount) ? 'bg-muted' : 'bg-primary active:opacity-70'
                                }`}
                        >
                            {isSaving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Check size={18} color={(!name || !amount) ? "#9ca3af" : "#fff"} strokeWidth={2.5} />}
                        </Pressable>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 100) }}>

                        {/* ── AMOUNT HEADER ── */}
                        <View className="items-center mt-6 mb-8">
                            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Limit</Text>
                            <View className="flex-row items-center justify-center">
                                <Text className="text-2xl font-bold  mr-2 text-[#3D9B35] pt-2">Rp</Text>
                                <TextInput
                                    value={amount}
                                    onChangeText={(text) => {
                                        const numeric = text.replace(/[^0-9]/g, '');
                                        if (numeric) setAmount(parseInt(numeric).toLocaleString('id-ID'));
                                        else setAmount('');
                                    }}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#A1A1AA"
                                    className="font-bold tracking-tighter text-[#3D9B35]"
                                    style={{ fontSize: 64, minWidth: 100, textAlign: 'center', height: 100 }}
                                />
                            </View>
                        </View>

                        <View className="px-0">
                            {/* ── SETTINGS CARD ── */}
                            <View className="bg-card mx-5 rounded-[24px] shadow-sm border border-gray-100 mb-8">
                                {/* Name Input */}
                                <View className="px-5 py-4 border-b border-gray-100 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <Icons.Tag size={15} color="#8E8E93" />
                                    </View>
                                    <TextInput
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Budget Name (e.g., Food)"
                                        placeholderTextColor="#9ca3af"
                                        className="flex-1 text-[15px] text-foreground font-semibold"
                                    />
                                </View>

                                {/* Period Toggle */}
                                <View className="px-5 py-4 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <Icons.CalendarDays size={15} color="#8E8E93" />
                                    </View>
                                    <View style={{ flex: 1, flexDirection: 'row', backgroundColor: '#F7F7F7', borderRadius: 14, padding: 4 }}>
                                        {(['weekly', 'monthly', 'yearly', 'lifetime'] as const).map((p) => {
                                            const active = period === p;
                                            return (
                                                <Pressable
                                                    key={p}
                                                    onPress={() => setPeriod(p)}
                                                    style={{
                                                        flex: 1,
                                                        paddingVertical: 8,
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: 10,
                                                        backgroundColor: active ? '#FFFFFF' : 'transparent',
                                                    }}
                                                >
                                                    <Text style={{
                                                        fontWeight: '700',
                                                        fontSize: 11,
                                                        letterSpacing: 0.5,
                                                        textTransform: 'capitalize',
                                                        color: active ? '#3D9B35' : '#8E8E93',
                                                    }}>{p}</Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            </View>

                            {/* ── CATEGORIES ASSIGNMENT ── */}
                            <View className="bg-card rounded-t-3xl p-5 h-full">
                                <View className="flex-row items-center justify-between mb-4 px-1">
                                    <Text className="text-xl" style={{ fontFamily: "Handjet_700Bold" }}>Category Limits</Text>
                                    <Pressable
                                        onPress={() => setShowCategorySelector(!showCategorySelector)}
                                        className="flex-row items-center bg-[#E8F3EA] px-3 py-1.5 rounded-full active:opacity-70"
                                    >
                                        <Plus size={14} color="#3D9B35" strokeWidth={3} />
                                        <Text className="text-[#3D9B35] text-[11px] font-bold ml-1">Assign</Text>
                                    </Pressable>
                                </View>

                                {showCategorySelector && (
                                    <View className="bg-white p-4 rounded-[20px] shadow-sm border border-gray-100 mb-4">
                                        <Text className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">Select Category</Text>
                                        <View className="flex-row flex-wrap gap-2">
                                            {categories.map(c => {
                                                const Icon = getSafeIcon(c.icon);
                                                const isSelected = selectedCategories.some(sc => sc.category_id === c.id);
                                                return (
                                                    <Pressable
                                                        key={c.id}
                                                        onPress={() => !isSelected && addCategory(c)}
                                                        className={`flex-row items-center px-3 py-2.5 rounded-[12px] border ${isSelected ? 'border-transparent bg-[#F7F7F7] opacity-50' : 'border-gray-100 bg-white active:bg-gray-50'}`}
                                                    >
                                                        <Icon size={14} color={c.color || '#666'} />
                                                        <Text className="text-[13px] font-semibold text-foreground ml-2">{c.name}</Text>
                                                    </Pressable>
                                                );
                                            })}
                                        </View>
                                    </View>
                                )}

                                {selectedCategories.map(sc => {
                                    const Icon = getSafeIcon(sc.icon);
                                    // Show the auto-computed default as placeholder
                                    const autoPlaceholder = defaultCategoryLimit > 0
                                        ? `Default: Rp ${defaultCategoryLimit.toLocaleString('id-ID')}`
                                        : 'Set limit (optional)';
                                    return (
                                        <View key={sc.category_id} className="bg-white p-3.5 rounded-[20px] shadow-sm border border-gray-100 mb-3 flex-row items-center">
                                            <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${sc.color || '#999'}15` }}>
                                                <Icon size={18} color={sc.color || '#999'} />
                                            </View>
                                            <View className="flex-1">
                                                <View className="flex-row items-center mb-1">
                                                    <Text className="text-[13px] font-bold text-foreground">{sc.name}</Text>
                                                    {!sc.isManual && defaultCategoryLimit > 0 && (
                                                        <View className="ml-2 px-1.5 py-0.5 bg-[#E8F3EA] rounded-full">
                                                            <Text style={{ fontSize: 9, fontWeight: '700', color: '#3D9B35', letterSpacing: 0.3 }}>AUTO</Text>
                                                        </View>
                                                    )}
                                                </View>
                                                <TextInput
                                                    value={sc.limit_amount}
                                                    onChangeText={(text) => {
                                                        const num = text.replace(/[^0-9]/g, '');
                                                        updateCategoryLimit(sc.category_id, num ? parseInt(num).toLocaleString('id-ID') : '');
                                                    }}
                                                    keyboardType="numeric"
                                                    placeholder={autoPlaceholder}
                                                    placeholderTextColor={defaultCategoryLimit > 0 ? '#3D9B35' : '#A1A1AA'}
                                                    className="text-[13px] text-foreground font-semibold"
                                                />
                                            </View>
                                            <Pressable onPress={() => removeCategory(sc.category_id)} className="w-8 h-8 items-center justify-center bg-[#FFF0F0] rounded-full active:opacity-70">
                                                <Trash2 size={14} color="#FF3B30" />
                                            </Pressable>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>

            </SafeAreaView>
            
            {modalState && (
                <ConfirmModal
                    visible={!!modalState}
                    {...modalState}
                />
            )}
        </View>
    );
}
