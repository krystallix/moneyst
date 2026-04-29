import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Image as ImageIcon, Plus, ScanLine } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewTransactionCamera() {
    const [permission, requestPermission] = useCameraPermissions();
    const insets = useSafeAreaInsets();
    const cameraRef = useRef<any>(null);

    const [isActive, setIsActive] = useState(false);
    const [isCapturing, setIsCapturing] = useState(false);

    // Scan line animation
    const scanAnim = useRef(new Animated.Value(0)).current;

    const startScanAnimation = () => {
        scanAnim.setValue(0);
        Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, { toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: true }),
                Animated.timing(scanAnim, { toValue: 0, duration: 0, useNativeDriver: true }),
            ])
        ).start();
    };

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            startScanAnimation();
            return () => setIsActive(false);
        }, [])
    );

    if (!permission) return <View className="flex-1 bg-black" />;

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center px-8">
                <View className="w-16 h-16 rounded-full bg-white/10 items-center justify-center mb-6">
                    <ScanLine size={32} color="#FFFFFF" strokeWidth={1.5} />
                </View>
                <Text className="text-white text-xl font-bold text-center mb-2">Camera Access Needed</Text>
                <Text className="text-white/60 text-center mb-8 text-sm leading-5">
                    We need camera access to scan receipts and automatically create transactions.
                </Text>
                <Pressable
                    onPress={requestPermission}
                    className="bg-primary px-8 py-4 rounded-2xl active:opacity-70 w-full items-center"
                >
                    <Text className="text-white font-bold text-base">Grant Permission</Text>
                </Pressable>
                <Pressable onPress={() => router.push("/(tabs)/home")} className="mt-5">
                    <Text className="text-white/50 text-sm">Cancel</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const handleBack = () => router.push("/(tabs)/home");

    const navigateToReview = (imageUri: string) => {
        router.push({
            pathname: "/receipt/review",
            params: { imageUri },
        });
    };

    const handleGallery = async () => {
        try {
            const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!granted) {
                alert("Permission to access gallery is required.");
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 0.85,
            });
            if (!result.canceled && result.assets[0]) {
                navigateToReview(result.assets[0].uri);
            }
        } catch (error) {
            console.error("Gallery error:", error);
        }
    };

    const handleCapture = async () => {
        if (!cameraRef.current || isCapturing) return;
        setIsCapturing(true);
        try {
            const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
            if (photo?.uri) navigateToReview(photo.uri);
        } catch (err) {
            console.error("Capture error:", err);
        } finally {
            setIsCapturing(false);
        }
    };

    // Scan line Y position (0 = top of the frame, 1 = bottom)
    const scanLineY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 260],
    });

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />

            {isActive ? (
                <View className="flex-1">
                    <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" />
                    <SafeAreaView className="flex-1" edges={['top']}>
                        {/* ── Top bar ── */}
                        <View className="flex-row items-center justify-between px-6 pt-4">
                            <Pressable
                                onPress={handleBack}
                                className="w-12 h-12 items-center justify-center rounded-full bg-black/40 active:bg-black/60"
                            >
                                <ChevronLeft size={26} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>

                            {/* Absolute center title */}
                            <View className="absolute inset-0 pt-3 items-center justify-center pointer-events-none">
                                <Text className="text-white text-2xl opacity-90" style={{ fontFamily: "Handjet_700Bold" }}>
                                    Scan Receipt
                                </Text>
                            </View>


                            <View className="flex-row items-center gap-2">
                                <Pressable
                                    onPress={() => {
                                        router.push(
                                            `/transaction/new`,
                                        )
                                    }}
                                    className="w-12 h-12 items-center justify-center rounded-full bg-black/40 active:bg-black/60"
                                >
                                    <Plus size={22} color="#FFFFFF" strokeWidth={2} />
                                </Pressable>
                                <Pressable
                                    onPress={handleGallery}
                                    className="w-12 h-12 items-center justify-center rounded-full bg-black/40 active:bg-black/60"
                                >
                                    <ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />
                                </Pressable>
                            </View>
                        </View>

                        {/* ── Receipt frame guide ── */}
                        <View className="flex-1 items-center justify-center">
                            <View style={{ width: 280, height: 360, position: 'relative' }}>
                                {/* Corner brackets */}
                                {[
                                    { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 12 },
                                    { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 12 },
                                    { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 12 },
                                    { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 12 },
                                ].map((style, i) => (
                                    <View
                                        key={i}
                                        style={{
                                            position: 'absolute',
                                            width: 32,
                                            height: 32,
                                            borderColor: '#3D9B35',
                                            ...style,
                                        }}
                                    />
                                ))}

                                {/* Animated scan line */}
                                <Animated.View
                                    style={{
                                        position: 'absolute',
                                        left: 0,
                                        right: 0,
                                        height: 2,
                                        backgroundColor: '#3D9B35',
                                        opacity: 0.8,
                                        transform: [{ translateY: scanLineY }],
                                        shadowColor: '#3D9B35',
                                        shadowOffset: { width: 0, height: 0 },
                                        shadowOpacity: 0.9,
                                        shadowRadius: 6,
                                    }}
                                />
                            </View>
                            <Text className="text-white/70 text-sm mt-6 font-medium">
                                Align receipt within the frame
                            </Text>
                        </View>

                        {/* ── Bottom shutter ── */}
                        <View
                            className="bg-white/95 rounded-t-[36px] pt-8 items-center"
                            style={{ paddingBottom: Math.max(insets.bottom + 24, 44) }}
                        >
                            <Pressable
                                onPress={handleCapture}
                                disabled={isCapturing}
                                style={({ pressed }) => ({
                                    width: 76,
                                    height: 76,
                                    borderRadius: 38,
                                    borderWidth: 5,
                                    borderColor: '#E5E7EB',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: pressed || isCapturing ? 0.7 : 1,
                                })}
                            >
                                <View style={{
                                    width: 58,
                                    height: 58,
                                    borderRadius: 29,
                                    backgroundColor: isCapturing ? '#9ca3af' : '#3D9B35',
                                }} />
                            </Pressable>
                            <Text className="text-gray-500 font-semibold mt-3 text-sm">
                                {isCapturing ? 'Capturing...' : 'Tap to Capture'}
                            </Text>

                        </View>
                    </SafeAreaView>
                </View>
            ) : (
                <View className="flex-1 bg-black" />
            )}
        </View>
    );
}
