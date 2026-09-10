import AsyncStorage from "@react-native-async-storage/async-storage";

export type Animal = {
  id: string;
  name: string;
  type: string; // Arabic label
  photoUri?: string;
  createdAt: string;
};

export type Meal = {
  id: string;
  animalId: string;
  // Snapshot of animal info (for legacy records if animal deleted)
  animalName: string;
  animalType: string;
  mealType: string;
  mealDate: string; // ISO
  nextMealDate: string; // ISO
  reminderMinutesBefore: number;
  notificationId?: string;
  createdAt: string;
};

const ANIMALS_KEY = "zootic:animals";
const MEALS_KEY = "zootic:meals";

// ---------- Animals ----------
export async function getAnimals(): Promise<Animal[]> {
  try {
    const raw = await AsyncStorage.getItem(ANIMALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Animal[];
  } catch {
    return [];
  }
}

export async function saveAnimals(list: Animal[]): Promise<void> {
  await AsyncStorage.setItem(ANIMALS_KEY, JSON.stringify(list));
}

export async function upsertAnimal(a: Animal): Promise<void> {
  const list = await getAnimals();
  const idx = list.findIndex((x) => x.id === a.id);
  if (idx >= 0) list[idx] = a;
  else list.unshift(a);
  await saveAnimals(list);
}

export async function deleteAnimal(id: string): Promise<void> {
  const list = await getAnimals();
  await saveAnimals(list.filter((x) => x.id !== id));
}

// ---------- Meals ----------
export async function getMeals(): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Meal[];
  } catch {
    return [];
  }
}

export async function saveMeals(list: Meal[]): Promise<void> {
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify(list));
}

export async function upsertMeal(m: Meal): Promise<void> {
  const list = await getMeals();
  const idx = list.findIndex((x) => x.id === m.id);
  if (idx >= 0) list[idx] = m;
  else list.unshift(m);
  await saveMeals(list);
}

export async function deleteMeal(id: string): Promise<void> {
  const list = await getMeals();
  await saveMeals(list.filter((x) => x.id !== id));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
