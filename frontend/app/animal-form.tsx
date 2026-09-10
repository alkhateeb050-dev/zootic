import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import Icon from "@react-native-vector-icons/ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { COLORS, FONTS, FONT_SIZE, RADIUS, SPACING } from "@/src/theme";
import {
  Animal,
  generateId,
  getAnimals,
  upsertAnimal,
} from "@/src/utils/storage/store";

const ANIMAL_TYPES = [
  "قطة",
  "كلب",
  "طائر",
  "أرنب",
  "زواحف",
  "سمكة",
  "قوارض",
  "حصان",
  "ماشية",
  "أخرى",
];

export default function AnimalForm() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ id?: string }>();
  const isEdit = !!params.id;

  const [name, setName] = useState("");
  const [type, setType] = useState("قطة");
  const [customType, setCustomType] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (params.id) {
        const list = await getAnimals();
        const a = list.find((x) => x.id === params.id);
        if (a) {
          setName(a.name);
          if (ANIMAL_TYPES.includes(a.type)) {
            setType(a.type);
            setUseCustom(false);
          } else {
            setUseCustom(true);
            setCustomType(a.type);
          }
          setPhotoUri(a.photoUri);
        }
      }
    })();
  }, [params.id]);

  const pickPhoto = async (source: "camera" | "library") => {
    try {
      if (source === "camera") {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) return;
        const res = await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
      } else {
        // Native Photo Picker (Android 13+ / iOS PHPicker) — no permission needed.
        // Do NOT call requestMediaLibraryPermissionsAsync() so the app doesn't
        // require READ_MEDIA_IMAGES; the system picker grants per-file access.
        const res = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.7,
        });
        if (!res.canceled && res.assets[0]) setPhotoUri(res.assets[0].uri);
      }
    } catch {}
  };

  const onSave = async () => {
    setError(null);
    const finalType = useCustom ? customType.trim() : type;
    if (!name.trim()) {
      setError("يرجى إدخال اسم الحيوان");
      return;
    }
    if (!finalType) {
      setError("يرجى إدخال نوع الحيوان");
      return;
    }
    const animal: Animal = {
      id: params.id || generateId(),
      name: name.trim(),
      type: finalType,
      photoUri,
      createdAt: new Date().toISOString(),
    };
    await upsertAnimal(animal);
    router.back();
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
        <Text style={styles.title}>{isEdit ? "تعديل حيوان" : "حيوان جديد"}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 140 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Photo picker */}
        <View style={styles.photoRow}>
          <View style={styles.photoWrap}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Icon name="paw" size={44} color={COLORS.brand} />
              </View>
            )}
          </View>
          <View style={{ gap: SPACING.sm }}>
            <Pressable
              testID="pick-camera"
              onPress={() => pickPhoto("camera")}
              style={styles.smallBtn}
            >
              <Icon name="camera" size={18} color={COLORS.onSurface} />
              <Text style={styles.smallBtnText}>الكاميرا</Text>
            </Pressable>
            <Pressable
              testID="pick-library"
              onPress={() => pickPhoto("library")}
              style={styles.smallBtn}
            >
              <Icon name="image" size={18} color={COLORS.onSurface} />
              <Text style={styles.smallBtnText}>المعرض</Text>
            </Pressable>
          </View>
        </View>

        {/* Name */}
        <Text style={styles.label}>اسم الحيوان</Text>
        <TextInput
          testID="animal-name-input"
          value={name}
          onChangeText={setName}
          placeholder="مثال: بيسي"
          placeholderTextColor={COLORS.muted}
          style={styles.input}
          textAlign="right"
        />

        {/* Type */}
        <Text style={styles.label}>نوع الحيوان</Text>
        <View style={styles.typeGrid}>
          {ANIMAL_TYPES.map((t) => {
            const active = !useCustom && type === t;
            return (
              <Pressable
                key={t}
                testID={`type-${t}`}
                onPress={() => {
                  setType(t);
                  setUseCustom(false);
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
            testID="type-custom"
            onPress={() => setUseCustom(true)}
            style={[styles.typeChip, useCustom && styles.typeChipActive]}
          >
            <Text
              style={[
                styles.typeChipText,
                useCustom && { color: COLORS.onBrandPrimary },
              ]}
            >
              مخصص
            </Text>
          </Pressable>
        </View>

        {useCustom && (
          <TextInput
            testID="custom-type-input"
            value={customType}
            onChangeText={setCustomType}
            placeholder="اكتب نوع الحيوان"
            placeholderTextColor={COLORS.muted}
            style={[styles.input, { marginTop: SPACING.sm }]}
            textAlign="right"
          />
        )}

        {error && (
          <Text testID="form-error" style={styles.errorText}>
            {error}
          </Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <Pressable testID="save-animal-btn" onPress={onSave} style={styles.saveBtn}>
          <Icon name="checkmark" size={22} color={COLORS.onBrandPrimary} />
          <Text style={styles.saveText}>{isEdit ? "حفظ التعديلات" : "إضافة الحيوان"}</Text>
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
  photoRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
    alignItems: "center",
  },
  photoWrap: { width: 120, height: 120 },
  photo: { width: "100%", height: "100%", borderRadius: RADIUS.lg, resizeMode: "cover" },
  photoPlaceholder: {
    backgroundColor: COLORS.brandTertiary,
    alignItems: "center",
    justifyContent: "center",
  },
  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.surfaceTertiary,
  },
  smallBtnText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
  },
  label: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZE.base,
    color: COLORS.onSurface,
    marginTop: SPACING.md,
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
