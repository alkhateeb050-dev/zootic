import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  FlatList,
  Image,
  Linking,
  RefreshControl,
} from "react-native";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useFocusEffect, useRouter } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from "@/src/theme";
import {
  deleteMeal,
  getMeals,
  Meal,
} from "@/src/utils/storage/store";
import { cancelReminder } from "@/src/utils/notifications";

type FilterKey = "all" | "today" | "upcoming";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "الكل" },
  { key: "today", label: "اليوم" },
  { key: "upcoming", label: "الوجبات القادمة" },
];

function formatDate(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} - ${hh}:${mi}`;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default function MealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const m = await getMeals();
    // Sort by next meal date ascending
    m.sort(
      (a, b) =>
        new Date(a.nextMealDate).getTime() -
        new Date(b.nextMealDate).getTime(),
    );
    setMeals(m);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const now = new Date();
    if (filter === "today") {
      return meals.filter((m) => isSameDay(new Date(m.nextMealDate), now));
    }
    if (filter === "upcoming") {
      return meals.filter((m) => new Date(m.nextMealDate).getTime() >= now.getTime());
    }
    return meals;
  }, [meals, filter]);

  const onDelete = async (m: Meal) => {
    await cancelReminder(m.notificationId);
    await deleteMeal(m.id);
    load();
  };

  const openStore = () => {
    Linking.openURL("https://zoo-tic.com").catch(() => {});
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Image
            source={require("../../assets/images/zootic-logo.png")}
            style={styles.headerLogo}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>زوتيك</Text>
            <Text style={styles.headerSubtitle}>سجل وجبات حيواناتك</Text>
          </View>
        </View>
      </View>

      {/* Store link banner */}
      <Pressable
        testID="store-link-banner"
        onPress={openStore}
        style={styles.storeBanner}
      >
        <Image
          source={require("../../assets/images/zootic-logo.png")}
          style={styles.storeIcon}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.storeTitle}>زوروا موقعنا</Text>
          <Text style={styles.storeUrl}>zoo-tic.com</Text>
        </View>
        <Icon name="chevron-back" size={20} color={COLORS.onBrandPrimary} />
      </Pressable>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
        style={styles.chipsScroll}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              testID={`filter-chip-${f.key}`}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                active && { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  active && { color: COLORS.onBrandPrimary },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.brand} />
        }
        contentContainerStyle={{
          paddingHorizontal: SPACING.lg,
          paddingBottom: 120,
          paddingTop: SPACING.sm,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="fast-food-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>لا توجد وجبات مسجلة</Text>
            <Text style={styles.emptySubtitle}>
              أضف أول وجبة عبر الزر السفلي البرتقالي
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View testID={`meal-card-${item.id}`} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.animalBadge}>
                <Icon name="paw" size={16} color={COLORS.brand} />
                <Text style={styles.animalBadgeText}>
                  {item.animalType} - {item.animalName}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  testID={`meal-edit-${item.id}`}
                  onPress={() =>
                    router.push({
                      pathname: "/meal-form",
                      params: { id: item.id },
                    })
                  }
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Icon name="create-outline" size={20} color={COLORS.onSurface} />
                </Pressable>
                <Pressable
                  testID={`meal-delete-${item.id}`}
                  onPress={() => onDelete(item)}
                  style={styles.iconBtn}
                  hitSlop={8}
                >
                  <Icon name="trash-outline" size={20} color={COLORS.error} />
                </Pressable>
              </View>
            </View>

            <View style={styles.rowBetween}>
              <Text style={styles.mealType}>{item.mealType}</Text>
            </View>

            <View style={styles.dateBlock}>
              <View style={styles.dateRow}>
                <Icon name="time-outline" size={16} color={COLORS.muted} />
                <Text style={styles.dateLabel}>تاريخ الوجبة:</Text>
                <Text style={styles.dateValue}>{formatDate(item.mealDate)}</Text>
              </View>
              <View style={styles.dateRow}>
                <Icon name="alarm-outline" size={16} color={COLORS.brand} />
                <Text style={styles.dateLabel}>الوجبة القادمة:</Text>
                <Text style={[styles.dateValue, { color: COLORS.brand }]}>
                  {formatDate(item.nextMealDate)}
                </Text>
              </View>
              <View style={styles.dateRow}>
                <Icon name="notifications-outline" size={16} color={COLORS.brandSecondary} />
                <Text style={styles.dateLabel}>تذكير قبل:</Text>
                <Text style={styles.dateValue}>
                  {item.reminderMinutesBefore} دقيقة
                </Text>
              </View>
            </View>
          </View>
        )}
      />

      {/* FAB */}
      <Pressable
        testID="add-meal-fab"
        onPress={() => router.push("/meal-form")}
        style={[
          styles.fab,
          { bottom: SPACING.lg + (insets.bottom > 0 ? 0 : 0) },
        ]}
      >
        <Icon name="add" size={28} color={COLORS.onBrandPrimary} />
        <Text style={styles.fabText}>وجبة جديدة</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: SPACING.md },
  headerLogo: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    resizeMode: "contain",
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
  },
  storeBanner: {
    marginHorizontal: SPACING.lg,
    backgroundColor: COLORS.surfaceInverse,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  storeIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surface,
    resizeMode: "contain",
  },
  storeTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onSurfaceInverse,
    textAlign: "right",
  },
  storeUrl: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.brand,
    textAlign: "right",
  },
  chipsScroll: {
    marginTop: SPACING.lg,
    maxHeight: 56,
  },
  chipsRow: {
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    alignItems: "center",
    height: 56,
  },
  chip: {
    flexShrink: 0,
    height: 36,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
  },
  card: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  animalBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    backgroundColor: COLORS.brandTertiary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.pill,
  },
  animalBadgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onBrandTertiary,
  },
  cardActions: { flexDirection: "row", gap: SPACING.xs },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  mealType: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.lg,
    color: COLORS.onSurface,
    textAlign: "right",
  },
  dateBlock: {
    borderTopWidth: 1,
    borderTopColor: COLORS.divider,
    paddingTop: SPACING.sm,
    gap: SPACING.xs,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
  },
  dateLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurfaceSecondary,
  },
  dateValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
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
