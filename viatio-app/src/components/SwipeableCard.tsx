/**
 * SWIPEABLE CARD COMPONENT
 *
 * Wrapper reutilizable que permite swipe horizontal con gestos suaves.
 * Muestra acciones personalizables al deslizar a la izquierda.
 */

import React, { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

const SWIPE_THRESHOLD = 80; // Threshold suave para activar acciones
const ACTION_WIDTH = 180; // Ancho del área de acciones

interface SwipeableCardProps {
  children: ReactNode;
  renderRightActions: () => ReactNode;
  onSwipeableOpen?: () => void;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  renderRightActions,
  onSwipeableOpen,
}) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);

  // Configuración del gesto con spring suave usando Gesture API
  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newTranslateX = startX.value + event.translationX;

      // Permitir solo swipe hacia la izquierda (valores negativos)
      // Límite: no más allá del ancho de las acciones
      if (newTranslateX <= 0 && newTranslateX >= -ACTION_WIDTH) {
        translateX.value = newTranslateX;
      }
    })
    .onEnd(() => {
      // Si el swipe supera el threshold, abrir completamente
      // Si no, volver a la posición original
      if (translateX.value < -SWIPE_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH, {
          damping: 20,
          stiffness: 90,
        });

        if (onSwipeableOpen) {
          runOnJS(onSwipeableOpen)();
        }
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 90,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Acciones detrás (fijas) */}
      <View style={styles.actionsContainer}>{renderRightActions()}</View>

      {/* Card frontal (deslizable) */}
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, animatedStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    overflow: 'hidden',
  },
  actionsContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: ACTION_WIDTH,
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
});
