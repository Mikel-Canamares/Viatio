import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Pressable,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlaceResult, mapGoogleTypeToCategoria } from '@/types/googlePlaces';
import { getPhotoUrl } from '@/services/googlePlacesService';
import { LUGAR_CATEGORIAS, CategoriaLugar } from '@/types/lugar';
import { theme } from '@/config/theme';

interface PlaceDetailCardProps {
  place: PlaceResult;
  onClose: () => void;
  onAddToTrip: (place: PlaceResult) => void;
  loading?: boolean;
}

export function PlaceDetailCard({
  place,
  onClose,
  onAddToTrip,
  loading = false,
}: PlaceDetailCardProps) {
  const [imageError, setImageError] = useState(false);

  const photoUrl = place.photoReference ? getPhotoUrl(place.photoReference, 600) : null;
  const categoria = mapGoogleTypeToCategoria(place.types) as CategoriaLugar;
  const categoriaInfo = LUGAR_CATEGORIAS[categoria] || LUGAR_CATEGORIAS.other;

  // Renderizar estrellas de rating
  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <Ionicons key={i} name="star" size={16} color="#FBBF24" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <Ionicons key={i} name="star-half" size={16} color="#FBBF24" />
        );
      } else {
        stars.push(
          <Ionicons key={i} name="star-outline" size={16} color="#FBBF24" />
        );
      }
    }
    return stars;
  };

  // Renderizar nivel de precio
  const renderPriceLevel = (level?: number) => {
    if (level === undefined) return null;
    return (
      <Text style={styles.priceLevel}>
        {'€'.repeat(level + 1)}
        <Text style={styles.priceLevelInactive}>
          {'€'.repeat(4 - level - 1)}
        </Text>
      </Text>
    );
  };

  const handleOpenInMaps = () => {
    if (place.googleMapsUrl) {
      Linking.openURL(place.googleMapsUrl);
    } else {
      const url = `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}&query_place_id=${place.placeId}`;
      Linking.openURL(url);
    }
  };

  const handleCall = () => {
    if (place.phone) {
      Linking.openURL(`tel:${place.phone}`);
    }
  };

  const handleWebsite = () => {
    if (place.website) {
      Linking.openURL(place.website);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header con botón cerrar */}
      <View style={styles.header}>
        <View style={styles.dragHandle} />
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagen */}
        {photoUrl && !imageError ? (
          <Image
            source={{ uri: photoUrl }}
            style={styles.image}
            onError={() => setImageError(true)}
          />
        ) : (
          <View style={[styles.image, styles.imagePlaceholder]}>
            <Ionicons
              name={categoriaInfo.icon as any}
              size={48}
              color={theme.colors.textMuted}
            />
          </View>
        )}

        {/* Información principal */}
        <View style={styles.content}>
          {/* Nombre */}
          <Text style={styles.name} numberOfLines={2}>
            {place.name}
          </Text>

          {/* Rating y tipo */}
          <View style={styles.ratingRow}>
            {place.rating && (
              <>
                <Text style={styles.ratingNumber}>{place.rating.toFixed(1)}</Text>
                <View style={styles.stars}>{renderStars(place.rating)}</View>
                {place.totalRatings && (
                  <Text style={styles.totalRatings}>
                    ({place.totalRatings.toLocaleString()})
                  </Text>
                )}
              </>
            )}
            {renderPriceLevel(place.priceLevel)}
          </View>

          {/* Tipo de lugar */}
          <View style={styles.typeRow}>
            <View style={[styles.typeBadge, { backgroundColor: categoriaInfo.color + '20' }]}>
              <Ionicons
                name={categoriaInfo.icon as any}
                size={14}
                color={categoriaInfo.color}
              />
              <Text style={[styles.typeText, { color: categoriaInfo.color }]}>
                {place.primaryTypeLabel || categoriaInfo.label}
              </Text>
            </View>
            {place.isOpen !== undefined && (
              <Text style={[
                styles.openStatus,
                { color: place.isOpen ? '#16A34A' : '#DC2626' }
              ]}>
                {place.isOpen ? 'Abierto' : 'Cerrado'}
              </Text>
            )}
          </View>

          {/* Descripción */}
          {place.description && (
            <Text style={styles.description} numberOfLines={3}>
              {place.description}
            </Text>
          )}

          {/* Dirección */}
          <Pressable style={styles.infoRow} onPress={handleOpenInMaps}>
            <Ionicons name="location-outline" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.infoText} numberOfLines={2}>
              {place.address}
            </Text>
            <Ionicons name="open-outline" size={16} color={theme.colors.primaryLight} />
          </Pressable>

          {/* Horarios */}
          {place.openingHours && place.openingHours.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={theme.colors.textSecondary} />
              <View style={styles.hoursContainer}>
                {place.openingHours.slice(0, 3).map((hour, index) => (
                  <Text key={index} style={styles.hourText} numberOfLines={1}>
                    {hour}
                  </Text>
                ))}
                {place.openingHours.length > 3 && (
                  <Text style={styles.moreHours}>
                    Ver todos los horarios...
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Teléfono */}
          {place.phone && (
            <Pressable style={styles.infoRow} onPress={handleCall}>
              <Ionicons name="call-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={styles.infoText}>{place.phone}</Text>
              <Ionicons name="open-outline" size={16} color={theme.colors.primaryLight} />
            </Pressable>
          )}

          {/* Website */}
          {place.website && (
            <Pressable style={styles.infoRow} onPress={handleWebsite}>
              <Ionicons name="globe-outline" size={20} color={theme.colors.textSecondary} />
              <Text style={[styles.infoText, styles.link]} numberOfLines={1}>
                {place.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </Text>
              <Ionicons name="open-outline" size={16} color={theme.colors.primaryLight} />
            </Pressable>
          )}

          {/* Botones de acción */}
          <View style={styles.actions}>
            <Pressable
              style={styles.actionButton}
              onPress={handleOpenInMaps}
            >
              <Ionicons name="navigate" size={20} color={theme.colors.primaryLight} />
              <Text style={styles.actionButtonText}>Cómo llegar</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.actionButtonPrimary]}
              onPress={() => onAddToTrip(place)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={20} color="#FFFFFF" />
                  <Text style={styles.actionButtonTextPrimary}>Añadir al viaje</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 8,
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
  },
  image: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  stars: {
    flexDirection: 'row',
  },
  totalRatings: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  priceLevel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
    marginLeft: 8,
  },
  priceLevelInactive: {
    color: '#D1D5DB',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  typeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  openStatus: {
    fontSize: 13,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text,
    lineHeight: 20,
  },
  link: {
    color: theme.colors.primaryLight,
  },
  hoursContainer: {
    flex: 1,
  },
  hourText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  moreHours: {
    fontSize: 13,
    color: theme.colors.primaryLight,
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.primaryLight,
  },
  actionButtonPrimary: {
    backgroundColor: theme.colors.primaryLight,
    borderColor: theme.colors.primaryLight,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.primaryLight,
  },
  actionButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
