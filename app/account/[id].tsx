import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getAccountById, updateAccount, deleteAccount } from "@/lib/supabase/accounts";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Check, ChevronLeft, Trash2 } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Switch,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

const ACCOUNT_TYPES = [
    { value: "cash", label: "Cash" },
    { value: "bank", label: "Bank" },
    { value: "credit", label: "Credit Card" },
    { value: "e-wallet", label: "E-Wallet" },
];

const ACCOUNT_COLORS = [
    "#111827", // Black
    "#1A202C", // Dark Gray
    "#1E3A8A", // Dark Blue
    "#A8D83B", // Neo Green
    "#EF4444", // Red
    "#F59E0B", // Orange
    "#3B82F6", // Blue
    "#8B5CF6", // Purple
    "#14B8A6", // Teal
    "#E5E7EB", // Light Gray (Silver)
    "#FBBF24", // Gold
    "#ec4899", // Pink
];

export default function EditAccountScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [institution, setInstitution] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [initialBalance, setInitialBalance] = useState("0");
    const [currentBalance, setCurrentBalance] = useState("0");
    const [selectedColor, setSelectedColor] = useState(ACCOUNT_COLORS[0]);
    const [selectedType, setSelectedType] = useState("bank");
    const [includeInNetWorth, setIncludeInNetWorth] = useState(true);

    const [currency, setCurrency] = useState("IDR");
    const [loadingInit, setLoadingInit] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    useEffect(() => {
        if (!id) return;
        getAccountById(id)
            .then((acc) => {
                setName(acc.name);
                setInstitution(acc.institution ?? "");
                setAccountNumber(acc.account_number ?? "");
                setInitialBalance(acc.initial_balance?.toString() ?? "0");
                setCurrentBalance(acc.current_balance?.toString() ?? "0");
                setSelectedColor(acc.color ?? ACCOUNT_COLORS[0]);
                setSelectedType(acc.type);
                setCurrency(acc.currency ?? "IDR");
                setIncludeInNetWorth(acc.include_in_net_worth);
            })
            .catch(() => Alert.alert("Error", "Could not load account."))
            .finally(() => setLoadingInit(false));
    }, [id]);

    const handleSave = async () => {
        if (!user || !id) return;
        if (!name.trim()) {
            Alert.alert("Validation", "Account name is required.");
            return;
        }

        try {
            setSaving(true);
            const initialNum = parseFloat(initialBalance) || 0;
            const currentNum = parseFloat(currentBalance) || 0;

            await updateAccount(id, {
                name: name.trim(),
                type: selectedType,
                initial_balance: initialNum,
                current_balance: currentNum,
                color: selectedColor,
                institution: institution.trim() || null,
                account_number: accountNumber.trim() || null,
                include_in_net_worth: includeInNetWorth,
            });

            router.back();
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not update account.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        setShowConfirmDelete(true);
    };

    const handleDeleteConfirm = async () => {
        try {
            setDeleting(true);
            setShowConfirmDelete(false);
            await updateAccount(id, { is_active: false });
            router.back();
        } catch (e: any) {
            Alert.alert("Error", e?.message ?? "Could not delete account.");
            setDeleting(false);
        }
    };

    if (loadingInit) {
        return (
            <SafeAreaView className="flex-1 bg-background items-center justify-center">
                <ActivityIndicator color="#5B8F85" />
            </SafeAreaView>
        );
    }

    const isDark = ["#000000", "#111827", "#1A202C", "#1E3A8A", "#8B5CF6", "#ec4899"].includes(selectedColor.toUpperCase());
    const cardTextColor = isDark ? "#FFFFFF" : "#1A1A1A";

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
                {/* Header */}
                <View className="px-6 pt-5 pb-3 flex-row items-center justify-center relative">
                    <View className="absolute left-6">
                        <Pressable
                            onPress={() => router.back()}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border"
                        >
                            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                    <Text
                        style={{ fontFamily: "Handjet_700Bold" }}
                        className="text-foreground text-3xl"
                    >
                        Edit Account
                    </Text>
                    <View className="absolute right-6">
                        <Pressable
                            onPress={handleSave}
                            disabled={saving || deleting}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 bg-primary"
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Check size={18} color="#fff" strokeWidth={2.5} />
                            )}
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Preview Card */}
                    <View className="items-center py-6 px-10">
                        <View
                            style={{
                                width: "100%",
                                aspectRatio: 1.6, // Standard card ratio
                                backgroundColor: selectedColor,
                                borderRadius: 24,
                                padding: 20,
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
                        >
                            <View className="absolute inset-0 opacity-10" style={{ transform: [{ rotate: "45deg" }, { scale: 1.5 }] }}>
                                <View className="w-full h-2 bg-white mb-2" />
                                <View className="w-full h-4 bg-white mb-4" />
                                <View className="w-full h-2 bg-white mb-2" />
                                <View className="w-full h-8 bg-white mb-4" />
                                <View className="w-full h-2 bg-white" />
                            </View>

                            <View className="flex-row justify-between items-start">
                                <View className="w-6 h-6 rounded-full bg-white opacity-90 shadow-sm" />
                                <Text
                                    style={{ color: cardTextColor, fontFamily: "Handjet_700Bold", fontSize: 20, letterSpacing: 1 }}
                                >
                                    {(selectedType || "BANK").toUpperCase()}
                                </Text>
                            </View>

                            <View className="flex-row justify-between items-end">
                                <View className="flex-1 mr-2">
                                    <Text
                                        style={{ color: cardTextColor, opacity: 0.9, fontSize: 14, marginBottom: 2, fontWeight: "500" }}
                                        numberOfLines={1}
                                    >
                                        {institution.trim() || name.trim() || "Account Name"}
                                    </Text>
                                    <Text
                                        style={{ color: cardTextColor, fontWeight: "700", fontSize: 18, letterSpacing: 2 }}
                                    >
                                        •••• {accountNumber ? accountNumber.slice(-4) : "0000"}
                                    </Text>
                                </View>
                                <Text
                                    style={{ color: cardTextColor, fontWeight: "800", fontSize: 14, opacity: 0.9 }}
                                    numberOfLines={1}
                                >
                                    {currency === "IDR" ? "Rp" : currency} {new Intl.NumberFormat("id-ID").format(parseFloat(currentBalance) || 0)}
                                </Text>
                            </View>
                        </View>
                    </View>

                    <View
                        className="px-6 pt-6 rounded-t-[32px] bg-card flex-1"
                        style={{ paddingBottom: Math.max(insets.bottom + 24, 48) }}
                    >
                        {/* Account Name */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                            Account Name
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Main Wallet, BCA, Neo"
                            placeholderTextColor="#999999"
                            className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium mb-5 text-foreground"
                            returnKeyType="next"
                        />

                        {/* Current Balance */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                            Current Balance
                        </Text>
                        <TextInput
                            value={currentBalance}
                            onChangeText={setCurrentBalance}
                            placeholder="0"
                            placeholderTextColor="#999999"
                            keyboardType="numeric"
                            className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium mb-5 text-foreground"
                            returnKeyType="next"
                        />

                        {/* Institution */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                            Institution (Optional)
                        </Text>
                        <TextInput
                            value={institution}
                            onChangeText={setInstitution}
                            placeholder="e.g. VISA, Mastercard, Bank Name"
                            placeholderTextColor="#999999"
                            className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium mb-5 text-foreground"
                            returnKeyType="next"
                        />

                        {/* Account Number */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2">
                            Account Number (Optional)
                        </Text>
                        <TextInput
                            value={accountNumber}
                            onChangeText={setAccountNumber}
                            placeholder="e.g. 1234 5678 9012 3456"
                            placeholderTextColor="#999999"
                            keyboardType="numeric"
                            className="rounded-2xl border border-border bg-card px-4 py-3.5 text-sm font-medium mb-5 text-foreground"
                            returnKeyType="done"
                        />

                        {/* Type */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3 mt-2">
                            Account Type
                        </Text>
                        <View className="flex-row flex-wrap gap-2 mb-5">
                            {ACCOUNT_TYPES.map((t) => (
                                <Pressable
                                    key={t.value}
                                    onPress={() => setSelectedType(t.value)}
                                    className={`flex-1 py-3.5 rounded-2xl items-center active:opacity-70 border ${selectedType === t.value ? "bg-primary border-primary" : "bg-card border-border"}`}
                                    style={{ minWidth: "40%" }}
                                >
                                    <Text
                                        className={`text-sm font-bold tracking-wide ${selectedType === t.value ? "text-primary-foreground" : "text-secondary-foreground"}`}
                                    >
                                        {t.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {/* Color */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3">
                            Card Color
                        </Text>
                        <View
                            className="flex-row flex-wrap mb-5"
                            style={{ marginHorizontal: -4 }}
                        >
                            {ACCOUNT_COLORS.map((color) => (
                                <View
                                    key={color}
                                    style={{ width: "16.66%", padding: 4, alignItems: "center" }}
                                >
                                    <Pressable
                                        onPress={() => setSelectedColor(color)}
                                        className="w-10 h-10 rounded-full items-center justify-center active:opacity-70"
                                        style={[{ backgroundColor: color }]}
                                    >
                                        {selectedColor === color && (
                                            <Check size={16} color={["#E5E7EB", "#FBBF24"].includes(color) ? "#000" : "#fff"} strokeWidth={3} />
                                        )}
                                    </Pressable>
                                </View>
                            ))}
                        </View>

                        {/* Include in Net Worth */}
                        <View className="flex-row items-center justify-between mb-6 mt-2 bg-muted p-4 rounded-2xl">
                            <View className="flex-1 mr-4">
                                <Text className="text-foreground text-sm font-bold mb-1">
                                    Include in Net Worth
                                </Text>
                                <Text className="text-secondary-foreground text-xs">
                                    Include this account's balance in your total net worth calculation.
                                </Text>
                            </View>
                            <Switch
                                value={includeInNetWorth}
                                onValueChange={setIncludeInNetWorth}
                                trackColor={{ false: "#D1D5DB", true: "#3D9B35" }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <Pressable
                            onPress={handleDelete}
                            disabled={deleting}
                            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-destructive/10 active:opacity-70 mb-8"
                        >
                            {deleting ? (
                                <ActivityIndicator size="small" color="#E53935" />
                            ) : (
                                <>
                                    <Trash2 size={18} color="#E53935" strokeWidth={2.5} />
                                    <Text className="text-[#E53935] font-bold text-sm">Delete Account</Text>
                                </>
                            )}
                        </Pressable>

                    </View>
                </ScrollView>
            </SafeAreaView>

            <ConfirmModal
                visible={showConfirmDelete}
                title="Delete Account"
                description={`Are you sure you want to delete "${name}"? This will hide it from your lists.`}
                confirmText="Delete"
                isDestructive={true}
                loading={deleting}
                onCancel={() => setShowConfirmDelete(false)}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}
