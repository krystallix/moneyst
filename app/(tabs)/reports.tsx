import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getCategoryBreakdown, getMonthlyStats, getRecurringInsights, getTrendLine } from "@/lib/supabase/transactions";
import { getGreetingFromTimezone, GREETING_TEXT_EN, GREETING_TEXT_ID } from "@/lib/time/greetings";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Icons from "lucide-react-native";
import { CalendarDays, Plus } from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, ScrollView, Text, View } from "react-native";
import { LineChart, PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

function getSafeIcon(iconName: string | undefined | null) {
    if (!iconName) return Icons.HelpCircle;
    const IconComp = (Icons as any)[iconName];
    return IconComp || Icons.HelpCircle;
}

type AppProfile = {
    id: string;
    full_name: string | null;
    timezone: string | null;
    avatar_url: string | null;
    locale: string | null;
    preferred_currency?: string | null;
};

const getLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
};

export default function ReportScreen() {
    const { user, loading } = useAuth();
    const [username, setUsername] = useState<string | null>(null);
    const [timezone, setTimezone] = useState<string>("Asia/Jakarta");
    const [locale, setLocale] = useState<string>("en-US");
    const [avatar, setAvatar] = useState<string | null>(null);
    const [currency, setCurrency] = useState<string>("IDR");

    const [filter, setFilter] = useState("This Month");
    const [customStart, setCustomStart] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    const [customEnd, setCustomEnd] = useState<Date>(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0));
    const [showStartPicker, setShowStartPicker] = useState(false);
    const [showEndPicker, setShowEndPicker] = useState(false);

    const [stats, setStats] = useState({ income: 0, expenses: 0 });
    const [breakdown, setBreakdown] = useState<any[]>([]);
    const [trends, setTrends] = useState<any[]>([]);
    const [recurring, setRecurring] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        const fetchProfile = async () => {
            const { data: profile } = await checkProfile(user) as {
                data: AppProfile | null;
                error: any;
            };

            if (!profile) {
                router.replace("/onboarding/profile");
                return;
            }

            setUsername(profile.full_name ?? user.user_metadata?.full_name ?? null);
            setTimezone(profile.timezone ?? "Asia/Jakarta");
            setAvatar(profile.avatar_url ?? null);
            setLocale(profile.locale ?? "en-US");
            setCurrency(profile.preferred_currency ?? "IDR");
        };

        fetchProfile();
    }, [user, loading]);

    const loadData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        try {
            let start: string | undefined;
            let end: string | undefined;
            const now = new Date();

            if (filter === "This Month") {
                start = getLocalYMD(new Date(now.getFullYear(), now.getMonth(), 1));
                end = getLocalYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            } else if (filter === "Last Month") {
                start = getLocalYMD(new Date(now.getFullYear(), now.getMonth() - 1, 1));
                end = getLocalYMD(new Date(now.getFullYear(), now.getMonth(), 0));
            } else if (filter === "Last 3 Months") {
                start = getLocalYMD(new Date(now.getFullYear(), now.getMonth() - 2, 1));
                end = getLocalYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            } else if (filter === "Last 6 Months") {
                start = getLocalYMD(new Date(now.getFullYear(), now.getMonth() - 5, 1));
                end = getLocalYMD(new Date(now.getFullYear(), now.getMonth() + 1, 0));
            } else if (filter === "This Year") {
                start = getLocalYMD(new Date(now.getFullYear(), 0, 1));
                end = getLocalYMD(new Date(now.getFullYear(), 11, 31));
            } else if (filter === "Custom") {
                start = getLocalYMD(customStart);
                end = getLocalYMD(customEnd);
            }

            const [monthlyStats, catBreakdown, trendLine, recurringInsights] = await Promise.all([
                getMonthlyStats(user.id, start, end),
                getCategoryBreakdown(user.id, start, end),
                getTrendLine(user.id),
                getRecurringInsights(user.id, start, end)
            ]);

            setStats(monthlyStats);
            setBreakdown(catBreakdown);
            setTrends(trendLine);
            setRecurring(recurringInsights);
        } catch (error) {
            console.error("Error loading reports data:", error);
        } finally {
            setLoadingData(false);
        }
    }, [user, filter, customStart, customEnd]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

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

    const greetingKey = getGreetingFromTimezone({ timezone, locale });
    const greetingText =
        locale.startsWith("id")
            ? GREETING_TEXT_ID[greetingKey]
            : GREETING_TEXT_EN[greetingKey];

    const avatarSource =
        avatar && avatar.length > 0
            ? { uri: avatar }
            : require("@/assets/images/default-avatar.png");

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-5 pb-4 flex-row justify-between items-center">
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-3xl text-foreground">
                        Reports
                    </Text>
                    <Pressable
                        onPress={() => router.push('/budget/new')}
                        className="bg-primary/10 w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                    >
                        <Plus size={22} color="#2F2F2F" strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Main content */}
                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Filters */}
                    <View className="px-6 pt-2 pb-4">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {["This Month", "Last Month", "Last 3 Months", "Last 6 Months", "This Year", "Custom"].map((f) => (
                                <Pressable
                                    key={f}
                                    onPress={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-full border ${filter === f ? 'bg-primary border-primary' : 'bg-transparent border-border'}`}
                                >
                                    <Text className={`text-sm font-semibold ${filter === f ? 'text-primary-foreground' : 'text-foreground'}`}>
                                        {f}
                                    </Text>
                                </Pressable>
                            ))}
                        </ScrollView>

                        {filter === "Custom" && (
                            <View className="flex-row items-center gap-3 mt-4">
                                <Pressable
                                    onPress={() => setShowStartPicker(true)}
                                    className="flex-1 flex-row items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-secondary/10"
                                >
                                    <Text className="text-sm font-medium text-foreground">{customStart.toLocaleDateString()}</Text>
                                    <CalendarDays size={16} color="#666" />
                                </Pressable>
                                <Text className="text-muted-foreground font-semibold">to</Text>
                                <Pressable
                                    onPress={() => setShowEndPicker(true)}
                                    className="flex-1 flex-row items-center justify-between px-3 py-2.5 rounded-xl border border-border bg-secondary/10"
                                >
                                    <Text className="text-sm font-medium text-foreground">{customEnd.toLocaleDateString()}</Text>
                                    <CalendarDays size={16} color="#666" />
                                </Pressable>
                            </View>
                        )}
                    </View>

                    {loadingData ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#5B8F85" size="large" />
                        </View>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <View className="px-6 flex-row gap-3 mb-6">
                                <View className="flex-1 bg-card p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <Text className="text-xs text-muted-foreground font-semibold uppercase mb-1">Income</Text>
                                    <Text className="text-lg font-bold text-[#2E8B57]" adjustsFontSizeToFit numberOfLines={1}>
                                        {currency} {stats.income.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-card p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <Text className="text-xs text-muted-foreground font-semibold uppercase mb-1">Expense</Text>
                                    <Text className="text-lg font-bold text-[#E53935]" adjustsFontSizeToFit numberOfLines={1}>
                                        {currency} {stats.expenses.toLocaleString()}
                                    </Text>
                                </View>
                                <View className="flex-1 bg-card p-4 rounded-2xl shadow-sm border border-gray-100">
                                    <Text className="text-xs text-muted-foreground font-semibold uppercase mb-1">Savings</Text>
                                    <Text className="text-lg font-bold text-foreground" adjustsFontSizeToFit numberOfLines={1}>
                                        {stats.income > 0 ? Math.round(((stats.income - stats.expenses) / stats.income) * 100) : 0}%
                                    </Text>
                                </View>
                            </View>

                            {/* Category Breakdown (Pie Chart) */}
                            <View className="px-6 mb-8">
                                <View className="bg-card p-5 rounded-3xl shadow-sm border border-gray-100">
                                    <Text className="text-2xl text-foreground mb-4" style={{ fontFamily: "Handjet_700Bold" }}>Category Breakdown</Text>
                                    <View className="items-center">
                                        {breakdown.length > 0 ? (
                                            <>
                                                <PieChart
                                                    data={breakdown.map(b => ({ value: b.total, color: b.color }))}
                                                    donut
                                                    innerRadius={60}
                                                    radius={100}
                                                    isAnimated
                                                    animationDuration={800}
                                                    centerLabelComponent={() => {
                                                        return (
                                                            <View className="items-center justify-center">
                                                                <Text className="text-xs text-muted-foreground font-bold">Total</Text>
                                                                <Text className="text-base font-bold text-foreground mt-1">{stats.expenses > 1000 ? (stats.expenses / 1000).toFixed(1) + 'k' : stats.expenses}</Text>
                                                            </View>
                                                        );
                                                    }}
                                                />
                                                <View className="w-full mt-6 flex-row flex-wrap justify-between gap-y-3">
                                                    {breakdown.slice(0, 6).map((b, idx) => (
                                                        <View key={idx} className="w-[48%] flex-row items-center gap-2">
                                                            <View className="w-3 h-3 rounded-full" style={{ backgroundColor: b.color }} />
                                                            <View className="flex-1">
                                                                <Text className="text-xs text-foreground font-medium" numberOfLines={1}>{b.name}</Text>
                                                                <Text className="text-[10px] text-muted-foreground">{currency} {b.total.toLocaleString()}</Text>
                                                            </View>
                                                        </View>
                                                    ))}
                                                </View>
                                            </>
                                        ) : (
                                            <View className="py-10 items-center justify-center">
                                                <Text className="text-muted-foreground text-sm">No category data for this period</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                            </View>

                            {/* Trend Line (Last 6 Months) */}
                            {(() => {
                                const maxVal = Math.max(...trends.map(t => t.income), ...trends.map(t => t.expenses), 100);
                                const chartMax = maxVal * 1.2;
                                return (
                                    <View className="px-6 mb-8">
                                        <View className="bg-card p-5 rounded-3xl shadow-sm border border-gray-100">
                                            <Text className="text-2xl text-foreground mb-4" style={{ fontFamily: "Handjet_700Bold" }}>6-Month Trend</Text>
                                            <View className="flex-row gap-4 mb-6 justify-center">
                                                <View className="flex-row items-center gap-1.5"><View className="w-2 h-2 rounded-full bg-[#2E8B57]" /><Text className="text-xs text-muted-foreground font-medium">Income</Text></View>
                                                <View className="flex-row items-center gap-1.5"><View className="w-2 h-2 rounded-full bg-[#E53935]" /><Text className="text-xs text-muted-foreground font-medium">Expense</Text></View>
                                            </View>
                                            <LineChart
                                                data={trends.map(t => ({ value: t.income, label: t.label }))}
                                                data2={trends.map(t => ({ value: t.expenses, label: t.label }))}
                                                maxValue={chartMax}
                                                noOfSections={4}
                                                color1="#2E8B57"
                                                color2="#E53935"
                                                dataPointsColor1="#2E8B57"
                                                dataPointsColor2="#E53935"
                                                thickness={3}
                                                thickness2={3}
                                                hideRules
                                                yAxisThickness={0}
                                                xAxisThickness={1}
                                                xAxisColor="#E5E7EB"
                                                yAxisTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
                                                xAxisLabelTextStyle={{ color: '#9CA3AF', fontSize: 10 }}
                                                spacing={45}
                                                initialSpacing={20}
                                                formatYLabel={(label) => {
                                                    const val = Number(label);
                                                    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}m`;
                                                    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
                                                    return val.toString();
                                                }}
                                                height={180}
                                                curved
                                                isAnimated
                                                animationDuration={1200}
                                                areaChart
                                                startFillColor1="#2E8B57"
                                                startFillColor2="#E53935"
                                                startOpacity={0.3}
                                                endOpacity={0.05}
                                            />
                                        </View>
                                    </View>
                                );
                            })()}

                            {/* Recurring Insights */}
                            {recurring.length > 0 && (
                                <View className="px-6 mb-8">
                                    <View className="bg-card p-5 rounded-3xl shadow-sm border border-gray-100">
                                        <Text className="text-2xl  text-foreground mb-4" style={{ fontFamily: "Handjet_700Bold" }}>Recurring Transactions</Text>
                                        {recurring.map((item, idx) => {
                                            const Icon = getSafeIcon(item.category?.icon);
                                            const catColor = item.category?.color || '#5B8F85';
                                            return (
                                                <Pressable
                                                    key={idx}
                                                    className={`flex-row items-center justify-between active:opacity-60 ${idx < recurring.length - 1 ? 'border-b border-gray-100 pb-3 mb-3' : ''}`}
                                                >
                                                    <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${catColor}15` }}>
                                                        <Icon size={18} color={catColor} />
                                                    </View>
                                                    <View className="flex-1">
                                                        <Text className="text-sm font-bold text-foreground capitalize">{item.name}</Text>
                                                        <Text className="text-[11px] text-muted-foreground mt-0.5">
                                                            {item.count}x dlm {item.totalDays} hr • Tiap ~{item.avgIntervalDays} hr
                                                        </Text>
                                                    </View>
                                                    <View className="items-end">
                                                        <Text className="text-sm font-bold text-[#E53935]">
                                                            {currency} {item.totalAmount.toLocaleString()}
                                                        </Text>
                                                    </View>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>
                            )}
                        </>
                    )}
                </ScrollView>
            </SafeAreaView>

            <CustomDatePicker
                visible={showStartPicker}
                date={customStart}
                onClose={() => setShowStartPicker(false)}
                onSelect={(d) => { setCustomStart(d); setShowStartPicker(false); }}
                maximumDate={customEnd}
            />
            <CustomDatePicker
                visible={showEndPicker}
                date={customEnd}
                onClose={() => setShowEndPicker(false)}
                onSelect={(d) => { setCustomEnd(d); setShowEndPicker(false); }}
                maximumDate={new Date()}
            />
        </View>
    );
}
