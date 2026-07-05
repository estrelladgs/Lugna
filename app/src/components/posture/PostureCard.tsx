import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Posture } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';
import { POSTURE_IMAGES } from '../../constants/postureImages';

const CARD_WIDTH = (Dimensions.get('window').width - spacing.xl * 2 - spacing.md) / 2;

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: colors.scoreHigh,
  intermediate: colors.scoreMedium,
  advanced: colors.scoreLow,
};

interface Props {
  posture: Posture;
  onPress: () => void;
}

export default function PostureCard({ posture, onPress }: Props) {
  const badgeColor = DIFFICULTY_COLOR[posture.difficulty] ?? colors.scoreMedium;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image source={POSTURE_IMAGES[posture.id]} style={styles.image} resizeMode="cover" />
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>
            {DIFFICULTY_LABEL[posture.difficulty] ?? posture.difficulty}
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={[typography.h3, styles.name]} numberOfLines={2}>
          {posture.name}
        </Text>
        <Text style={[typography.caption, styles.muscles]} numberOfLines={1}>
          {posture.muscleGroups.slice(0, 2).join(' · ')}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  imageWrapper: {
    width: '100%',
    height: 96,
    backgroundColor: colors.backgroundLight,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  body: {
    padding: spacing.md,
  },
  name: {
    fontSize: 17,
    marginBottom: spacing.xs,
    textTransform: 'capitalize',
  },
  muscles: {
    textTransform: 'capitalize',
  },
});
