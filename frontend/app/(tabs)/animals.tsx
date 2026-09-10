import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Image,
  RefreshControl,
} from "react-native";
import { useCallback, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from "@/src/theme";
import {
  Animal,
  deleteAnimal,
  getAnimals,
  getMeals,
  saveMeals,
} from "@/src/utils/storage/store";
import { cancelReminder } from "@/src/utils/notifications";

export default function AnimalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const a = await getAnimals();
    setAnimals(a);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onDelete = async (a: Animal) => {
    // Cancel and remove related meal reminders
    const meals = await getMeals();
    const related = meals.filter((m) => m.animalId === a.id);
    for (const m of related) {
      await cancelReminder(m.notificationId);
    }
    const remaining = meals.filter((m) => m.animalId !== a.id);
    await saveMeals(remaining);
    await deleteAnimal(a.id);
    load();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الحيوانات المسجلة</Text>
        <Text style={styles.headerSubtitle}>
          {animals.length > 0
            ? `${animals.length} حيوان`
            : "لم تضف أي حيوان بعد"}
        </Text>
      </View>

      <FlatList
        data={animals}
        keyExtractor={(a) => a.id}
        numColumns={2}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
        }
        columnWrapperStyle={{ gap: SPACING.md }}
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 120,
          gap: SPACING.md,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="paw-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>لا يوجد حيوانات مسجلة</Text>
            <Text style={styles.emptySubtitle}>
              اضغط على الزر البرتقالي في الأسفل لإضافة أول حيوان
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View testID={`animal-card-${item.id}`} style={styles.card}>
            <View style={styles.photoWrapper}>
              {item.photoUri ? (
                <Image source={{ uri: item.photoUri }} style={styles.photo} />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Icon name="paw" size={44} color={COLORS.brand} />
                </View>
              )}
            </View>
            <Text style={styles.animalName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.animalType} numberOfLines={1}>
              {item.type}
            </Text>
            <View style={styles.cardActions}>
              <Pressable
                testID={`animal-edit-${item.id}`}
                onPress={() =>
                  router.push({
                    pathname: "/animal-form",
                    params: { id: item.id },
                  })
                }
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Icon name="create-outline" size={18} color={COLORS.onSurface} />
              </Pressable>
              <Pressable
                testID={`animal-delete-${item.id}`}
                onPress={() => onDelete(item)}
                style={styles.iconBtn}
                hitSlop={8}
              >
                <Icon name="trash-outline" size={18} color={COLORS.error} />
              </Pressable>
            </View>
          </View>
        )}
      />

      <Pressable
        testID="add-animal-fab"
        onPress={() => router.push("/animal-form")}
        style={styles.fab}
      >
        <Icon name="add" size={28} color={COLORS.onBrandPrimary} />
        <Text style={styles.fabText}>حيوان جديد</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  headerTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.xxl,
    color: COLORS.onSurface,
    textAlign: "right",
  },
  headerSubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurfaceSecondary,
    textAlign: "right",
    marginTop: SPACING.xs,
  },
  card: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  photoWrapper: { width: "100%", aspectRatio: 1, marginBottom: SPACING.sm },
  photo: {
    width: "100%",
    height: "100%",
    borderRadius: RADIUS.md,
    resizeMode: "cover",
  },
  photoPlaceholder: {
    backgroundColor: COLORS.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  animalName: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onSurface,
    textAlign: "center",
  },
  animalType: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurfaceSecondary,
    textAlign: "center",
    marginBottom: SPACING.sm,
  },
  cardActions: { flexDirection: "row", gap: SPACING.xs },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: SPACING.xxxl,
    gap: SPACING.sm,
  },
  emptyTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.xl,
    color: COLORS.onSurface,
  },
  emptySubtitle: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurfaceSecondary,
    textAlign: "center",
    paddingHorizontal: SPACING.xl,
  },
  fab: {
    position: "absolute",
    left: SPACING.lg,
    bottom: SPACING.lg,
    backgroundColor: COLORS.brand,
    borderRadius: RADIUS.pill,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    shadowColor: COLORS.brand,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  fabText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onBrandPrimary,
  },
});
