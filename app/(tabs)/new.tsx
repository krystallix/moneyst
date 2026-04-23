import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { router, useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Image as ImageIcon } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export default function NewTransactionCamera() {
    const [permission, requestPermission] = useCameraPermissions();
    const insets = useSafeAreaInsets();
    
    // We can track if camera is active to unmount it when tab changes
    const [isActive, setIsActive] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setIsActive(true);
            return () => {
                setIsActive(false);
            };
        }, [])
    );

    if (!permission) {
        return <View className="flex-1 bg-black" />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView className="flex-1 bg-black items-center justify-center">
                <Text className="text-white mb-4 text-center px-8">
                    We need your permission to access the camera to capture receipts.
                </Text>
                <Pressable
                    onPress={requestPermission}
                    className="bg-primary px-5 py-3 rounded-xl active:opacity-70"
                >
                    <Text className="text-white font-semibold">Grant Permission</Text>
                </Pressable>
                
                <Pressable
                    onPress={() => router.push("/(tabs)/home")}
                    className="mt-6"
                >
                    <Text className="text-white/60">Cancel</Text>
                </Pressable>
            </SafeAreaView>
        );
    }

    const handleBack = () => {
        router.push("/(tabs)/home");
    };

    const handleGallery = async () => {
        try {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) {
                alert("Permission to access gallery is required.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                quality: 1,
            });

            if (!result.canceled) {
                // Dummy: simply navigate back after selecting image
                alert("Image selected from gallery! (Dummy action)");
                router.push("/(tabs)/home");
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleCapture = () => {
        // Dummy capture action
        alert("Photo captured! (Dummy action)");
        router.push("/(tabs)/home");
    };

    return (
        <View className="flex-1 bg-black">
            <StatusBar style="light" />
            
            {isActive ? (
                <CameraView style={StyleSheet.absoluteFillObject} facing="back">
                    <SafeAreaView className="flex-1 justify-between" edges={['top']}>
                        {/* Top actions */}
                        <View className="flex-row items-center justify-between px-6 pt-4">
                            <Pressable
                                onPress={handleBack}
                                className="w-12 h-12 items-center justify-center rounded-full bg-black/30 active:bg-black/50 backdrop-blur-md"
                            >
                                <ChevronLeft size={26} color="#FFFFFF" strokeWidth={2.5} />
                            </Pressable>

                            <Pressable
                                onPress={handleGallery}
                                className="w-12 h-12 items-center justify-center rounded-full bg-black/30 active:bg-black/50 backdrop-blur-md"
                            >
                                <ImageIcon size={22} color="#FFFFFF" strokeWidth={2} />
                            </Pressable>
                        </View>

                        {/* Bottom actions container */}
                        <View 
                            className="bg-white rounded-t-[36px] pt-8 px-6 items-center shadow-lg w-full"
                            style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}
                        >
                            <Pressable
                                onPress={handleCapture}
                                className="w-20 h-20 rounded-full border-[6px] border-gray-200 items-center justify-center active:opacity-70"
                            >
                                <View className="w-14 h-14 rounded-full bg-gray-300" />
                            </Pressable>
                            <Text className="text-gray-400 font-medium mt-4 text-sm tracking-wide">
                                Capture Receipt
                            </Text>
                        </View>
                    </SafeAreaView>
                </CameraView>
            ) : (
                <View className="flex-1 bg-black" />
            )}
        </View>
    );
}
