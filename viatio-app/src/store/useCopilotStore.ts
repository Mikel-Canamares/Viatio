/**
 * COPILOT STORE
 *
 * Estado global para configuración del Viatio Copilot.
 * Gestiona preferencias de personalización, módulos activos y preferencias de viaje.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CopilotPreferences,
  DEFAULT_COPILOT_PREFERENCES,
  CopilotTone,
  CopilotResponseLength,
  CopilotLanguage,
  TravelPreferences,
  TravelInterest,
  FoodRestriction,
  TravelPace,
  MobilityLevel,
  BudgetLevel,
} from '@/types/asistente';

// ============================================
// TIPOS DEL STORE
// ============================================

interface CopilotState {
  // Estado
  preferences: CopilotPreferences;
  isLoading: boolean;
  isInitialized: boolean;

  // Acciones principales
  loadPreferences: () => Promise<void>;
  updatePreferences: (updates: Partial<CopilotPreferences>) => Promise<void>;
  resetPreferences: () => Promise<void>;

  // Acciones específicas para módulos
  toggleModule: (module: keyof CopilotPreferences['enabledModules']) => Promise<void>;
  isModuleEnabled: (module: keyof CopilotPreferences['enabledModules']) => boolean;

  // Acciones para estilo
  setTone: (tone: CopilotTone) => Promise<void>;
  setResponseLength: (length: CopilotResponseLength) => Promise<void>;
  setLanguage: (language: CopilotLanguage) => Promise<void>;
  toggleEmojis: () => Promise<void>;

  // Acciones para preferencias de viaje
  updateTravelPreferences: (updates: Partial<TravelPreferences>) => Promise<void>;
  toggleInterest: (interest: TravelInterest) => Promise<void>;
  toggleFoodRestriction: (restriction: FoodRestriction) => Promise<void>;
  addAvoidance: (avoidance: string) => Promise<void>;
  removeAvoidance: (avoidance: string) => Promise<void>;
  setPace: (pace: TravelPace) => Promise<void>;
  setMobilityLevel: (level: MobilityLevel) => Promise<void>;
  setBudgetLevel: (level: BudgetLevel) => Promise<void>;
}

// ============================================
// STORAGE KEY
// ============================================

const STORAGE_KEY = '@viatio:copilot_preferences';

// ============================================
// STORE
// ============================================

export const useCopilotStore = create<CopilotState>((set, get) => ({
  // Estado inicial
  preferences: DEFAULT_COPILOT_PREFERENCES,
  isLoading: false,
  isInitialized: false,

  // ============================================
  // ACCIONES PRINCIPALES
  // ============================================

  loadPreferences: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const parsed = JSON.parse(stored) as CopilotPreferences;
        // Merge con defaults para manejar nuevas propiedades
        const merged: CopilotPreferences = {
          ...DEFAULT_COPILOT_PREFERENCES,
          ...parsed,
          enabledModules: {
            ...DEFAULT_COPILOT_PREFERENCES.enabledModules,
            ...parsed.enabledModules,
          },
          travelPreferences: {
            ...DEFAULT_COPILOT_PREFERENCES.travelPreferences,
            ...parsed.travelPreferences,
          },
        };
        set({ preferences: merged, isLoading: false, isInitialized: true });
      } else {
        // Primera vez: guardar defaults
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COPILOT_PREFERENCES));
        set({ preferences: DEFAULT_COPILOT_PREFERENCES, isLoading: false, isInitialized: true });
      }
    } catch (error) {
      console.error('[CopilotStore] Error al cargar preferencias:', error);
      set({ isLoading: false, isInitialized: true });
    }
  },

  updatePreferences: async (updates: Partial<CopilotPreferences>) => {
    try {
      const current = get().preferences;
      const newPreferences: CopilotPreferences = {
        ...current,
        ...updates,
        // Merge nested objects
        enabledModules: updates.enabledModules
          ? { ...current.enabledModules, ...updates.enabledModules }
          : current.enabledModules,
        travelPreferences: updates.travelPreferences
          ? { ...current.travelPreferences, ...updates.travelPreferences }
          : current.travelPreferences,
      };

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
      set({ preferences: newPreferences });
    } catch (error) {
      console.error('[CopilotStore] Error al actualizar preferencias:', error);
      throw error;
    }
  },

  resetPreferences: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_COPILOT_PREFERENCES));
      set({ preferences: DEFAULT_COPILOT_PREFERENCES });
    } catch (error) {
      console.error('[CopilotStore] Error al resetear preferencias:', error);
      throw error;
    }
  },

  // ============================================
  // ACCIONES PARA MÓDULOS
  // ============================================

  toggleModule: async (module: keyof CopilotPreferences['enabledModules']) => {
    const current = get().preferences;
    const newEnabledModules = {
      ...current.enabledModules,
      [module]: !current.enabledModules[module],
    };

    await get().updatePreferences({ enabledModules: newEnabledModules });
  },

  isModuleEnabled: (module: keyof CopilotPreferences['enabledModules']) => {
    return get().preferences.enabledModules[module];
  },

  // ============================================
  // ACCIONES PARA ESTILO
  // ============================================

  setTone: async (tone: CopilotTone) => {
    await get().updatePreferences({ tone });
  },

  setResponseLength: async (length: CopilotResponseLength) => {
    await get().updatePreferences({ responseLength: length });
  },

  setLanguage: async (language: CopilotLanguage) => {
    await get().updatePreferences({ language });
  },

  toggleEmojis: async () => {
    const current = get().preferences;
    await get().updatePreferences({ useEmojis: !current.useEmojis });
  },

  // ============================================
  // ACCIONES PARA PREFERENCIAS DE VIAJE
  // ============================================

  updateTravelPreferences: async (updates: Partial<TravelPreferences>) => {
    const current = get().preferences;
    const newTravelPreferences = {
      ...current.travelPreferences,
      ...updates,
    };
    await get().updatePreferences({ travelPreferences: newTravelPreferences });
  },

  toggleInterest: async (interest: TravelInterest) => {
    const current = get().preferences.travelPreferences;
    const newInterests = current.interests.includes(interest)
      ? current.interests.filter((i) => i !== interest)
      : [...current.interests, interest];

    await get().updateTravelPreferences({ interests: newInterests });
  },

  toggleFoodRestriction: async (restriction: FoodRestriction) => {
    const current = get().preferences.travelPreferences;
    const newRestrictions = current.foodRestrictions.includes(restriction)
      ? current.foodRestrictions.filter((r) => r !== restriction)
      : [...current.foodRestrictions, restriction];

    await get().updateTravelPreferences({ foodRestrictions: newRestrictions });
  },

  addAvoidance: async (avoidance: string) => {
    const current = get().preferences.travelPreferences;
    if (!current.avoidances.includes(avoidance)) {
      await get().updateTravelPreferences({
        avoidances: [...current.avoidances, avoidance],
      });
    }
  },

  removeAvoidance: async (avoidance: string) => {
    const current = get().preferences.travelPreferences;
    await get().updateTravelPreferences({
      avoidances: current.avoidances.filter((a) => a !== avoidance),
    });
  },

  setPace: async (pace: TravelPace) => {
    await get().updateTravelPreferences({ pace });
  },

  setMobilityLevel: async (level: MobilityLevel) => {
    await get().updateTravelPreferences({ mobilityLevel: level });
  },

  setBudgetLevel: async (level: BudgetLevel) => {
    await get().updateTravelPreferences({ budgetLevel: level });
  },
}));
