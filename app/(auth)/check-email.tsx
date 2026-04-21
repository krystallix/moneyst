import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import {
    KeyboardAvoidingView,
    Platform,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SpriteAnimation } from "../../components/SpriteAnimation";

const OTP_LENGTH = 4;
const RESEND_SECONDS = 30;


const MAIL_FRAMES = [
    require("../../assets/animated/mail1.png"),
    require("../../assets/animated/mail2.png"),
    require("../../assets/animated/mail3.png"),
    require("../../assets/animated/mail4.png"),
    require("../../assets/animated/mail5.png"),
    require("../../assets/animated/mail6.png"),
    require("../../assets/animated/mail7.png"),
    require("../../assets/animated/mail6.png"),
    require("../../assets/animated/mail5.png"),
    require("../../assets/animated/mail4.png"),
    require("../../assets/animated/mail3.png"),
    require("../../assets/animated/mail2.png"),
];


export default function CheckEmailScreen() {
    const { email } = useLocalSearchParams<{ email: string }>();
    const decodedEmail = email ? decodeURIComponent(email) : "your email";

    const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
    const [countdown, setCountdown] = useState(RESEND_SECONDS);
    const [canResend, setCanResend] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Countdown timer
    useEffect(() => {
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, []);

    const handleResend = () => {
        if (!canResend) return;
        setOtp(Array(OTP_LENGTH).fill(""));
        setCountdown(RESEND_SECONDS);
        setCanResend(false);
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setCanResend(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleChangeOtp = (text: string, index: number) => {
        const cleaned = text.replace(/[^0-9]/g, "").slice(-1);
        const newOtp = [...otp];
        newOtp[index] = cleaned;
        setOtp(newOtp);

        if (cleaned && index < OTP_LENGTH - 1) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyPress = (key: string, index: number) => {
        if (key === "Backspace" && !otp[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const otpFilled = otp.every((d) => d !== "");

    return (
        <>
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1 bg-background">
                {/* Back button */}
                <KeyboardAvoidingView
                    behavior={Platform.OS === "android" ? "padding" : "height"}
                    className="flex-1"
                >

                    <View className="px-6 pt-4 pb-2">
                        <Pressable
                            onPress={() => router.back()}
                            className="self-start p-2.5 rounded-xl border border-border bg-secondary items-center justify-center"
                        >
                            <ChevronLeft size={18} strokeWidth={2} className="text-foreground" />
                        </Pressable>
                    </View>

                    {/* Content */}
                    <View className="flex-1 items-center justify-center px-8">
                        {/* Email icon */}
                        <SpriteAnimation frames={MAIL_FRAMES} interval={200} className="w-32 h-32 mb-4" />
                        {/* Title */}
                        <Text className="text-foreground text-3xl font-bold text-center mb-3">
                            Check your email
                        </Text>

                        {/* Subtitle with email */}
                        <Text className="text-secondary-foreground text-sm text-center leading-5 mb-10">
                            We sent a {OTP_LENGTH} digit code to{"\n"}
                            <Text className="text-foreground font-semibold">{decodedEmail}</Text>.
                        </Text>

                        {/* OTP boxes */}
                        <View className="flex-row gap-4 mb-10">
                            {otp.map((digit, i) => (
                                <TextInput
                                    key={i}
                                    ref={(ref) => { inputRefs.current[i] = ref; }}
                                    value={digit}
                                    onChangeText={(text) => handleChangeOtp(text, i)}
                                    onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
                                    keyboardType="number-pad"
                                    maxLength={1}
                                    selectTextOnFocus
                                    className={`w-16 h-16 rounded-2xl bg-secondary border text-center text-foreground text-2xl font-bold ${digit ? "border-primary" : "border-border"
                                        }`}
                                />
                            ))}
                        </View>

                        {/* Verify button */}
                        <Pressable
                            onPress={() => console.log("verify:", otp.join(""))}
                            disabled={!otpFilled}
                            className={`w-full py-4 rounded-full items-center mb-6 ${otpFilled ? "bg-foreground active:opacity-80" : "bg-secondary"
                                }`}
                        >
                            <Text className={`text-base font-semibold ${otpFilled ? "text-background" : "text-secondary-foreground"}`}>
                                Verify
                            </Text>
                        </Pressable>

                        {/* Resend */}
                        <View className="flex-row items-center">
                            <Text className="text-secondary-foreground text-sm">
                                Didn't receive the email?{"  "}
                            </Text>
                            <Pressable onPress={handleResend} disabled={!canResend} hitSlop={8}>
                                <Text className={`text-sm font-bold ${canResend ? "text-foreground" : "text-secondary-foreground"}`}>
                                    {canResend ? "Resend" : `Resend(${countdown})`}
                                </Text>
                            </Pressable>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </>
    );
}
