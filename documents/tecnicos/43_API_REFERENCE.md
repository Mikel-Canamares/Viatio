# API Reference

## Backend IA (Express)
Base URL (local): `http://localhost:3000`

### GET /health
**Descripción**: health check.

**Respuesta 200**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.45
}
```

### POST /api/extract-reserva
**Descripción**: extracción estructurada de reservas desde imagen (Gemini Vision).

**Request (legacy)**
```json
{
  "imageBase64": "<base64>",
  "mimeType": "image/jpeg"
}
```

**Request (múltiples imágenes)**
```json
{
  "images": [
    { "base64": "<base64>", "mimeType": "image/jpeg" },
    { "base64": "<base64>", "mimeType": "image/png" }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "categoria": "transport",
    "nombre": "Vuelo XYZ",
    "proveedor": "Aerolinea",
    "numeroConfirmacion": "ABC123",
    "fechaInicio": "2024-01-01",
    "horaInicio": "12:00",
    "fechaFin": null,
    "horaFin": null,
    "ubicacion": "Madrid",
    "direccion": null,
    "precio": 120.5,
    "moneda": "EUR",
    "notas": null,
    "metadatos": { "aerolinea": "Aerolinea" },
    "confianza": "media"
  }
}
```

### POST /api/assistant
**Descripción**: chat con asistente de viaje.

**Request**
```json
{
  "message": "¿Qué puedo hacer mañana?",
  "context": {
    "tripName": "Roma",
    "startDate": "2024-01-01",
    "endDate": "2024-01-05"
  },
  "conversationHistory": [
    { "role": "user", "content": "Hola" }
  ]
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Respuesta del asistente"
}
```

### POST /api/copilot
**Descripción**: asistente con acciones y contexto ampliado.

**Request**
```json
{
  "message": "Planifica mi día",
  "contextPack": {
    "app": { "version": "1.0.0", "platform": "ios", "locale": "es", "timezone": "Europe/Madrid" },
    "user": {
      "preferences": {
        "pace": "balanced",
        "interests": [],
        "avoidances": [],
        "foodRestrictions": [],
        "mobilityLevel": "full",
        "budgetLevel": "moderate"
      },
      "copilotSettings": {
        "tone": "friendly",
        "responseLength": "normal",
        "language": "es",
        "useEmojis": true
      }
    },
    "ui": { "currentScreen": "TripAgenda" }
  }
}
```

**Response 200**
```json
{
  "success": true,
  "message": "Respuesta del copiloto",
  "actions": []
}
```

## APIs internas adicionales
- NO APLICA (no se observa backend adicional de datos).


