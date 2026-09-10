import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { LogBox, I18nManager, View, ActivityIndicator, Image } from "react-native";
import * as Font from "expo-font";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ensureNotificationPermission } from "@/src/utils/notifications";
import { COLORS } from "@/src/theme";

LogBox.ignoreAllLogs(true);

// Force RTL for the whole app
if (!I18nManager.isRTL) {
  try {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
  } catch {}
}

// Prewarm logo asset so it displays instantly across screens (expo-go safe)
try {
  const ICON_ASSET_SOURCE =
    typeof Image.resolveAssetSource === "function"
      ? Image.resolveAssetSource(require("../assets/images/zootic-logo.png"))
      : null;
  if (ICON_ASSET_SOURCE?.uri) {
    Image.prefetch(ICON_ASSET_SOURCE.uri);
  }
} catch {}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await Font.loadAsync({
          Cairo: require("../assets/fonts/Cairo-Regular.ttf"),
        });
      } catch {}
      // Fire and forget - request permission upfront
      ensureNotificationPermission();
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: COLORS.surface,
        }}
      >
        <ActivityIndicator size="large" color={COLORS.brand} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.surface },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="meal-form"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="animal-form"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
