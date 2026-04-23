import { router } from "expo-router";
import ArrowDownLeft from "@/assets/icons/arrow-down-left.svg";
import ArrowUpRight from "@/assets/icons/arrow-up-right.svg";
import { EyeOff, CreditCard } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

type Props = {
    totalBalance?: number;
    income?: number;
    expenses?: number;
    currency?: string;
    exchangeRates?: { currency: string; rate: number }[];
    change?: number;
    month?: string;
    loading?: boolean;
    onToggleVisibility?: () => void;
};

function formatAmount(amount: number, currency: string): string {
    if (currency === "IDR" || currency === "Rp") {
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

export default function BalanceCard({
    totalBalance = 0,
    income = 0,
    expenses = 0,
    currency = "IDR",
    exchangeRates = [],
    change,
    month,
    loading = false,
    onToggleVisibility,
}: Props) {
    const [hidden, setHidden] = useState(false);
    const symbol = currency === "IDR" ? "Rp" : currency;

    const currentMonth =
        month ??
        new Date().toLocaleString("default", { month: "long", year: "numeric" });

    const rateString =
        exchangeRates.length > 0
            ? `1 ${currency} = ` +
            exchangeRates.map((r) => `${r.currency} ${r.rate.toFixed(2)}`).join(" = ")
            : null;

    const isPositive = (change ?? 0) >= 0;
    const changeColor = isPositive ? "#2E8B57" : "#E53935";
    const changePrefix = isPositive ? "+" : "";

    return (
        <View className="rounded-[32px] bg-white w-full shadow-sm overflow-hidden p-3">

            {/* Inner yellow section */}
            <View
                style={{ backgroundColor: "#EEFF66" }}
                className="rounded-[24px] px-5 pt-6 pb-10 w-full"
            >
                {/* Month label + right actions */}
                <View className="flex-row items-center justify-between mb-4">
                    <Text className="text-[#1A1A1A]/50 text-[11px] font-bold uppercase tracking-widest">
                        {currentMonth}
                    </Text>
                    <View className="flex-row items-center gap-2">
                        <Pressable
                            onPress={() => router.push("/account")}
                            className="flex-row items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#1A1A1A]/10 active:opacity-70 h-8"
                        >
                            <CreditCard size={14} color="#1A1A1A" strokeWidth={2} />
                            <Text className="text-[#1A1A1A] text-[10px] font-bold uppercase">See Cards</Text>
                        </Pressable>
                        <Pressable
                            onPress={() => {
                                setHidden((h) => !h);
                                onToggleVisibility?.();
                            }}
                            className="w-8 h-8 rounded-full bg-[#1A1A1A]/10 items-center justify-center active:opacity-70"
                        >
                            <EyeOff size={15} color="#1A1A1A" strokeWidth={2} />
                        </Pressable>
                    </View>
                </View>

                {/* Currency */}
                <Text className="text-center text-[#1A1A1A] text-[15px] font-bold tracking-wide mb-1">
                    {currency}
                </Text>

                {/* Exchange rates */}
                {rateString && (
                    <Text className="text-center text-[#1A1A1A]/50 text-[11px] mb-4">
                        {rateString}
                    </Text>
                )}

                {/* Balance */}
                <View className="items-center mt-2 mb-2">
                    {loading ? (
                        <ActivityIndicator color="#1A1A1A" size="small" />
                    ) : (
                        <Text
                            className="text-[#1A1A1A] text-[42px] font-extrabold tracking-tighter leading-none"
                            style={{ fontFamily: "Handjet_700Bold" }}
                        >
                            {hidden ? "••••••" : `${symbol} ${formatAmount(totalBalance, currency)}`}
                        </Text>
                    )}
                </View>

                {/* Change indicator */}
                {change !== undefined && !loading && (
                    <Text
                        className="text-center text-[13px] font-semibold mt-2"
                        style={{ color: changeColor }}
                    >
                        {changePrefix}{symbol} {formatAmount(Math.abs(change), currency)}
                    </Text>
                )}
            </View>

            {/* Bottom white section: Income & Expenses */}
            <View className="flex-row gap-4 px-3 pt-4 pb-2">
                {/* Income */}
                <View className="flex-1">
                    <View className="flex-row items-center gap-2 mb-1.5">
                        <View
                            className="w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: "rgba(46,139,87,0.12)" }}
                        >
                            <ArrowDownLeft width={14} height={14} color="#2E8B57" strokeWidth={2.5} />
                        </View>
                        <Text className="text-[#555555] text-[11px] font-semibold">Income</Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator color="#2E8B57" size="small" />
                    ) : (
                        <Text className="text-[#1A1A1A] text-lg font-bold tracking-tight">
                            {hidden ? "••••" : `${symbol} ${formatAmount(income, currency)}`}
                        </Text>
                    )}
                </View>

                {/* Divider */}
                <View className="w-px bg-[#f1f1f1] self-stretch" />

                {/* Expenses */}
                <View className="flex-1 pl-2">
                    <View className="flex-row items-center gap-2 mb-1.5">
                        <View
                            className="w-7 h-7 rounded-full items-center justify-center"
                            style={{ backgroundColor: "rgba(229,57,53,0.10)" }}
                        >
                            <ArrowUpRight width={14} height={14} color="#E53935" strokeWidth={2.5} />
                        </View>
                        <Text className="text-[#555555] text-[11px] font-semibold">Expenses</Text>
                    </View>
                    {loading ? (
                        <ActivityIndicator color="#E53935" size="small" />
                    ) : (
                        <Text className="text-[#1A1A1A] text-lg font-bold tracking-tight">
                            {hidden ? "••••" : `${symbol} ${formatAmount(expenses, currency)}`}
                        </Text>
                    )}
                </View>
            </View>
        </View>
    );
}