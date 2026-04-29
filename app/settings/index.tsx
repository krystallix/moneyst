import User from "@/assets/icons/user.svg";
import { useAuth } from "@/lib/auth/AuthContext";
import { getProfile } from "@/lib/profile/profile";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    ChevronLeft,
    ChevronRight,
    LogOut,
    Wallet,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


type SettingsItem = {
    id: string;
    label: string;
    subtitle?: string;
    icon: React.ReactNode;
    onPress: () => void;
    danger?: boolean;
};

export default function SettingsTab() {
    const { user } = useAuth();
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [fullName, setFullName] = useState<string | null>(null);
    const [email, setEmail] = useState<string | null>(null);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        if (!user) return;

        getProfile(user.id).then(({ data }) => {
            if (data) {
                setAvatarUrl(data.avatar_url ?? null);
                setFullName(data.full_name ?? null);
                setEmail(data.email ?? user.email ?? null);
            }
        });
    }, [user]);

    const avatarSource =
        avatarUrl && avatarUrl.length > 0
            ? { uri: avatarUrl }
            : require("@/assets/images/default-avatar.png");

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.error("Logout error", e);
            setSigningOut(false);
        }
    };

    // Replace direct router.push calls with deferred ones
    const navigate = (path: string) => {
        setTimeout(() => router.push(path as any), 0);
    };

    const items: SettingsItem[] = [
        {
            id: "accounts",
            label: "Manage Accounts",
            subtitle: "Wallets, Banks, Cards",
            icon: <Wallet size={18} color="#5B8F85" />,
            onPress: () => navigate("/account"),
        },
        {
            id: "profile",
            label: "Edit Profile",
            subtitle: "Name, photo, timezone",
            icon: <User width={18} color="#5B8F85" />,
            onPress: () => navigate("/settings/user-settings"),
        },
    ];

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1">
                <View className="px-6 pt-5 pb-2 flex-row items-center justify-center relative">
                    <View className="absolute left-6">
                        <Pressable
                            onPress={() => { router.back() }}
                            className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border"
                        >
                            <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                        </Pressable>
                    </View>
                    <Text
                        style={{ fontFamily: "Handjet_700Bold" }}
                        className="text-[#1A1A1A] text-3xl"
                    >
                        Settings
                    </Text>
                </View>

                {/* Profile card */}
                <Pressable
                    onPress={() => navigate("/settings/user-settings")}
                    className="mx-6 mt-4 mb-5 flex-row items-center gap-4 rounded-[24px] px-5 py-5 active:opacity-80 bg-white"
                    style={{ shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 }}
                >
                    <View
                        className="w-14 h-14 rounded-full overflow-hidden"
                        style={{ borderWidth: 2, borderColor: "#f1f1f1" }}
                    >
                        <Image
                            source={avatarSource}
                            className="w-full h-full"
                            resizeMode="cover"
                        />
                    </View>
                    <View className="flex-1">
                        <Text className="text-[#1A1A1A] text-base font-bold">
                            {fullName ?? "—"}
                        </Text>
                        <Text className="text-[#999999] text-xs mt-0.5 font-medium" numberOfLines={1}>
                            {email ?? "—"}
                        </Text>
                    </View>
                    <View
                        className="w-8 h-8 rounded-xl items-center justify-center"
                        style={{ backgroundColor: "#f1f1f1" }}
                    >
                        <ChevronRight size={16} color="#020202" strokeWidth={2.5} />
                    </View>
                </Pressable>

                {/* Settings list */}
                <View
                    className="mx-6 rounded-[24px] overflow-hidden bg-white"
                    style={{ shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 }}
                >
                    {items.map((item, index) => (
                        <Pressable
                            key={item.id}
                            onPress={item.onPress}
                            className="flex-row items-center gap-4 px-5 py-4 active:opacity-70"
                            style={[
                                index < items.length - 1 ? { borderBottomWidth: 1, borderBottomColor: "#f1f1f1" } : {},
                            ]}
                        >
                            <View
                                className="w-10 h-10 rounded-2xl items-center justify-center"
                                style={{ backgroundColor: "rgba(91,143,133,0.12)" }}
                            >
                                {item.icon}
                            </View>
                            <View className="flex-1">
                                <Text className="text-[14px] font-bold text-[#1A1A1A]">{item.label}</Text>
                                {item.subtitle ? (
                                    <Text className="text-[12px] font-medium text-[#999999] mt-0.5">{item.subtitle}</Text>
                                ) : null}
                            </View>
                            <ChevronRight size={16} color="#D6EDE6" strokeWidth={2.5} />
                        </Pressable>
                    ))}
                </View>

                {/* Logout */}
                <View
                    className="mx-6 mt-4 rounded-[24px] overflow-hidden"
                >
                    <Pressable
                        onPress={handleLogout}
                        disabled={signingOut}
                        className="flex-row items-center gap-4 px-5 py-4 active:opacity-70 bg-white"
                        style={{ shadowColor: "rgba(0,0,0,0.02)", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 }}
                    >
                        <View
                            className="w-10 h-10 rounded-xl items-center justify-center"
                            style={{ backgroundColor: "rgba(229,57,53,0.10)" }}
                        >
                            <LogOut size={20} color="#E53935" strokeWidth={2.5} />
                        </View>
                        <Text className="flex-1 text-[14px] font-bold tracking-tight" style={{ color: "#E53935" }}>
                            {signingOut ? "Signing out..." : "Sign Out"}
                        </Text>
                    </Pressable>
                </View>
            </SafeAreaView>
        </View>
    );
}
