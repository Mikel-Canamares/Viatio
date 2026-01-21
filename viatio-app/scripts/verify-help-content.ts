/**
 * VERIFICADOR DE CONTENIDO DEL CENTRO DE AYUDA
 *
 * Script para validar la integridad y completitud del helpContent.ts
 */

import { faqCategories, getAllFAQs } from '../src/data/helpContent';

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function section(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, colors.cyan);
  console.log('='.repeat(60));
}

function checkmark() {
  log('✅', colors.green);
}

function crossmark() {
  log('❌', colors.red);
}

// ============================================
// VERIFICACIONES
// ============================================

section('🔍 VERIFICACIÓN DE CONTENIDO DEL CENTRO DE AYUDA');

// 1. Contar categorías
log(`\n📊 Total de categorías: ${faqCategories.length}`, colors.blue);
const expectedCategories = 9;
if (faqCategories.length === expectedCategories) {
  checkmark();
} else {
  crossmark();
  log(
    `  Esperado: ${expectedCategories}, Encontrado: ${faqCategories.length}`,
    colors.red
  );
}

// 2. Contar FAQs totales
const allFaqs = getAllFAQs();
log(`\n📝 Total de FAQs: ${allFaqs.length}`, colors.blue);
const expectedFaqs = 67;
if (allFaqs.length === expectedFaqs) {
  checkmark();
} else {
  crossmark();
  log(`  Esperado: ${expectedFaqs}, Encontrado: ${allFaqs.length}`, colors.red);
}

// 3. Verificar cada categoría
section('📁 CATEGORÍAS');

const expectedCounts: Record<string, number> = {
  'inicio-config': 6,
  viajes: 6,
  reservas: 9,
  compartido: 8,
  gastos: 9,
  documentos: 7,
  mapa: 7,
  copilot: 9,
  notificaciones: 6,
};

let categoryErrors = 0;

faqCategories.forEach((category, index) => {
  const expected = expectedCounts[category.id];
  const actual = category.faqs.length;
  const match = expected === actual;

  console.log(
    `\n${index + 1}. ${category.title} (${category.id})`
  );
  console.log(`   Ícono: ${category.icon}`);
  console.log(`   Color: ${category.color}`);
  console.log(`   FAQs: ${actual}/${expected} ${match ? '✅' : '❌'}`);

  if (!match) {
    categoryErrors++;
    log(`   ERROR: Esperado ${expected}, encontrado ${actual}`, colors.red);
  }
});

if (categoryErrors === 0) {
  log('\n✅ Todas las categorías tienen el número correcto de FAQs', colors.green);
} else {
  log(`\n❌ ${categoryErrors} categorías con errores`, colors.red);
}

// 4. Verificar IDs únicos
section('🔑 VERIFICACIÓN DE IDs ÚNICOS');

const faqIds = allFaqs.map((faq) => faq.id);
const uniqueIds = new Set(faqIds);

if (faqIds.length === uniqueIds.size) {
  checkmark();
  log('Todos los IDs de FAQs son únicos', colors.green);
} else {
  crossmark();
  log('HAY IDs DUPLICADOS', colors.red);

  // Encontrar duplicados
  const duplicates = faqIds.filter(
    (id, index) => faqIds.indexOf(id) !== index
  );
  log(`  Duplicados: ${[...new Set(duplicates)].join(', ')}`, colors.yellow);
}

// 5. Verificar keywords
section('🔍 VERIFICACIÓN DE KEYWORDS');

let faqsWithoutKeywords = 0;
let totalKeywords = 0;

allFaqs.forEach((faq) => {
  if (!faq.keywords || faq.keywords.length === 0) {
    faqsWithoutKeywords++;
  } else {
    totalKeywords += faq.keywords.length;
  }
});

log(`Total de keywords: ${totalKeywords}`, colors.blue);
log(`Promedio por FAQ: ${(totalKeywords / allFaqs.length).toFixed(1)}`, colors.blue);

if (faqsWithoutKeywords === 0) {
  checkmark();
  log('Todas las FAQs tienen keywords', colors.green);
} else {
  crossmark();
  log(`${faqsWithoutKeywords} FAQs sin keywords`, colors.red);
}

// 6. Verificar campos requeridos
section('📋 VERIFICACIÓN DE CAMPOS REQUERIDOS');

let missingFields = 0;

allFaqs.forEach((faq, index) => {
  const errors: string[] = [];

  if (!faq.id || faq.id.trim() === '') errors.push('id');
  if (!faq.question || faq.question.trim() === '') errors.push('question');
  if (!faq.answer || faq.answer.trim() === '') errors.push('answer');
  if (!faq.category || faq.category.trim() === '') errors.push('category');

  if (errors.length > 0) {
    missingFields++;
    log(
      `  FAQ #${index + 1} (${faq.id || 'sin ID'}): Falta ${errors.join(', ')}`,
      colors.red
    );
  }
});

if (missingFields === 0) {
  checkmark();
  log('Todas las FAQs tienen campos requeridos completos', colors.green);
} else {
  crossmark();
  log(`${missingFields} FAQs con campos faltantes`, colors.red);
}

// 7. Verificar longitud de respuestas
section('📏 VERIFICACIÓN DE LONGITUD DE RESPUESTAS');

const shortAnswers = allFaqs.filter((faq) => faq.answer.length < 50);
const longAnswers = allFaqs.filter((faq) => faq.answer.length > 500);

log(`Respuestas cortas (<50 chars): ${shortAnswers.length}`, colors.blue);
log(`Respuestas largas (>500 chars): ${longAnswers.length}`, colors.blue);

if (shortAnswers.length > 0) {
  log('\nRespuestas muy cortas:', colors.yellow);
  shortAnswers.forEach((faq) => {
    log(`  - ${faq.question} (${faq.answer.length} chars)`, colors.yellow);
  });
}

// 8. Estadísticas generales
section('📈 ESTADÍSTICAS GENERALES');

console.log(`
Total de categorías:      ${faqCategories.length}
Total de FAQs:            ${allFaqs.length}
Total de keywords:        ${totalKeywords}
Promedio keywords/FAQ:    ${(totalKeywords / allFaqs.length).toFixed(1)}

FAQs con imágenes:        ${allFaqs.filter((f) => f.images && f.images.length > 0).length}
FAQs con relatedScreens:  ${allFaqs.filter((f) => f.relatedScreens && f.relatedScreens.length > 0).length}

Respuesta más corta:      ${Math.min(...allFaqs.map((f) => f.answer.length))} chars
Respuesta más larga:      ${Math.max(...allFaqs.map((f) => f.answer.length))} chars
Respuesta promedio:       ${Math.round(allFaqs.reduce((sum, f) => sum + f.answer.length, 0) / allFaqs.length)} chars
`);

// 9. Top keywords
section('🏆 TOP 20 KEYWORDS MÁS USADAS');

const keywordCounts: Record<string, number> = {};

allFaqs.forEach((faq) => {
  faq.keywords.forEach((keyword) => {
    keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
  });
});

const sortedKeywords = Object.entries(keywordCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

sortedKeywords.forEach(([keyword, count], index) => {
  console.log(`${index + 1}. ${keyword.padEnd(20)} - ${count} FAQs`);
});

// 10. Resumen final
section('✨ RESUMEN FINAL');

const totalChecks = 7;
const passedChecks =
  (faqCategories.length === expectedCategories ? 1 : 0) +
  (allFaqs.length === expectedFaqs ? 1 : 0) +
  (categoryErrors === 0 ? 1 : 0) +
  (faqIds.length === uniqueIds.size ? 1 : 0) +
  (faqsWithoutKeywords === 0 ? 1 : 0) +
  (missingFields === 0 ? 1 : 0) +
  1; // Siempre pasa el de estadísticas

const percentage = Math.round((passedChecks / totalChecks) * 100);

if (percentage === 100) {
  log(`\n🎉 PERFECTO: ${passedChecks}/${totalChecks} verificaciones pasadas (${percentage}%)`, colors.green);
  log('El contenido del Centro de Ayuda está completo y correcto.', colors.green);
} else if (percentage >= 80) {
  log(`\n⚠️  CASI COMPLETO: ${passedChecks}/${totalChecks} verificaciones pasadas (${percentage}%)`, colors.yellow);
  log('Revisa los errores anteriores y corrige.', colors.yellow);
} else {
  log(`\n❌ ERRORES CRÍTICOS: ${passedChecks}/${totalChecks} verificaciones pasadas (${percentage}%)`, colors.red);
  log('Revisa y corrige los errores antes de continuar.', colors.red);
}

console.log('\n' + '='.repeat(60) + '\n');

// Exit code
process.exit(percentage === 100 ? 0 : 1);
