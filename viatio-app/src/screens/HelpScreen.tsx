/**
 * HELP SCREEN
 *
 * Centro de ayuda rediseñado con 67+ FAQs organizadas en categorías,
 * búsqueda mejorada, soporte multimedia y navegación directa.
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Linking,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { ProfileMenuItem } from '@/components/ProfileMenuItem';
import { CategoryAccordion } from '@/components/CategoryAccordion';
import { FAQCard } from '@/components/FAQCard';
import { SearchHighlight } from '@/components/SearchHighlight';
import { CustomModal } from '@/components';
import { theme } from '@/config';
import { showToast } from '@/utils/toast';
import { faqCategories, searchFAQs, FAQItem } from '@/data/helpContent';
import Constants from 'expo-constants';

export default function HelpScreen() {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  // Estado del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    type: 'info' as const,
    title: '',
    message: '',
  });

  // Determinar si estamos en modo búsqueda
  const isSearching = searchQuery.trim().length > 0;

  // Obtener resultados de búsqueda
  const searchResults = isSearching ? searchFAQs(searchQuery) : [];

  // Toggle de categoría
  const toggleCategory = (categoryId: string) => {
    setExpandedCategory(expandedCategory === categoryId ? null : categoryId);
  };

  // Toggle de FAQ
  const toggleFaq = (faqId: string) => {
    setExpandedFaq(expandedFaq === faqId ? null : faqId);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setExpandedFaq(null);
  };

  // Navegación a pantalla relacionada
  const handleNavigate = (screenName: string) => {
    try {
      // Intentar navegar a la pantalla
      (navigation as any).navigate(screenName);
    } catch (error) {
      showToast.info('Información', `Esta pantalla aún no está disponible: ${screenName}`);
    }
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
        showToast.error(
          'Error',
          'No se pudo abrir el cliente de correo. Por favor, contacta a soporte@viatio.com manualmente.'
        );
      }
    } catch (error) {
      showToast.error(
        'Error',
        'No se pudo abrir el cliente de correo. Por favor, contacta a soporte@viatio.com manualmente.'
      );
    }
  };

  const handleChatSupport = () => {
    setModalConfig({
      type: 'info',
      title: 'Chat de soporte',
      message: 'El chat en vivo estará disponible próximamente. Por ahora, puedes contactarnos por email.',
    });
    setModalVisible(true);
  };

  const handleReportProblem = () => {
    setModalConfig({
      type: 'info',
      title: 'Reportar un problema',
      message: 'Describe el problema que has encontrado y te contactaremos por email.',
    });
    setModalVisible(true);
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

  // Renderizar resultado de búsqueda
  const renderSearchResult = ({ item }: { item: FAQItem }) => {
    // Encontrar la categoría a la que pertenece
    const category = faqCategories.find((cat) => cat.id === item.category);

    return (
      <View style={styles.searchResultContainer}>
        {/* Badge de categoría */}
        {category && (
          <View style={[styles.categoryBadge, { backgroundColor: `${category.color}20` }]}>
            <Ionicons name={category.icon as any} size={14} color={category.color} />
            <Text style={[styles.categoryBadgeText, { color: category.color }]}>
              {category.title}
            </Text>
          </View>
        )}

        {/* FAQ Card con texto resaltado */}
        <FAQCard
          question={item.question}
          answer={item.answer}
          images={item.images}
          expanded={expandedFaq === item.id}
          onToggle={() => toggleFaq(item.id)}
          onNavigate={handleNavigate}
          relatedScreens={item.relatedScreens}
        />
      </View>
    );
  };

  // Renderizar categoría
  const renderCategory = ({ item }: { item: typeof faqCategories[0] }) => (
    <CategoryAccordion
      title={item.title}
      icon={item.icon}
      color={item.color}
      itemCount={item.faqs.length}
      expanded={expandedCategory === item.id}
      onToggle={() => toggleCategory(item.id)}
    >
      {item.faqs.map((faq) => (
        <FAQCard
          key={faq.id}
          question={faq.question}
          answer={faq.answer}
          images={faq.images}
          expanded={expandedFaq === faq.id}
          onToggle={() => toggleFaq(faq.id)}
          onNavigate={handleNavigate}
          relatedScreens={faq.relatedScreens}
        />
      ))}
    </CategoryAccordion>
  );

  return (
    <View style={styles.container}>
      <PageHeader title="Centro de ayuda" onBack={() => navigation.goBack()} />
      <ScreenContainer>
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
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Estadísticas de ayuda (solo cuando NO hay búsqueda) */}
        {!isSearching && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {faqCategories.reduce((sum, cat) => sum + cat.faqs.length, 0)}
              </Text>
              <Text style={styles.statLabel}>Preguntas</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{faqCategories.length}</Text>
              <Text style={styles.statLabel}>Categorías</Text>
            </View>
          </View>
        )}

        {/* Contenido principal con FlatList */}
        {isSearching ? (
          /* Vista de búsqueda */
          <FlatList
            data={searchResults}
            renderItem={renderSearchResult}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <View style={styles.searchHeader}>
                <SectionTitle
                  title={
                    searchResults.length === 0
                      ? 'Sin resultados'
                      : `${searchResults.length} ${
                          searchResults.length === 1 ? 'resultado' : 'resultados'
                        }`
                  }
                  marginTop={false}
                />
                {searchResults.length > 0 && (
                  <Text style={styles.searchSubtitle}>
                    para "<Text style={styles.searchTerm}>{searchQuery}</Text>"
                  </Text>
                )}
              </View>
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color={theme.colors.textMuted} />
                <Text style={styles.emptyText}>
                  No se encontraron resultados para "{searchQuery}"
                </Text>
                <Text style={styles.emptyHint}>Intenta con otros términos de búsqueda</Text>
              </View>
            }
            ListFooterComponent={
              <>
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
                    onPress={() => openLink('https://viatio.com/terminos-de-servicio')}
                  >
                    <Text style={styles.footerLink}>Términos de servicio</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openLink('https://viatio.com/politica-de-privacidad')}
                  >
                    <Text style={styles.footerLink}>Política de privacidad</Text>
                  </Pressable>

                  <Text style={styles.versionText}>Versión {appVersion}</Text>
                </View>

                {/* Espaciado inferior */}
                <View style={styles.bottomSpacing} />
              </>
            }
          />
        ) : (
          /* Vista de categorías */
          <FlatList
            data={faqCategories}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={<SectionTitle title="Categorías" marginTop={false} />}
            ListFooterComponent={
              <>
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
                    onPress={() => openLink('https://viatio.com/terminos-de-servicio')}
                  >
                    <Text style={styles.footerLink}>Términos de servicio</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => openLink('https://viatio.com/politica-de-privacidad')}
                  >
                    <Text style={styles.footerLink}>Política de privacidad</Text>
                  </Pressable>

                  <Text style={styles.versionText}>Versión {appVersion}</Text>
                </View>

                {/* Espaciado inferior */}
                <View style={styles.bottomSpacing} />
              </>
            }
          />
        )}
      </View>

      {/* Modal de información */}
      <CustomModal
        visible={modalVisible}
        type={modalConfig.type}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalVisible(false)}
        primaryButton={{
          text: modalConfig.title === 'Reportar un problema' ? 'Enviar email' : 'OK',
          onPress: modalConfig.title === 'Reportar un problema' ? handleSendEmail : () => {},
        }}
        secondaryButton={modalConfig.title === 'Reportar un problema' ? {
          text: 'Cancelar',
          onPress: () => {},
        } : undefined}
      />
      </ScreenContainer>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
    marginBottom: theme.spacing.md,
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
  statsContainer: {
    flexDirection: 'row',
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: theme.spacing.xs,
  },
  statLabel: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.md,
  },
  listContent: {
    paddingHorizontal: theme.spacing.lg,
  },
  searchHeader: {
    marginBottom: theme.spacing.md,
  },
  searchSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  searchTerm: {
    fontWeight: '600',
    color: theme.colors.text,
  },
  searchResultContainer: {
    marginBottom: theme.spacing.md,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    marginBottom: theme.spacing.xs,
    gap: theme.spacing.xs,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    marginBottom: theme.spacing.sm,
  },
  emptyState: {
    paddingVertical: theme.spacing.xxl * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginTop: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyHint: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  footer: {
    marginTop: theme.spacing.xl,
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
