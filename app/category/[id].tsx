import { useAuth } from "@/lib/auth/AuthContext";
import {
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    CATEGORY_TYPES,
} from "@/lib/category/constants";
import { getCategoryById, updateCategory } from "@/lib/supabase/categories";
import { router, useLocalSearchParams } from "expo-router";
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
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    SafeAreaView,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

// ── Icon map ────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Gift,
  Car,
  Coffee,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Zap,
  Wifi,
  Phone,
  Tv,
  Heart,
  Pill,
  Home,
  Briefcase,
  GraduationCap,
  Music,
  Dumbbell,
  Bike,
  Ticket,
  Star,
  Package,
  Pizza,
  BookOpen,
  TreePalm,
  Percent,
  Banknote,
  Wallet,
  CreditCard,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
};

function hexToRgba(hex: string, alpha = 0.12) {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ── Main component ───────────────────────────────────────────────────────────

export default function EditCategoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS[0]);
  const [selectedType, setSelectedType] = useState("expense");
  const [isSystem, setIsSystem] = useState(false);
  const [loadingInit, setLoadingInit] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    getCategoryById(id)
      .then((cat) => {
        setName(cat.name);
        setSelectedIcon(cat.icon);
        setSelectedColor(cat.color ?? CATEGORY_COLORS[0]);
        setSelectedType(cat.type);
        setIsSystem(cat.is_system);
      })
      .catch(() => Alert.alert("Error", "Could not load category."))
      .finally(() => setLoadingInit(false));
  }, [id]);

  const handleSave = async () => {
    if (!user || !id) return;
    if (!name.trim()) {
      Alert.alert("Validation", "Category name is required.");
      return;
    }

    try {
      setSaving(true);
      await updateCategory(id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
        type: selectedType,
      });
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Could not update category.");
    } finally {
      setSaving(false);
    }
  };

  const PreviewIcon = selectedIcon
    ? (ICON_MAP[selectedIcon] ?? HelpCircle)
    : HelpCircle;

  if (loadingInit) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#5B8F85" />
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
        {/* Header */}
        <View className="px-6 pt-5 pb-3 flex-row items-center justify-center relative">
          <View className="absolute left-6">
            <Pressable
              onPress={() => {
                router.back();
              }}
              className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border"
            >
              <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
            </Pressable>
          </View>
          <Text
            style={{ fontFamily: "Handjet_700Bold" }}
            className="text-foreground text-3xl"
          >
            Edit Category
          </Text>
          <View className="absolute right-6">
            <Pressable
              onPress={handleSave}
              disabled={saving || isSystem}
              className={`w-10 h-10 rounded-xl items-center justify-center active:opacity-70 bg-primary ${isSystem ? "opacity-50" : ""}`}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Check size={18} color="#fff" strokeWidth={2.5} />
              )}
            </Pressable>
          </View>
        </View>

        {/* System category banner */}
        {isSystem && (
          <View className="mx-4 mb-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
            <Text className="text-orange-600 text-xs font-medium">
              System categories are read-only.
            </Text>
          </View>
        )}

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

          <View
            className="px-6 pt-6 rounded-t-[32px] bg-card flex-1"
            style={{ paddingBottom: Math.max(insets.bottom + 24, 48) }}
          >
            {/* Category Name */}
            <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-2 mt-2">
              Category Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Food & Drinks"
              placeholderTextColor="#999999"
              editable={!isSystem}
              className={`rounded-2xl border border-border px-4 py-3.5 text-sm font-medium mb-5 ${isSystem ? "bg-muted opacity-60" : "bg-card text-foreground"}`}
              returnKeyType="done"
            />

            {/* Category Icon */}
            <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3">
              Category Icon
            </Text>
            <View
              className="flex-row flex-wrap mb-5"
              style={{ marginHorizontal: -4 }}
            >
              {CATEGORY_ICONS.map(({ name: iconName, label }) => {
                const Icon = ICON_MAP[iconName] ?? HelpCircle;
                const isSelected = selectedIcon === iconName;
                return (
                  <View key={iconName} style={{ width: "16.666%", padding: 4 }}>
                    <Pressable
                      onPress={() => !isSystem && setSelectedIcon(iconName)}
                      disabled={isSystem}
                      className={`aspect-square w-full items-center justify-center rounded-2xl active:opacity-70 ${!isSelected ? "bg-card border border-border" : ""} ${isSystem ? "opacity-50" : ""}`}
                      style={[
                        isSelected
                          ? {
                              backgroundColor: hexToRgba(selectedColor, 0.15),
                              borderWidth: 2,
                              borderColor: selectedColor,
                            }
                          : {},
                      ]}
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
            <Text className="text-secondary-foreground text-xs font-semibold uppercase tracking-widest mb-3">
              Category Color
            </Text>
            <View
              className="flex-row flex-wrap mb-5"
              style={{ marginHorizontal: -4 }}
            >
              {CATEGORY_COLORS.map((color) => (
                <View
                  key={color}
                  style={{ width: "14.285%", padding: 4, alignItems: "center" }}
                >
                  <Pressable
                    onPress={() => !isSystem && setSelectedColor(color)}
                    disabled={isSystem}
                    className="w-8 h-8 rounded-full items-center justify-center active:opacity-70"
                    style={[
                      { backgroundColor: color },
                      isSystem ? { opacity: 0.5 } : {},
                    ]}
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
              {CATEGORY_TYPES.map((t) => (
                <Pressable
                  key={t.value}
                  onPress={() => !isSystem && setSelectedType(t.value)}
                  disabled={isSystem}
                  className={`flex-1 py-3.5 rounded-2xl items-center active:opacity-70 border ${selectedType === t.value ? "bg-primary border-primary" : "bg-card border-border"} ${isSystem ? "opacity-50" : ""}`}
                >
                  <Text
                    className={`text-sm font-bold tracking-wide ${selectedType === t.value ? "text-primary-foreground" : "text-secondary-foreground"}`}
                  >
                    {t.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
