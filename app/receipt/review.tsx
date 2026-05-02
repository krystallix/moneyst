import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth/AuthContext";
import { analyzeReceiptLocally, insertTransactionSplits, resolveOrCreateMerchant, uploadReceiptImage } from "@/lib/receipt/scan";
import { getAccounts, updateAccount } from "@/lib/supabase/accounts";
import { getCategories } from "@/lib/supabase/categories";
import { addTransaction } from "@/lib/supabase/transactions";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Icons from "lucide-react-native";
import {
    AlertCircle,
    Check,
    ChevronLeft,
    HelpCircle,
    Loader,
    MapPin,
    Plus,
    Receipt,
    StickyNote,
    Store,
    Trash2,
    X
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ─── helpers ────────────────────────────────────────────────────────────────

function getSafeIcon(name: string | null | undefined) {
    if (!name) return HelpCircle;
    return (Icons as any)[name] ?? HelpCircle;
}

function fmtIDR(n: number | null | undefined) {
    if (n == null) return "-";
    return new Intl.NumberFormat("id-ID").format(n);
}

type Split = {
    id: string;
    category_id: string;
    category_name: string;
    category_icon: string | null;
    category_color: string | null;
    amount: string;
    description: string;
};

const getLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

// ─── Loading overlay ────────────────────────────────────────────────────────

function ScanningOverlay({ step }: { step: "uploading" | "analyzing" }) {
    const spinAnim = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.loop(
            Animated.timing(spinAnim, { toValue: 1, duration: 1200, easing: Easing.linear, useNativeDriver: true })
        ).start();
    }, []);
    const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
    return (
        <View style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 99, alignItems: "center", justifyContent: "center" }}>
            <View style={{ backgroundColor: "#fff", borderRadius: 24, padding: 32, alignItems: "center", width: 260 }}>
                <Animated.View style={{ transform: [{ rotate }], marginBottom: 16 }}>
                    <Loader size={36} color="#3D9B35" strokeWidth={2} />
                </Animated.View>
                <Text style={{ fontWeight: "700", fontSize: 16, color: "#111", marginBottom: 6 }}>
                    {step === "uploading" ? "Uploading Receipt..." : "Analyzing with AI..."}
                </Text>
                <Text style={{ fontSize: 13, color: "#8E8E93", textAlign: "center" }}>
                    {step === "uploading"
                        ? "Saving your receipt to storage"
                        : "Extracting merchant, date, and total"}
                </Text>
            </View>
        </View>
    );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ReceiptReviewScreen() {
    const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    // Scan state
    const [scanStep, setScanStep] = useState<"uploading" | "analyzing" | null>("uploading");
    const [scanError, setScanError] = useState<string | null>(null);
    const [receiptUrl, setReceiptUrl] = useState<string | null>(null);
    const [alertMsg, setAlertMsg] = useState<{ title: string, description: string, onSuccess?: () => void } | null>(null);

    // Extracted fields (editable)
    const [merchantName, setMerchantName] = useState("");
    const [date, setDate] = useState(getLocalYMD(new Date()));
    const [time, setTime] = useState("");
    const [totalAmount, setTotalAmount] = useState("");
    const [location, setLocation] = useState("");
    const [notes, setNotes] = useState("");

    // Account + category
    const [accounts, setAccounts] = useState<any[]>([]);
    const [allCategories, setAllCategories] = useState<any[]>([]);
    const [accountId, setAccountId] = useState("");

    // Split mode
    const [splitMode, setSplitMode] = useState(false);
    const [splits, setSplits] = useState<Split[]>([]);
    const [singleCategoryId, setSingleCategoryId] = useState("");

    // Category picker
    const [showCategoryPicker, setShowCategoryPicker] = useState<"single" | string | null>(null);

    // Save state
    const [isSaving, setIsSaving] = useState(false);

    // ── Load categories & Analyze ───────────────────────────────────────────
    useEffect(() => {
        if (!imageUri || !user) return;
        (async () => {
            try {
                // 1. First fetch categories and accounts
                setScanStep("analyzing"); // Starting with analysis now
                const [accs, cats] = await Promise.all([getAccounts(user.id), getCategories(user.id)]);

                setAccounts(accs ?? []);
                const expenseCats = (cats ?? []).filter((c: any) => c.type === "expense");
                setAllCategories(expenseCats);
                if (accs?.length) setAccountId(accs[0].id);

                // 2. Analyze locally with category hints
                const analysis = await analyzeReceiptLocally(imageUri, expenseCats);

                setMerchantName(analysis.merchant_name ?? "");
                setDate(analysis.date ?? getLocalYMD(new Date()));
                setTime(analysis.time ?? "");
                setTotalAmount(analysis.total_amount != null ? String(analysis.total_amount) : "");
                setLocation(analysis.location ?? "");
                setNotes(analysis.notes ?? "");

                // Handle suggested splits
                if (analysis.suggested_splits && analysis.suggested_splits.length > 0) {
                    setSplitMode(true);
                    setSplits(analysis.suggested_splits.map(s => {
                        const cat = cats.find(c => c.id === s.category_id);
                        return {
                            id: Math.random().toString(36).slice(2),
                            category_id: s.category_id,
                            category_name: s.category_name,
                            category_icon: cat?.icon ?? null,
                            category_color: cat?.color ?? null,
                            amount: String(s.amount),
                            description: s.reason || "",
                        };
                    }));
                }

                setScanStep(null);
            } catch (err: any) {
                console.error("Receipt scan error:", err);
                setScanError(err?.message ?? "Failed to analyze receipt");
                setScanStep(null);
            }
        })();
    }, [imageUri, user]);

    // ── Splits helpers ───────────────────────────────────────────────────────
    const addSplit = (cat: any) => {
        setSplits(prev => [...prev, {
            id: Math.random().toString(36).slice(2),
            category_id: cat.id,
            category_name: cat.name,
            category_icon: cat.icon,
            category_color: cat.color,
            amount: "",
            description: "",
        }]);
        setShowCategoryPicker(null);
    };

    const removeSplit = (id: string) => setSplits(prev => prev.filter(s => s.id !== id));

    const updateSplit = (id: string, field: "amount" | "description", val: string) => {
        setSplits(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    };

    const splitsTotal = splits.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const totalNum = parseFloat(totalAmount) || 0;
    const splitsMatch = Math.abs(splitsTotal - totalNum) < 0.01;

    // ── Save ─────────────────────────────────────────────────────────────────
    const handleSave = async () => {
        if (!user || !accountId || !totalNum) return;
        if (!splitMode && !singleCategoryId) {
            setAlertMsg({ title: "Missing Category", description: "Please select a category for this transaction." });
            return;
        }
        if (splitMode && splits.length === 0) {
            setAlertMsg({ title: "No Splits", description: "Add at least one split, or switch to single category mode." });
            return;
        }
        if (splitMode && !splitsMatch) {
            setAlertMsg({ title: "Split Mismatch", description: `Split total (Rp ${fmtIDR(splitsTotal)}) must equal transaction amount (Rp ${fmtIDR(totalNum)}).` });
            return;
        }

        setIsSaving(true);
        try {
            // 1. Upload receipt image ONLY NOW when saving
            setScanStep("uploading");
            const uploadedUrl = await uploadReceiptImage(user.id, imageUri as string);
            setReceiptUrl(uploadedUrl);

            // 2. Resolve merchant
            const merchantId = merchantName.trim()
                ? await resolveOrCreateMerchant(user.id, merchantName.trim())
                : null;

            // 3. Add transaction
            const tx = await addTransaction({
                user_id: user.id,
                account_id: accountId,
                category_id: splitMode ? null : singleCategoryId,
                merchant_id: merchantId,
                type: "expense",
                amount: totalNum,
                currency: "IDR",
                description: merchantName.trim() || "Receipt",
                date,
                time: time || null,
                is_transfer: false,
                is_deleted: false,
                receipt_url: uploadedUrl,
                location: location.trim() || null,
                notes: notes.trim() || null,
            });

            // 4. Update account balance
            const acc = accounts.find(a => a.id === accountId);
            if (acc) {
                await updateAccount(acc.id, {
                    current_balance: Number(acc.current_balance) - totalNum
                });
            }

            // 5. Insert splits if needed
            if (splitMode && splits.length > 0) {
                await insertTransactionSplits(splits.map(s => ({
                    transaction_id: tx.id,
                    category_id: s.category_id,
                    amount: parseFloat(s.amount),
                    description: s.description.trim() || undefined,
                })));
            }

            setScanStep(null);
            setAlertMsg({
                title: "✓ Transaction Saved",
                description: `Rp ${fmtIDR(totalNum)} from ${merchantName || "receipt"}\nID: ${tx.id.slice(0, 8)}...`,
                onSuccess: () => router.replace("/(tabs)/home")
            });
        } catch (err: any) {
            console.error("Save error:", err);
            setScanStep(null);
            setAlertMsg({ title: "Save Failed", description: err?.message ?? "Something went wrong. Please try again." });
        } finally {
            setIsSaving(false);
        }
    };

    const canSave = !!accountId && !!totalNum && !isSaving &&
        (splitMode ? splits.length > 0 && splitsMatch : !!singleCategoryId);

    const expenseCategories = allCategories;

    // ── Category picker modal inline ─────────────────────────────────────────
    const renderCategoryPicker = (mode: "single" | string) => (
        <View className="bg-white rounded-[20px] border border-gray-100 shadow-sm p-4 mb-4">
            <View className="flex-row items-center justify-between mb-3">
                <Text className="text-[12px] font-bold text-muted-foreground uppercase tracking-wider">
                    Select Category
                </Text>
                <Pressable onPress={() => setShowCategoryPicker(null)}>
                    <X size={16} color="#8E8E93" />
                </Pressable>
            </View>
            <View className="flex-row flex-wrap gap-2">
                {expenseCategories.map(cat => {
                    const Icon = getSafeIcon(cat.icon);
                    return (
                        <Pressable
                            key={cat.id}
                            onPress={() => mode === "single" ? (setSingleCategoryId(cat.id), setShowCategoryPicker(null)) : addSplit(cat)}
                            className="flex-row items-center px-3 py-2 rounded-xl border border-gray-100 bg-white active:bg-gray-50"
                        >
                            <Icon size={13} color={cat.color || "#666"} />
                            <Text className="text-[13px] font-semibold text-foreground ml-1.5">{cat.name}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />

            {scanStep && <ScanningOverlay step={scanStep} />}

            <SafeAreaView className="flex-1" edges={["top"]}>
                {/* Header */}
                <View className="px-6 pt-5 pb-3 flex-row items-center justify-center relative">
                    <View className="absolute left-6">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-xl items-center justify-center border border-border active:opacity-70"
                        >
                            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-3xl">
                        Receipt
                    </Text>
                    <View className="absolute right-6">
                        <Pressable
                            onPress={handleSave}
                            disabled={!canSave}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${canSave ? "bg-primary active:opacity-70" : "bg-muted"}`}
                        >
                            {isSaving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Check size={18} color={canSave ? "#fff" : "#9ca3af"} strokeWidth={2.5} />}
                        </Pressable>
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : undefined}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 32, 80) }}
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Receipt Image + Total ── */}
                        <View className="items-center mt-4 mb-6 px-6">
                            {(receiptUrl || imageUri) ? (
                                <View style={{ width: 140, height: 190, borderRadius: 16, overflow: "hidden", marginBottom: 16 }}>
                                    <Image
                                        source={{ uri: (receiptUrl ?? imageUri) as string }}
                                        style={{ width: "100%", height: "100%" }}
                                        resizeMode="cover"
                                    />
                                </View>
                            ) : (
                                <View className="w-[140px] h-[190px] rounded-2xl bg-gray-100 items-center justify-center mb-4">
                                    <Receipt size={40} color="#D1D5DB" strokeWidth={1.5} />
                                </View>
                            )}

                            {scanError && (
                                <View className="flex-row items-center bg-red-50 border border-red-100 rounded-2xl px-4 py-3 mb-4">
                                    <AlertCircle size={16} color="#E53935" className="mr-2" />
                                    <Text className="text-red-600 text-[13px] font-medium ml-2 flex-1">{scanError}</Text>
                                </View>
                            )}

                            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Total Amount</Text>
                            <View className="flex-row items-center">
                                <Text className="text-2xl font-bold text-[#3D9B35] mr-1 pt-1">Rp</Text>
                                <TextInput
                                    value={totalAmount}
                                    onChangeText={t => setTotalAmount(t.replace(/[^0-9.]/g, ""))}
                                    keyboardType="numeric"
                                    placeholder="0"
                                    placeholderTextColor="#A1A1AA"
                                    className="font-bold text-[#3D9B35] tracking-tighter"
                                    style={{ fontSize: 52, minWidth: 80, textAlign: "center", height: 80 }}
                                />
                            </View>
                        </View>

                        <View className="px-5">
                            {/* ── Details Card ── */}
                            <View className="bg-card rounded-[24px] border border-gray-100 shadow-sm mb-5">
                                {/* Merchant */}
                                <View className="px-5 py-4 border-b border-gray-100 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <Store size={15} color="#8E8E93" />
                                    </View>
                                    <TextInput
                                        value={merchantName}
                                        onChangeText={setMerchantName}
                                        placeholder="Merchant name"
                                        placeholderTextColor="#C7C7CC"
                                        className="flex-1 text-[15px] text-foreground font-semibold"
                                    />
                                </View>

                                {/* Date */}
                                <View className="px-5 py-4 border-b border-gray-100 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <Icons.CalendarDays size={15} color="#8E8E93" />
                                    </View>
                                    <TextInput
                                        value={date}
                                        onChangeText={setDate}
                                        placeholder="YYYY-MM-DD"
                                        placeholderTextColor="#C7C7CC"
                                        className="flex-1 text-[15px] text-foreground font-semibold"
                                    />
                                </View>

                                {/* Location */}
                                <View className="px-5 py-4 border-b border-gray-100 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <MapPin size={15} color="#8E8E93" />
                                    </View>
                                    <TextInput
                                        value={location}
                                        onChangeText={setLocation}
                                        placeholder="Location (optional)"
                                        placeholderTextColor="#C7C7CC"
                                        className="flex-1 text-[15px] text-foreground font-semibold"
                                    />
                                </View>

                                {/* Notes */}
                                <View className="px-5 py-4 flex-row items-center">
                                    <View className="w-9 h-9 rounded-full bg-[#F7F7F7] items-center justify-center mr-3">
                                        <StickyNote size={15} color="#8E8E93" />
                                    </View>
                                    <TextInput
                                        value={notes}
                                        onChangeText={setNotes}
                                        placeholder="Notes (optional)"
                                        placeholderTextColor="#C7C7CC"
                                        className="flex-1 text-[15px] text-foreground font-semibold"
                                        multiline
                                    />
                                </View>
                            </View>

                            {/* ── Account Selector ── */}
                            <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3 px-1">
                                Account
                            </Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5" contentContainerStyle={{ gap: 8 }}>
                                {accounts.map(acc => {
                                    const Icon = getSafeIcon(acc.icon ?? "Wallet");
                                    const isSel = accountId === acc.id;
                                    const col = acc.color || "#3D9B35";
                                    return (
                                        <Pressable
                                            key={acc.id}
                                            onPress={() => setAccountId(acc.id)}
                                            style={{
                                                flexDirection: "row", alignItems: "center", gap: 7,
                                                paddingVertical: 8, paddingHorizontal: 12, borderRadius: 20, minHeight: 38,
                                                backgroundColor: isSel ? col : "#F3F4F6",
                                            }}
                                        >
                                            <Icon size={13} color={isSel ? "#fff" : col} strokeWidth={2} />
                                            <Text style={{ fontSize: 13, fontWeight: "700", color: isSel ? "#fff" : "#111" }}>
                                                {acc.name}
                                            </Text>
                                        </Pressable>
                                    );
                                })}
                            </ScrollView>

                            {/* ── Category / Splits ── */}
                            <View className="flex-row items-center justify-between mb-3 px-1">
                                <Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                                    Category
                                </Text>
                                <Pressable
                                    onPress={() => { setSplitMode(m => !m); setShowCategoryPicker(null); }}
                                    className="flex-row items-center bg-[#F7F7F7] px-3 py-1.5 rounded-full active:opacity-70"
                                >
                                    <Text className="text-[11px] font-bold text-[#8E8E93]">
                                        {splitMode ? "Single Category" : "Split"}
                                    </Text>
                                </Pressable>
                            </View>

                            {/* Single category mode */}
                            {!splitMode && (
                                <>
                                    {showCategoryPicker === "single" && renderCategoryPicker("single")}
                                    {singleCategoryId ? (() => {
                                        const cat = allCategories.find(c => c.id === singleCategoryId);
                                        if (!cat) return null;
                                        const Icon = getSafeIcon(cat.icon);
                                        return (
                                            <Pressable
                                                onPress={() => setShowCategoryPicker("single")}
                                                className="flex-row items-center bg-white border border-gray-100 rounded-[20px] p-4 mb-4 shadow-sm active:opacity-70"
                                            >
                                                <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${cat.color || "#999"}18` }}>
                                                    <Icon size={18} color={cat.color || "#999"} />
                                                </View>
                                                <Text className="flex-1 text-[14px] font-bold text-foreground">{cat.name}</Text>
                                                <Icons.ChevronRight size={16} color="#C7C7CC" />
                                            </Pressable>
                                        );
                                    })() : (
                                        <Pressable
                                            onPress={() => setShowCategoryPicker("single")}
                                            className="flex-row items-center bg-white border border-dashed border-gray-200 rounded-[20px] p-4 mb-4 active:opacity-70"
                                        >
                                            <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-[#F7F7F7]">
                                                <Plus size={18} color="#C7C7CC" />
                                            </View>
                                            <Text className="text-[14px] font-semibold text-muted-foreground">Select Category</Text>
                                        </Pressable>
                                    )}
                                </>
                            )}

                            {/* Split mode */}
                            {splitMode && (
                                <>
                                    {/* Split total badge */}
                                    {splits.length > 0 && (
                                        <View className={`flex-row items-center px-4 py-2.5 rounded-xl mb-3 ${splitsMatch ? "bg-[#E8F3EA]" : "bg-orange-50 border border-orange-100"}`}>
                                            {splitsMatch
                                                ? <Check size={14} color="#3D9B35" />
                                                : <AlertCircle size={14} color="#F97316" />}
                                            <Text className={`ml-2 text-[12px] font-bold ${splitsMatch ? "text-[#3D9B35]" : "text-orange-500"}`}>
                                                Rp {fmtIDR(splitsTotal)} / Rp {fmtIDR(totalNum)}
                                                {!splitsMatch && ` (${splitsTotal < totalNum ? "short" : "over"} by Rp ${fmtIDR(Math.abs(totalNum - splitsTotal))})`}
                                            </Text>
                                        </View>
                                    )}

                                    {showCategoryPicker === "add" && renderCategoryPicker("add")}

                                    {splits.map(s => {
                                        const Icon = getSafeIcon(s.category_icon);
                                        return (
                                            <View key={s.id} className="bg-white border border-gray-100 rounded-[20px] p-4 mb-3 shadow-sm">
                                                <View className="flex-row items-center mb-3">
                                                    <View className="w-9 h-9 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${s.category_color || "#999"}18` }}>
                                                        <Icon size={16} color={s.category_color || "#999"} />
                                                    </View>
                                                    <Text className="flex-1 text-[13px] font-bold text-foreground">{s.category_name}</Text>
                                                    <Pressable onPress={() => removeSplit(s.id)} className="w-7 h-7 bg-red-50 rounded-full items-center justify-center">
                                                        <Trash2 size={12} color="#FF3B30" />
                                                    </Pressable>
                                                </View>
                                                <View className="flex-row gap-2">
                                                    <View className="flex-1 bg-[#F7F7F7] rounded-xl px-3 py-2.5 flex-row items-center">
                                                        <Text className="text-[13px] font-semibold text-[#8E8E93] mr-1">Rp</Text>
                                                        <TextInput
                                                            value={s.amount}
                                                            onChangeText={v => updateSplit(s.id, "amount", v.replace(/[^0-9.]/g, ""))}
                                                            keyboardType="numeric"
                                                            placeholder="Amount"
                                                            placeholderTextColor="#C7C7CC"
                                                            className="flex-1 text-[13px] font-semibold text-foreground"
                                                        />
                                                    </View>
                                                    <View className="flex-[1.4] bg-[#F7F7F7] rounded-xl px-3 py-2.5">
                                                        <TextInput
                                                            value={s.description}
                                                            onChangeText={v => updateSplit(s.id, "description", v)}
                                                            placeholder="Label (optional)"
                                                            placeholderTextColor="#C7C7CC"
                                                            className="text-[13px] font-semibold text-foreground"
                                                        />
                                                    </View>
                                                </View>
                                            </View>
                                        );
                                    })}

                                    <Pressable
                                        onPress={() => setShowCategoryPicker("add")}
                                        className="flex-row items-center bg-white border border-dashed border-gray-200 rounded-[20px] p-4 mb-4 active:opacity-70"
                                    >
                                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3 bg-[#F7F7F7]">
                                            <Plus size={18} color="#C7C7CC" />
                                        </View>
                                        <Text className="text-[14px] font-semibold text-muted-foreground">Add Split</Text>
                                    </Pressable>
                                </>
                            )}
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
            <ConfirmModal
                visible={!!alertMsg}
                title={alertMsg?.title ?? ""}
                description={alertMsg?.description ?? ""}
                confirmText="OK"
                singleButton={true}
                onConfirm={() => {
                    const cb = alertMsg?.onSuccess;
                    setAlertMsg(null);
                    if (cb) cb();
                }}
            />
        </View>
    );
}
