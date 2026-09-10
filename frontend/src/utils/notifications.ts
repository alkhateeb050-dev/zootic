import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  try {
    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("zootic-reminders", {
        name: "تذكيرات الوجبات",
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#D4622A",
      });
    }
    const { status } = await Notifications.getPermissionsAsync();
    if (status === "granted") return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.status === "granted";
  } catch {
    return false;
  }
}

export async function scheduleMealReminder(params: {
  animalName: string;
  mealType: string;
  nextMealDate: string; // ISO
  reminderMinutesBefore: number;
}): Promise<string | undefined> {
  try {
    const ok = await ensureNotificationPermission();
    if (!ok) return undefined;

    const triggerDate = new Date(
      new Date(params.nextMealDate).getTime() -
        params.reminderMinutesBefore * 60 * 1000,
    );
    // If in past, don't schedule
    if (triggerDate.getTime() <= Date.now() + 1000) return undefined;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `تذكير وجبة ${params.animalName}`,
        body: `اقترب موعد وجبة (${params.mealType}) خلال ${params.reminderMinutesBefore} دقيقة`,
        sound: "default",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        channelId: Platform.OS === "android" ? "zootic-reminders" : undefined,
      },
    });
    return id;
  } catch {
    return undefined;
  }
}

export async function cancelReminder(id?: string): Promise<void> {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    /* noop */
  }
}
