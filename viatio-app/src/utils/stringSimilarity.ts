/**
 * UTILS: STRING SIMILARITY
 *
 * Utilidades para calcular similitud entre strings.
 * Usado en el matching de lugares con reservas.
 */

/**
 * Normaliza un string para comparación:
 * - Convierte a minúsculas
 * - Elimina acentos
 * - Elimina caracteres especiales
 * - Elimina espacios múltiples
 */
export function normalizeString(str: string): string {
  if (!str) return '';

  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9\s]/g, '') // Eliminar caracteres especiales
    .replace(/\s+/g, ' ') // Espacios múltiples a uno solo
    .trim();
}

/**
 * Calcula la distancia de Levenshtein entre dos strings
 * (número mínimo de ediciones para convertir s1 en s2)
 */
function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;

  // Crear matriz de distancias
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Inicializar primera fila y columna
  for (let i = 0; i <= len1; i++) {
    matrix[i][0] = i;
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Calcular distancias
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Eliminación
        matrix[i][j - 1] + 1, // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calcula similitud entre dos strings usando Levenshtein
 * Retorna un valor entre 0 (completamente diferentes) y 1 (idénticos)
 */
export function stringSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  const distance = levenshteinDistance(longer, shorter);
  const maxLength = longer.length;

  if (maxLength === 0) return 1;

  return 1 - distance / maxLength;
}

/**
 * Calcula similitud usando algoritmo de Jaro-Winkler
 * (Da más peso a los caracteres iniciales coincidentes)
 */
export function jaroWinklerSimilarity(s1: string, s2: string): number {
  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1;

  const len1 = s1.length;
  const len2 = s2.length;
  const matchWindow = Math.floor(Math.max(len1, len2) / 2) - 1;

  const s1Matches = new Array(len1).fill(false);
  const s2Matches = new Array(len2).fill(false);

  let matches = 0;
  let transpositions = 0;

  // Encontrar matches
  for (let i = 0; i < len1; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, len2);

    for (let j = start; j < end; j++) {
      if (s2Matches[j] || s1[i] !== s2[j]) continue;
      s1Matches[i] = true;
      s2Matches[j] = true;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0;

  // Encontrar transposiciones
  let k = 0;
  for (let i = 0; i < len1; i++) {
    if (!s1Matches[i]) continue;
    while (!s2Matches[k]) k++;
    if (s1[i] !== s2[k]) transpositions++;
    k++;
  }

  // Calcular similitud Jaro
  const jaro =
    (matches / len1 + matches / len2 + (matches - transpositions / 2) / matches) / 3;

  // Aplicar boost Winkler (para prefijos comunes)
  let prefixLength = 0;
  for (let i = 0; i < Math.min(len1, len2, 4); i++) {
    if (s1[i] === s2[i]) {
      prefixLength++;
    } else {
      break;
    }
  }

  return jaro + prefixLength * 0.1 * (1 - jaro);
}

/**
 * Calcula similitud combinada (promedio de Levenshtein y Jaro-Winkler)
 * Esta es la función recomendada para matching de lugares
 */
export function combinedSimilarity(s1: string, s2: string): number {
  const normalized1 = normalizeString(s1);
  const normalized2 = normalizeString(s2);

  const levenshtein = stringSimilarity(normalized1, normalized2);
  const jaroWinkler = jaroWinklerSimilarity(normalized1, normalized2);

  // Promedio ponderado (70% Jaro-Winkler, 30% Levenshtein)
  // Jaro-Winkler es mejor para nombres de lugares
  return jaroWinkler * 0.7 + levenshtein * 0.3;
}

/**
 * Verifica si un string contiene a otro (ignorando normalización)
 */
export function fuzzyContains(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeString(haystack);
  const normalizedNeedle = normalizeString(needle);

  return normalizedHaystack.includes(normalizedNeedle);
}

/**
 * Extrae palabras clave de un string (elimina stopwords comunes)
 */
export function extractKeywords(str: string): string[] {
  const normalized = normalizeString(str);
  const words = normalized.split(' ').filter(Boolean);

  // Stopwords comunes en español
  const stopwords = new Set([
    'el',
    'la',
    'de',
    'del',
    'los',
    'las',
    'un',
    'una',
    'y',
    'o',
    'en',
    'a',
    'con',
    'por',
    'para',
    'al',
  ]);

  return words.filter((word) => !stopwords.has(word) && word.length > 2);
}

/**
 * Calcula similitud basada en keywords compartidos
 */
export function keywordSimilarity(s1: string, s2: string): number {
  const keywords1 = new Set(extractKeywords(s1));
  const keywords2 = new Set(extractKeywords(s2));

  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  // Intersección
  const intersection = new Set([...keywords1].filter((k) => keywords2.has(k)));

  // Coeficiente de Jaccard
  const union = new Set([...keywords1, ...keywords2]);
  return intersection.size / union.size;
}
