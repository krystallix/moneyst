import { AvatarPicker } from "@/components/AvatarPicker";
import timezones from "@/constant/timezones.json";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProfile, updateProfile } from "@/lib/profile/profile";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Check, ChevronLeft, ChevronRight, Clock, Globe, Mail, Pencil } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TimezonePickerModal } from "../onboarding/profile";

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

const CURRENCY_OPTIONS = ["IDR", "USD", "EUR"] as const;
const CURRENCY_SYMBOLS: Record<(typeof CURRENCY_OPTIONS)[number], string> = {
    IDR: "Rp",
    USD: "$",
    EUR: "€",
};

const LOCALES = [
    { code: "id-ID", label: "Indonesia", flag: "🇮🇩" },
    { code: "en-US", label: "English (US)", flag: "🇺🇸" },
    { code: "en-GB", label: "English (UK)", flag: "🇬🇧" },
] as const;

type LocaleCode = (typeof LOCALES)[number]["code"];
type TimezoneOption = { id: string; label: string; offset: number };
type TimezoneItem = {
    value: string; abbr: string; offset: number;
    isdst: boolean; text: string; utc: string[];
};

// ─── Reusable sub-components ───────────────────────────────────────────────

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
            {onPress && <ChevronRight size={16} color={C.textMuted} />}
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

// ───────────────────────────────────────────────────────────────────────────

export default function UserSettings() {
    const { user } = useAuth();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [email, setEmail] = useState("");
    const [preferredCurrency, setPreferredCurrency] =
        useState<(typeof CURRENCY_OPTIONS)[number]>("IDR");
    const [timezone, setTimezone] = useState<string>("Asia/Jakarta");
    const [locale, setLocale] = useState<LocaleCode>("id-ID");
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const [nameEditing, setNameEditing] = useState(false);

    useEffect(() => {
        if (!user) return;
        getProfile(user.id).then(({ data }) => {
            if (data) {
                setAvatarUrl(data.avatar_url ?? null);
                setFullName(data.full_name ?? null);
                setEmail(data.email ?? "");
                if (data.preferred_currency)
                    setPreferredCurrency(data.preferred_currency as any);
                if (data.timezone) setTimezone(data.timezone);
                if (data.locale) setLocale(data.locale as LocaleCode);
            }
        });
    }, [user]);

    const avatarSource =
        avatarUrl && avatarUrl.length > 0
            ? { uri: avatarUrl }
            : require("@/assets/images/default-avatar.png");

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

    const handleSave = async () => {
        try {
            setLoading(true);
            setFormError(null);
            if (!user) return;
            const { error } = await updateProfile(
                user, fullName ?? "", avatarUrl, preferredCurrency, timezone, locale
            );
            if (error) { setFormError(error.message); return; }
            router.back();
        } catch (err: any) {
            setFormError(err.message ?? "An error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1" style={{ backgroundColor: C.surface }}>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="flex-1"
                >
                    {/* ── Header ── */}
                    <View className="px-6 pt-5 pb-3 flex-row items-center justify-center relative">
                        <View className="absolute left-6">
                            <Pressable
                                onPress={() => { router.back() }}
                                className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border"
                            >
                                <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                            </Pressable>
                        </View>
                        <Text
                            className="text-3xl"
                            style={{ color: C.textMain, fontFamily: "Handjet_700Bold" }}
                        >
                            Account
                        </Text>
                        <View className="absolute right-6">
                            <Pressable
                                onPress={handleSave}
                                disabled={loading}
                                className={`w-10 h-10 rounded-xl items-center justify-center ${!loading ? 'bg-primary' : 'bg-muted'}`}
                            >
                                {loading
                                    ? <ActivityIndicator size="small" color="#fff" />
                                    : <Check size={18} color={"#fff"} strokeWidth={2.5} />}
                            </Pressable>
                        </View>
                    </View>

                    <ScrollView
                        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 48 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* ── Avatar + Identity ── */}
                        <View
                            className="rounded-2xl p-4 mb-6 flex-row items-center gap-4"
                            style={{ backgroundColor: C.white, borderWidth: 1, borderColor: C.border }}
                        >
                            {/* Avatar */}
                            <Pressable
                                onPress={() => setIsAvatarOpen(true)}
                                className="relative active:opacity-70"
                            >
                                <View
                                    className="w-16 h-16 rounded-full overflow-hidden"
                                    style={{ borderWidth: 2, borderColor: C.border }}
                                >
                                    <Image
                                        source={avatarSource}
                                        style={{ width: "100%", height: "100%" }}
                                        resizeMode="cover"
                                    />
                                </View>
                                <View
                                    className="absolute bottom-0 right-0 w-5 h-5 rounded-full items-center justify-center"
                                    style={{
                                        backgroundColor: C.primary,
                                        borderWidth: 1.5,
                                        borderColor: C.white,
                                    }}
                                >
                                    <Pencil size={9} color={C.white} />
                                </View>
                            </Pressable>

                            {/* Name + Email */}
                            <View className="flex-1 gap-y-1">
                                {nameEditing ? (
                                    <TextInput
                                        value={fullName ?? ""}
                                        onChangeText={setFullName}
                                        onBlur={() => setNameEditing(false)}
                                        autoFocus
                                        placeholder="Your name"
                                        placeholderTextColor={C.textMuted}
                                        className="text-sm font-semibold py-1 px-2 rounded-lg"
                                        style={{
                                            color: C.textMain,
                                            backgroundColor: C.surface,
                                            borderWidth: 1,
                                            borderColor: C.primary,
                                        }}
                                        returnKeyType="done"
                                    />
                                ) : (
                                    <Pressable
                                        onPress={() => setNameEditing(true)}
                                        className="flex-row items-center gap-2 active:opacity-60"
                                    >
                                        <Text className="text-sm font-semibold" style={{ color: C.textMain }}>
                                            {fullName || "Add your name"}
                                        </Text>
                                        <Pencil size={12} color={C.textMuted} />
                                    </Pressable>
                                )}
                                <View className="flex-row items-center gap-1.5">
                                    <Mail size={12} color={C.textMuted} />
                                    <Text className="text-xs" style={{ color: C.textMuted }} numberOfLines={1}>
                                        {email}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* ── Preferences ── */}
                        <GroupLabel>Preferences</GroupLabel>
                        <Card>
                            {/* Currency */}
                            {/* <Text className="text-2xl px-4 pt-3.5" style={{ fontFamily: "Handjet_700Bold" }}>Preferences</Text> */}
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
                                value={timezone}
                                onPress={() => setIsTimezoneOpen(true)}
                                icon={<Clock size={15} color={C.textMuted} />}
                            />

                            {/* Language */}
                            <SettingRow
                                label="Language"
                                value={selectedLocaleLabel ? `${selectedLocaleLabel.flag}  ${selectedLocaleLabel.label}` : ""}
                                onPress={() => { }}
                                icon={<Globe size={15} color={C.textMuted} />}
                                last
                            />
                        </Card>

                        {/* Language picker inline — muncul di bawah card saat di-tap */}
                        <View className="mt-2 gap-y-1.5">
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

                        {/* ── Error ── */}
                        {formError && (
                            <View
                                className="mt-4 rounded-xl px-4 py-3 border border-red-200"
                                style={{ backgroundColor: "#FFF5F5" }}
                            >
                                <Text className="text-sm text-red-500">{formError}</Text>
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>

            <TimezonePickerModal
                visible={isTimezoneOpen}
                value={timezone}
                options={timezoneOptions}
                onSelect={(val) => setTimezone(val)}
                onClose={() => setIsTimezoneOpen(false)}
            />

            <AvatarPicker
                visible={isAvatarOpen}
                currentUrl={avatarUrl}
                userId={user?.id ?? ""}
                onSelect={(url) => setAvatarUrl(url)}
                onClose={() => setIsAvatarOpen(false)}
            />
        </View>
    );
}