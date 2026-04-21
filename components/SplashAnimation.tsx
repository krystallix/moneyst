import { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Image, Text, View } from "react-native";

const { width } = Dimensions.get("window");

interface SplashAnimationProps {
    onFinish: () => void;
}

export default function SplashAnimation({ onFinish }: SplashAnimationProps) {
    const logoScale = useRef(new Animated.Value(0)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const textOpacity = useRef(new Animated.Value(0)).current;
    const textSlide = useRef(new Animated.Value(20)).current;
    const progressWidth = useRef(new Animated.Value(0)).current;
    const dotScale1 = useRef(new Animated.Value(0.5)).current;
    const dotScale2 = useRef(new Animated.Value(0.5)).current;
    const dotScale3 = useRef(new Animated.Value(0.5)).current;
    const overallOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        console.log("SplashAnimation: Starting animations...");

        // Safety timeout agar tidak stuck selamanya (max 5 detik)
        const safetyTimer = setTimeout(() => {
            console.log("SplashAnimation: Safety timeout reached, finishing...");
            onFinish();
        }, 5000);

        const dotLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(dotScale1, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(dotScale1, { toValue: 0.5, duration: 200, useNativeDriver: true }),
                Animated.timing(dotScale2, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(dotScale2, { toValue: 0.5, duration: 200, useNativeDriver: true }),
                Animated.timing(dotScale3, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(dotScale3, { toValue: 0.5, duration: 200, useNativeDriver: true }),
            ])
        );

        Animated.sequence([
            // Step 1: logo pop in
            Animated.parallel([
                Animated.spring(logoScale, {
                    toValue: 1,
                    tension: 50,
                    friction: 7,
                    useNativeDriver: true,
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]),
            // Step 2: text fades in
            Animated.parallel([
                Animated.timing(textOpacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(textSlide, {
                    toValue: 0,
                    duration: 300,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            // Step 3: progress bar fills (faster duration: 1200 -> 800)
            Animated.timing(progressWidth, {
                toValue: width - 80,
                duration: 800,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: false,
            }),
            // Step 4: fade out entire screen
            Animated.timing(overallOpacity, {
                toValue: 0,
                duration: 300,
                easing: Easing.in(Easing.ease),
                useNativeDriver: true,
            }),
        ]).start(({ finished }) => {
            console.log("SplashAnimation: Sequence finished:", finished);
            clearTimeout(safetyTimer);
            dotLoop.stop();
            onFinish();
        });

        dotLoop.start();

        return () => {
            clearTimeout(safetyTimer);
            dotLoop.stop();
        };
    }, []);

    return (
        <Animated.View
            style={{ opacity: overallOpacity }}
            className="flex-1 bg-background items-center justify-center"
        >
            {/* Background decorative */}
            <View className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
                <View
                    className="absolute w-80 h-80 rounded-full bg-primary/25"
                    style={{ top: -120, left: -120 }}
                />
                <View
                    className="absolute w-72 h-72 rounded-full bg-primary/15"
                    style={{ bottom: -100, right: -100 }}
                />
            </View>

            {/* Logo */}
            <Animated.View
                style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}
                className="w-24 h-24 rounded-3xl items-center justify-center mb-5"
            // Glow effect via shadow
            >
                <Image
                    source={require('../assets/images/splash-icon.png')}
                    className="w-24 h-24"
                    resizeMode="contain"
                />
            </Animated.View>

            {/* App name */}
            <Animated.View
                style={{
                    opacity: textOpacity,
                    transform: [{ translateY: textSlide }],
                }}
                className="items-center"
            >
                <Text style={{ fontFamily: "Handjet_700Bold" }} className="text-foreground text-4xl tracking-tight">
                    moneyst
                </Text>
                <Text className="text-secondary-foreground text-sm font-medium mt-1 tracking-widest uppercase">
                    Smart Finance
                </Text>
            </Animated.View>

            {/* Loading dots */}
            <View className="flex-row gap-2 mt-10 mb-6">
                {[dotScale1, dotScale2, dotScale3].map((dot, i) => (
                    <Animated.View
                        key={i}
                        style={{ transform: [{ scale: dot }] }}
                        className="w-2 h-2 rounded-full bg-primary-light"
                    />
                ))}
            </View>

            {/* Progress bar */}
            <View
                className="h-1 rounded-full bg-secondary overflow-hidden mx-10"
                style={{ width: width - 80 }}
            >
                <Animated.View
                    className="h-1 rounded-full bg-primary"
                    style={{ width: progressWidth }}
                />
            </View>
        </Animated.View>
    );
}
