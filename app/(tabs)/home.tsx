
import BalanceCard from "@/components/BalanceCard";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getNetWorth } from "@/lib/supabase/accounts";
import { getMonthlyStats, getRecentTransactions } from "@/lib/supabase/transactions";
import { getGreetingFromTimezone, GREETING_TEXT_EN, GREETING_TEXT_ID } from "@/lib/time/greetings";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import type { LucideIcon } from "lucide-react-native";
import {
    ArrowDownLeft,
    ArrowLeftRight,
    ArrowUpRight,
    Banknote,
    Bike,
    BookOpen,
    Briefcase,
    Car,
    Clock,
    Coffee,
    CreditCard,
    Dumbbell,
    Gift,
    GraduationCap,
    Heart,
    HelpCircle,
    Home,
    Music,
    Package,
    Percent,
    Phone,
    Pill,
    Pizza,
    Plus,
    ShoppingBag,
    ShoppingCart,
    Star,
    Tag,
    Ticket,
    TreePalm,
    TrendingUp,
    Tv,
    Utensils,
    Wallet,
    Wifi,
    Zap
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    Easing,
    Image,
    Pressable,
    RefreshControl,
    ScrollView,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppProfile = {
    id: string;
    full_name: string | null;
    timezone: string | null;
    avatar_url: string | null;
    locale: string | null;
    preferred_currency: string | null;
};

type Category = {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
    type: string;
};

type Transaction = {
    id: string;
    type: string;
    amount: number;
    currency: string;
    description: string | null;
    date: string;
    time: string | null;
    is_transfer: boolean;
    categories: Category | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatAmount(amount: number, currency: string): string {
    if (currency === "IDR") {
        return new Intl.NumberFormat("id-ID", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }
    return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount);
}


function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const isSameDay = (a: Date, b: Date) =>
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate();

    if (isSameDay(date, today)) return "Today";
    if (isSameDay(date, yesterday)) return "Yesterday";

    return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
}

/** Background tint from hex color */
function hexToRgba(hex: string | null, alpha = 0.15): string {
    if (!hex) return `rgba(61,155,53,${alpha})`;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

/** Map DB icon name string → Lucide component */
const ICON_MAP: Record<string, LucideIcon> = {
    Utensils, Gift, Car, Coffee, ShoppingBag, ShoppingCart,
    TrendingUp, Zap, Wifi, Phone, Tv, Heart, Pill, Home,
    Briefcase, GraduationCap, Music, Dumbbell, Bike, Ticket,
    Star, Package, Pizza, BookOpen, TreePalm, Percent,
    Banknote, Wallet, CreditCard, Clock, Plus,
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
};

function getCategoryIcon(iconName: string | null | undefined): LucideIcon {
    if (!iconName) return HelpCircle;
    return ICON_MAP[iconName] ?? HelpCircle;
}

// ─── Activity Item ─────────────────────────────────────────────────────────────

export function ActivityItem({ tx }: { tx: Transaction }) {
    const isIncome = tx.type === "income";
    const isTransfer = tx.is_transfer;
    const cat = tx.categories;

    const catColor = cat?.color ?? (isIncome ? "#2E8B57" : isTransfer ? "#5B8F85" : "#E53935");
    const bgColor = hexToRgba(catColor, 0.12);

    const IconComp = isTransfer
        ? ArrowLeftRight
        : isIncome
            ? ArrowDownLeft
            : getCategoryIcon(cat?.icon);

    const label = tx.description || cat?.name || (isTransfer ? "Transfer" : tx.type);
    const amountColor = isIncome ? "#2E8B57" : isTransfer ? "#5B8F85" : "#E53935";
    const prefix = isIncome ? "+" : isTransfer ? "" : "-";

    return (
        <View
            className="flex-row items-center py-3.5 px-4 bg-white rounded-[24px] mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
        >
            {/* Icon badge */}
            <View
                className="w-12 h-12 rounded-full items-center justify-center mr-3.5"
                style={{ backgroundColor: bgColor }}
            >
                <IconComp size={20} color={catColor} strokeWidth={2.5} />
            </View>

            {/* Info */}
            <View className="flex-1">
                <Text className="text-foreground text-sm font-bold tracking-tight" numberOfLines={1}>
                    {label}
                </Text>
                <Text className="text-secondary-foreground text-xs font-medium mt-0.5">
                    {cat?.name ? `${cat.name} · ` : ""}{formatDate(tx.date)}
                </Text>
            </View>

            {/* Amount */}
            <Text className="text-sm font-bold pl-2 tracking-tight" style={{ color: amountColor }}>
                {prefix}Rp {formatAmount(Number(tx.amount), tx.currency)}
            </Text>
        </View>
    );
}

// ─── Empty State ───────────────────────────────────────────────────────────────

function EmptyActivity() {
    return (
        <View className="items-center justify-center py-12 gap-3">
            <View
                className="w-16 h-16 rounded-2xl items-center justify-center"
                style={{ backgroundColor: "rgba(61,155,53,0.08)" }}
            >
                <HelpCircle size={28} color="#3D9B35" strokeWidth={1.5} />
            </View>
            <Text className="text-secondary-foreground text-sm text-center">
                No transactions yet.{"\n"}Add your first transaction!
            </Text>
        </View>
    );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function HomeScreen() {
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState<AppProfile | null>(null);
    const [netWorth, setNetWorth] = useState<number>(0);
    const [income, setIncome] = useState<number>(0);
    const [expenses, setExpenses] = useState<number>(0);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    const fetchData = useCallback(
        async (showRefresh = false) => {
            if (!user) return;
            if (showRefresh) setRefreshing(true);
            try {
                const { data: profileData } = (await checkProfile(user)) as {
                    data: AppProfile | null;
                    error: any;
                };
                if (!profileData) {
                    router.replace("/onboarding/profile");
                    return;
                }
                setProfile(profileData);

                const [worth, stats, txs] = await Promise.all([
                    getNetWorth(user.id),
                    getMonthlyStats(user.id),
                    getRecentTransactions(user.id, 20),
                ]);

                setNetWorth(worth);
                setIncome(stats.income);
                setExpenses(stats.expenses);
                setTransactions((txs ?? []) as unknown as Transaction[]);
            } catch (err) {
                console.warn("HomeScreen fetchData error:", err);
            } finally {
                setStatsLoading(false);
                setTxLoading(false);
                setRefreshing(false);
            }
        },
        [user]
    );

    useEffect(() => {
        if (authLoading) return;
        fetchData();
    }, [user, authLoading, fetchData]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const currency = profile?.preferred_currency ?? "IDR";
    const timezone = profile?.timezone ?? "Asia/Jakarta";
    const locale = profile?.locale ?? "en-US";

    const greetingKey = getGreetingFromTimezone({ timezone, locale });
    const greetingText = locale.startsWith("id")
        ? GREETING_TEXT_ID[greetingKey]
        : GREETING_TEXT_EN[greetingKey];

    const avatarSource =
        profile?.avatar_url && profile.avatar_url.length > 0
            ? { uri: profile.avatar_url }
            : require("@/assets/images/default-avatar.png");

    const currentMonth = new Date().toLocaleString("default", {
        month: "long",
        year: "numeric",
    });

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1" edges={['top']}>
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 32 }}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={() => fetchData(true)}
                            tintColor="#3D9B35"
                            colors={["#3D9B35"]}
                        />
                    }
                >
                    {/* ── Header ──────────────────────────────────────────── */}
                    <View className="px-6 pt-5 pb-2 flex flex-row justify-between items-center">
                        <Animated.View
                            style={{
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                            }}
                        >
                            <Text
                                style={{ fontFamily: "Handjet_700Bold" }}
                                className="text-foreground text-2xl"
                            >
                                {greetingText},
                            </Text>
                            <Text className="text-secondary-foreground text-xs">
                                {profile?.full_name ?? user?.user_metadata?.full_name ?? ""}
                            </Text>
                        </Animated.View>

                        <Animated.View
                            style={{ opacity: fadeAnim }}
                            className="flex-row items-center gap-3"
                        >
                            <Pressable
                                onPress={() => router.push("/(tabs)/settings")}
                                className="rounded-xl overflow-hidden"
                            >
                                <Image
                                    source={avatarSource}
                                    className="w-10 h-10 rounded-xl"
                                />
                            </Pressable>
                        </Animated.View>
                    </View>

                    {/* ── Balance Card ─────────────────────────────────────── */}
                    <View className="px-6 pt-4">
                        <BalanceCard
                            totalBalance={netWorth}
                            income={income}
                            expenses={expenses}
                            currency={currency}
                            month={currentMonth}
                            loading={statsLoading}
                        // onSeeAll={() => router.push("/(tabs)/reports")}
                        />
                    </View>

                    <View className="px-6 pt-10 flex-row justify-between items-center">
                        <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-2xl text-foreground">
                            Activity
                        </Text>
                        <View className="flex-row items-center gap-3">
                            <Pressable
                                onPress={() => router.push("/category")}
                                className="active:opacity-70 bg-secondary/30 rounded-full px-2.5 py-1"
                            >
                                <View className="flex flex-row gap-1.5 items-center">
                                    <Tag strokeWidth={1.5} size={14} color="#666666" />
                                    <Text className="text-secondary-foreground text-xs font-semibold">Category</Text>
                                </View>
                            </Pressable>
                            <Pressable
                                onPress={() => router.push("/(tabs)/transactions")}
                                className="active:opacity-70"
                            >
                                <Text className="text-secondary-foreground text-sm font-semibold">See All</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View className="px-6 pt-3">
                        {txLoading ? (
                            <View className="py-10 items-center">
                                <ActivityIndicator color="#5B8F85" />
                            </View>
                        ) : transactions.length === 0 ? (
                            <EmptyActivity />
                        ) : (
                            transactions.map((tx) => (
                                <ActivityItem key={tx.id} tx={tx} />
                            ))
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
