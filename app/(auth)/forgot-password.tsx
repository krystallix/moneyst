// app/sign-in.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View
} from "react-native";
import { SpriteAnimation } from "../../components/SpriteAnimation";
import { SafeAreaView } from "react-native-safe-area-context";

const FORGOT_FRAMES = [
    require("../../assets/animated/forgot1.png"),
    require("../../assets/animated/forgot2.png"),
    require("../../assets/animated/forgot3.png"),
    require("../../assets/animated/forgot2.png"),
];

export default function ForgotPasswordScreen() {
    const [email, setEmail] = useState("");
    const back = () => router.back();

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 bg-background">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView
                        contentContainerStyle={{ flexGrow: 1 }}
                        keyboardShouldPersistTaps="handled"
                        showsVerticalScrollIndicator={false}
                    >
                        {/* Back button */}
                        <View className="px-6 pt-4 pb-2">
                            <Pressable
                                onPress={back}
                                className="self-start p-2.5 rounded-xl border border-border bg-secondary items-center justify-center"
                            >
                                <ChevronLeft size={18} strokeWidth={2} className="text-foreground" />
                            </Pressable>
                        </View>

                        {/* Header */}
                        <View className="my-auto">

                            <View className="w-full items-center px-8 pt-4 pb-8">
                                <SpriteAnimation frames={FORGOT_FRAMES} interval={300} className="w-48 h-48" />
                                <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-4xl text-center">
                                    Forgot Password?
                                </Text>
                                <Text className="text-secondary-foreground text-sm text-center mt-1">
                                    Don't worry, enter the associated email. and we'll send the instructions.
                                </Text>
                            </View>
                            <View className="px-6 gap-3">
                                {/* Email */}
                                <View className="bg-secondary rounded-2xl px-4 pt-3 pb-3 border border-border">
                                    <Text className="text-secondary-foreground text-xs mb-1">Email</Text>
                                    <TextInput
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="moneyst@example.com"
                                        placeholderTextColor="#9CA3AF"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoComplete="email"
                                        returnKeyType="next"
                                        className="text-foreground text-base"
                                        style={{ padding: 0 }}
                                    />
                                </View>

                                {/* Sign in button */}
                                <Pressable
                                    onPress={() => router.push(`/check-email?email=${encodeURIComponent(email)}`)}
                                    className="w-full py-4 rounded-full bg-foreground items-center mt-2 active:opacity-80"
                                >
                                    <Text className="text-background text-base font-semibold">
                                        Send Instructions
                                    </Text>
                                </Pressable>

                            </View>
                        </View>

                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}