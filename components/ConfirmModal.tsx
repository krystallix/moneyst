import { AlertCircle } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { Animated, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export type ConfirmModalProps = {
    visible: boolean;
    title: string;
    description: string;
    cancelText?: string;
    confirmText?: string;
    onCancel?: () => void;
    onConfirm: () => void;
    isDestructive?: boolean;
    loading?: boolean;
    singleButton?: boolean;
};

export function ConfirmModal({
    visible,
    title,
    description,
    cancelText = "Cancel",
    confirmText = "Confirm",
    onCancel,
    onConfirm,
    isDestructive = false,
    loading = false,
    singleButton = false,
}: ConfirmModalProps) {
    const [show, setShow] = useState(visible);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (visible) {
            setShow(true);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    damping: 20,
                    stiffness: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 150,
                    useNativeDriver: true,
                }),
                Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 150,
                    useNativeDriver: true,
                }),
            ]).start(() => {
                setShow(false);
            });
        }
    }, [visible, fadeAnim, scaleAnim]);

    if (!show) return null;

    return (
        <Modal transparent visible={show} animationType="none" statusBarTranslucent>
            <Animated.View style={[{ opacity: fadeAnim }, StyleSheet.absoluteFill]} className="bg-black/40 items-center justify-center px-6">
                <Pressable style={StyleSheet.absoluteFill} onPress={onCancel || onConfirm} disabled={loading} />
                
                <Animated.View 
                    style={{ transform: [{ scale: scaleAnim }] }}
                    className="w-full max-w-[320px] bg-white rounded-[28px] overflow-hidden shadow-2xl"
                >
                    <View className="px-6 pt-7 pb-6 items-center">
                        <View className={`w-14 h-14 rounded-full items-center justify-center mb-5 ${isDestructive ? 'bg-red-50' : 'bg-primary/10'}`}>
                            <AlertCircle size={28} color={isDestructive ? '#dc2626' : '#5B8F85'} strokeWidth={2.2} />
                        </View>
                        
                        <Text className="text-xl font-bold text-[#1A1A1A] text-center mb-2 tracking-tight">
                            {title}
                        </Text>
                        <Text className="text-[13px] leading-5 text-[#555555] text-center px-2">
                            {description}
                        </Text>
                    </View>

                    <View className="flex-row border-t border-[#f1f1f1]">
                        {!singleButton && (
                            <Pressable 
                                onPress={onCancel} 
                                disabled={loading}
                                className="flex-1 py-4 items-center justify-center border-r border-[#f1f1f1] active:bg-[#f9f9f9]"
                            >
                                <Text className="text-[15px] font-semibold text-[#555555]">
                                    {cancelText}
                                </Text>
                            </Pressable>
                        )}
                        <Pressable 
                            onPress={onConfirm}
                            disabled={loading}
                            className={`flex-1 py-4 items-center justify-center active:bg-[#f9f9f9] ${loading ? 'opacity-70' : ''}`}
                        >
                            <Text className={`text-[15px] font-bold ${isDestructive ? 'text-red-600' : 'text-primary'}`}>
                                {loading ? "Processing..." : confirmText}
                            </Text>
                        </Pressable>
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}
