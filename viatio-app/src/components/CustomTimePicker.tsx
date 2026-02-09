/**
 * CUSTOM TIME PICKER
 *
 * Picker de hora personalizado con diseño moderno y atractivo.
 * Mejora visual sobre el picker nativo de Android/iOS.
 * Permite seleccionar hora y minutos con ruedas interactivas o entrada manual.
 */

import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { theme } from '@/config/theme';

interface CustomTimePickerProps {
  visible: boolean;
  value?: string; // Formato HH:MM
  onConfirm: (time: string) => void;
  onCancel: () => void;
  title?: string;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

export function CustomTimePicker({
  visible,
  value,
  onConfirm,
  onCancel,
  title = 'Seleccionar hora',
}: CustomTimePickerProps) {
  // Parsear valor inicial
  const [hours, minutes] = value ? value.split(':').map(Number) : [12, 0];

  const [selectedHour, setSelectedHour] = useState(hours);
  const [selectedMinute, setSelectedMinute] = useState(minutes);

  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Arrays para las opciones
  const hoursArray = Array.from({ length: 24 }, (_, i) => i);
  const minutesArray = Array.from({ length: 60 }, (_, i) => i); // 0, 1, 2, ..., 59

  // Scroll inicial al valor seleccionado
  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({
          y: selectedHour * ITEM_HEIGHT,
          animated: false,
        });
        minuteScrollRef.current?.scrollTo({
          y: selectedMinute * ITEM_HEIGHT,
          animated: false,
        });
      }, 100);
    }
  }, [visible]);

  const handleConfirm = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    onConfirm(timeString);
  };

  const renderColumn = (
    items: number[],
    selected: number,
    onSelect: (value: number) => void,
    scrollRef: React.RefObject<ScrollView | null>,
    suffix: string = ''
  ) => {
    const handleScroll = (event: any) => {
      const yOffset = event.nativeEvent.contentOffset.y;
      const index = Math.round(yOffset / ITEM_HEIGHT);
      const value = items[index];
      if (value !== undefined && value !== selected) {
        onSelect(value);
      }
    };

    return (
      <View style={styles.column}>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          onMomentumScrollEnd={handleScroll}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Padding superior */}
          <View style={{ height: ITEM_HEIGHT * 2 }} />

          {items.map((item) => {
            const isSelected = item === selected;
            return (
              <Pressable
                key={item}
                style={[styles.item, isSelected && styles.itemSelected]}
                onPress={() => {
                  onSelect(item);
                  const index = items.indexOf(item);
                  scrollRef.current?.scrollTo({
                    y: index * ITEM_HEIGHT,
                    animated: true,
                  });
                }}
              >
                <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
                  {item.toString().padStart(2, '0')}
                  {suffix}
                </Text>
              </Pressable>
            );
          })}

          {/* Padding inferior */}
          <View style={{ height: ITEM_HEIGHT * 2 }} />
        </ScrollView>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable style={styles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onCancel} hitSlop={8}>
              <Text style={styles.cancelButton}>Cancelar</Text>
            </Pressable>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={handleConfirm} hitSlop={8}>
              <Text style={styles.confirmButton}>Aceptar</Text>
            </Pressable>
          </View>

          {/* Time Display */}
          <View style={styles.displayContainer}>
            <View style={styles.displayBox}>
              <Text style={styles.displayTime}>
                {selectedHour.toString().padStart(2, '0')}
                <Text style={styles.displaySeparator}> : </Text>
                {selectedMinute.toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* Picker */}
          <View style={styles.pickerContainer}>
            {/* Highlight overlay */}
            <View style={styles.selectionOverlay} pointerEvents="none">
              <View style={styles.selectionHighlight} />
            </View>

            {/* Columns */}
            <View style={styles.columnsContainer}>
              {/* Hours */}
              <View style={styles.columnWrapper}>
                {renderColumn(
                  hoursArray,
                  selectedHour,
                  setSelectedHour,
                  hourScrollRef,
                  ''
                )}
              </View>

              {/* Separator */}
              <View style={styles.separator}>
                <Text style={styles.separatorText}>:</Text>
              </View>

              {/* Minutes */}
              <View style={styles.columnWrapper}>
                {renderColumn(
                  minutesArray,
                  selectedMinute,
                  setSelectedMinute,
                  minuteScrollRef,
                  ''
                )}
              </View>
            </View>
          </View>

        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  container: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.xl,
    width: '100%',
    maxWidth: 400,
    ...theme.shadows.elevated,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
  },
  cancelButton: {
    ...theme.typography.subtitle,
    color: theme.colors.textSecondary,
  },
  confirmButton: {
    ...theme.typography.subtitle,
    color: theme.colors.primaryLight,
    fontWeight: '700',
  },
  displayContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  displayBox: {
    backgroundColor: theme.colors.primaryLight,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    ...theme.shadows.card,
  },
  displayTime: {
    ...theme.typography.h1,
    fontSize: 48,
    fontWeight: '700',
    color: theme.colors.primaryForeground,
    letterSpacing: 2,
  },
  displaySeparator: {
    color: theme.colors.primaryForeground,
    opacity: 0.7,
  },
  pickerContainer: {
    height: PICKER_HEIGHT,
    position: 'relative',
  },
  selectionOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  selectionHighlight: {
    width: '80%',
    height: ITEM_HEIGHT,
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
    borderRadius: theme.radius.md,
    borderWidth: 2,
    borderColor: theme.colors.primaryLight,
  },
  columnsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  columnWrapper: {
    alignItems: 'center',
  },
  column: {
    width: 100,
    height: PICKER_HEIGHT,
  },
  scrollContent: {
    paddingVertical: 0,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemSelected: {
    // El estilo selected es manejado por el overlay
  },
  itemText: {
    ...theme.typography.h2,
    fontSize: 28,
    color: theme.colors.textSecondary,
    fontWeight: '400',
  },
  itemTextSelected: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 32,
  },
  separator: {
    width: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorText: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
  },
});
