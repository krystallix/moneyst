import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth/AuthContext";
import { deleteCategory, getCategories, type Category } from "@/lib/supabase/categories";
import { router, useFocusEffect } from "expo-router";
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
    Plus,
    ShoppingBag,
    ShoppingCart,
    Star,
    Ticket,
    Trash2,
    TreePalm,
    TrendingUp,
    Tv,
    Utensils,
    Wallet,
    Wifi,
    Zap
} from "lucide-react-native";
import { useCallback, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    RefreshControl,
    SectionList,
    Text,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// ── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
    Utensils, Gift, Car, Coffee, ShoppingBag, ShoppingCart,
    TrendingUp, Zap, Wifi, Phone, Tv, Heart, Pill, Home,
    Briefcase, GraduationCap, Music, Dumbbell, Bike, Ticket,
    Star, Package, Pizza, BookOpen, TreePalm, Percent,
    Banknote, Wallet, CreditCard, Clock,
    ArrowDownLeft, ArrowUpRight, ArrowLeftRight,
};

function getCategoryIcon(name: string | null | undefined): LucideIcon {
    if (!name) return HelpCircle;
    return ICON_MAP[name] ?? HelpCircle;
}

function hexToRgba(hex: string | null, alpha = 0.12): string {
    if (!hex) return `rgba(61,155,53,${alpha})`;
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

// ── Category row ────────────────────────────────────────────────────────────

function CategoryRow({
    item,
    onEdit,
    onDelete,
}: {
    item: Category;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const Icon = getCategoryIcon(item.icon);
    const color = item.color ?? "#3D9B35";
    const bg = hexToRgba(color, 0.10);

    return (
        <Pressable
            onPress={onEdit}
            className="flex-row items-center py-3.5 px-4 bg-white shadow-sm rounded-3xl mb-3 active:opacity-70 "
        >
            {/* Icon */}
            <View className="w-12 h-12 rounded-full items-center justify-center mr-3.5" style={{ backgroundColor: bg }}>
                <Icon size={20} color={color} strokeWidth={2.5} />
            </View>

            {/* Name + type */}
            <View className="flex-1">
                <Text className="text-foreground text-sm font-bold tracking-tight" numberOfLines={1}>
                    {item.name}
                </Text>
                <Text className="text-secondary-foreground text-xs font-medium mt-0.5 capitalize">
                    {item.type}{item.is_system ? " · System" : ""}
                </Text>
            </View>

            {/* Color dot */}

            {/* Delete (only user-owned) */}
            {!item.is_system && (
                <Pressable
                    onPress={onDelete}
                    hitSlop={8}
                    className="w-8 h-8 rounded-xl items-center justify-center mr-3 active:opacity-60 bg-destructive/10"
                >
                    <Trash2 size={15} color="#E53935" strokeWidth={2} />
                </Pressable>
            )}

        </Pressable>
    );
}

// ── Main screen ─────────────────────────────────────────────────────────────

export default function CategoryScreen() {
    const { user } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    
    // Modal state
    const [confirmDeleteCat, setConfirmDeleteCat] = useState<Category | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (!user) return;
        if (isRefresh) setRefreshing(true);
        try {
            const data = await getCategories(user.id);
            setCategories(data);
        } catch (e) {
            console.warn("CategoryScreen load error:", e);
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

    const handleDelete = (cat: Category) => {
        setConfirmDeleteCat(cat);
    };

    const [errorMsg, setErrorMsg] = useState<{ title: string, description: string } | null>(null);

    const handleDeleteConfirm = async () => {
        if (!confirmDeleteCat) return;
        setIsDeleting(true);
        try {
            await deleteCategory(confirmDeleteCat.id);
            setCategories(prev => prev.filter(c => c.id !== confirmDeleteCat.id));
            setConfirmDeleteCat(null);
        } catch {
            setErrorMsg({ title: "Error", description: "Could not delete category." });
            setConfirmDeleteCat(null);
        } finally {
            setIsDeleting(false);
        }
    };

    // Group by type
    const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
        const key = cat.type.charAt(0).toUpperCase() + cat.type.slice(1);
        if (!acc[key]) acc[key] = [];
        acc[key].push(cat);
        return acc;
    }, {});

    const sections = Object.entries(grouped).map(([title, data]) => ({ title, data }));

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
                        Category
                    </Text>

                    <View className="absolute right-6">
                        <Pressable
                            onPress={() => router.push("/category/new")}
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
                    <SectionList
                        sections={sections}
                        keyExtractor={(item) => item.id}
                        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={() => load(true)}
                                tintColor="#5B8F85"
                                colors={["#5B8F85"]}
                            />
                        }
                        renderSectionHeader={({ section }) => (
                            <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3 mt-4 ml-1">
                                {section.title}
                            </Text>
                        )}
                        renderItem={({ item }) => (
                            <CategoryRow
                                item={item}
                                onEdit={() => router.push(`/category/${item.id}`)}
                                onDelete={() => handleDelete(item)}
                            />
                        )}
                        ListEmptyComponent={
                            <View className="items-center py-16 gap-3">
                                <View className="w-16 h-16 rounded-2xl items-center justify-center bg-primary">
                                    <HelpCircle size={28} color="#5B8F85" strokeWidth={2} />
                                </View>
                                <Text className="text-secondary-foreground text-sm text-center">
                                    No categories yet.{"\n"}Tap + to add one.
                                </Text>
                            </View>
                        }
                    />
                )}
            </SafeAreaView>

            <ConfirmModal
                visible={!!confirmDeleteCat}
                title="Delete Category"
                description={confirmDeleteCat ? `Are you sure you want to delete "${confirmDeleteCat.name}"? This action cannot be undone.` : ""}
                confirmText="Delete"
                isDestructive={true}
                loading={isDeleting}
                onCancel={() => setConfirmDeleteCat(null)}
                onConfirm={handleDeleteConfirm}
            />

            <ConfirmModal
                visible={!!errorMsg}
                title={errorMsg?.title ?? "Error"}
                description={errorMsg?.description ?? ""}
                confirmText="OK"
                isDestructive={true}
                singleButton={true}
                onConfirm={() => setErrorMsg(null)}
            />
        </View>
    );
}