import Home from "@/assets/icons/home.svg";
import Notebook from "@/assets/icons/notebook.svg";
import NumberedList from "@/assets/icons/numbered-list.svg";
import Plus from "@/assets/icons/plus.svg";
import Setting from "@/assets/icons/setting.svg";
import { useAuth } from "@/lib/auth/AuthContext";
import { router, Tabs } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function getIconForRoute(routeName: string, focused: boolean, color: string) {
    const stroke = focused ? 2.5 : 1.8;
    switch (routeName) {
        case "home": return <Home width={22} height={22} color={color} strokeWidth={stroke} />;
        case "transactions": return <NumberedList width={22} height={22} color={color} strokeWidth={stroke} />;
        case "new": return <Plus width={22} height={22} color={color} strokeWidth={stroke} />;
        case "reports": return <Notebook width={22} height={22} color={color} strokeWidth={stroke} />;
        case "settings": return <Setting width={22} height={22} color={color} strokeWidth={stroke} />;
        default: return null;
    }
}

function getLabelForRoute(routeName: string) {
    switch (routeName) {
        case "home": return "Home";
        case "transactions": return "Transactions";
        case "new": return "Add";
        case "reports": return "Reports";
        case "settings": return "Settings";
        default: return routeName;
    }
}

function TabBarButton({ routeName, isFocused, onPress, onLongPress }: any) {
    const label = getLabelForRoute(routeName);

    // Fix: Dark pill with white text/icon for active state, grey for inactive
    const color = isFocused ? "#FFFFFF" : "#999999";

    const buttonFlexStyle = useAnimatedStyle(() => {
        return {
            flex: withTiming(isFocused ? 2 : 1, { duration: 250 })
        };
    });

    const textWrapperStyle = useAnimatedStyle(() => {
        return {
            maxWidth: withSpring(isFocused ? 110 : 0, { damping: 15, stiffness: 120 }),
            opacity: withTiming(isFocused ? 1 : 0, { duration: 200 }),
            marginLeft: withTiming(isFocused ? 6 : 0, { duration: 200 }),
        };
    });

    return (
        <Animated.View style={buttonFlexStyle}>
            <TouchableOpacity
                accessibilityState={isFocused ? { selected: true } : {}}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.touchable}
                activeOpacity={0.8}
            >
                <Animated.View style={[styles.pillContainer]} className={isFocused ? 'bg-primary' : 'bg-transparent'}>
                    {getIconForRoute(routeName, isFocused, color)}
                    <Animated.View style={[textWrapperStyle, { overflow: 'hidden' }]}>
                        <Text numberOfLines={1} style={[styles.tabLabel, { color }]}>
                            {label}
                        </Text>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </Animated.View>
    );
}

function CustomTabBar({ state, descriptors, navigation }: any) {
    const insets = useSafeAreaInsets();
    // Default safe padding or an extra 10px if needed
    const paddingBottom = insets.bottom > 0 ? insets.bottom + 4 : 16;

    const activeRouteName = state.routes[state.index].name;
    if (activeRouteName === 'new') {
        return null; // Hide tab bar on camera screen
    }

    return (
        <View style={{ backgroundColor: '#f7f7f7' }}>
            <View style={[styles.tabBarContainer, { paddingBottom }]}>
                <View style={styles.tabBarInner}>
                    {state.routes.reduce((acc: any[], route: any, index: number) => {
                        const { options } = descriptors[route.key];
                        const isFocused = state.index === index;

                        const onPress = () => {
                            const event = navigation.emit({
                                type: 'tabPress',
                                target: route.key,
                                canPreventDefault: true,
                            });

                            if (!isFocused && !event.defaultPrevented) {
                                navigation.navigate(route.name, route.params);
                            }
                        };

                        const onLongPress = () => {
                            navigation.emit({
                                type: 'tabLongPress',
                                target: route.key,
                            });
                        };

                        acc.push(
                            <TabBarButton
                                key={route.key}
                                routeName={route.name}
                                isFocused={isFocused}
                                onPress={onPress}
                                onLongPress={onLongPress}
                            />
                        );

                        return acc;
                    }, [])}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderTopWidth: 1,
        borderTopColor: '#f1f1f1',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
        elevation: 10,
    },
    tabBarInner: {
        flexDirection: 'row',
        height: 65,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        paddingTop: 8,
    },
    touchable: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pillContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        paddingHorizontal: 12, // Reduced slightly to ensure it doesn't overlap on small screens
        borderRadius: 100,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    }
});

export default function AppTabsLayout() {
    const { user, loading } = useAuth();

    // Auth guard — redirect unauthenticated users away from tabs
    useEffect(() => {
        if (loading) return;
        if (!user) {
            router.replace("/get-started");
        }
    }, [user, loading]);

    return (
        <Tabs
            tabBar={props => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: '#f7f7f7' }
            }}
        >
            <Tabs.Screen name="home" />
            <Tabs.Screen name="transactions" />
            <Tabs.Screen name="new" />
            <Tabs.Screen name="reports" />
            <Tabs.Screen name="settings" />
        </Tabs>
    );
}
