import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from "@/src/theme";
import {
  Animal,
  generateId,
  getAnimals,
  getMeals,
  Meal,
  upsertMeal,
} from "@/src/utils/storage/store";
import {
  cancelReminder,
  scheduleMealReminder,
} from "@/src/utils/notifications";

const MEAL_TYPES = [
  "طعام جاف",
  "طعام رطب",
  "لحم",
  "خضروات",
  "فواكه",
  "حبوب",
  "أخرى",
];

const REMINDER_OPTIONS = [5, 10, 15, 30, 60, 120];

function formatDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} - ${hh}:${mi}`;
}

export default function MealForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [animals, setAnimals] = useState<Animal[]>([]);
  const [animalId, setAnimalId] = useState<string | null>(null);
  const [mealType, setMealType] = useState(MEAL_TYPES[0]);
  const [customMealType, setCustomMealType] = useState("");
  const [useCustomMeal, setUseCustomMeal] = useState(false);
  const [mealDate, setMealDate] = useState<Date>(new Date());
  const [nextMealDate, setNextMealDate] = useState<Date>(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [existingNotifId, setExistingNotifId] = useState<string | undefined>();
  const [pickerMode, setPickerMode] = useState<
    | null
    | { field: "meal" | "next"; mode: "date" | "time" }
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const a = await getAnimals();
      setAnimals(a);
      if (a.length > 0 && !animalId) setAnimalId(a[0].id);

      if (params.id) {
        const meals = await getMeals();
        const m = meals.find((x) => x.id === params.id);
        if (m) {
          setAnimalId(m.animalId);
          if (MEAL_TYPES.includes(m.mealType)) {
            setMealType(m.mealType);
            setUseCustomMeal(false);
          } else {
            setUseCustomMeal(true);
            setCustomMealType(m.mealType);
          }
          setMealDate(new Date(m.mealDate));
          setNextMealDate(new Date(m.nextMealDate));
          setReminderMinutes(m.reminderMinutesBefore);
          setExistingNotifId(m.notificationId);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const onSave = async () => {
    setError(null);
    if (!animalId) {
      setError("يرجى إضافة حيوان أولاً من صفحة الحيوانات");
      return;
    }
    const animal = animals.find((a) => a.id === animalId);
    if (!animal) {
      setError("لم يتم العثور على الحيوان");
      return;
    }
    const finalMeal = useCustomMeal ? customMealType.trim() : mealType;
    if (!finalMeal) {
      setError("يرجى إدخال نوع الوجبة");
      return;
    }
    if (nextMealDate.getTime() <= Date.now()) {
      setError("تاريخ الوجبة القادمة يجب أن يكون في المستقبل");
      return;
    }

    // Cancel existing reminder if editing
    if (existingNotifId) {
      await cancelReminder(existingNotifId);
    }

    const notificationId = await scheduleMealReminder({
      animalName: animal.name,
      mealType: finalMeal,
      nextMealDate: nextMealDate.toISOString(),
      reminderMinutesBefore: reminderMinutes,
    });

    const meal: Meal = {
      id: params.id || generateId(),
      animalId: animal.id,
      animalName: animal.name,
      animalType: animal.type,
      mealType: finalMeal,
      mealDate: mealDate.toISOString(),
      nextMealDate: nextMealDate.toISOString(),
      reminderMinutesBefore: reminderMinutes,
      notificationId,
      createdAt: new Date().toISOString(),
    };
    await upsertMeal(meal);
    router.back();
  };

  const openPicker = (field: "meal" | "next", mode: "date" | "time") => {
    setPickerMode({ field, mode });
  };

  const onPickerChange = (event: unknown, selected?: Date) => {
    if (Platform.OS === "android") setPickerMode(null);
    if (!selected) return;
    const current = pickerMode?.field === "meal" ? mealDate : nextMealDate;
    const next = new Date(current);
    if (pickerMode?.mode === "date") {
      next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    } else {
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    }
    if (pickerMode?.field === "meal") setMealDate(next);
    else setNextMealDate(next);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
        <Pressable testID="close-btn" onPress={() => router.back()} style={styles.iconBtn}>
          <Icon name="close" size={22} color={COLORS.onSurface} />
        </Pressable>
        <Text style={styles.title}>{isEdit ? "تعديل وجبة" : "وجبة جديدة"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animal selection */}
        <Text style={styles.label}>الحيوان</Text>
        {animals.length === 0 ? (
          <View style={styles.warnCard}>
            <Icon name="warning" size={22} color={COLORS.warning} />
            <Text style={styles.warnText}>
              لا يوجد حيوانات مسجلة، أضف حيوان أولاً من صفحة "الحيوانات"
            </Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: SPACING.sm }}>
              {animals.map((a) => {
                const active = animalId === a.id;
                return (
                  <Pressable
                    key={a.id}
                    testID={`animal-select-${a.id}`}
                    onPress={() => setAnimalId(a.id)}
                    style={[styles.animalChip, active && styles.animalChipActive]}
                  >
                    <Icon
                      name="paw"
                      size={16}
                      color={active ? COLORS.onBrandPrimary : COLORS.brand}
                    />
                    <Text
                      style={[
                        styles.animalChipText,
                        active && { color: COLORS.onBrandPrimary },
                      ]}
                    >
                      {a.name} ({a.type})
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}

        {/* Meal type */}
        <Text style={styles.label}>نوع الوجبة</Text>
        <View style={styles.typeGrid}>
          {MEAL_TYPES.map((t) => {
            const active = !useCustomMeal && mealType === t;
            return (
              <Pressable
                key={t}
                testID={`meal-type-${t}`}
                onPress={() => {
                  setMealType(t);
                  setUseCustomMeal(false);
                }}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    active && { color: COLORS.onBrandPrimary },
                  ]}
                >
                  {t}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            testID="meal-type-custom"
            onPress={() => setUseCustomMeal(true)}
            style={[styles.typeChip, useCustomMeal && styles.typeChipActive]}
          >
            <Text
              style={[
                styles.typeChipText,
                useCustomMeal && { color: COLORS.onBrandPrimary },
              ]}
            >
              مخصص
            </Text>
          </Pressable>
        </View>
        {useCustomMeal && (
          <TextInput
            testID="custom-meal-type"
            value={customMealType}
            onChangeText={setCustomMealType}
            placeholder="اكتب نوع الوجبة"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { marginTop: SPACING.sm }]}
            textAlign="right"
          />
        )}

        {/* Meal date */}
        <Text style={styles.label}>تاريخ الوجبة</Text>
        <View style={styles.dateRow}>
          <Pressable
            testID="meal-date-btn"
            onPress={() => openPicker("meal", "date")}
            style={styles.dateBtn}
          >
            <Icon name="calendar" size={18} color={COLORS.brand} />
            <Text style={styles.dateBtnText}>{formatDate(mealDate).split(" - ")[0]}</Text>
          </Pressable>
          <Pressable
            testID="meal-time-btn"
            onPress={() => openPicker("meal", "time")}
            style={styles.dateBtn}
          >
            <Icon name="time" size={18} color={COLORS.brand} />
            <Text style={styles.dateBtnText}>{formatDate(mealDate).split(" - ")[1]}</Text>
          </Pressable>
        </View>

        {/* Next meal date */}
        <Text style={styles.label}>الوجبة القادمة</Text>
        <View style={styles.dateRow}>
          <Pressable
            testID="next-date-btn"
            onPress={() => openPicker("next", "date")}
            style={styles.dateBtn}
          >
            <Icon name="calendar" size={18} color={COLORS.brand} />
            <Text style={styles.dateBtnText}>
              {formatDate(nextMealDate).split(" - ")[0]}
            </Text>
          </Pressable>
          <Pressable
            testID="next-time-btn"
            onPress={() => openPicker("next", "time")}
            style={styles.dateBtn}
          >
            <Icon name="time" size={18} color={COLORS.brand} />
            <Text style={styles.dateBtnText}>
              {formatDate(nextMealDate).split(" - ")[1]}
            </Text>
          </Pressable>
        </View>

        {/* Reminder */}
        <Text style={styles.label}>التذكير قبل الموعد (بالدقائق)</Text>
        <View style={styles.typeGrid}>
          {REMINDER_OPTIONS.map((m) => {
            const active = reminderMinutes === m;
            return (
              <Pressable
                key={m}
                testID={`reminder-${m}`}
                onPress={() => setReminderMinutes(m)}
                style={[styles.typeChip, active && styles.typeChipActive]}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    active && { color: COLORS.onBrandPrimary },
                  ]}
                >
                  {m} دقيقة
                </Text>
              </Pressable>
            );
          })}
        </View>

        {error && (
          <Text testID="form-error" style={styles.errorText}>
            {error}
          </Text>
        )}

        {pickerMode && (
          <DateTimePicker
            testID="datetime-picker"
            value={pickerMode.field === "meal" ? mealDate : nextMealDate}
            mode={pickerMode.mode}
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onPickerChange}
            minimumDate={pickerMode.field === "next" ? new Date() : undefined}
          />
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable testID="save-meal-btn" onPress={onSave} style={styles.saveBtn}>
          <Icon name="checkmark" size={22} color={COLORS.onBrandPrimary} />
          <Text style={styles.saveText}>
            {isEdit ? "حفظ التعديلات" : "إضافة الوجبة"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.onSurface,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
    textAlign: "right",
  },
  input: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onSurface,
  },
  animalChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  animalChipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  animalChipText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
  },
  typeGrid: { flexDirection: "row", flexWrap: "wrap", gap: SPACING.sm },
  typeChip: {
    height: 40,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  typeChipActive: {
    backgroundColor: COLORS.brand,
    borderColor: COLORS.brand,
  },
  typeChipText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
  },
  dateRow: { flexDirection: "row", gap: SPACING.sm },
  dateBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.xs,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  dateBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
  },
  warnCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: "#FFF7E0",
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: "#F1D97C",
  },
  warnText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: "#7A5A00",
    flex: 1,
    textAlign: "right",
  },
  errorText: {
    color: COLORS.error,
    fontFamily: FONTS.bold,
    marginTop: SPACING.md,
    textAlign: "right",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
  },
  saveBtn: {
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
  },
  saveText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onBrandPrimary,
  },
});
