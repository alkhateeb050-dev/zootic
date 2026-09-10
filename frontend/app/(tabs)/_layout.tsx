import { Tabs } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { COLORS, FONTS } from "@/src/theme";
import { Platform } from "react-native";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.brand,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarLabelStyle: {
          fontFamily: FONTS.regular,
          fontSize: 12,
        },
        tabBarStyle: {
          backgroundColor: COLORS.surfaceSecondary,
          borderTopColor: COLORS.border,
          ...(Platform.OS === "web" ? { height: 64 } : {}),
        },
        tabBarItemStyle: { alignSelf: "center" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "الوجبات",
          tabBarIcon: ({ color, size }) => (
            <Icon name="restaurant" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="animals"
        options={{
          title: "الحيوانات",
          tabBarIcon: ({ color, size }) => (
            <Icon name="paw" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
