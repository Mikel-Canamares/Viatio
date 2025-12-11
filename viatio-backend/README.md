# Viatio Backend

Backend Node.js + Express + TypeScript para integración con Google Gemini AI.

## Funcionalidades

- **OCR de Reservas**: Extrae datos estructurados de imágenes (.pkpass, capturas)
- **Asistente de Viaje**: Chat conversacional con contexto del viaje
- **Rate Limiting**: Protección contra abuso
- **Type Safety**: TypeScript estricto

## Setup

1. Instalar dependencias:
```bash
npm install
```

2. Configurar variables de entorno:
```bash
cp .env.example .env
# Editar .env y añadir tu GEMINI_API_KEY
```

3. Desarrollo:
```bash
npm run dev
```

4. Build para producción:
```bash
npm run build
npm start
```

## Endpoints

### `GET /api/health`
Health check del servidor.

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "uptime": 123.45
}
```

### `POST /api/extract-reserva`
Extrae datos estructurados de una imagen de reserva.

**Request:**
```json
{
  "imageBase64": "base64_string_sin_prefijo",
  "mimeType": "image/jpeg"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tipo": "vuelo",
    "titulo": "Vuelo Madrid - Barcelona",
    "fecha": "2025-03-15",
    "hora": "14:30",
    "ubicacion": "Aeropuerto Adolfo Suárez Madrid-Barajas",
    "numeroReserva": "ABC123XYZ",
    "proveedor": "Iberia",
    "detalles": "Vuelo IB1234, Pasajeros: 2 adultos, Clase: Economy",
    "confianza": 0.92
  }
}
```

### `POST /api/assistant`
Chat con el asistente de viaje.

**Request:**
```json
{
  "message": "¿Qué puedo visitar en Barcelona?",
  "context": {
    "tripName": "Viaje a Barcelona",
    "destination": "Barcelona, España",
    "startDate": "2025-03-15",
    "endDate": "2025-03-20"
  },
  "conversationHistory": [
    { "role": "user", "content": "Hola" },
    { "role": "model", "content": "¡Hola! ¿En qué puedo ayudarte con tu viaje?" }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Barcelona tiene lugares increíbles que visitar..."
}
```

## Scripts

- `npm run dev` - Servidor en modo desarrollo con hot reload
- `npm run build` - Compila TypeScript a JavaScript
- `npm start` - Ejecuta versión compilada
- `npm run type-check` - Verifica tipos sin compilar

## Stack

- **Express** - Framework web
- **TypeScript** - Type safety
- **Google Generative AI** - SDK de Gemini
- **express-rate-limit** - Rate limiting
- **cors** - CORS middleware
- **dotenv** - Variables de entorno

## Estructura

```
viatio-backend/
├── src/
│   ├── routes/         # Endpoints de la API
│   ├── services/       # Lógica de negocio (Gemini)
│   ├── middleware/     # Error handling, rate limit
│   ├── config/         # Configuración y env vars
│   ├── types/          # Tipos TypeScript
│   └── index.ts        # Entry point
├── dist/               # Build output
└── package.json
```
