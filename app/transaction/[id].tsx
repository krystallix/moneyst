import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getAccounts } from "@/lib/supabase/accounts";
import { Category, getCategories } from "@/lib/supabase/categories";
import { deleteTransaction, getTransactionById, updateTransaction } from "@/lib/supabase/transactions";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Icons from "lucide-react-native";
import { Check, ChevronLeft } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";

import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ─── helpers ─────────────────────────────────────────────────────────────────
function getSafeIcon(iconName: string | undefined | null) {
    if (!iconName) return Icons.CircleDashed;
    const Icon = (Icons as any)[iconName];
    return Icon ?? Icons.CircleDashed;
}

function buildLocalDate(tz: string): Date {
    try {
        const fmt = new Intl.DateTimeFormat("en-US", {
            timeZone: tz,
            year: "numeric", month: "numeric", day: "numeric",
            hour: "numeric", minute: "numeric", second: "numeric",
            hour12: false,
        });
        const parts = fmt.formatToParts(new Date());
        let y = 0, m = 0, d = 0, H = 0, M = 0, S = 0;
        for (const p of parts) {
            if (p.type === "year") y = +p.value;
            if (p.type === "month") m = +p.value;
            if (p.type === "day") d = +p.value;
            if (p.type === "hour") H = +p.value;
            if (p.type === "minute") M = +p.value;
            if (p.type === "second") S = +p.value;
        }
        if (y > 0) return new Date(y, m - 1, d, H, M, S);
    } catch (_) { }
    return new Date();
}

// ─── main ─────────────────────────────────────────────────────────────────────
export default function EditScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const passedDate = params?.date as string | undefined;
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [profile, setProfile] = useState<any>(null);
    const [type, setType] = useState<"expense" | "income">("expense");
    const [amountStr, setAmountStr] = useState("0");
    const [notes, setNotes] = useState("");
    const [categoryId, setCategoryId] = useState<string>("");
    const [accountId, setAccountId] = useState<string>("");
    const [categories, setCategories] = useState<Category[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [catSheetOpen, setCatSheetOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const handleDeleteConfirm = async () => {
        try {
            setDeleting(true);
            setShowConfirmDelete(false);
            await deleteTransaction(params.id as string);
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not delete transaction.");
            setDeleting(false);
        }
    };

    // Parse passedDate into a Date object
    const initDate = (() => {
        if (passedDate && /^\d{4}-\d{2}-\d{2}$/.test(passedDate)) {
            const [y, m, d] = passedDate.split("-").map(Number);
            return new Date(y, m - 1, d);
        }
        return new Date();
    })();
    const [selectedDate, setSelectedDate] = useState<Date>(initDate);



    const scaleAnim = useRef(new Animated.Value(1)).current;
    const typeAnim = useRef(new Animated.Value(0)).current;

    // ── init ──────────────────────────────────────────────────────────────────
    useEffect(() => {
        if (!user) return;
        (async () => {
            try {
                const { data } = await checkProfile(user);
                if (data) setProfile(data);
                const cats = await getCategories(user.id);
                setCategories(cats);
                const accs = await getAccounts(user.id);
                setAccounts(accs);

                const txId = params.id as string;
                if (txId) {
                    const tx = await getTransactionById(txId);
                    if (tx) {
                        setType(tx.type as "expense" | "income");
                        typeAnim.setValue(tx.type === "income" ? 1 : 0);
                        setAmountStr(String(tx.amount));
                        setNotes(tx.description || "");
                        setCategoryId(tx.category_id);
                        setAccountId(tx.account_id);
                        if (tx.date) setSelectedDate(new Date(tx.date));
                    }
                } else if (accs.length > 0) {
                    setAccountId(accs[0].id);
                }
            } catch (err) {
                console.error("Init error:", err);
            } finally {
                setLoading(false);
            }
        })();
    }, [user, params.id, typeAnim]);

    // ── type switch ───────────────────────────────────────────────────────────
    const switchType = useCallback((next: "expense" | "income") => {
        if (next === type) return;
        Animated.spring(typeAnim, {
            toValue: next === "income" ? 1 : 0,
            useNativeDriver: false,
            stiffness: 260,
            damping: 24,
            mass: 1,
        }).start();
        setType(next);
        setCategoryId("");
        setAmountStr("0");
    }, [type, typeAnim]);

    // ── keypad ────────────────────────────────────────────────────────────────
    const handleKeypad = useCallback((val: string) => {
        scaleAnim.setValue(0.97);
        Animated.spring(scaleAnim, {
            toValue: 1, useNativeDriver: true, stiffness: 400, damping: 25, mass: 1
        }).start();

        if (val === "DEL") {
            setAmountStr(prev => prev.length > 1 ? prev.slice(0, -1) : "0");
        } else if (val === ".") {
            setAmountStr(prev => prev.includes(".") ? prev : prev + ".");
        } else {
            setAmountStr(prev => {
                if (prev === "0") return val;
                if (prev.replace(".", "").length >= 12) return prev;
                return prev + val;
            });
        }
    }, [scaleAnim]);

    // ── save ──────────────────────────────────────────────────────────────────
    const handleSave = useCallback(async () => {
        if (amountStr === "0" || !categoryId || !user || submitting) return;
        setSubmitting(true);
        try {
            const amnt = parseFloat(amountStr);
            const currency = profile?.preferred_currency ?? "IDR";
            const tz = profile?.timezone ?? "Asia/Jakarta";
            const localDate = buildLocalDate(tz);
            const pad = (n: number) => String(n).padStart(2, "0");
            // Use selectedDate (from picker) as the date
            const sd = selectedDate;
            const dateStr = `${sd.getFullYear()}-${pad(sd.getMonth() + 1)}-${pad(sd.getDate())}`;

            const timeStr = `${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;

            if (!accountId) {
                console.error("No account selected");
                setSubmitting(false);
                return;
            }

            const payload = {
                account_id: accountId,
                type,
                amount: amnt,
                currency,
                description: notes.trim(),
                category_id: categoryId,
                date: dateStr,
                time: timeStr,
            };
            console.log("Updating transaction payload:", payload);
            const res = await updateTransaction(params.id as string, payload);
            console.log("Update transaction result:", res);

            setSaved(true);
            setTimeout(() => {
                setAmountStr("0");
                setCategoryId("");
                setNotes("");
                setSaved(false);
                router.replace(`/(tabs)/transactions?date=${dateStr}`);
            }, 700);
        } catch (error) {
            console.error("Save error", error);
            setSubmitting(false);
        }
    }, [amountStr, categoryId, accountId, selectedDate, user, submitting, profile, type, notes, router, accounts, params.id]);

    // ── derived ───────────────────────────────────────────────────────────────
    const isExpense = type === "expense";
    const typeColor = isExpense ? "#FF3B30" : "#34C759";
    const filteredCats = categories.filter(c => c.type === type);
    const currencySym = profile?.preferred_currency ?? "IDR";
    const canSave = amountStr !== "0" && !!categoryId && !!accountId && !submitting && !saved;

    const [intPart, decPart] = amountStr.split(".");
    const formattedInt = parseInt(intPart || "0", 10).toLocaleString("en-US");
    const displayAmount = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
    const pillLeft = typeAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "50%"] });

    const keyRows = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        [".", "0", "DEL"],
    ];

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

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
                        Edit Transaction
                    </Text>
                    <View className="absolute right-6">
                        <Pressable
                            onPress={handleSave}
                            disabled={!canSave}
                            className={`w-10 h-10 rounded-xl items-center justify-center ${saved ? 'bg-green-500' : canSave ? 'bg-primary active:opacity-70' : 'bg-muted'
                                }`}
                        >
                            {submitting
                                ? <ActivityIndicator size="small" color="#fff" />
                                : saved
                                    ? <Check size={18} color="#fff" strokeWidth={3} />
                                    : <Check size={18} color={canSave ? "#fff" : "#9ca3af"} strokeWidth={2.5} />}
                        </Pressable>
                    </View>
                </View>

                {/* ── TYPE TOGGLE ── */}
                <View className="px-5 mb-6">
                    <View className="flex-row bg-[#E3E3E8] rounded-[14px] p-[3px] relative">
                        <Animated.View style={{
                            position: "absolute",
                            top: 3, left: pillLeft,
                            width: "48%", bottom: 3,
                            backgroundColor: "#FFFFFF",
                            borderRadius: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                        }} />
                        <TouchableOpacity
                            onPress={() => switchType("expense")}
                            activeOpacity={0.8}
                            className="flex-1 py-2.5 items-center flex-row justify-center gap-1.5"
                        >
                            <Text className={`font-semibold text-sm ${isExpense ? 'text-[#000000]' : 'text-[#8E8E93]'}`}>
                                Expense
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => switchType("income")}
                            activeOpacity={0.8}
                            className="flex-1 py-2.5 items-center flex-row justify-center gap-1.5"
                        >
                            <Text className={`font-semibold text-sm ${!isExpense ? 'text-[#000000]' : 'text-[#8E8E93]'}`}>
                                Income
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* ── AMOUNT DISPLAY ── */}
                <View className="flex-1 justify-center items-center px-5">
                    <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="items-center">
                        <Text className="text-muted-foreground text-sm font-semibold uppercase mb-2 tracking-wider">
                            Amount
                        </Text>
                        <View className="flex-row items-start justify-center">
                            <Text className="text-[28px] font-semibold mt-2 mr-1" style={{ color: typeColor }}>
                                {currencySym}
                            </Text>
                            <Text
                                className="font-bold tracking-tighter"
                                style={{
                                    fontSize: displayAmount.length > 8 ? 56 : 72,
                                    color: typeColor,
                                }}
                                adjustsFontSizeToFit
                                numberOfLines={1}
                            >
                                {displayAmount}
                            </Text>
                        </View>
                    </Animated.View>
                </View>

                {/* ── CONTROLS & KEYPAD CONTAINER ── */}
                <View
                    className="bg-card rounded-t-[36px] pt-6 shadow-sm elevation-5"
                    style={{ paddingBottom: Math.max(insets.bottom + 20, 32) }}
                >

                    {/* DATE & NOTES ROW */}
                    <View className="mb-4 px-5 flex-row gap-2.5">
                        {/* DATE */}
                        <View>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                activeOpacity={0.7}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 6,
                                    height: 42,
                                    paddingHorizontal: 12,
                                    borderRadius: 14,
                                    backgroundColor: isExpense ? "rgba(255, 59, 48, 0.08)" : "rgba(52, 199, 89, 0.08)",
                                    borderWidth: 1.5,
                                    borderColor: isExpense ? "rgba(255, 59, 48, 0.15)" : "rgba(52, 199, 89, 0.15)",
                                }}
                            >
                                <Icons.CalendarDays size={15} color={typeColor} strokeWidth={2.5} />
                                <Text style={{ fontSize: 13, fontWeight: "700", color: typeColor }}>
                                    {(() => {
                                        const today = new Date();
                                        const isToday =
                                            selectedDate.getFullYear() === today.getFullYear() &&
                                            selectedDate.getMonth() === today.getMonth() &&
                                            selectedDate.getDate() === today.getDate();
                                        const yesterday = new Date(today);
                                        yesterday.setDate(today.getDate() - 1);
                                        const isYesterday =
                                            selectedDate.getFullYear() === yesterday.getFullYear() &&
                                            selectedDate.getMonth() === yesterday.getMonth() &&
                                            selectedDate.getDate() === yesterday.getDate();

                                        if (isToday) return "Today";
                                        if (isYesterday) return "Yesterday";
                                        return selectedDate.toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            ...(selectedDate.getFullYear() !== today.getFullYear() && { year: "numeric" })
                                        });
                                    })()}
                                </Text>
                            </TouchableOpacity>
                            <CustomDatePicker
                                visible={showDatePicker}
                                date={selectedDate}
                                maximumDate={new Date()}
                                onClose={() => setShowDatePicker(false)}
                                onSelect={(date) => {
                                    setShowDatePicker(false);
                                    setSelectedDate(date);
                                }}
                            />
                        </View>

                        {/* NOTES */}
                        <View className="flex-1 bg-muted rounded-[14px] px-3 flex-row items-center gap-2">
                            <Icons.AlignLeft size={15} color="#9ca3af" />
                            <TextInput
                                value={notes}
                                onChangeText={setNotes}
                                placeholder="Add a note..."
                                placeholderTextColor="#9ca3af"
                                maxLength={100}
                                returnKeyType="done"
                                className="flex-1 text-[14px] text-foreground font-medium p-0"
                                style={{ height: 42 }}
                            />
                            {notes.length > 0 && (
                                <TouchableOpacity onPress={() => setNotes("")} activeOpacity={0.6} style={{ padding: 4 }}>
                                    <Icons.XCircle size={15} color="#d1d5db" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* ACCOUNT SELECTOR */}
                    <View style={{ marginBottom: 14 }}>
                        {loading ? (
                            <ActivityIndicator color={typeColor} style={{ paddingVertical: 12 }} />
                        ) : accounts.length === 0 ? (
                            <Text className="text-center text-muted-foreground py-3 text-[14px]">
                                No accounts
                            </Text>
                        ) : (
                            <>
                                <Text className="px-5 text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">Account</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}
                                >
                                    {accounts.map(acc => {
                                        const Icon = getSafeIcon(acc.icon || "Wallet");
                                        const isSel = accountId === acc.id;
                                        const col = acc.color || "#111827";
                                        return (
                                            <AccountChip
                                                key={acc.id}
                                                acc={acc}
                                                Icon={Icon}
                                                isSel={isSel}
                                                col={col}
                                                onPress={() => setAccountId(acc.id)}
                                            />
                                        );
                                    })}
                                </ScrollView>
                            </>
                        )}
                    </View>

                    {/* CATEGORY SELECTOR — chip row + more drawer */}
                    <View style={{ marginBottom: 14 }}>
                        {loading ? (
                            <ActivityIndicator color={typeColor} style={{ paddingVertical: 12 }} />
                        ) : filteredCats.length === 0 ? (
                            <Text className="text-center text-muted-foreground py-3 text-[14px]">
                                No categories
                            </Text>
                        ) : (
                            <>
                                <Text className="px-5 text-[10px] font-bold text-muted-foreground mb-2 tracking-widest uppercase">Category</Text>
                                <ScrollView
                                    horizontal
                                    showsHorizontalScrollIndicator={false}
                                    contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}
                                >
                                    {/* First 4 cats as chips */}
                                    {filteredCats.slice(0, 4).map(cat => {
                                        const Icon = getSafeIcon(cat.icon);
                                        const isSel = categoryId === cat.id;
                                        const col = cat.color ?? "#8E8E93";
                                        return (
                                            <CategoryChip
                                                key={cat.id}
                                                cat={cat}
                                                Icon={Icon}
                                                isSel={isSel}
                                                col={col}
                                                onPress={() => setCategoryId(cat.id)}
                                            />
                                        );
                                    })}

                                    {/* If selected cat is beyond first 4, show it as extra chip */}
                                    {categoryId && !filteredCats.slice(0, 4).find(c => c.id === categoryId) && (() => {
                                        const cat = filteredCats.find(c => c.id === categoryId);
                                        if (!cat) return null;
                                        const Icon = getSafeIcon(cat.icon);
                                        const col = cat.color ?? "#8E8E93";
                                        return (
                                            <CategoryChip
                                                key={cat.id}
                                                cat={cat}
                                                Icon={Icon}
                                                isSel={true}
                                                col={col}
                                                onPress={() => setCategoryId(cat.id)}
                                            />
                                        );
                                    })()}

                                    {/* More button */}
                                    {filteredCats.length > 4 && (
                                        <TouchableOpacity
                                            onPress={() => setCatSheetOpen(true)}
                                            activeOpacity={0.7}
                                            style={{
                                                flexDirection: "row",
                                                alignItems: "center",
                                                gap: 4,
                                                paddingVertical: 7,
                                                paddingHorizontal: 11,
                                                borderRadius: 18,
                                                minHeight: 36,
                                                borderWidth: 1.5,
                                                borderStyle: "dashed",
                                                borderColor: "#D1D5DB",
                                                backgroundColor: "#F9FAFB",
                                            }}
                                        >
                                            <Icons.LayoutGrid size={12} color="#6B7280" strokeWidth={2} />
                                            <Text style={{ fontSize: 12, fontWeight: "600", color: "#6B7280" }}>
                                                {filteredCats.length - 4} more
                                            </Text>
                                        </TouchableOpacity>
                                    )}
                                </ScrollView>
                            </>
                        )}
                    </View>

                    {/* CATEGORY BOTTOM SHEET */}
                    <CategoryBottomSheet
                        visible={catSheetOpen}
                        cats={filteredCats}
                        categoryId={categoryId}
                        onSelect={(id) => {
                            setCategoryId(id);
                            setCatSheetOpen(false);
                        }}
                        onClose={() => setCatSheetOpen(false)}
                        typeColor={typeColor}
                    />


                    {/* KEYPAD */}
                    <View className="px-5">
                        {keyRows.map((row, ri) => (
                            <View key={ri} className="flex-row mb-2.5 gap-3">
                                {row.map(key => (
                                    <KeyButton
                                        key={key}
                                        label={key}
                                        onPress={() => handleKeypad(key)}
                                    />
                                ))}
                            </View>
                        ))}

                        {/* DELETE BUTTON */}
                        <Pressable
                            onPress={() => setShowConfirmDelete(true)}
                            disabled={submitting || deleting}
                            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-destructive/10 active:opacity-70 mt-2 mb-2"
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#E53935" />
                            ) : (
                                <>
                                    <Icons.Trash2 size={18} color="#E53935" strokeWidth={2.5} />
                                    <Text className="text-[#E53935] font-bold text-sm">Delete Transaction</Text>
                                </>
                            )}
                        </Pressable>
                    </View>
                </View>

            </SafeAreaView>

            <ConfirmModal
                visible={showConfirmDelete}
                title="Delete Transaction"
                description="Are you sure you want to delete this transaction?"
                confirmText="Delete"
                isDestructive={true}
                loading={deleting}
                onCancel={() => setShowConfirmDelete(false)}
                onConfirm={handleDeleteConfirm}
            />
        </View>
    );
}

// ── KeyButton ─────────────────────────────────────────────────────────────────
function KeyButton({
    label,
    onPress,
}: {
    label: string;
    onPress: () => void;
}) {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.9,
            useNativeDriver: true,
            stiffness: 400,
            damping: 25,
            mass: 0.8
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1,
            useNativeDriver: true,
            stiffness: 400,
            damping: 25,
            mass: 0.8
        }).start();
    };

    const isDel = label === "DEL";

    return (
        <Animated.View style={{ flex: 1, transform: [{ scale: pressAnim }] }}>
            <Pressable
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                className="items-center justify-center py-4 rounded-[16px] active:bg-border"
                style={({ pressed }) => ({
                    backgroundColor: pressed ? "#D1D1D6" : "#F2F2F7",
                })}
            >
                {isDel ? (
                    <Icons.Delete size={26} color="#111827" strokeWidth={1.5} />
                ) : (
                    <Text className="text-[26px] font-medium text-[#000000]">
                        {label}
                    </Text>
                )}
            </Pressable>
        </Animated.View>
    );
}

// ── AccountChip ───────────────────────────────────────────────────────────────
function AccountChip({
    acc,
    Icon,
    isSel,
    col,
    onPress,
}: {
    acc: any;
    Icon: any;
    isSel: boolean;
    col: string;
    onPress: () => void;
}) {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.93, useNativeDriver: true, stiffness: 400, damping: 25, mass: 0.8
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1, useNativeDriver: true, stiffness: 400, damping: 25, mass: 0.8
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 18,
                    minHeight: 36,
                    backgroundColor: isSel ? col : "#F3F4F6",
                    shadowColor: isSel ? col : "transparent",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSel ? 0.35 : 0,
                    shadowRadius: 10,
                    elevation: isSel ? 5 : 0,
                }}
            >
                <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: isSel ? "rgba(255,255,255,0.25)" : `${col}20`,
                    alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={11} color={isSel ? "#FFFFFF" : col} strokeWidth={2} />
                </View>
                <Text style={{
                    fontSize: 12,
                    fontWeight: isSel ? "700" : "600",
                    color: isSel ? "#FFFFFF" : "#111827",
                }}>
                    {acc.name}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── CategoryTile ──────────────────────────────────────────────────────────────
function CategoryTile({
    cat,
    Icon,
    isSel,
    col,
    onPress,
    tileSize,
}: {
    cat: any;
    Icon: any;
    isSel: boolean;
    col: string;
    onPress: () => void;
    tileSize: number;
}) {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.88, useNativeDriver: true, stiffness: 500, damping: 28, mass: 0.7
        }).start();
    };

    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1, useNativeDriver: true, stiffness: 500, damping: 28, mass: 0.7
        }).start();
    };

    const iconBg = isSel ? col : `${col}18`;
    const iconSize = Math.round(tileSize * 0.30);

    return (
        <Animated.View style={{ transform: [{ scale: pressAnim }], width: tileSize }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={{
                    width: tileSize,
                    alignItems: "center",
                    paddingVertical: 6,
                    paddingHorizontal: 2,
                    borderRadius: 12,
                    backgroundColor: isSel ? `${col}14` : "transparent",
                    borderWidth: isSel ? 1.5 : 1,
                    borderColor: isSel ? col : "#E5E7EB",
                }}
            >
                {/* Icon circle */}
                <View style={{
                    width: tileSize * 0.52,
                    height: tileSize * 0.52,
                    borderRadius: tileSize * 0.26,
                    backgroundColor: iconBg,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 4,
                    shadowColor: isSel ? col : "transparent",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isSel ? 0.4 : 0,
                    shadowRadius: 6,
                    elevation: isSel ? 4 : 0,
                }}>
                    <Icon size={iconSize} color={isSel ? "#FFFFFF" : col} strokeWidth={2} />
                </View>

                {/* Label */}
                <Text
                    numberOfLines={1}
                    style={{
                        fontSize: 9,
                        fontWeight: isSel ? "700" : "500",
                        color: isSel ? col : "#6B7280",
                        textAlign: "center",
                        letterSpacing: 0,
                    }}
                >
                    {cat.name}
                </Text>

                {/* Selected dot */}
                {isSel && (
                    <View style={{
                        position: "absolute",
                        top: 4,
                        right: 4,
                        width: 11,
                        height: 11,
                        borderRadius: 5.5,
                        backgroundColor: col,
                        alignItems: "center",
                        justifyContent: "center",
                    }}>
                        <Icons.Check size={7} color="#FFFFFF" strokeWidth={3} />
                    </View>
                )}
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── CategoryChip ──────────────────────────────────────────────────────────────
function CategoryChip({
    cat,
    Icon,
    isSel,
    col,
    onPress,
}: {
    cat: any;
    Icon: any;
    isSel: boolean;
    col: string;
    onPress: () => void;
}) {
    const pressAnim = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(pressAnim, {
            toValue: 0.93, useNativeDriver: true, stiffness: 400, damping: 25, mass: 0.8
        }).start();
    };
    const onPressOut = () => {
        Animated.spring(pressAnim, {
            toValue: 1, useNativeDriver: true, stiffness: 400, damping: 25, mass: 0.8
        }).start();
    };

    return (
        <Animated.View style={{ transform: [{ scale: pressAnim }] }}>
            <TouchableOpacity
                onPress={onPress}
                onPressIn={onPressIn}
                onPressOut={onPressOut}
                activeOpacity={1}
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingVertical: 7,
                    paddingHorizontal: 11,
                    borderRadius: 18,
                    minHeight: 36,
                    backgroundColor: isSel ? col : "#F3F4F6",
                    shadowColor: isSel ? col : "transparent",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isSel ? 0.35 : 0,
                    shadowRadius: 10,
                    elevation: isSel ? 5 : 0,
                }}
            >
                <View style={{
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: isSel ? "rgba(255,255,255,0.25)" : `${col}20`,
                    alignItems: "center", justifyContent: "center",
                }}>
                    <Icon size={11} color={isSel ? "#FFFFFF" : col} strokeWidth={2} />
                </View>
                <Text style={{
                    fontSize: 12,
                    fontWeight: isSel ? "700" : "600",
                    color: isSel ? "#FFFFFF" : "#111827",
                }}>
                    {cat.name}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
}

// ── CategoryBottomSheet ───────────────────────────────────────────────────────
const TILE_SIZE = (SCREEN_W - 40 - 40) / 5; // 6 cols inside sheet

function CategoryBottomSheet({
    visible,
    cats,
    categoryId,
    onSelect,
    onClose,
    typeColor,
}: {
    visible: boolean;
    cats: any[];
    categoryId: string;
    onSelect: (id: string) => void;
    onClose: () => void;
    typeColor: string;
}) {
    const slideAnim = useRef(new Animated.Value(SCREEN_H)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;
    const insets = useSafeAreaInsets();

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    useNativeDriver: true,
                    stiffness: 280,
                    damping: 28,
                    mass: 1,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: SCREEN_H,
                    useNativeDriver: true,
                    stiffness: 320,
                    damping: 32,
                    mass: 0.9,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 180,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                style={{
                    position: "absolute", inset: 0,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    opacity: backdropAnim,
                }}
            >
                <Pressable style={{ flex: 1 }} onPress={onClose} />
            </Animated.View>

            {/* Sheet */}
            <Animated.View
                style={{
                    position: "absolute",
                    bottom: 0, left: 0, right: 0,
                    backgroundColor: "#FFFFFF",
                    borderTopLeftRadius: 28,
                    borderTopRightRadius: 28,
                    paddingBottom: Math.max(insets.bottom + 16, 28),
                    transform: [{ translateY: slideAnim }],
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -6 },
                    shadowOpacity: 0.12,
                    shadowRadius: 20,
                    elevation: 20,
                }}
            >
                {/* Drag handle */}
                <View style={{
                    alignItems: "center", paddingTop: 12, paddingBottom: 4,
                }}>
                    <View style={{
                        width: 36, height: 4, borderRadius: 2,
                        backgroundColor: "#E5E7EB",
                    }} />
                </View>

                {/* Header */}
                <View style={{
                    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                    paddingHorizontal: 20, paddingVertical: 12,
                }}>
                    <Text style={{
                        fontSize: 17, fontWeight: "700", color: "#111827", letterSpacing: -0.3,
                    }}>
                        All Categories
                    </Text>
                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.7}
                        style={{
                            width: 32, height: 32, borderRadius: 16,
                            backgroundColor: "#F3F4F6",
                            alignItems: "center", justifyContent: "center",
                        }}
                    >
                        <Icons.X size={16} color="#6B7280" strokeWidth={2.5} />
                    </TouchableOpacity>
                </View>

                {/* Grid */}
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        paddingHorizontal: 20,
                        gap: 6,
                        paddingTop: 4,
                    }}
                    style={{ maxHeight: SCREEN_H * 0.52 }}
                >
                    {cats.map(cat => {
                        const Icon = getSafeIcon(cat.icon);
                        const isSel = categoryId === cat.id;
                        const col = cat.color ?? "#8E8E93";
                        return (
                            <CategoryTile
                                key={cat.id}
                                cat={cat}
                                Icon={Icon}
                                isSel={isSel}
                                col={col}
                                onPress={() => onSelect(cat.id)}
                                tileSize={TILE_SIZE}
                            />
                        );
                    })}
                </ScrollView>
            </Animated.View>
        </Modal>
    );
}