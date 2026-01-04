/**
 * HELP SCREEN
 *
 * Pantalla de centro de ayuda con FAQs, búsqueda, contacto y recursos.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Linking,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { Accordion } from '@/components/Accordion';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import Constants from 'expo-constants';

// Tipos para FAQs
interface FAQ {
  id: string;
  question: string;
  answer: string;
}

// Lista de FAQs
const FAQS: FAQ[] = [
  {
    id: '1',
    question: '¿Cómo creo un nuevo viaje?',
    answer:
      'Para crear un nuevo viaje, ve a la pantalla principal y pulsa el botón amarillo "+" en la esquina inferior derecha. Completa el formulario con el nombre del viaje, destino y fechas, y pulsa "Crear viaje".',
  },
  {
    id: '2',
    question: '¿Cómo escaneo una reserva?',
    answer:
      'Dentro de un viaje, ve a la sección "Reservas" y pulsa "Añadir reserva". Puedes escanear un archivo .pkpass (Apple Wallet) o usar OCR para extraer información de capturas de pantalla de confirmaciones. El asistente de IA te ayudará a extraer todos los detalles.',
  },
  {
    id: '3',
    question: '¿Puedo usar la app sin internet?',
    answer:
      'Sí, Viatio funciona completamente offline. Todos tus viajes, reservas y documentos se almacenan localmente en tu dispositivo usando SQLite. Necesitarás conexión solo para funciones como el asistente de IA, mapas en tiempo real o sincronización.',
  },
  {
    id: '4',
    question: '¿Cómo comparto mi viaje?',
    answer:
      'Esta funcionalidad estará disponible en una próxima actualización. Podrás compartir tus viajes con otros usuarios de Viatio o exportar el itinerario en formato PDF.',
  },
  {
    id: '5',
    question: '¿Mis datos están seguros?',
    answer:
      'Absolutamente. Todos tus datos se almacenan localmente en tu dispositivo y están protegidos por las medidas de seguridad del sistema operativo. Firebase Auth gestiona tu autenticación de forma segura. No compartimos ni vendemos tus datos personales.',
  },
  {
    id: '6',
    question: '¿Cómo gestiono mis gastos?',
    answer:
      'En la pantalla de un viaje, accede a la sección "Gastos". Puedes añadir gastos manualmente, categorizarlos (transporte, alojamiento, comida, actividad, otros), y ver estadísticas de tu presupuesto en diferentes monedas.',
  },
  {
    id: '7',
    question: '¿Qué es el asistente de IA?',
    answer:
      'El asistente de viaje impulsado por Gemini Flash te ayuda a planificar actividades, extraer información de reservas mediante OCR, responder preguntas sobre tu viaje y sugerir rutas optimizadas. Necesitas conexión a internet para usarlo.',
  },
];

export default function HelpScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Filtrar FAQs según la búsqueda
  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Toggle de acordeón
  const toggleFaq = (id: string) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  // Handlers de contacto
  const handleSendEmail = async () => {
    const email = 'soporte@viatio.com';
    const subject = 'Consulta desde Viatio';
    const url = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast.error('Error', 'No se pudo abrir el cliente de correo. Por favor, contacta a soporte@viatio.com manualmente.'
        );
      }
    } catch (error) {
      showToast.error('Error', 'No se pudo abrir el cliente de correo. Por favor, contacta a soporte@viatio.com manualmente.'
      );
    }
  };

  const handleChatSupport = () => {
    Alert.alert(
      'Chat de soporte',
      'El chat en vivo estará disponible próximamente. Por ahora, puedes contactarnos por email.',
      [{ text: 'OK' }]
    );
  };

  const handleReportProblem = () => {
    Alert.alert(
      'Reportar un problema',
      'Describe el problema que has encontrado y te contactaremos por email.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar email',
          onPress: handleSendEmail,
        },
      ]
    );
  };

  // Abrir enlaces externos
  const openLink = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        showToast.error('Error', 'No se pudo abrir el enlace');
      }
    } catch (error) {
      showToast.error('Error', 'No se pudo abrir el enlace');
    }
  };

  // Versión de la app
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  return (
    <ScreenContainer scroll>
      <PageHeader title="Centro de ayuda" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        {/* Input de búsqueda */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={20}
            color={theme.colors.textMuted}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en ayuda..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Ionicons
                name="close-circle"
                size={20}
                color={theme.colors.textMuted}
              />
            </Pressable>
          )}
        </View>

        {/* Preguntas frecuentes */}
        <SectionTitle title="Preguntas frecuentes" marginTop={false} />
        <Card padding={0} style={styles.card}>
          {filteredFaqs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="search-outline"
                size={48}
                color={theme.colors.textMuted}
              />
              <Text style={styles.emptyText}>
                No se encontraron resultados para "{searchQuery}"
              </Text>
            </View>
          ) : (
            filteredFaqs.map((faq, index) => (
              <View key={faq.id}>
                <Accordion
                  title={faq.question}
                  expanded={expandedFaq === faq.id}
                  onToggle={() => toggleFaq(faq.id)}
                >
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                </Accordion>

                {/* Separador (no mostrar en el último) */}
                {index < filteredFaqs.length - 1 && (
                  <View style={styles.separator} />
                )}
              </View>
            ))
          )}
        </Card>

        {/* Contacto */}
        <SectionTitle title="Contacto" />
        <Card padding={0} style={styles.card}>
          <ProfileMenuItem
            icon="mail-outline"
            label="Enviar email"
            onPress={handleSendEmail}
          />
          <ProfileMenuItem
            icon="chatbubble-ellipses-outline"
            label="Chat de soporte"
            value="Próximamente"
            onPress={handleChatSupport}
          />
          <ProfileMenuItem
            icon="bug-outline"
            label="Reportar un problema"
            onPress={handleReportProblem}
          />
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Enlaces útiles</Text>
          <Pressable
            onPress={() =>
              openLink('https://viatio.com/terminos-de-servicio')
            }
          >
            <Text style={styles.footerLink}>Términos de servicio</Text>
          </Pressable>
          <Pressable
            onPress={() =>
              openLink('https://viatio.com/politica-de-privacidad')
            }
          >
            <Text style={styles.footerLink}>Política de privacidad</Text>
          </Pressable>

          <Text style={styles.versionText}>Versión {appVersion}</Text>
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingTop: theme.spacing.lg,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 20,
    color: theme.colors.textSecondary,
  },
  separator: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.lg,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  footer: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  footerTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: theme.spacing.md,
  },
  footerLink: {
    fontSize: 14,
    color: theme.colors.primaryLight,
    marginBottom: theme.spacing.sm,
  },
  versionText: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.lg,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});
