/**
 * CONFIGURACIÓN STORE
 *
 * Estado global para configuración de la aplicación.
 * Gestiona preferencias de usuario, idioma, tema, etc.
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConfiguracionApp, DEFAULT_CONFIGURACION_APP } from '@/types/perfil';

interface ConfiguracionState {
  // Estado
  config: ConfiguracionApp;
  isLoading: boolean;

  // Acciones
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<ConfiguracionApp>) => Promise<void>;
  resetConfig: () => Promise<void>;
}

const STORAGE_KEY = '@viatio:configuracion';

export const useConfiguracionStore = create<ConfiguracionState>((set, get) => ({
  // Estado inicial
  config: DEFAULT_CONFIGURACION_APP,
  isLoading: false,

  // Cargar configuración desde AsyncStorage
  loadConfig: async () => {
    try {
      set({ isLoading: true });
      const stored = await AsyncStorage.getItem(STORAGE_KEY);

      if (stored) {
        const config = JSON.parse(stored) as ConfiguracionApp;
        set({ config, isLoading: false });
      } else {
        // Primera vez: guardar configuración por defecto
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIGURACION_APP));
        set({ config: DEFAULT_CONFIGURACION_APP, isLoading: false });
      }
    } catch (error) {
      console.error('Error al cargar configuración:', error);
      set({ isLoading: false });
    }
  },

  // Actualizar configuración
  updateConfig: async (updates: Partial<ConfiguracionApp>) => {
    try {
      const newConfig = { ...get().config, ...updates };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newConfig));
      set({ config: newConfig });
    } catch (error) {
      console.error('Error al actualizar configuración:', error);
      throw error;
    }
  },

  // Resetear a valores por defecto
  resetConfig: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIGURACION_APP));
      set({ config: DEFAULT_CONFIGURACION_APP });
    } catch (error) {
      console.error('Error al resetear configuración:', error);
      throw error;
    }
  },
}));
