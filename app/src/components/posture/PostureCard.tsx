import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Posture } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.xl * 2 - spacing.md) / 2;

interface Props {
  posture: Posture;
  onPress: () => void;
}

export default function PostureCard({ posture, onPress }: Props) {
  const difficultyColor: Record<string, string> = {
    beginner: '#22C55E',
    intermediate: '#F59E0B',
    advanced: '#EF4444',
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.badge}>
        <Text style={[styles.badgeText, { color: difficultyColor[posture.difficulty] }]}>
          {posture.difficulty}
        </Text>
      </View>
      <Text style={[typography.h3, styles.name]} numberOfLines={2}>
        {posture.name}
      </Text>
      <Text style={[typography.caption, styles.muscles]} numberOfLines={1}>
        {posture.muscleGroups.slice(0, 2).join(' · ')}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.md,
    minHeight: 120,
    justifyContent: 'flex-end',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  name: {
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  muscles: {
    textTransform: 'capitalize',
  },
});
