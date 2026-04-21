import { supabase } from "@/lib/supabase";
import * as ImagePicker from "expo-image-picker";
import { Camera, Trash2, X } from "lucide-react-native";
import { useState } from "react";
import {
    ActivityIndicator,
    Image,
    Modal,
    Pressable,
    ScrollView,
    Text,
    View,
} from "react-native";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;

const DEFAULT_AVATARS = [
    `${SUPABASE_URL}/storage/v1/object/public/moneyst/default/avatar1.png`,
    `${SUPABASE_URL}/storage/v1/object/public/moneyst/default/avatar2.png`,
    `${SUPABASE_URL}/storage/v1/object/public/moneyst/default/avatar3.png`,
    `${SUPABASE_URL}/storage/v1/object/public/moneyst/default/avatar4.png`,
];

type AvatarPickerProps = {
    visible: boolean;
    currentUrl: string | null;
    userId: string;
    onSelect: (url: string | null) => void;
    onClose: () => void;
};

export function AvatarPicker({
    visible,
    currentUrl,
    userId,
    onSelect,
    onClose,
}: AvatarPickerProps) {
    const [uploading, setUploading] = useState(false);

    const handleSelectTemplate = (url: string) => {
        onSelect(url);
        onClose();
    };

    const handleRemove = () => {
        onSelect(null);
        onClose();
    };

    const handleUpload = async () => {
        try {
            const permission =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permission.granted) {
                alert("Permission to access gallery is required.");
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (result.canceled || !result.assets?.[0]) return;

            setUploading(true);

            const asset = result.assets[0];
            const ext = asset.uri.split(".").pop() ?? "jpg";
            const filePath = `${userId}/avatar/avatar.${ext}`;

            // Fetch the image as a blob
            const response = await fetch(asset.uri);
            const blob = await response.blob();

            // Convert blob to ArrayBuffer for Supabase upload
            const arrayBuffer = await new Response(blob).arrayBuffer();

            const { error: uploadError } = await supabase.storage
                .from("moneyst")
                .upload(filePath, arrayBuffer, {
                    contentType: asset.mimeType ?? `image/${ext}`,
                    upsert: true,
                });

            if (uploadError) {
                console.log("Upload error:", uploadError);
                alert("Failed to upload image.");
                return;
            }

            const {
                data: { publicUrl },
            } = supabase.storage.from("moneyst").getPublicUrl(filePath);

            // Append timestamp to bust cache
            onSelect(`${publicUrl}?t=${Date.now()}`);
            onClose();
        } catch (err: any) {
            console.log("Avatar upload error:", err);
            alert(err.message ?? "Something went wrong.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end bg-black/50">
                <View className="bg-background rounded-t-3xl px-6 pt-6 pb-10">
                    {/* Header */}
                    <View className="flex-row items-center justify-between mb-6">
                        <Text className="text-lg font-bold text-foreground">
                            Change Avatar
                        </Text>
                        <Pressable
                            onPress={onClose}
                            hitSlop={8}
                            className="p-2 rounded-xl bg-secondary"
                        >
                            <X size={18} className="text-foreground" />
                        </Pressable>
                    </View>

                    {/* Templates */}
                    <Text className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Choose a template
                    </Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 12 }}
                        className="mb-6"
                    >
                        {DEFAULT_AVATARS.map((url, i) => {
                            const isActive = currentUrl === url;
                            return (
                                <Pressable
                                    key={i}
                                    onPress={() => handleSelectTemplate(url)}
                                    className={`w-20 h-20 rounded-full overflow-hidden border-2 ${
                                        isActive
                                            ? "border-primary"
                                            : "border-border"
                                    }`}
                                >
                                    <Image
                                        source={{ uri: url }}
                                        className="w-full h-full"
                                        resizeMode="cover"
                                    />
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Actions */}
                    <View className="gap-y-3">
                        {/* Upload from gallery */}
                        <Pressable
                            onPress={handleUpload}
                            disabled={uploading}
                            className="flex-row items-center gap-3 rounded-xl border border-border bg-background px-4 py-3.5 active:bg-muted"
                        >
                            {uploading ? (
                                <ActivityIndicator size="small" />
                            ) : (
                                <Camera
                                    size={18}
                                    strokeWidth={2}
                                    className="text-foreground"
                                />
                            )}
                            <Text className="text-sm font-medium text-foreground">
                                {uploading
                                    ? "Uploading..."
                                    : "Upload from gallery"}
                            </Text>
                        </Pressable>

                        {/* Remove avatar */}
                        <Pressable
                            onPress={handleRemove}
                            className="flex-row items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 active:bg-red-100"
                        >
                            <Trash2
                                size={18}
                                strokeWidth={2}
                                color="#dc2626"
                            />
                            <Text className="text-sm font-medium text-red-600">
                                Remove avatar
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
