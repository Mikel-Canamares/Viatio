/**
 * FAQ CARD
 *
 * Tarjeta expandible para mostrar una pregunta frecuente.
 * Soporta formato Markdown básico (negrita) y carrusel de imágenes.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';
import { ImageCarousel } from './ImageCarousel';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface FAQCardProps {
  /** Pregunta */
  question: string;

  /** Respuesta (soporta **negrita** y saltos de línea) */
  answer: string;

  /** Imágenes opcionales */
  images?: ImageSourcePropType[];

  /** Estado expandido (para componente controlado) */
  expanded?: boolean;

  /** Callback al alternar (para componente controlado) */
  onToggle?: () => void;

  /** Callback al navegar a pantalla relacionada (opcional) */
  onNavigate?: (screenName: string) => void;

  /** Pantallas relacionadas (opcional) */
  relatedScreens?: string[];
}

export function FAQCard({
  question,
  answer,
  images,
  expanded,
  onToggle,
  onNavigate,
  relatedScreens,
}: FAQCardProps) {
  // Estado interno para modo no controlado
  const [internalExpanded, setInternalExpanded] = useState(false);

  // Determinar si es controlado o no controlado
  const isControlled = expanded !== undefined && onToggle !== undefined;
  const isExpanded = isControlled ? expanded : internalExpanded;

  // Handler de toggle
  const handleToggle = () => {
    // Configurar animación suave
    LayoutAnimation.configureNext({
      duration: 200,
      update: {
        type: LayoutAnimation.Types.easeInEaseOut,
      },
    });

    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded(!internalExpanded);
    }
  };

  // Renderizar texto con formato Markdown básico
  const renderFormattedText = (text: string) => {
    // Dividir por saltos de línea
    const lines = text.split('\n');

    return lines.map((line, lineIndex) => {
      // Detectar si es una línea con bullet (- texto)
      const isBullet = line.trim().startsWith('-');
      const lineText = isBullet ? line.trim().substring(1).trim() : line;

      // Parsear negrita **texto**
      const parts: Array<{ text: string; bold: boolean }> = [];
      let currentText = '';
      let inBold = false;
      let i = 0;

      while (i < lineText.length) {
        if (lineText[i] === '*' && lineText[i + 1] === '*') {
          // Guardar texto actual
          if (currentText) {
            parts.push({ text: currentText, bold: inBold });
            currentText = '';
          }
          // Cambiar estado de negrita
          inBold = !inBold;
          i += 2;
        } else {
          currentText += lineText[i];
          i++;
        }
      }

      // Añadir último fragmento
      if (currentText) {
        parts.push({ text: currentText, bold: inBold });
      }

      return (
        <View key={lineIndex} style={isBullet ? styles.bulletLine : styles.regularLine}>
          {isBullet && <Text style={styles.bulletPoint}>•</Text>}
          <Text style={styles.answerText}>
            {parts.map((part, partIndex) => (
              <Text
                key={partIndex}
                style={part.bold ? styles.boldText : styles.regularText}
              >
                {part.text}
              </Text>
            ))}
          </Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      {/* Pregunta (siempre visible) */}
      <Pressable
        onPress={handleToggle}
        style={({ pressed }) => [
          styles.questionContainer,
          pressed && styles.questionPressed,
        ]}
      >
        <View style={styles.questionContent}>
          <Ionicons
            name="help-circle-outline"
            size={20}
            color={theme.colors.primary}
            style={styles.questionIcon}
          />
          <Text style={styles.question}>{question}</Text>
        </View>
        <Ionicons
          name="chevron-down"
          size={20}
          color={theme.colors.textSecondary}
          style={[styles.chevron, isExpanded && styles.chevronExpanded]}
        />
      </Pressable>

      {/* Respuesta expandible */}
      {isExpanded && (
        <View style={styles.answerContainer}>
          <View style={styles.answerContent}>{renderFormattedText(answer)}</View>

          {/* Carrusel de imágenes (si las hay) */}
          {images && images.length > 0 && (
            <View style={styles.imagesContainer}>
              <ImageCarousel images={images} />
            </View>
          )}

          {/* Enlaces a pantallas relacionadas (opcional) */}
          {relatedScreens && relatedScreens.length > 0 && onNavigate && (
            <View style={styles.relatedScreensContainer}>
              <Text style={styles.relatedScreensTitle}>Pantallas relacionadas:</Text>
              {relatedScreens.map((screenName) => (
                <Pressable
                  key={screenName}
                  onPress={() => onNavigate(screenName)}
                  style={({ pressed }) => [
                    styles.relatedScreenButton,
                    pressed && styles.relatedScreenButtonPressed,
                  ]}
                >
                  <Ionicons
                    name="arrow-forward-circle-outline"
                    size={16}
                    color={theme.colors.primary}
                  />
                  <Text style={styles.relatedScreenText}>Ir a {screenName}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing.sm,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.md,
  },
  questionPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  questionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
  },
  questionIcon: {
    marginTop: 2,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
    lineHeight: 21,
  },
  chevron: {
    marginLeft: theme.spacing.sm,
  },
  chevronExpanded: {
    transform: [{ rotate: '180deg' }],
  },
  answerContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  answerContent: {
    paddingTop: theme.spacing.md,
  },
  bulletLine: {
    flexDirection: 'row',
    marginBottom: theme.spacing.xs,
    paddingLeft: theme.spacing.sm,
  },
  regularLine: {
    marginBottom: theme.spacing.xs,
  },
  bulletPoint: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginRight: theme.spacing.sm,
    marginTop: 2,
  },
  answerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  regularText: {
    color: theme.colors.textSecondary,
  },
  boldText: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  imagesContainer: {
    marginTop: theme.spacing.md,
  },
  relatedScreensContainer: {
    marginTop: theme.spacing.md,
    paddingTop: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  relatedScreensTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.sm,
  },
  relatedScreenButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
  relatedScreenButtonPressed: {
    opacity: 0.6,
  },
  relatedScreenText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
});
