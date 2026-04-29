import "@/global.css";
import { Handjet_700Bold, useFonts } from "@expo-google-fonts/handjet";
import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

import SplashAnimation from "@/components/SplashAnimation";
import { AuthProvider, useAuth } from "@/lib/auth/AuthContext";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <AuthProvider>
                <RootLayoutInner />
            </AuthProvider>
        </GestureHandlerRootView>
    );
}

function RootLayoutInner() {
    const [showCustomSplash, setShowCustomSplash] = useState(true);
    const [appReady, setAppReady] = useState(false);
    const [fontsLoaded] = useFonts({ Handjet_700Bold });

    const { user, loading: authLoading } = useAuth();
    const isLoggedInRef = useRef<boolean>(false);

    useEffect(() => {
        if (!fontsLoaded || authLoading) return;

        isLoggedInRef.current = !!user;

        const hideSplash = async () => {
            await SplashScreen.hideAsync();
            setAppReady(true);
        };

        hideSplash();
    }, [fontsLoaded, authLoading, user]);

    const handleSplashFinish = () => {
        setTimeout(() => {
            const target = isLoggedInRef.current ? "/" : "/get-started";
            router.replace(target);
            setTimeout(() => setShowCustomSplash(false), 100);
        }, 0);
    };

    return (
        <ThemeProvider value={DefaultTheme}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="get-started" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="(auth)/sign-in" />
                <Stack.Screen name="(auth)/forgot-password" />
                <Stack.Screen name="(auth)/check-email" />
                <Stack.Screen name="onboarding/profile" />
                <Stack.Screen
                    name="settings/index"
                    options={{ presentation: "card" }}
                />
                <Stack.Screen
                    name="budget/new"
                    options={{ presentation: "card" }}
                />
                <Stack.Screen name="transaction/search" />
                <Stack.Screen name="account/new" />
                <Stack.Screen name="account/[id]" />
                <Stack.Screen name="transaction/new" />
                <Stack.Screen name="transaction/[id]" />
                <Stack.Screen name="category/new" />
                <Stack.Screen name="category/[id]" />
                <Stack.Screen name="budget/[id]" options={{ presentation: "card" }} />
                <Stack.Screen name="receipt/review" options={{ presentation: "card" }} />
            </Stack>

            {(showCustomSplash || !appReady) && (
                <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, backgroundColor: "#FFFFFF" }}>
                    {appReady && (
                        <SplashAnimation onFinish={handleSplashFinish} />
                    )}
                </View>
            )}

            <StatusBar style="dark" />
        </ThemeProvider>
    );
}