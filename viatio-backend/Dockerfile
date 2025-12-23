# ==========================================
# Stage 1: Builder - Compila TypeScript
# ==========================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar TODAS las dependencias (incluidas devDependencies para compilar)
# Usar npm install en lugar de npm ci porque Railway no copia package-lock.json correctamente
RUN npm install

# Copiar código fuente
COPY . .

# Compilar TypeScript a JavaScript
RUN npm run build

# ==========================================
# Stage 2: Production - Runtime ligero
# ==========================================
FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm install --omit=dev

# Copiar build compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Variables de entorno
ENV NODE_ENV=production

# Puerto expuesto (Railway lo mapea automáticamente)
EXPOSE 3000

# Health check (opcional pero recomendado)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicio
CMD ["node", "dist/index.js"]
