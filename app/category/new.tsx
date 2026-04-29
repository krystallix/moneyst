import { useAuth } from "@/lib/auth/AuthContext";
import { CATEGORY_COLORS, CATEGORY_ICONS, CATEGORY_TYPES } from "@/lib/category/constants";
import { addCategory } from "@/lib/supabase/categories";
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
    Check,
    ChevronLeft,
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
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    TreePalm,
    TrendingUp,
    Tv,
    Utensils,
    Wallet,
    Wifi,
    Zap,
} from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

// ── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    Utensils, Gift, Car, Coffee, ShoppingBag, ShoppingCart,
    TrendingUp, Zap, Wifi, Phone, Tv, Heart, Pill, Home,
    Briefcase, GraduationCap, Music, Dumbbell, Bike, Ticket,
    Star, Package, Pizza, BookOpen, TreePalm, Percent,
    Banknote, Wallet, CreditCard, Clock,
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
};

function hexToRgba(hex: string, alpha = 0.12) {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main component ───────────────────────────────────────────────────────────

import { ConfirmModal } from "@/components/ConfirmModal";

export default function NewCategoryScreen() {
    const { user } = useAuth();
    const insets = useSafeAreaInsets();

    const [name, setName] = useState("");
    const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
    const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
    const [selectedType, setSelectedType] = useState("expense");
    const [saving, setSaving] = useState(false);
    const [alertMsg, setAlertMsg] = useState<{ title: string, description: string } | null>(null);

    const handleSave = async () => {
        if (!user) return;
        if (!name.trim()) {
            setAlertMsg({ title: "Validation", description: "Category name is required." });
            return;
        }

        try {
            setSaving(true);
            await addCategory({
                user_id: user.id,
                name: name.trim(),
                icon: selectedIcon,
                color: selectedColor,
                type: selectedType,
                is_active: true,
            });
            router.back();
        } catch (e: any) {
            setAlertMsg({ title: "Error", description: e?.message ?? "Could not save category." });
        } finally {
            setSaving(false);
        }
    };

    const previewIcon = selectedIcon ? (ICON_MAP[selectedIcon] ?? HelpCircle) : HelpCircle;
    const PreviewIcon = previewIcon;

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 bg-background" edges={['top']}>
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
                        New Category
                    </Text>
                    <View className="absolute right-6">
                        <Pressable
                            onPress={handleSave}
                            disabled={saving}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 bg-primary"
                        >
                            {saving
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <Check size={18} color="#fff" strokeWidth={2.5} />}
                        </Pressable>
                    </View>
                </View>

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ flexGrow: 1 }}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Preview */}
                    <View className="items-center py-6">
                        <View
                            className="w-16 h-16 rounded-2xl items-center justify-center mb-3"
                            style={{ backgroundColor: hexToRgba(selectedColor, 0.15) }}
                        >
                            <PreviewIcon size={28} color={selectedColor} strokeWidth={2} />
                        </View>
                        <Text className="text-secondary-foreground text-xs">
                            {name.trim() || "Category name"}
                        </Text>
                    </View>

                    <View className="px-6 pt-6 rounded-t-[32px] bg-card flex-1" style={{ paddingBottom: Math.max(insets.bottom + 24, 48) }}>
                        {/* Category Name */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2 mt-2">
                            Category Name
                        </Text>
                        <TextInput
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g. Food & Drinks"
                            placeholderTextColor="#999999"
                            className="rounded-2xl border border-border px-4 py-3.5 text-sm font-medium mb-5 bg-card text-foreground"
                            autoFocus
                            returnKeyType="done"
                        />

                        {/* Category Icon */}
                        <Text className="text-secondary-foreground text-[11px] font-semibold uppercase tracking-widest mb-3">
                            Category Icon
                        </Text>
                        <View className="flex-row flex-wrap mb-5" style={{ marginHorizontal: -4 }}>
                            {CATEGORY_ICONS.map(({ name: iconName, label }) => {
                                const Icon = ICON_MAP[iconName] ?? HelpCircle;
                                const isSelected = selectedIcon === iconName;
                                return (
                                    <View key={iconName} style={{ width: '16.666%', padding: 4 }}>
                                        <Pressable
                                            onPress={() => setSelectedIcon(iconName)}
                                            className={`aspect-square w-full items-center justify-center rounded-2xl active:opacity-70 ${!isSelected ? 'bg-card border border-border' : ''}`}
                                            style={isSelected
                                                ? { backgroundColor: hexToRgba(selectedColor, 0.15), borderWidth: 2, borderColor: selectedColor }
                                                : {}
                                            }
                                        >
                                            <Icon
                                                size={20}
                                                color={isSelected ? selectedColor : "#999999"}
                                                strokeWidth={isSelected ? 2.5 : 2}
                                            />
                                        </Pressable>
                                    </View>
                                );
                            })}
                        </View>

                        {/* Category Color */}
                        <Text className="text-secondary-foreground text-[11px] font-semibold uppercase tracking-widest mb-3">
                            Category Color
                        </Text>
                        <View className="flex-row flex-wrap mb-5" style={{ marginHorizontal: -4 }}>
                            {CATEGORY_COLORS.map(color => (
                                <View key={color} style={{ width: '14.285%', padding: 4, alignItems: 'center' }}>
                                    <Pressable
                                        onPress={() => setSelectedColor(color)}
                                        className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
                                        style={{ backgroundColor: color }}
                                    >
                                        {selectedColor === color && (
                                            <Check size={14} color="#fff" strokeWidth={3} />
                                        )}
                                    </Pressable>
                                </View>
                            ))}
                        </View>

                        {/* Type */}
                        <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3 mt-2">
                            Type
                        </Text>
                        <View className="flex-row gap-2 mb-5">
                            {CATEGORY_TYPES.map(t => (
                                <Pressable
                                    key={t.value}
                                    onPress={() => setSelectedType(t.value)}
                                    className={`flex-1 py-3.5 rounded-2xl items-center active:opacity-70 border ${selectedType === t.value ? 'bg-primary border-primary' : 'bg-card border-border'}`}
                                >
                                    <Text
                                        className={`text-sm font-bold tracking-wide ${selectedType === t.value ? 'text-primary-foreground' : 'text-secondary-foreground'}`}
                                    >
                                        {t.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </ScrollView>
            </SafeAreaView>

            <ConfirmModal
                visible={!!alertMsg}
                title={alertMsg?.title ?? ""}
                description={alertMsg?.description ?? ""}
                confirmText="OK"
                singleButton={true}
                onConfirm={() => setAlertMsg(null)}
            />
        </>
    );
}
