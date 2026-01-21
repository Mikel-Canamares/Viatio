/**
 * CONFIGURACIÓN STORE
 *
 * Estado global para configuración de la aplicación.
 * Gestiona preferencias de usuario, idioma, tema, etc.
 *
 * La configuración se guarda tanto en AsyncStorage (local) como en Firebase (nube).
 * - AsyncStorage: Caché local y acceso offline
 * - Firebase: Persistencia vinculada a la cuenta del usuario
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ConfiguracionApp, DEFAULT_CONFIGURACION_APP } from '@/types/perfil';
import { getUserConfig, updateUserConfig } from '@/services/firestore/usersService';

interface ConfiguracionState {
  // Estado
  config: ConfiguracionApp;
  isLoading: boolean;
  isSynced: boolean; // Indica si está sincronizado con Firebase

  // Acciones
  loadConfig: (uid?: string) => Promise<void>;
  updateConfig: (updates: Partial<ConfiguracionApp>, uid?: string) => Promise<void>;
  resetConfig: (uid?: string) => Promise<void>;
  syncWithFirebase: (uid: string) => Promise<void>;
  clearLocalConfig: () => Promise<void>;
}

// Clave de almacenamiento por usuario (si no hay UID, usa clave genérica)
const getStorageKey = (uid?: string) =>
  uid ? `@viatio:configuracion:${uid}` : '@viatio:configuracion:guest';

export const useConfiguracionStore = create<ConfiguracionState>((set, get) => ({
  // Estado inicial
  config: DEFAULT_CONFIGURACION_APP,
  isLoading: false,
  isSynced: false,

  // Cargar configuración desde AsyncStorage y opcionalmente sincronizar con Firebase
  loadConfig: async (uid?: string) => {
    try {
      set({ isLoading: true });
      const storageKey = getStorageKey(uid);

      // Si hay usuario autenticado, Firebase es la fuente de verdad
      if (uid) {
        const firebaseConfig = await getUserConfig(uid);

        if (firebaseConfig) {
          // Firebase tiene configuración: usarla y cachear localmente
          await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseConfig));
          set({ config: firebaseConfig, isLoading: false, isSynced: true });
          console.log('[ConfigStore] ✅ Configuración cargada desde Firebase');
        } else {
          // No hay config en Firebase: intentar cargar desde caché local del usuario
          const stored = await AsyncStorage.getItem(storageKey);
          let localConfig: ConfiguracionApp | null = null;

          if (stored) {
            localConfig = JSON.parse(stored) as ConfiguracionApp;
          } else {
            // No hay caché local: usar defaults
            localConfig = DEFAULT_CONFIGURACION_APP;
          }

          // Subir a Firebase la config local o defaults
          await updateUserConfig(uid, localConfig);
          await AsyncStorage.setItem(storageKey, JSON.stringify(localConfig));
          set({ config: localConfig, isLoading: false, isSynced: true });
          console.log('[ConfigStore] ✅ Configuración inicializada en Firebase');
        }
      } else {
        // Sin usuario: cargar desde caché guest o usar defaults
        const stored = await AsyncStorage.getItem(storageKey);
        let localConfig: ConfiguracionApp;

        if (stored) {
          localConfig = JSON.parse(stored) as ConfiguracionApp;
        } else {
          localConfig = DEFAULT_CONFIGURACION_APP;
          await AsyncStorage.setItem(storageKey, JSON.stringify(localConfig));
        }

        set({ config: localConfig, isLoading: false, isSynced: false });
        console.log('[ConfigStore] ✅ Configuración guest cargada');
      }
    } catch (error) {
      console.error('[ConfigStore] Error al cargar configuración:', error);
      set({ config: DEFAULT_CONFIGURACION_APP, isLoading: false });
    }
  },

  // Actualizar configuración (local + Firebase si hay usuario)
  updateConfig: async (updates: Partial<ConfiguracionApp>, uid?: string) => {
    try {
      const newConfig = { ...get().config, ...updates };
      const storageKey = getStorageKey(uid);

      // Actualizar estado local inmediatamente
      set({ config: newConfig });

      // Si hay usuario autenticado, guardar en Firebase primero
      if (uid) {
        const success = await updateUserConfig(uid, updates);
        if (success) {
          // Solo cachear en AsyncStorage si Firebase tuvo éxito
          await AsyncStorage.setItem(storageKey, JSON.stringify(newConfig));
          set({ isSynced: true });
          console.log('[ConfigStore] ✅ Configuración sincronizada con Firebase y cacheada');
        } else {
          console.error('[ConfigStore] ⚠️ Error sincronizando con Firebase');
          set({ isSynced: false });
        }
      } else {
        // Sin usuario: solo guardar en caché guest
        await AsyncStorage.setItem(storageKey, JSON.stringify(newConfig));
        console.log('[ConfigStore] ✅ Configuración guest actualizada');
      }
    } catch (error) {
      console.error('[ConfigStore] Error al actualizar configuración:', error);
      throw error;
    }
  },

  // Resetear a valores por defecto
  resetConfig: async (uid?: string) => {
    try {
      const storageKey = getStorageKey(uid);

      set({ config: DEFAULT_CONFIGURACION_APP });

      // Si hay usuario, resetear en Firebase primero
      if (uid) {
        await updateUserConfig(uid, DEFAULT_CONFIGURACION_APP);
        await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_CONFIGURACION_APP));
        set({ isSynced: true });
        console.log('[ConfigStore] ✅ Configuración reseteada en Firebase');
      } else {
        await AsyncStorage.setItem(storageKey, JSON.stringify(DEFAULT_CONFIGURACION_APP));
        console.log('[ConfigStore] ✅ Configuración guest reseteada');
      }
    } catch (error) {
      console.error('[ConfigStore] Error al resetear configuración:', error);
      throw error;
    }
  },

  // Sincronizar manualmente con Firebase
  syncWithFirebase: async (uid: string) => {
    try {
      const storageKey = getStorageKey(uid);
      const firebaseConfig = await getUserConfig(uid);

      if (firebaseConfig) {
        await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseConfig));
        set({ config: firebaseConfig, isSynced: true });
        console.log('[ConfigStore] ✅ Sincronizado desde Firebase');
      } else {
        // Subir config local a Firebase
        const localConfig = get().config;
        await updateUserConfig(uid, localConfig);
        await AsyncStorage.setItem(storageKey, JSON.stringify(localConfig));
        set({ isSynced: true });
        console.log('[ConfigStore] ✅ Config local subida a Firebase');
      }
    } catch (error) {
      console.error('[ConfigStore] Error al sincronizar con Firebase:', error);
    }
  },

  // Limpiar configuración local al hacer logout
  clearLocalConfig: async () => {
    try {
      // Resetear a defaults sin guardar en AsyncStorage
      set({ config: DEFAULT_CONFIGURACION_APP, isSynced: false });
      console.log('[ConfigStore] ✅ Configuración local limpiada (logout)');
    } catch (error) {
      console.error('[ConfigStore] Error al limpiar configuración:', error);
    }
  },
}));
