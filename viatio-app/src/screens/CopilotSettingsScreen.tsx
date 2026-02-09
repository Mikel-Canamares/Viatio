/**
 * COPILOT SETTINGS SCREEN
 *
 * Pantalla de configuración del Viatio Copilot.
 * Permite personalizar módulos, tono, preferencias de viaje, etc.
 */

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ScreenContainer';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/Card';
import { SectionTitle } from '@/components/SectionTitle';
import { SwitchItem } from '@/components/SwitchItem';
import { SelectItem, SelectOption } from '@/components/SelectItem';
import { CustomModal } from '@/components';
import { useCopilotStore } from '@/store/useCopilotStore';
import {
  COPILOT_TONE_OPTIONS,
  COPILOT_LENGTH_OPTIONS,
  COPILOT_LANGUAGE_OPTIONS,
  TRAVEL_INTEREST_OPTIONS,
  FOOD_RESTRICTION_OPTIONS,
  TRAVEL_PACE_OPTIONS,
  MOBILITY_LEVEL_OPTIONS,
  BUDGET_LEVEL_OPTIONS,
  TravelInterest,
  FoodRestriction,
} from '@/types/asistente';
import { theme } from '@/config';

export default function CopilotSettingsScreen() {
  const navigation = useNavigation();
  const {
    preferences,
    isLoading,
    loadPreferences,
    toggleModule,
    setTone,
    setResponseLength,
    setLanguage,
    toggleEmojis,
    toggleInterest,
    toggleFoodRestriction,
    setPace,
    setMobilityLevel,
    setBudgetLevel,
    resetPreferences,
  } = useCopilotStore();

  // Estado del modal
  const [modalVisible, setModalVisible] = useState(false);
  const [resetModalVisible, setResetModalVisible] = useState(false);

  // Cargar preferencias al montar
  useEffect(() => {
    loadPreferences();
  }, []);

  // Convertir opciones a formato SelectItem
  const toneOptions: SelectOption[] = COPILOT_TONE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const lengthOptions: SelectOption[] = COPILOT_LENGTH_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const languageOptions: SelectOption[] = COPILOT_LANGUAGE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const paceOptions: SelectOption[] = TRAVEL_PACE_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `${opt.label} - ${opt.description}`,
  }));

  const mobilityOptions: SelectOption[] = MOBILITY_LEVEL_OPTIONS.map((opt) => ({
    value: opt.value,
    label: opt.label,
  }));

  const budgetOptions: SelectOption[] = BUDGET_LEVEL_OPTIONS.map((opt) => ({
    value: opt.value,
    label: `${opt.label} - ${opt.description}`,
  }));

  // Handler para reset
  const handleReset = () => {
    setResetModalVisible(true);
  };

  const confirmReset = async () => {
    await resetPreferences();
    setModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Configurar Copilot" onBack={() => navigation.goBack()} />
        <ScreenContainer>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando configuración...</Text>
        </View>
        </ScreenContainer>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Configurar Copilot" onBack={() => navigation.goBack()} />
      <ScreenContainer>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header con icono */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="sparkles" size={32} color={theme.colors.primary} />
          </View>
          <Text style={styles.headerTitle}>Viatio Copilot</Text>
          <Text style={styles.headerSubtitle}>
            Tu asistente de viaje personalizado. Ajusta cómo quieres que te ayude.
          </Text>
        </View>

        {/* MÓDULOS ACTIVOS */}
        <SectionTitle title="Dónde aparece" />
        <Card padding={0} style={styles.card}>
          <SwitchItem
            label="Agenda"
            description="Sugerencias para planificar tu día"
            value={preferences.enabledModules.agenda}
            onValueChange={() => toggleModule('agenda')}
          />
          <SwitchItem
            label="Mapa"
            description="Descubre lugares cercanos"
            value={preferences.enabledModules.map}
            onValueChange={() => toggleModule('map')}
          />
          <SwitchItem
            label="Detalle del viaje"
            description="Visión general y preparación"
            value={preferences.enabledModules.tripDetail}
            onValueChange={() => toggleModule('tripDetail')}
          />
          <SwitchItem
            label="Chat propio"
            description="Acceso desde el menú principal"
            value={preferences.enabledModules.standalone}
            onValueChange={() => toggleModule('standalone')}
          />
        </Card>

        {/* ESTILO DE RESPUESTAS */}
        <SectionTitle title="Estilo de respuestas" />
        <Card padding={0} style={styles.card}>
          <SelectItem
            label="Tono"
            value={preferences.tone}
            options={toneOptions}
            onSelect={(value) => setTone(value as typeof preferences.tone)}
            icon="chatbubble-outline"
          />
          <SelectItem
            label="Longitud"
            value={preferences.responseLength}
            options={lengthOptions}
            onSelect={(value) => setResponseLength(value as typeof preferences.responseLength)}
            icon="text-outline"
          />
          <SelectItem
            label="Idioma"
            value={preferences.language}
            options={languageOptions}
            onSelect={(value) => setLanguage(value as typeof preferences.language)}
            icon="language-outline"
          />
          <SwitchItem
            label="Usar emojis"
            description="Añade emojis a las respuestas"
            value={preferences.useEmojis}
            onValueChange={toggleEmojis}
          />
        </Card>

        {/* PREFERENCIAS DE VIAJE */}
        <SectionTitle title="Tu estilo de viaje" />
        <Card padding={0} style={styles.card}>
          <SelectItem
            label="Ritmo"
            value={preferences.travelPreferences.pace}
            options={paceOptions}
            onSelect={(value) => setPace(value as typeof preferences.travelPreferences.pace)}
            icon="speedometer-outline"
          />
          <SelectItem
            label="Presupuesto"
            value={preferences.travelPreferences.budgetLevel}
            options={budgetOptions}
            onSelect={(value) => setBudgetLevel(value as typeof preferences.travelPreferences.budgetLevel)}
            icon="wallet-outline"
          />
          <SelectItem
            label="Movilidad"
            value={preferences.travelPreferences.mobilityLevel}
            options={mobilityOptions}
            onSelect={(value) => setMobilityLevel(value as typeof preferences.travelPreferences.mobilityLevel)}
            icon="accessibility-outline"
          />
        </Card>

        {/* INTERESES */}
        <SectionTitle title="Tus intereses" />
        <Text style={styles.sectionDescription}>
          Selecciona lo que más te gusta para sugerencias personalizadas
        </Text>
        <View style={styles.chipsContainer}>
          {TRAVEL_INTEREST_OPTIONS.map((interest) => {
            const isSelected = preferences.travelPreferences.interests.includes(interest.value);
            return (
              <Pressable
                key={interest.value}
                onPress={() => toggleInterest(interest.value)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Ionicons
                  name={interest.icon as keyof typeof Ionicons.glyphMap}
                  size={16}
                  color={isSelected ? '#FFFFFF' : theme.colors.text}
                  style={styles.chipIcon}
                />
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {interest.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* RESTRICCIONES ALIMENTARIAS */}
        <SectionTitle title="Restricciones alimentarias" />
        <Text style={styles.sectionDescription}>
          Para recomendaciones de restaurantes adecuadas
        </Text>
        <View style={styles.chipsContainer}>
          {FOOD_RESTRICTION_OPTIONS.map((restriction) => {
            const isSelected = preferences.travelPreferences.foodRestrictions.includes(restriction.value);
            return (
              <Pressable
                key={restriction.value}
                onPress={() => toggleFoodRestriction(restriction.value)}
                style={[styles.chip, isSelected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                  {restriction.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* RESET */}
        <View style={styles.resetContainer}>
          <Pressable onPress={handleReset} style={styles.resetButton}>
            <Ionicons name="refresh-outline" size={18} color={theme.colors.error} />
            <Text style={styles.resetText}>Restablecer configuración</Text>
          </Pressable>
        </View>

        {/* Espaciado inferior */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Modal de confirmación de reset */}
      <CustomModal
        visible={resetModalVisible}
        type="warning"
        title="Restablecer configuración"
        message="¿Seguro que quieres restablecer la configuración del Copilot a los valores por defecto?"
        onClose={() => setResetModalVisible(false)}
        primaryButton={{
          text: 'Restablecer',
          onPress: confirmReset,
          destructive: true,
        }}
        secondaryButton={{
          text: 'Cancelar',
          onPress: () => {},
        }}
      />

      {/* Modal de éxito */}
      <CustomModal
        visible={modalVisible}
        type="success"
        title="Listo"
        message="Configuración restablecida"
        onClose={() => setModalVisible(false)}
        primaryButton={{
          text: 'OK',
          onPress: () => {},
        }}
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  header: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.full,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  chipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  chipIcon: {
    marginRight: theme.spacing.xs,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  chipTextSelected: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  resetContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  resetText: {
    fontSize: 14,
    color: theme.colors.error,
    marginLeft: theme.spacing.xs,
  },
  bottomSpacing: {
    height: theme.spacing.xl,
  },
});
