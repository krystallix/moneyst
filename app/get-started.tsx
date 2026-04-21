// app/get-started.tsx
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const STEPS = [
    {
        title: "Welcome to Moneyst",
        description: "Track your money, budgets, and goals in one place.",
    },
    {
        title: "See where money goes",
        description: "Get clear insights on spending by category and account.",
    },
    {
        title: "Reach your goals faster",
        description: "Set saving goals and watch your net worth grow.",
    },
];

export default function GetStartedScreen() {
    const [step, setStep] = useState(0);
    const isLast = step === STEPS.length - 1;

    const handleNext = () => {
        if (isLast) {
            router.push("/(auth)/sign-in");
        } else {
            setStep((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        router.push("/(auth)/sign-in");
    };

    return (
        <>
            <StatusBar style="dark" />

            <SafeAreaView className="flex-1 bg-background">
                {/* Top bar: progress + skip */}
                <View className="flex-row justify-between items-center px-8 pt-4">
                    <Text className="text-sm text-muted-foreground">
                        {step + 1}/{STEPS.length}
                    </Text>

                    <Pressable onPress={handleSkip} hitSlop={8}>
                        <Text className="text-sm font-medium text-muted-foreground">
                            Skip
                        </Text>
                    </Pressable>
                </View>

                {/* Content tengah */}
                <View className="flex-1 items-center justify-center px-8">
                    <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-4xl text-foreground text-center mb-4">
                        {STEPS[step].title}
                    </Text>
                    <Text className="text-muted-foreground text-center">
                        {STEPS[step].description}
                    </Text>
                </View>

                <View className="px-8 pb-6">
                    <View className="flex-row items-center gap-3">
                        {step > 0 && (
                            <Pressable
                                className="px-4 py-3 rounded-xl border border-border bg-secondary items-center justify-center"
                                onPress={() => setStep((prev) => prev - 1)}
                            >
                                <ChevronLeft size={18} strokeWidth={2} />
                            </Pressable>
                        )}

                        <Pressable
                            className="flex-1 py-3 rounded-xl bg-primary items-center"
                            onPress={handleNext}
                        >
                            <Text className="text-background font-semibold">
                                {isLast ? "Get started" : "Next"}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </>
    );
}