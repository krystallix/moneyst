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
            tz.utc.map((u) => ({
                id: u,
                label: `${tz.text} - ${u}`,
                offset: tz.offset,
            })),
        );

        const seen = new Set<string>();
        const unique = raw.filter((item) => {
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        });

        return unique.sort(
            (a, b) => a.offset - b.offset || a.label.localeCompare(b.label),
        );
    }, []);

    const selectedTimezoneLabel = useMemo(() => {
        const found = timezoneOptions.find((t) => t.id === timezone);
        if (!found) return timezone;
        const offset =
            found.offset >= 0 ? `+${found.offset}` : `${found.offset}`;
        return `${timezone}  ·  UTC${offset}`;
    }, [timezoneOptions, timezone]);

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
        <SafeAreaView className="flex-1 bg-background">
            <StatusBar style="dark" />

            <KeyboardAvoidingView
                className="flex-1"
                behavior={Platform.OS === "android" ? "padding" : undefined}
            >
                <ScrollView
                    contentContainerStyle={{ padding: 24, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header */}
                    <View className="mt-2 mb-8">
                        <Text className="text-2xl font-bold tracking-tight text-foreground">
                            Complete your profile
                        </Text>
                        <Text className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                            Personalize your experience with a few quick settings.
                        </Text>
                    </View>

                    <View className="gap-y-6">
                        {/* Full Name */}
                        <View>
                            <SectionLabel>Full name</SectionLabel>
                            <TextInput
                                value={fullName}
                                onChangeText={setFullName}
                                placeholder="Your name"
                                placeholderTextColor="#9ca3af"
                                className="rounded-xl border border-border bg-background px-4 py-3.5 text-sm text-foreground"
                                returnKeyType="next"
                            />
                        </View>

                        {/* Email */}
                        <View>
                            <SectionLabel>Email</SectionLabel>
                            <View className="flex-row items-center gap-2 rounded-xl border border-border bg-muted px-4 py-3.5">
                                <Mail size={14} strokeWidth={2} className="text-foreground" />
                                <Text
                                    className="flex-1 text-sm text-muted-foreground"
                                    numberOfLines={1}
                                >
                                    {email}
                                </Text>
                                <View className="rounded-full bg-muted-foreground/15 px-2 py-0.5">
                                    <Text className="text-xs text-muted-foreground">
                                        verified
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Currency */}
                        <View>
                            <SectionLabel>Primary currency</SectionLabel>
                            <View className="flex-row gap-2">
                                {CURRENCY_OPTIONS.map((c) => {
                                    const isActive = preferredCurrency === c;
                                    return (
                                        <Pill
                                            key={c}
                                            active={isActive}
                                            onPress={() => setPreferredCurrency(c)}
                                        >
                                            <Text
                                                className={`text-base font-bold ${isActive
                                                    ? "text-primary-foreground"
                                                    : "text-foreground"
                                                    }`}
                                            >
                                                {CURRENCY_SYMBOLS[c]}
                                            </Text>
                                            <Text
                                                className={`text-xs ${isActive
                                                    ? "text-primary-foreground/80"
                                                    : "text-muted-foreground"
                                                    }`}
                                            >
                                                {c}
                                            </Text>
                                        </Pill>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Timezone */}
                        <View>
                            <SectionLabel>Timezone</SectionLabel>
                            <Pressable
                                onPress={() => setIsTimezoneOpen(true)}
                                className="flex-row items-center justify-between rounded-xl border border-border bg-background px-4 py-3.5 active:bg-muted"
                            >
                                <View className="mr-2 flex-row flex-1 items-center gap-2">
                                    <Clock
                                        size={14}
                                        strokeWidth={2}
                                        className="text-foreground"
                                    />
                                    <Text
                                        className="flex-1 text-sm text-foreground"
                                        numberOfLines={1}
                                    >
                                        {selectedTimezoneLabel}
                                    </Text>
                                </View>
                                <Text className="text-xs text-muted-foreground">▼</Text>
                            </Pressable>
                        </View>

                        {/* Language */}
                        <View>
                            <SectionLabel>Language</SectionLabel>
                            <View className="gap-y-2">
                                {LOCALES.map((l) => {
                                    const isActive = locale === l.code;
                                    return (
                                        <Pressable
                                            key={l.code}
                                            onPress={() => setLocale(l.code)}
                                            className={`flex-row items-center gap-3 rounded-xl border px-4 py-3.5 ${isActive
                                                ? "border-primary bg-primary/8"
                                                : "border-border bg-background"
                                                }`}
                                        >
                                            <Text className="text-xl">{l.flag}</Text>
                                            <Text
                                                className={`flex-1 text-sm font-medium ${isActive ? "text-primary" : "text-foreground"
                                                    }`}
                                            >
                                                {l.label}
                                            </Text>
                                            {isActive && (
                                                <View className="h-5 w-5 items-center justify-center rounded-full bg-primary">
                                                    <Check size={12} color="white" />
                                                </View>
                                            )}
                                        </Pressable>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Error */}
                        {formError && (
                            <View className="flex-row items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
                                <Text className="flex-1 text-sm text-red-600">
                                    {formError}
                                </Text>
                            </View>
                        )}

                        {/* CTA */}
                        <Pressable
                            disabled={loading}
                            onPress={handleContinue}
                            className={`mt-2 items-center justify-center rounded-xl px-4 py-4 ${loading ? "bg-primary/60" : "bg-primary"
                                }`}
                        >
                            <Text className="text-base font-semibold text-primary-foreground">
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