import { useAuth } from "@/lib/auth/AuthContext";
import { getAccounts } from "@/lib/supabase/accounts";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Plus } from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
// 2 columns with 24px total horizontal padding and 16px gap
const CARD_WIDTH = (width - 48 - 16) / 2;

function AccountCard({ account, onPress }: { account: any; onPress: () => void }) {
    const isDark = ["#000000", "#111827", "#1A1A1A", "#333333"].includes(account.color?.toUpperCase() || "");
    const textColor = isDark ? "#FFFFFF" : "#1A1A1A";

    return (
        <Pressable
            onPress={onPress}
            style={{
                width: CARD_WIDTH,
                aspectRatio: 1,
                backgroundColor: account.color || "#000000",
                borderRadius: 24,
                padding: 16,
                justifyContent: "space-between",
                overflow: "hidden",
                borderWidth: 1,
                borderColor: "rgba(0,0,0,0.05)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }}
            className="active:opacity-80"
        >
            {/* Background design (diagonal lines) */}
            <View className="absolute inset-0 opacity-10" style={{ transform: [{ rotate: "45deg" }, { scale: 1.5 }] }}>
                <View className="w-full h-2 bg-white mb-2" />
                <View className="w-full h-4 bg-white mb-4" />
                <View className="w-full h-2 bg-white mb-2" />
                <View className="w-full h-8 bg-white mb-4" />
                <View className="w-full h-2 bg-white" />
            </View>

            <View className="flex-row justify-between items-start">
                {/* Chip / Hole */}
                <View className="w-5 h-5 rounded-full bg-white opacity-90 shadow-sm" />

                {/* Institution or Type */}
                <Text
                    style={{ color: textColor, fontFamily: "Handjet_700Bold", fontSize: 18, letterSpacing: 1 }}
                    numberOfLines={1}
                >
                    {(account.type || "BANK").toUpperCase()}
                </Text>
            </View>

            <View className="flex-row justify-between items-end">
                <View className="flex-1 mr-2">
                    {/* Account Name / Institution */}
                    <Text
                        style={{ color: textColor, opacity: 0.9, fontSize: 13, marginBottom: 2, fontWeight: "500" }}
                        numberOfLines={1}
                    >
                        {account.institution ? account.institution : account.name}
                    </Text>
                    {/* Account Number */}
                    <Text
                        style={{ color: textColor, fontWeight: "700", fontSize: 16, letterSpacing: 2 }}
                    >
                        •••• {account.account_number ? account.account_number.slice(-4) : "0000"}
                    </Text>
                </View>
                {/* Balance */}
                <Text
                    style={{ color: textColor, fontWeight: "800", fontSize: 13, opacity: 0.9 }}
                    numberOfLines={1}
                >
                    {account.currency === "IDR" ? "Rp" : account.currency} {new Intl.NumberFormat("id-ID").format(account.current_balance || 0)}
                </Text>
            </View>
        </Pressable>
    );
}

export default function AccountScreen() {
    const { user } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (!user) return;
        if (isRefresh) setRefreshing(true);
        try {
            const data = await getAccounts(user.id);
            setAccounts(data);
        } catch (e) {
            console.warn("AccountScreen load error:", e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            load();
        }, [load])
    );

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1">
                {/* Header */}
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
                        Accounts
                    </Text>

                    <View className="absolute right-6">
                        <Pressable
                            onPress={() => router.push("/account/new")}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 bg-primary"
                        >
                            <Plus size={18} color="white" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                </View>

                {loading ? (
                    <View className="flex-1 items-center justify-center">
                        <ActivityIndicator color="#5B8F85" />
                    </View>
                ) : (
                    <FlatList
                        data={accounts}
                        keyExtractor={(item) => item.id}
                        numColumns={2}
                        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 32, paddingTop: 16 }}
                        columnWrapperStyle={{ justifyContent: "space-between", marginBottom: 16 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => load(true)}
                                tintColor="#5B8F85"
                                colors={["#5B8F85"]}
                            />
                        }
                        renderItem={({ item }) => (
                            <AccountCard
                                account={item}
                                onPress={() => router.push(`/account/${item.id}`)}
                            />
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-16 gap-3 mt-10">
                                <View className="w-16 h-16 rounded-2xl items-center justify-center bg-primary">
                                    <Plus size={28} color="#FFFFFF" strokeWidth={2} />
                                </View>
                                <Text className="text-secondary-foreground text-sm text-center">
                                    No accounts yet.{"\n"}Tap + to add your first account.
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>
        </View>
    );
}
