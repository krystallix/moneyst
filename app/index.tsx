import { useAuth } from "@/lib/auth/AuthContext";
import { checkProfile } from "@/lib/profile/profile";
import { router } from "expo-router";
import { useEffect } from "react";
import { View } from "react-native";

export default function IndexRedirect() {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (loading) return;

        if (!user) {
            router.replace("/get-started");
            return;
        }

        // Check if user completed onboarding
        checkProfile(user).then(({ data: profile }) => {
            if (!profile) {
                router.replace("/onboarding/profile");
            } else {
                router.replace("/(tabs)/home");
            }
        });
    }, [user, loading]);

    return <View className="flex-1 bg-background" />;
}