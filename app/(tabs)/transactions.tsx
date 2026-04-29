import { ConfirmModal } from "@/components/ConfirmModal";
import { CustomDatePicker } from "@/components/CustomDatePicker";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { deleteTransaction, getTransactionsByDate } from "@/lib/supabase/transactions";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronDown, ListOrdered, Plus, Search } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityItem } from "./home";

// Helper to safely get the current date in a specific timezone
function getTodayInTimezone(tz: string): Date {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      year: "numeric",
      month: "numeric",
      day: "numeric",
    });
    const parts = formatter.formatToParts(new Date());
    let y = 0,
      m = 0,
      d = 0;
    for (const p of parts) {
      if (p.type === "year") y = parseInt(p.value, 10);
      if (p.type === "month") m = parseInt(p.value, 10);
      if (p.type === "day") d = parseInt(p.value, 10);
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
  const params = useLocalSearchParams();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showPicker, setShowPicker] = useState(false);
  const [deletingTx, setDeletingTx] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTransaction = async () => {
    if (!deletingTx) return;
    try {
      setIsDeleting(true);
      await deleteTransaction(deletingTx.id);
      setTransactions((prev) => prev.filter((t) => t.id !== deletingTx.id));
      setDeletingTx(null);
    } catch (e: any) {
      console.warn("Could not delete tx", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const timezone = profile?.timezone ?? "Asia/Jakarta";

  // Initialize with correct timezone "today" date ONCE
  useEffect(() => {
    if (params.date && typeof params.date === "string") {
      const [y, m, d] = params.date.split("-").map(Number);
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        setSelectedDate(new Date(y, m - 1, d));
        return;
      }
    }
    if (profile?.timezone) {
      setSelectedDate(getTodayInTimezone(profile.timezone));
    }
  }, [profile?.timezone, params.date]);

  // Format Date to YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchTransactions = useCallback(
    async (date: Date) => {
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
    },
    [user],
  );

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

  useFocusEffect(
    useCallback(() => {
      if (user && profile) {
        fetchTransactions(selectedDate);
      }
    }, [selectedDate, user, profile, fetchTransactions]),
  );

  // Week generation
  const weekDates = useMemo(() => {
    const dates = [];
    const d = new Date(selectedDate);
    const currentDay = d.getDay() === 0 ? 7 : d.getDay();
    d.setDate(d.getDate() - currentDay + 1);

    for (let i = 0; i < 7; i++) {
      dates.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return dates;
  }, [selectedDate]);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  // Swipe handler
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return (
          Math.abs(gestureState.dx) > 20 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (gestureState.dx > 40) {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: 150,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setSelectedDate((prev) => {
              const next = new Date(prev);
              next.setDate(prev.getDate() - 7);
              return next;
            });
            slideAnim.setValue(-150);
            Animated.parallel([
              Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 20,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          });
        } else if (gestureState.dx < -40) {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -150,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start(() => {
            setSelectedDate((prev) => {
              const next = new Date(prev);
              next.setDate(prev.getDate() + 7);
              return next;
            });
            slideAnim.setValue(150);
            Animated.parallel([
              Animated.spring(slideAnim, {
                toValue: 0,
                useNativeDriver: true,
                speed: 20,
              }),
              Animated.timing(opacityAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
              }),
            ]).start();
          });
        }
      },
    }),
  ).current;

  const todayStr = formatDateKey(getTodayInTimezone(timezone));

  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, tx) => {
      const amount = Number(tx.amount) || 0;
      return sum + (tx.type === "expense" ? -amount : amount);
    }, 0);
  }, [transactions]);

  // Safely format the selected month
  let currentMonth = "Unknown Date";
  try {
    currentMonth = selectedDate.toLocaleString("default", {
      month: "long",
      year: "numeric",
    });
  } catch (e) {
    currentMonth = "";
  }

  return (
    <View className="flex-1 bg-background">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1" edges={["top"]}>
        <View className="px-6 pt-5 pb-4 flex-row items-center justify-between">
          <Pressable
            onPress={() => setShowPicker(true)}
            className="flex-row items-center gap-2 active:opacity-70"
          >
            <Text
              style={{ fontFamily: "Handjet_700Bold" }}
              className="text-foreground text-3xl"
            >
              {currentMonth}
            </Text>
            <ChevronDown size={20} color="#999999" />
          </Pressable>

          <View className="flex-row items-center gap-3">
            {formatDateKey(selectedDate) !== todayStr && (
              <Pressable
                onPress={() => setSelectedDate(getTodayInTimezone(timezone))}
                className="px-3 py-1.5 rounded-full border border-border bg-secondary/20 active:opacity-70"
              >
                <Text className="text-[12px] font-semibold text-secondary-foreground">Today</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => router.push('/transaction/search')}
              className="w-10 h-10 rounded-xl items-center justify-center bg-secondary/20 active:opacity-70"
            >
              <Search size={20} color="#2F2F2F" strokeWidth={2.5} />
            </Pressable>
            <Pressable
              onPress={() =>
                router.push(
                  `/transaction/new?date=${formatDateKey(selectedDate)}`,
                )
              }
              className="w-10 h-10 rounded-xl items-center justify-center bg-primary/10 active:opacity-70"
            >
              <Plus size={22} color="#2F2F2F" strokeWidth={2.5} />
            </Pressable>
          </View>
        </View>

        {/* Week Card */}
        <View className="px-6 mb-4">
          <View className="rounded-[24px] p-2 shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
            <Animated.View
              {...panResponder.panHandlers}
              className="flex-row justify-between items-center"
              style={{
                transform: [{ translateX: slideAnim }],
                opacity: opacityAnim,
              }}
            >
              {weekDates.map((date, i) => {
                const isSelected =
                  formatDateKey(date) === formatDateKey(selectedDate);
                const isToday = formatDateKey(date) === todayStr;
                const dayName = date.toLocaleDateString("en-US", {
                  weekday: "short",
                });

                return (
                  <Pressable
                    key={i}
                    onPress={() => setSelectedDate(date)}
                    className={`items-center justify-center p-2 rounded-xl w-11 h-14 ${isSelected ? "bg-primary" : "bg-transparent"}`}
                  >
                    <Text
                      className={`text-[12px] font-medium mb-1 ${isSelected ? "text-primary-foreground" : "text-[#999999]"}`}
                    >
                      {dayName}
                    </Text>
                    <Text
                      className={`text-[16px] font-bold ${isSelected ? "text-primary-foreground" : isToday ? "#5B8F85" : "text-foreground"}`}
                    >
                      {date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>
          </View>
        </View>

        <CustomDatePicker
          visible={showPicker}
          date={selectedDate}
          onClose={() => setShowPicker(false)}
          onSelect={(date) => {
            setShowPicker(false);
            setSelectedDate(date);
          }}
        />

        <View className="flex-1 bg-white rounded-t-[36px] pt-6 mt-4 shadow-[0_-4px_12px_rgba(0,0,0,0.02)]">
          {!loading && transactions.length > 0 && (
            <View className="px-8 pb-4 flex-row justify-between items-center">
              <Text className="text-base font-bold text-foreground">Total</Text>
              <Text className={`text-sm font-bold tracking-tight ${totalAmount < 0 ? 'text-[#E53935]' : 'text-[#2E8B57]'}`}>
                {totalAmount < 0 ? "-" : ""}Rp {new Intl.NumberFormat("id-ID").format(Math.abs(totalAmount))}
              </Text>
            </View>
          )}

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100, paddingHorizontal: 24 }}
          >
            {loading ? (
              <View className="py-20 items-center">
                <ActivityIndicator color="#5B8F85" />
              </View>
            ) : transactions.length === 0 ? (
              <View className="flex-1 items-center justify-center py-20 gap-3">
                <Pressable
                  onPress={() =>
                    router.push(
                      `/transaction/new?date=${formatDateKey(selectedDate)}`,
                    )
                  }
                >
                  <View
                    className="w-16 h-16 rounded-2xl items-center justify-center"
                    style={{ backgroundColor: "rgba(91,143,133,0.12)" }}
                  >
                    <ListOrdered size={28} color="#5B8F85" strokeWidth={2} />
                  </View>
                </Pressable>
                <Text className="text-foreground text-base font-semibold text-center">
                  No transactions today
                </Text>
                <Text className="text-secondary-foreground text-sm text-center">
                  You don't have any transactions recorded for{" "}
                  {!isNaN(selectedDate.getTime())
                    ? selectedDate.toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                    })
                    : "this date"}
                  .
                </Text>
              </View>
            ) : (
              transactions.map((tx, index) => (
                <View key={tx.id}>
                  <ActivityItem tx={tx} isCard onDelete={(t) => setDeletingTx(t)} />
                  {index < transactions.length - 1 && (
                    <View className="h-[1px] bg-border/40 mx-4 mb-2" />
                  )}
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </SafeAreaView>

      <ConfirmModal
        visible={!!deletingTx}
        title="Delete Transaction"
        description={`Are you sure you want to delete "${deletingTx?.description || "this transaction"}"?`}
        confirmText="Delete"
        isDestructive={true}
        loading={isDeleting}
        onCancel={() => setDeletingTx(null)}
        onConfirm={handleDeleteTransaction}
      />
    </View>
  );
}
