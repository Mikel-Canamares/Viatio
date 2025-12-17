export default {
  expo: {
    name: 'viatio-app',
    slug: 'viatio-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#ffffff',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.viatio.app',
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
    android: {
      package: 'com.viatio.app',
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      eas: {
        projectId: 'e82bcee5-f81e-4a73-b04f-1fc6db0b9c4a',
      },
      EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
    },
    plugins: [
      'expo-font',
      'expo-sqlite',
      'expo-web-browser',
      'expo-localization',
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Viatio necesita acceso a tu ubicación para mostrarte lugares cercanos y calcular rutas en el mapa.',
          locationWhenInUsePermission:
            'Viatio necesita acceso a tu ubicación para mostrarte lugares cercanos y calcular rutas en el mapa.',
        },
      ],
    ],
  },
};
