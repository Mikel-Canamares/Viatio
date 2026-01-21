/**
 * IMAGE CAROUSEL
 *
 * Carrusel horizontal de imágenes con tap para abrir modal fullscreen.
 * El modal incluye zoom con pinch-to-zoom y navegación entre imágenes.
 */

import { useState } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  Modal,
  StyleSheet,
  Dimensions,
  ScrollView,
  ImageSourcePropType,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/config';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THUMBNAIL_WIDTH = 200;
const THUMBNAIL_HEIGHT = 150;

interface ImageCarouselProps {
  /** Array de imágenes a mostrar */
  images: ImageSourcePropType[];
}

export function ImageCarousel({ images }: ImageCarouselProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  // Abrir modal con la imagen seleccionada
  const openImage = (index: number) => {
    setSelectedImageIndex(index);
  };

  // Cerrar modal
  const closeImage = () => {
    setSelectedImageIndex(null);
  };

  // Navegar a imagen anterior
  const goToPrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  // Navegar a imagen siguiente
  const goToNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* Carrusel de thumbnails */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carouselContent}
        style={styles.carousel}
      >
        {images.map((image, index) => (
          <Pressable
            key={index}
            onPress={() => openImage(index)}
            style={({ pressed }) => [
              styles.thumbnailContainer,
              pressed && styles.thumbnailPressed,
            ]}
          >
            <Image source={image} style={styles.thumbnail} resizeMode="cover" />
            <View style={styles.zoomOverlay}>
              <Ionicons name="expand-outline" size={20} color="#fff" />
            </View>
          </Pressable>
        ))}
      </ScrollView>

      {/* Indicador de cantidad */}
      {images.length > 1 && (
        <View style={styles.imageCount}>
          <Ionicons name="images-outline" size={14} color={theme.colors.textMuted} />
          <Text style={styles.imageCountText}>
            {images.length} {images.length === 1 ? 'imagen' : 'imágenes'}
          </Text>
        </View>
      )}

      {/* Modal fullscreen con zoom */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeImage}
      >
        <View style={styles.modalContainer}>
          {/* Header con botón cerrar */}
          <View style={styles.modalHeader}>
            <Pressable onPress={closeImage} style={styles.closeButton}>
              <Ionicons name="close" size={28} color="#fff" />
            </Pressable>
            {images.length > 1 && selectedImageIndex !== null && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>
                  {selectedImageIndex + 1} / {images.length}
                </Text>
              </View>
            )}
          </View>

          {/* Imagen con zoom */}
          {selectedImageIndex !== null && (
            <ScrollView
              contentContainerStyle={styles.imageScrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsHorizontalScrollIndicator={false}
              showsVerticalScrollIndicator={false}
            >
              <Image
                source={images[selectedImageIndex]}
                style={styles.fullImage}
                resizeMode="contain"
              />
            </ScrollView>
          )}

          {/* Controles de navegación (si hay múltiples imágenes) */}
          {images.length > 1 && selectedImageIndex !== null && (
            <View style={styles.navigationControls}>
              {/* Botón anterior */}
              <Pressable
                onPress={goToPrevious}
                disabled={selectedImageIndex === 0}
                style={[
                  styles.navButton,
                  selectedImageIndex === 0 && styles.navButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-back"
                  size={32}
                  color={selectedImageIndex === 0 ? 'rgba(255,255,255,0.3)' : '#fff'}
                />
              </Pressable>

              {/* Botón siguiente */}
              <Pressable
                onPress={goToNext}
                disabled={selectedImageIndex === images.length - 1}
                style={[
                  styles.navButton,
                  selectedImageIndex === images.length - 1 && styles.navButtonDisabled,
                ]}
              >
                <Ionicons
                  name="chevron-forward"
                  size={32}
                  color={
                    selectedImageIndex === images.length - 1
                      ? 'rgba(255,255,255,0.3)'
                      : '#fff'
                  }
                />
              </Pressable>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginVertical: theme.spacing.xs,
  },
  carouselContent: {
    gap: theme.spacing.sm,
  },
  thumbnailContainer: {
    width: THUMBNAIL_WIDTH,
    height: THUMBNAIL_HEIGHT,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailPressed: {
    opacity: 0.8,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  imageCountText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.md,
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.full,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  imageScrollContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  navigationControls: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    transform: [{ translateY: -22 }],
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
});
