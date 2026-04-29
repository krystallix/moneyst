import { useAuth } from "@/lib/auth/AuthContext";
import { supabase } from "@/lib/supabase";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ChevronLeft, Search as SearchIcon, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityItem } from "../(tabs)/home";

export default function SearchScreen() {
    const { user } = useAuth();
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!user || query.trim() === "") {
            setResults([]);
            return;
        }

        const fetchResults = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .schema("moneyst")
                    .from("transactions")
                    .select("id, type, amount, currency, description, date, time, is_transfer, categories:category_id(id, name, icon, color, type), accounts:account_id(id, name)")
                    .eq("user_id", user.id)
                    .eq("is_deleted", false)
                    .ilike("description", `%${query}%`)
                    .order("date", { ascending: false })
                    .limit(50);

                if (error) {
                    console.error("Supabase search error:", error);
                } else if (data) {
                    setResults(data);
                }
            } catch (e) {
                console.error("Search error:", e);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(() => {
            fetchResults();
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, user]);

    return (
        <View className="flex-1 bg-background">
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1" edges={['top']}>
                <View className="px-6 pt-5 flex-row items-center ">
                    <Pressable
                        onPress={() => router.back()}
                        className="w-10 h-10 rounded-xl items-center justify-center active:opacity-70 border border-border mr-3"
                    >
                        <ChevronLeft size={20} color="#1A1A1A" strokeWidth={2.5} />
                    </Pressable>
                    <View className="flex-1 flex-row items-center bg-secondary/20 h-10 rounded-xl px-3 border border-border">
                        <SearchIcon size={16} color="#8E8E93" />
                        <TextInput
                            value={query}
                            onChangeText={setQuery}
                            placeholder="Search by notes..."
                            placeholderTextColor="#A1A1AA"
                            className="flex-1 ml-2 h-12 text-foreground font-semibold"
                            autoFocus
                        />
                        {query.length > 0 && (
                            <Pressable onPress={() => setQuery("")} className="w-6 h-6 items-center justify-center rounded-full bg-border/50">
                                <X size={12} color="#555" />
                            </Pressable>
                        )}
                    </View>
                </View>

                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    className="flex-1"
                >
                    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 16 }}>
                        {loading ? (
                            <View className="py-10 items-center">
                                <ActivityIndicator color="#3D9B35" />
                            </View>
                        ) : query.trim() === "" ? (
                            <View className="py-10 items-center opacity-50">
                                <SearchIcon size={40} color="#999" strokeWidth={1.5} className="mb-4" />
                                <Text className="text-muted-foreground font-medium text-center">Type something to search transactions...</Text>
                            </View>
                        ) : results.length === 0 ? (
                            <View className="py-10 items-center opacity-50">
                                <Text className="text-muted-foreground font-medium text-center">No transactions found</Text>
                            </View>
                        ) : (
                            <View>
                                <Text className="text-sm font-bold text-muted-foreground mb-4">Search Results ({results.length})</Text>
                                {results.map((tx) => (
                                    <View key={tx.id}>
                                        <ActivityItem
                                            tx={tx}
                                            isCard
                                            onDelete={undefined}
                                        />
                                    </View>
                                ))}
                            </View>
                        )}
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </View>
    );
}
