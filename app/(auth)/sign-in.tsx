// app/sign-in.tsx
import { useAuth } from "@/lib/auth/AuthContext";
import { emailSignIn } from "@/lib/auth/email";
import { googleSignIn } from "@/lib/auth/google";
import { getProfile } from "@/lib/profile/profile";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Eye, EyeOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import {
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
import { SpriteAnimation } from "../../components/SpriteAnimation";

const CHEST_FRAMES = [
    require("../../assets/animated/chest1.png"),
    require("../../assets/animated/chest2.png"),
    require("../../assets/animated/chest3.png"),
    require("../../assets/animated/chest2.png"),
];

export default function SignInScreen() {
    const { user } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // When auth context user changes (after any sign-in), check profile and route
    useEffect(() => {
        if (!user) return;

        getProfile(user.id).then(({ data: existing, error }) => {
            if (error) console.log("Check profile error:", error);
            if (!existing) {
                router.replace("/onboarding/profile");
            } else {
                router.replace("/");
            }
        });
    }, [user]);

    const handleGoogle = async () => {
        try {
            setLoading(true);
            setFormError(null);
            await googleSignIn();
            // Routing is handled by the useEffect above once user updates in context
        } catch (e: any) {
            console.log("Google sign-in error", e);
            setFormError(e.message ?? "Failed to sign in with Google");
        } finally {
            setLoading(false);
        }
    };

    const handleEmailLogin = async () => {
        if (!email || !password) {
            setFormError("Email dan password tidak boleh kosong");
            return;
        }

        try {
            setLoading(true);
            setFormError(null);
            await emailSignIn(email, password);
            // Routing is handled by the useEffect above once user updates in context
        } catch (err: any) {
            setFormError(err.message ?? "Failed to sign in");
        } finally {
            setLoading(false);
        }
    };

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
                                <SpriteAnimation frames={CHEST_FRAMES} interval={300} className="w-32 h-32 mb-4" />
                                <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-4xl text-center">
                                    Welcome Back
                                </Text>
                                <Text className="text-secondary-foreground text-sm text-center mt-1">
                                    Please enter your credentials
                                </Text>
                            </View>

                            {/* Form */}
                            <View className="px-6 gap-3">
                                {formError && (
                                    <Text className="text-red-500 text-sm mt-1">
                                        {formError}
                                    </Text>
                                )}
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

                                {/* Password */}
                                <View className="bg-secondary rounded-2xl px-4 pt-3 pb-3 border border-border flex-row items-center">
                                    <View className="flex-1">
                                        <Text className="text-secondary-foreground text-xs mb-1">Password</Text>
                                        <TextInput
                                            value={password}
                                            onChangeText={setPassword}
                                            placeholder="••••••••"
                                            placeholderTextColor="#9CA3AF"
                                            secureTextEntry={!showPassword}
                                            autoCapitalize="none"
                                            autoComplete="password"
                                            returnKeyType="done"
                                            className="text-foreground text-base"
                                            style={{ padding: 0 }}
                                        />
                                    </View>
                                    <Pressable
                                        onPress={() => setShowPassword((p) => !p)}
                                        hitSlop={8}
                                        className="ml-3"
                                    >
                                        {showPassword
                                            ? <Eye size={20} className="text-secondary-foreground" />
                                            : <EyeOff size={20} className="text-secondary-foreground" />
                                        }
                                    </Pressable>
                                </View>

                                {/* Remember me + Forgot password */}
                                <View className="flex-row items-center justify-between">
                                    <Pressable
                                        onPress={() => setRememberMe((r) => !r)}
                                        className="flex-row items-center gap-2"
                                        hitSlop={8}
                                    >
                                        <View
                                            className={`w-5 h-5 rounded border-2 items-center justify-center ${rememberMe
                                                ? "bg-primary border-primary"
                                                : "bg-secondary border-border"
                                                }`}
                                        >
                                            {rememberMe && (
                                                <Text className="text-primary-foreground text-xs font-bold leading-none">✓</Text>
                                            )}
                                        </View>
                                        <Text className="text-secondary-foreground text-sm">Remember me</Text>
                                    </Pressable>

                                    <Pressable hitSlop={8} onPress={() => router.push('/forgot-password')}>
                                        <Text className="text-foreground text-sm font-bold">Forgot password</Text>
                                    </Pressable>
                                </View>

                                {/* Sign in button */}
                                <Pressable
                                    onPress={handleEmailLogin}
                                    disabled={loading}
                                    className={`w-full py-4 rounded-full bg-foreground items-center mt-2 active:opacity-80 ${loading ? "opacity-60" : ""
                                        }`}
                                >
                                    <Text className="text-background text-base font-semibold">
                                        {loading ? "Signing in..." : "Sign in"}
                                    </Text>
                                </Pressable>

                                {/* Google sign in */}
                                <Pressable onPress={handleGoogle}
                                    className="w-full py-4 rounded-full border border-border bg-background items-center flex-row justify-center gap-2 active:opacity-80"
                                >
                                    <Image source={require("../../assets/images/google-logo.png")} className="w-5 h-5" />
                                    <Text className="text-foreground text-base font-medium">
                                        Sign in with Google
                                    </Text>
                                </Pressable>

                                {/* Sign up link */}
                                <View className="flex-row justify-center items-center pt-2 pb-6">
                                    <Text className="text-secondary-foreground text-sm">
                                        Don't have an account?{"  "}
                                    </Text>
                                    <Pressable hitSlop={8}>
                                        <Text className="text-foreground text-sm font-bold">Sign up</Text>
                                    </Pressable>
                                </View>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}