import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getTransactionsByDate } from "@/lib/supabase/transactions";
import DateTimePicker from "@react-native-community/datetimepicker";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Calendar as CalendarIcon, ChevronDown, ListOrdered, Plus } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityItem } from "./home";

// Helper to safely get the current date in a specific timezone
function getTodayInTimezone(tz: string): Date {
    try {
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            year: 'numeric',
            month: 'numeric',
            day: 'numeric'
        });
        const parts = formatter.formatToParts(new Date());
        let y = 0, m = 0, d = 0;
        for (const p of parts) {
            if (p.type === 'year') y = parseInt(p.value, 10);
            if (p.type === 'month') m = parseInt(p.value, 10);
            if (p.type === 'day') d = parseInt(p.value, 10);
        }
        if (y > 0 && m > 0 && d > 0) {
            return new Date(y, m - 1, d);
        }
    } catch (err) {
        console.warn("Timezone parse error:", err);
    }
    const today = new Date();
    // Return a normalized local date safely
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
}

export default function TransactionsScreen() {
    const { user, loading: authLoading } = useAuth();

    const [profile, setProfile] = useState<any>(null);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [showPicker, setShowPicker] = useState(false);

    const timezone = profile?.timezone ?? "Asia/Jakarta";

    // Initialize with correct timezone "today" date ONCE
    useEffect(() => {
        if (profile?.timezone) {
            setSelectedDate(getTodayInTimezone(profile.timezone));
        }
    }, [profile?.timezone]);

    // Format Date to YYYY-MM-DD
    const formatDateKey = (d: Date) => {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const fetchTransactions = useCallback(async (date: Date) => {
        if (!user) return;
        setLoading(true);
        try {
            const dateStr = formatDateKey(date);
            const txs = await getTransactionsByDate(user.id, dateStr);
            setTransactions(txs || []);
        } catch (error) {
            console.error("Fetch TX error:", error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const init = async () => {
            if (!user) return;
            try {
                const { data } = await checkProfile(user);
                if (data) setProfile(data);
            } catch (err) {
                console.error("Profile check error:", err);
            }
        };
        init();
    }, [user]);

    useEffect(() => {
        if (user && profile) {
            fetchTransactions(selectedDate);
        }
    }, [selectedDate, user, profile, fetchTransactions]);

    // Week generation
    const weekDates = useMemo(() => {
        const dates = [];
        // Determine start of week (Monday)
        const d = new Date(selectedDate);
        // JS getDay(): 0 is Sunday, 1 is Monday ...
        const currentDay = d.getDay() === 0 ? 7 : d.getDay();
        d.setDate(d.getDate() - currentDay + 1); // Set to Monday

        for (let i = 0; i < 7; i++) {
            dates.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return dates;
    }, [selectedDate]);

    const onDateChange = (event: any, date?: Date) => {
        if (Platform.OS === 'android') {
            setShowPicker(false);
        }
        if (date) {
            setSelectedDate(date);
        }
    };

    const todayStr = formatDateKey(getTodayInTimezone(timezone));

    // Safely format the selected month
    let currentMonth = "Unknown Date";
    try {
        currentMonth = selectedDate.toLocaleString("default", { month: "long", year: "numeric" });
    } catch (e) {
        currentMonth = "";
    }

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-5 pb-4 flex-row items-center justify-between">
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-3xl">
                        Transactions
                    </Text>
                    <Pressable
                        onPress={() => router.push(`/transaction/new?date=${formatDateKey(selectedDate)}`)}
                        className="w-10 h-10 rounded-xl items-center justify-center bg-primary/10 active:opacity-70"
                    >
                        <Plus size={22} color="#5B8F85" strokeWidth={2.5} />
                    </Pressable>
                </View>

                {/* Week Card */}
                <View className="px-6 mb-4">
                    <View className="bg-white rounded-[24px] p-4 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                        <Pressable
                            onPress={() => setShowPicker(true)}
                            className="flex-row items-center justify-between mx-1 mb-4"
                        >
                            <View className="flex-row items-center gap-2">
                                <CalendarIcon size={18} color="#5B8F85" strokeWidth={2} />
                                <Text className="text-foreground font-bold text-[16px]">
                                    {currentMonth}
                                </Text>
                            </View>
                            <ChevronDown size={20} color="#999999" />
                        </Pressable>

                        <View className="flex-row justify-between items-center">
                            {weekDates.map((date, i) => {
                                const isSelected = formatDateKey(date) === formatDateKey(selectedDate);
                                const isToday = formatDateKey(date) === todayStr;
                                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

                                return (
                                    <Pressable
                                        key={i}
                                        onPress={() => setSelectedDate(date)}
                                        className={`items-center justify-center p-2 rounded-xl w-11 h-14 ${isSelected ? 'bg-primary' : 'bg-transparent'}`}
                                    >
                                        <Text className={`text-[12px] font-medium mb-1 ${isSelected ? 'text-primary-foreground' : 'text-[#999999]'}`}>
                                            {dayName}
                                        </Text>
                                        <Text className={`text-[16px] font-bold ${isSelected ? 'text-primary-foreground' : (isToday ? '#5B8F85' : 'text-foreground')}`}>
                                            {date.getDate()}
                                        </Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>
                </View>

                {showPicker && (
                    <DateTimePicker
                        value={selectedDate}
                        mode="date"
                        display="default"
                        onChange={onDateChange}
                        themeVariant="light"
                    />
                )}

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}>
                    {loading ? (
                        <View className="py-20 items-center">
                            <ActivityIndicator color="#5B8F85" />
                        </View>
                    ) : transactions.length === 0 ? (
                        <View className="flex-1 items-center justify-center py-20 gap-3">
                            <Pressable onPress={() => router.push(`/transaction/new?date=${formatDateKey(selectedDate)}`)}>
                                <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: "rgba(91,143,133,0.12)" }}>
                                    <ListOrdered size={28} color="#5B8F85" strokeWidth={2} />
                                </View>
                            </Pressable>
                            <Text className="text-foreground text-base font-semibold text-center">
                                No transactions today
                            </Text>
                            <Text className="text-secondary-foreground text-sm text-center">
                                You don't have any transactions recorded for {
                                    !isNaN(selectedDate.getTime())
                                        ? selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                                        : 'this date'
                                }.
                            </Text>
                        </View>
                    ) : (
                        transactions.map(tx => <ActivityItem key={tx.id} tx={tx} />)
                    )}
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}
