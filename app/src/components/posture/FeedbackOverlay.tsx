import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PostureFeedback } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';

interface Props {
  feedback: PostureFeedback;
}

export default function FeedbackOverlay({ feedback }: Props) {
  const bgColor = feedback.isCorrect ? 'rgba(34,197,94,0.85)' : 'rgba(239,68,68,0.85)';

  return (
    <View style={styles.container}>
      <View style={[styles.scoreBadge, { backgroundColor: bgColor }]}>
        <Text style={styles.scoreText}>{feedback.score}</Text>
      </View>

      {feedback.corrections.length > 0 && (
        <View style={styles.correctionsPanel}>
          {feedback.corrections.slice(0, 3).map((correction, i) => (
            <Text key={i} style={[typography.body, styles.correctionText]}>
              • {correction}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  correctionsPanel: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: radius.md,
    padding: spacing.md,
    alignSelf: 'stretch',
    gap: spacing.xs,
  },
  correctionText: {
    color: colors.white,
  },
});
