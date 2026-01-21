# Architecture Overview

## Arquitectura a alto nivel
La solución se compone de:
- **App móvil (Expo/React Native)**: UI, lógica de dominio, SQLite local y sincronización.
- **Firebase**: Auth + Firestore + Storage para viajes compartidos.
- **Backend IA (Express)**: endpoints para extracción de reservas y asistente Copilot.
- **APIs externas**: Google Places/Maps y Frankfurter.

## Diagrama de componentes (Mermaid)
```mermaid
flowchart LR
  subgraph Mobile[App móvil - Expo/React Native]
    UI[UI Screens]
    LocalDB[(SQLite Local)]
    Sync[Sync Engine]
    Auth[Firebase Auth]
  end

  subgraph Firebase[Firebase]
    Firestore[(Firestore)]
    Storage[(Storage)]
  end

  subgraph Backend[Backend IA - Express]
    Extract[API /api/extract-reserva]
    Assistant[API /api/assistant]
    Copilot[API /api/copilot]
  end

  subgraph External[Servicios externos]
    Places[Google Places/Maps]
    Frankfurter[Frankfurter API]
    Gemini[Gemini AI]
  end

  UI --> LocalDB
  UI --> Sync
  UI --> Auth
  Sync <--> Firestore
  Sync <--> Storage
  UI --> Backend
  Backend --> Gemini
  UI --> Places
  UI --> Frankfurter
```

## Límites de contexto y responsabilidades por módulo
- **App móvil**: orquestación de viajes, datos locales, UI, sincronización en viajes compartidos.
- **Firebase**: almacenamiento remoto de entidades y archivos.
- **Backend IA**: procesamiento con Gemini (texto + visión).
- **Servicios externos**: datos geográficos y tasas de cambio.

## Observaciones
- No existe un backend propio para viajes; Firestore actúa como backend de datos compartidos.
- La sincronización es híbrida: **offline-first** con SQLite y **online** con Firestore en viajes compartidos.

