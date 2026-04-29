// app/onboarding/profile.tsx
import timezones from "@/constant/timezones.json";
import { useAuth } from "@/lib/auth/AuthContext";
import { updateProfile } from "@/lib/profile/profile";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Check, Clock, Mail, Search } from "lucide-react-native";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Animated,
    KeyboardAvoidingView,
    Modal,
    Platform,
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

const CURRENCY_OPTIONS = ["IDR", "USD", "EUR"] as const;

const LOCALES = [
    { code: "id-ID", label: "Indonesia", flag: "🇮🇩" },
    { code: "en-US", label: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
] as const;

const CURRENCY_SYMBOLS: Record<(typeof CURRENCY_OPTIONS)[number], string> = {
    IDR: "Rp",
    USD: "$",
    EUR: "€",
};

type LocaleCode = (typeof LOCALES)[number]["code"];

type TimezoneItem = {
    value: string;
    abbr: string;
    offset: number;
    isdst: boolean;
    text: string;
    utc: string[];
};

// ─── UI helpers ──────────────────────────────────────────────────────────────

export function SectionLabel({ children }: { children: string }) {
    return (
        <Text className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {children}
        </Text>
    );
}

export function Pill({
    active,
    children,
    onPress,
}: {
    active: boolean;
    children: React.ReactNode;
    onPress: () => void;
}) {
    return (
        <Pressable
            onPress={onPress}
            className={`flex-1 items-center gap-0.5 rounded-xl border py-3 ${active ? "border-primary bg-primary" : "border-border bg-background"
                }`}
        >
            {children}
        </Pressable>
    );
}

// ─── Timezone Picker Modal ───────────────────────────────────────────────────

type TimezoneOption = {
    id: string;
    label: string;
    offset: number;
};

export function TimezonePickerModal(props: {
    visible: boolean;
    value: string;
    options: TimezoneOption[];
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    const { visible, value, options, onSelect, onClose } = props;

    const [query, setQuery] = useState("");
    const insets = useSafeAreaInsets();

    const slideAnim = useRef(new Animated.Value(300)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            setQuery("");
            Animated.parallel([
                Animated.spring(slideAnim, {
                    toValue: 0,
                    damping: 20,
                    stiffness: 180,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 300,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(backdropAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [visible, backdropAnim, slideAnim]);

    const filtered = useMemo(() => {
        if (!query.trim()) return options;
        const q = query.toLowerCase();
        return options.filter(
            (tz) =>
                tz.label.toLowerCase().includes(q) ||
                tz.id.toLowerCase().includes(q),
        );
    }, [options, query]);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            {/* Backdrop */}
            <Animated.View
                style={{ opacity: backdropAnim }}
                className="absolute inset-0 bg-black/50"
            >
                <Pressable className="flex-1" onPress={onClose} />
            </Animated.View>

            {/* Sheet + keyboard handling */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={insets.top + 40}
                style={{ flex: 1, justifyContent: "flex-end" }}
            >
                <Animated.View
                    style={[
                        { transform: [{ translateY: slideAnim }] },
                        { paddingBottom: insets.bottom, maxHeight: "85%" },
                    ]}
                    className="w-full overflow-hidden rounded-t-3xl bg-background"
                >
                    {/* Handle */}
                    <View className="items-center pt-3 pb-1">
                        <View className="h-1 w-10 rounded-full bg-muted-foreground/30" />
                    </View>

                    {/* Header */}
                    <View className="flex-row items-center justify-between px-5 py-3">
                        <Text className="text-lg font-semibold text-foreground">
                            Select Timezone
                        </Text>
                        <Pressable
                            onPress={onClose}
                            className="h-8 w-8 items-center justify-center rounded-full bg-muted"
                            hitSlop={8}
                        >
                            <Text className="text-sm font-medium text-muted-foreground">
                                ✕
                            </Text>
                        </Pressable>
                    </View>

                    {/* Search */}
                    <View className="mx-5 mb-3 flex-row items-center gap-2 rounded-xl bg-muted px-3">
                        <Search size={14} strokeWidth={2} className="text-foreground" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search timezone..."
                            placeholderTextColor="#9ca3af"
                            className="flex-1 py-3 text-sm text-foreground"
                            autoCapitalize="none"
                            autoCorrect={false}
                            clearButtonMode="while-editing"
                        />
                    </View>

                    {/* List */}
                    <ScrollView
                        style={{ flexShrink: 1, minHeight: 200 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {filtered.length === 0 ? (
                            <View className="items-center py-12">
                                <Text className="mb-2 text-3xl">🕐</Text>
                                <Text className="text-sm text-muted-foreground">
                                    No timezones found
                                </Text>
                            </View>
                        ) : (
                            filtered.map((tz, index) => {
                                const isSelected = tz.id === value;
                                const offset =
                                    tz.offset >= 0 ? `+${tz.offset}` : `${tz.offset}`;
                                return (
                                    <Pressable
                                        key={`${tz.id}-${index}`}
                                        onPress={() => {
                                            onSelect(tz.id);
                                            onClose();
                                        }}
                                        className={`flex-row items-center justify-between px-5 py-3.5 ${isSelected ? "bg-primary/8" : ""
                                            }`}
                                    >
                                        <View className="mr-3 flex-1">
                                            <Text
                                                numberOfLines={1}
                                                className={`text-sm ${isSelected
                                                    ? "font-semibold text-primary"
                                                    : "text-foreground"
                                                    }`}
                                            >
                                                {tz.id}
                                            </Text>
                                            <Text
                                                numberOfLines={1}
                                                className="mt-0.5 text-xs text-muted-foreground"
                                            >
                                                UTC{offset}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                <Text className="text-xs font-bold text-primary-foreground">
                                                    ✓
                                                </Text>
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })
                        )}
                    </ScrollView>
                </Animated.View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

// ─── Constants & UI Helpers ──────────────────────────────────────────────────

const C = {
    primary: "#5B8F85",
    primaryBg: "rgba(91,143,133,0.12)",
    border: "#EBEBEB",
    textMain: "#1A1A1A",
    textMuted: "#AAAAAA",
    textSecondary: "#666666",
    surface: "#F7F7F7",
    white: "#ffffff",
} as const;

function GroupLabel({ children }: { children: string }) {
    return (
        <Text
            className="text-xs font-semibold tracking-widest uppercase px-1 mb-2"
            style={{ color: C.textMuted }}
        >
            {children}
        </Text>
    );
}

function SettingRow({
    label,
    value,
    onPress,
    icon,
    last = false,
}: {
    label: string;
    value?: string;
    onPress?: () => void;
    icon?: React.ReactNode;
    last?: boolean;
}) {
    const Inner = (
        <View
            className="flex-row items-center px-4 py-3.5"
            style={!last ? { borderBottomWidth: 1, borderBottomColor: C.border } : undefined}
        >
            {icon && <View className="mr-3">{icon}</View>}
            <Text className="flex-1 text-sm font-medium" style={{ color: C.textMain }}>
                {label}
            </Text>
            {value ? (
                <Text className="text-sm mr-2" style={{ color: C.textMuted }} numberOfLines={1}>
                    {value}
                </Text>
            ) : null}
            {onPress && <Text className="text-xs" style={{ color: C.textMuted }}>▼</Text>}
        </View>
    );

    if (!onPress) return Inner;
    return (
        <Pressable onPress={onPress} className="active:opacity-60">
            {Inner}
        </Pressable>
    );
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <View
            className="rounded-2xl overflow-hidden"
            style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border }}
        >
            {children}
        </View>
    );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OnboardingProfileScreen() {
    const { user, loading: authLoading } = useAuth();
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [preferredCurrency, setPreferredCurrency] =
        useState<(typeof CURRENCY_OPTIONS)[number]>("IDR");
    const [timezone, setTimezone] = useState<string>("Asia/Jakarta");
    const [locale, setLocale] = useState<LocaleCode>("id-ID");
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

    const timezoneOptions: TimezoneOption[] = useMemo(() => {
        const raw = (timezones as TimezoneItem[]).flatMap((tz) =>
            tz.utc.map((u) => ({ id: u, label: `${tz.text} - ${u}`, offset: tz.offset }))
        );
        const seen = new Set<string>();
        return raw
            .filter((item) => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            })
            .sort((a, b) => a.offset - b.offset || a.label.localeCompare(b.label));
    }, []);

    const selectedTimezoneLabel = useMemo(() => {
        const found = timezoneOptions.find((t) => t.id === timezone);
        if (!found) return timezone;
        const sign = found.offset >= 0 ? "+" : "";
        return `${timezone}  (UTC${sign}${found.offset})`;
    }, [timezoneOptions, timezone]);

    const selectedLocaleLabel = LOCALES.find((l) => l.code === locale);

    // Redirect jika tidak ada session; populasi form dari user metadata
    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.replace("/get-started");
            return;
        }

        const meta = (user.user_metadata ?? {}) as Record<string, string>;
        setFullName(meta.full_name ?? meta.name ?? meta.display_name ?? "");
        setEmail(user.email ?? "");
    }, [user, authLoading]);

    const handleContinue = async () => {
        try {
            setLoading(true);
            setFormError(null);

            if (!user) {
                router.replace("/get-started");
                return;
            }

            const meta = (user.user_metadata ?? {}) as Record<string, string>;
            const avatar = meta.avatar_url ?? meta.picture ?? null;

            if (!user.email) {
                setFormError("Invalid email.");
                return;
            }

            const { error } = await updateProfile(
                user,
                fullName,
                avatar,
                preferredCurrency,
                timezone,
                locale
            );
            if (error) {
                setFormError(error.message);
                return;
            }

            router.replace("/");
        } catch (err: any) {
            setFormError(err.message ?? "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1" style={{ backgroundColor: C.surface }}>
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "android" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="mt-2 mb-8 px-2">
                        <Text className="text-3xl font-bold tracking-tight" style={{ color: C.textMain }}>
                            Complete your profile
                        </Text>
                        <Text className="mt-1.5 text-sm leading-relaxed" style={{ color: C.textSecondary }}>
                            Personalize your experience with a few quick settings.
                        </Text>
                    </View>

                    <View className="gap-y-6">
                        {/* ── Identity ── */}
                        <View>
                            <GroupLabel>Identity</GroupLabel>
                            <Card>
                                {/* Full Name */}
                                <View
                                    className="px-4 py-1"
                                    style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
                                >
                                    <Text className="text-xs mt-2 font-medium" style={{ color: C.textMuted }}>
                                        Full name
                                    </Text>
                                    <TextInput
                                        value={fullName}
                                        onChangeText={setFullName}
                                        placeholder="Your name"
                                        placeholderTextColor={C.textMuted}
                                        className="py-2 text-sm font-semibold"
                                        style={{ color: C.textMain }}
                                        returnKeyType="next"
                                    />
                                </View>

                                {/* Email */}
                                <View className="flex-row items-center px-4 py-3 bg-muted">
                                    <Mail size={14} strokeWidth={2} color={C.textMuted} />
                                    <Text
                                        className="flex-1 ml-2 text-sm font-medium"
                                        style={{ color: C.textMuted }}
                                        numberOfLines={1}
                                    >
                                        {email}
                                    </Text>
                                    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: C.surface }}>
                                        <Text className="text-xs" style={{ color: C.textMuted }}>
                                            verified
                                        </Text>
                                    </View>
                                </View>
                            </Card>
                        </View>

                        {/* ── Preferences ── */}
                        <View>
                            <GroupLabel>Preferences</GroupLabel>
                            <Card>
                                {/* Currency */}
                                <View
                                    className="px-4 pt-3.5 pb-3"
                                    style={{ borderBottomWidth: 1, borderBottomColor: C.border }}
                                >
                                    <Text className="text-xs mb-2.5 font-medium" style={{ color: C.textMuted }}>
                                        Currency
                                    </Text>
                                    <View className="flex-row gap-2">
                                        {CURRENCY_OPTIONS.map((c) => {
                                            const isActive = preferredCurrency === c;
                                            return (
                                                <Pressable
                                                    key={c}
                                                    onPress={() => setPreferredCurrency(c)}
                                                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-xl active:opacity-60"
                                                    style={{
                                                        borderWidth: 1.5,
                                                        borderColor: isActive ? C.primary : C.border,
                                                        backgroundColor: isActive ? C.primaryBg : C.surface,
                                                    }}
                                                >
                                                    <Text
                                                        className="text-sm font-bold"
                                                        style={{ color: isActive ? C.primary : C.textSecondary }}
                                                    >
                                                        {CURRENCY_SYMBOLS[c]}
                                                    </Text>
                                                    <Text
                                                        className="text-xs font-semibold"
                                                        style={{ color: isActive ? C.primary : C.textMuted }}
                                                    >
                                                        {c}
                                                    </Text>
                                                </Pressable>
                                            );
                                        })}
                                    </View>
                                </View>

                                {/* Timezone */}
                                <SettingRow
                                    label="Timezone"
                                    value={selectedTimezoneLabel}
                                    onPress={() => setIsTimezoneOpen(true)}
                                    icon={<Clock size={15} color={C.textMuted} />}
                                />
                            </Card>
                        </View>

                        {/* Language picker inline */}
                        <View>
                            <GroupLabel>Language</GroupLabel>
                            <View className="gap-y-1.5">
                                {LOCALES.map((l) => {
                                    const isActive = locale === l.code;
                                    return (
                                        <Pressable
                                            key={l.code}
                                            onPress={() => setLocale(l.code)}
                                            className="flex-row items-center gap-3 px-4 py-3 rounded-xl active:opacity-60"
                                            style={{
                                                backgroundColor: isActive ? C.primaryBg : C.white,
                                                borderWidth: 1,
                                                borderColor: isActive ? C.primary : C.border,
                                            }}
                                        >
                                            <Text className="text-base">{l.flag}</Text>
                                            <Text
                                                className="flex-1 text-sm font-medium"
                                                style={{ color: isActive ? C.primary : C.textSecondary }}
                                            >
                                                {l.label}
                                            </Text>
                                            {isActive && <Check size={15} color={C.primary} />}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Error */}
                        {formError && (
                            <View
                                className="mt-2 rounded-xl px-4 py-3 border border-red-200"
                                style={{ backgroundColor: "#FFF5F5" }}
                            >
                                <Text className="text-sm text-red-500">{formError}</Text>
                            </View>
                        )}

                        {/* CTA */}
                        <Pressable
                            disabled={loading}
                            onPress={handleContinue}
                            className={`mt-4 items-center justify-center rounded-xl px-4 py-4 ${loading ? "bg-muted" : ""}`}
                            style={!loading ? { backgroundColor: C.primary } : {}}
                        >
                            <Text
                                className="text-base font-semibold"
                                style={{ color: loading ? C.textMuted : C.white }}
                            >
                                {loading ? "Saving..." : "Continue →"}
                            </Text>
                        </Pressable>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>

            {/* Timezone Modal */}
            <TimezonePickerModal
                visible={isTimezoneOpen}
                value={timezone}
                options={timezoneOptions}
                onSelect={setTimezone}
                onClose={() => setIsTimezoneOpen(false)}
            />
        </SafeAreaView>
    );
}