import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { getGreetingFromTimezone, GREETING_TEXT_EN, GREETING_TEXT_ID } from "@/lib/time/greetings";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { Animated, Easing, Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type AppProfile = {
    id: string;
    full_name: string | null;
    timezone: string | null;
    avatar_url: string | null;
    locale: string | null;
};

export default function ReportScreen() {
    const { user, loading } = useAuth();
    const [username, setUsername] = useState<string | null>(null);
    const [timezone, setTimezone] = useState<string>("Asia/Jakarta");
    const [locale, setLocale] = useState<string>("en-US");
    const [avatar, setAvatar] = useState<string | null>(null);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(20)).current;

    useEffect(() => {
        if (loading) return;
        if (!user) return;

        const fetchProfile = async () => {
            const { data: profile } = await checkProfile(user) as {
                data: AppProfile | null;
                error: any;
            };

            if (!profile) {
                router.replace("/onboarding/profile");
                return;
            }

            setUsername(profile.full_name ?? user.user_metadata?.full_name ?? null);
            setTimezone(profile.timezone ?? "Asia/Jakarta");
            setAvatar(profile.avatar_url ?? null);
            setLocale(profile.locale ?? "en-US");
        };

        fetchProfile();
    }, [user, loading]);

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const greetingKey = getGreetingFromTimezone({ timezone, locale });
    const greetingText =
        locale.startsWith("id")
            ? GREETING_TEXT_ID[greetingKey]
            : GREETING_TEXT_EN[greetingKey];

    const avatarSource =
        avatar && avatar.length > 0
            ? { uri: avatar }
            : require("@/assets/images/default-avatar.png");

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1">
                {/* Header */}
                <View className="px-6 pt-5 pb-2 flex flex-row justify-between items-center">
                    <Animated.View
                        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
                    >
                        <Text
                            style={{ fontFamily: "Handjet_700Bold" }}
                            className="text-[#1A1A1A] text-2xl"
                        >
                            {greetingText},
                        </Text>
                        <Text className="text-[#555555] text-xs">
                            {username}
                        </Text>
                    </Animated.View>

                    <Animated.View style={{ opacity: fadeAnim }}>
                        <Pressable
                            onPress={() => router.push("/settings/user-settings")}
                            className="rounded-xl overflow-hidden"
                        >
                            <Image source={avatarSource} className="w-10 h-10 rounded-xl" />
                        </Pressable>
                    </Animated.View>
                </View>

                {/* Main content */}
                <View className="flex-1 px-6 pt-4 items-center justify-center gap-3">
                    <View
                        className="w-16 h-16 rounded-2xl items-center justify-center"
                        style={{ backgroundColor: "rgba(91,143,133,0.12)" }}
                    >
                        <Text style={{ fontSize: 28 }}>📊</Text>
                    </View>
                    <Text className="text-[#1A1A1A] text-base font-semibold text-center">
                        Reports coming soon
                    </Text>
                    <Text className="text-[#555555] text-sm text-center">
                        Spending charts and monthly breakdowns will appear here.
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}
