import { AvatarPicker } from "@/components/AvatarPicker";
import timezones from "@/constant/timezones.json";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProfile, updateProfile } from "@/lib/profile/profile";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { Check, ChevronLeft, Clock, Mail, Pencil } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Pill, SectionLabel, TimezonePickerModal } from "../onboarding/profile";

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

type TimezoneOption = {
    id: string;
    label: string;
    offset: number;
};
type TimezoneItem = {
    value: string;
    abbr: string;
    offset: number;
    isdst: boolean;
    text: string;
    utc: string[];
};

export default function UserSettings() {
    const { user, loading: authLoading } = useAuth();
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

    // Initial fetch from DB
    useEffect(() => {
        if (!user) return;

        getProfile(user.id).then(({ data }) => {
            if (data) {
                setAvatarUrl(data.avatar_url ?? null);
                setFullName(data.full_name ?? null);
                setEmail(data.email ?? "");
                if (data.preferred_currency) setPreferredCurrency(data.preferred_currency as any);
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

    // Redirect jika tidak ada session
    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.replace("/get-started");
            return;
        }
    }, [user, authLoading]);

    const handleSave = async () => {
        try {
            setLoading(true);
            setFormError(null);

            if (!user) {
                router.replace("/get-started");
                return;
            }

            const { error } = await updateProfile(
                user,
                fullName ?? "",
                avatarUrl,
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

    const handleLogout = async () => {
        setLoading(true);
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error", e);
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ paddingBottom: 40 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back button + title */}
                        <View className="px-6 pt-4 pb-2 flex-row items-center justify-center relative">
                            <View className="absolute left-6">
                                <Pressable
                                    onPress={() => { router.back() }}
                                    className="p-2.5 rounded-xl border border-border bg-secondary items-center justify-center"
                                >
                                    <ChevronLeft size={18} strokeWidth={2} className="text-foreground" />
                                </Pressable>
                            </View>
                            <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-3xl">
                                User Settings
                            </Text>
                        </View>

                        {/* Avatar */}
                        <View className="items-center mt-8 mb-6">
                            <View className="relative">
                                <View className="w-24 h-24 rounded-full border-2 border-border overflow-hidden items-center justify-center bg-secondary">
                                    <Image
                                        source={avatarSource}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </View>
                                <Pressable
                                    onPress={() => setIsAvatarOpen(true)}
                                    className="absolute bottom-0 right-0 bg-background p-2 rounded-full border-2 border-border shadow-sm"
                                    hitSlop={8}
                                >
                                    <Pencil size={14} className="text-foreground" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Form Content */}
                        <View className="px-6">
                            <View className="gap-y-6">
                                {/* Full Name */}
                                <View>
                                    <SectionLabel>Full name</SectionLabel>
                                    <TextInput
                                        value={fullName ?? ""}
                                        onChangeText={setFullName}
                                        placeholder="Your name"
                                        placeholderTextColor="#9ca3af"
                                        className="rounded-2xl border bg-white px-4 py-3.5 text-sm text-[#1A1A1A] font-medium shadow-sm"
                                        style={{ borderColor: "#D6EDE6", shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 } }}
                                        returnKeyType="next"
                                    />
                                </View>

                                {/* Email */}
                                <View>
                                    <SectionLabel>Email</SectionLabel>
                                    <View className="flex-row items-center gap-2 rounded-2xl border bg-[#f1f1f1] px-4 py-3.5" style={{ borderColor: "#D6EDE6" }}>
                                        <Mail size={16} strokeWidth={2} className="text-[#555555]" />
                                        <Text
                                            className="flex-1 text-sm text-[#555555] font-medium"
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
                                        className="flex-row items-center justify-between rounded-2xl border bg-white px-4 py-3.5 shadow-sm active:opacity-70"
                                        style={{ borderColor: "#D6EDE6", shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 } }}
                                    >
                                        <View className="mr-2 flex-row flex-1 items-center gap-3">
                                            <Clock
                                                size={16}
                                                strokeWidth={2}
                                                className="text-[#1A1A1A]"
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
                                                    className={`flex-row items-center gap-4 rounded-2xl border px-5 py-4 ${isActive
                                                        ? "border-[#1A1A1A] bg-[#1A1A1A]/5"
                                                        : "border-[#D6EDE6] bg-white shadow-sm"
                                                        }`}
                                                    style={!isActive ? { shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 } } : {}}
                                                >
                                                    <Text className="text-[20px]">{l.flag}</Text>
                                                    <Text
                                                        className={`flex-1 text-[13px] font-bold ${isActive ? "text-[#1A1A1A]" : "text-[#555555]"
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
                                    onPress={handleSave}
                                    className={`mt-2 items-center justify-center rounded-xl px-4 py-4 ${loading ? "bg-primary/60" : "bg-primary"
                                        }`}
                                >
                                    <Text className="text-base font-semibold text-primary-foreground">
                                        {loading ? "Saving..." : "Save Changes"}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
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