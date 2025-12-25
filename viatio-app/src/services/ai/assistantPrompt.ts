/**
 * PROMPTS DEL ASISTENTE IA
 *
 * Configura el comportamiento y personalidad del asistente de viaje.
 * El prompt del sistema se envía en cada conversación para mantener contexto.
 */

import type { ContextoViaje } from '@/types/asistente';

// ============================================
// CONFIGURACIÓN DEL MODELO
// ============================================

export const ASSISTANT_CONFIG = {
  model: 'gemini-2.0-flash-exp',
  maxTokens: 1000,
  temperature: 0.7,
} as const;

// ============================================
// PROMPT BASE DEL SISTEMA
// ============================================

const SYSTEM_PROMPT_BASE = `Eres el asistente de viajes de Viatio, una aplicación móvil para organizar viajes.

PERSONALIDAD:
- Amigable y cercano, como un amigo viajero experimentado
- Conciso pero informativo (respuestas de 2-4 párrafos máximo)
- Proactivo con sugerencias útiles
- Usa emojis con moderación (1-2 por mensaje, solo si aportan)

CAPACIDADES:
- Responder preguntas sobre el viaje del usuario
- Sugerir actividades, restaurantes y lugares según destino
- Ayudar a organizar itinerarios diarios
- Dar consejos prácticos de viaje (clima, transporte, cultura)
- Orientar sobre presupuesto y gastos
- Informar sobre documentos necesarios

LIMITACIONES (sé honesto sobre ellas):
- No puedes hacer reservas reales ni pagos
- Tu información puede no estar actualizada al momento
- No tienes acceso a precios en tiempo real
- No compartas datos personales del usuario

FORMATO DE RESPUESTA:
- Usa párrafos cortos para facilitar lectura en móvil
- Listas con viñetas para recomendaciones múltiples
- Destaca información importante con **negritas**
- Si no sabes algo, admítelo y sugiere dónde buscar`;

// ============================================
// BUILDER DEL PROMPT CON CONTEXTO
// ============================================

/**
 * Construye el prompt del sistema incluyendo contexto del viaje actual
 */
export function buildSystemPrompt(contexto?: ContextoViaje): string {
  let prompt = SYSTEM_PROMPT_BASE;

  if (contexto) {
    prompt += `

---
CONTEXTO DEL VIAJE ACTUAL:
- **Destino**: ${contexto.destino}
- **Fechas**: ${formatearFechas(contexto.fechaInicio, contexto.fechaFin)}
- **Duración**: ${calcularDuracion(contexto.fechaInicio, contexto.fechaFin)} días`;

    if (contexto.reservas.length > 0) {
      prompt += `
- **Reservas** (${contexto.reservas.length}): ${contexto.reservas.map(r => r.nombre).join(', ')}`;
    }

    if (contexto.lugares.length > 0) {
      prompt += `
- **Lugares por visitar** (${contexto.lugares.length}): ${contexto.lugares.map(l => l.nombre).join(', ')}`;
    }

    if (contexto.presupuesto) {
      const porcentaje = Math.round((contexto.gastoActual / contexto.presupuesto) * 100);
      prompt += `
- **Presupuesto**: ${contexto.gastoActual}€ gastados de ${contexto.presupuesto}€ (${porcentaje}%)`;
    } else if (contexto.gastoActual > 0) {
      prompt += `
- **Gasto actual**: ${contexto.gastoActual}€`;
    }

    prompt += `

Usa este contexto para personalizar tus respuestas al viaje específico del usuario.`;
  }

  return prompt;
}

// ============================================
// SUGERENCIAS INICIALES
// ============================================

/**
 * Chips de sugerencias para iniciar conversación
 * Varían según si hay contexto de viaje o no
 */
export function getSugerenciasIniciales(tieneContexto: boolean): string[] {
  if (tieneContexto) {
    return [
      '¿Qué puedo visitar?',
      'Organiza mi día',
      '¿Cómo voy de presupuesto?',
      'Recomienda restaurantes',
    ];
  }

  return [
    '¿Cómo organizo un viaje?',
    'Destinos recomendados',
    '¿Qué documentos necesito?',
    'Consejos para viajar',
  ];
}

// ============================================
// HELPERS
// ============================================

function formatearFechas(inicio: string, fin: string): string {
  const opciones: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short'
  };
  const fechaInicio = new Date(inicio).toLocaleDateString('es-ES', opciones);
  const fechaFin = new Date(fin).toLocaleDateString('es-ES', opciones);
  return `${fechaInicio} - ${fechaFin}`;
}

function calcularDuracion(inicio: string, fin: string): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const diff = new Date(fin).getTime() - new Date(inicio).getTime();
  return Math.ceil(diff / msPerDay) + 1;
}
