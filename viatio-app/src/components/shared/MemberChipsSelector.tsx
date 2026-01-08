import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TripMember } from '@/types/shared';
import { theme } from '@/config/theme';

interface MemberChipsSelectorProps {
  members: TripMember[];
  selectedUids: string[];
  onToggle: (uid: string) => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  singleSelect?: boolean;
  label?: string;
  error?: string;
}

export function MemberChipsSelector({
  members,
  selectedUids,
  onToggle,
  onSelectAll,
  onDeselectAll,
  singleSelect = false,
  label,
  error,
}: MemberChipsSelectorProps) {
  const allSelected = selectedUids.length === members.length;

  return (
    <View style={styles.container}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          {!singleSelect && onSelectAll && onDeselectAll && (
            <Pressable
              onPress={allSelected ? onDeselectAll : onSelectAll}
              hitSlop={8}
            >
              <Text style={styles.selectAllText}>
                {allSelected ? 'Ninguno' : 'Todos'}
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <View style={styles.chipsContainer}>
        {members.map((member) => {
          const isSelected = selectedUids.includes(member.uid);

          return (
            <Pressable
              key={member.uid}
              style={[
                styles.chip,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => onToggle(member.uid)}
            >
              {member.photoURL ? (
                <Image
                  source={{ uri: member.photoURL }}
                  style={styles.avatar}
                />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarText}>
                    {member.displayName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text
                style={[
                  styles.chipText,
                  isSelected && styles.chipTextSelected,
                ]}
                numberOfLines={1}
              >
                {member.displayName}
              </Text>

              {isSelected && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.colors.primary}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  selectAllText: {
    fontSize: 14,
    color: theme.colors.primary,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: '#FFFFFF',
    gap: 6,
  },
  chipSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  chipText: {
    fontSize: 14,
    color: theme.colors.text,
    maxWidth: 100,
  },
  chipTextSelected: {
    fontWeight: '500',
    color: theme.colors.primary,
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
});
