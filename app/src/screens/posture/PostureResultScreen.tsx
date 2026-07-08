import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { PostureStackParamList } from '../../navigation/PostureNavigator';
import { colors, spacing, radius, typography } from '../../theme';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';

type Nav = NativeStackNavigationProp<PostureStackParamList, 'PostureResult'>;
type Route = RouteProp<PostureStackParamList, 'PostureResult'>;

export default function PostureResultScreen() {
  const navigation = useNavigation<Nav>();
  const { params: { session } } = useRoute<Route>();
  const scrollRef = useScrollToTopOnFocus<ScrollView>();

  const minutes = Math.floor(session.durationSeconds / 60);
  const seconds = session.durationSeconds % 60;

  const scoreColor =
    session.averageScore >= 80
      ? colors.scoreHigh
      : session.averageScore >= 50
      ? colors.scoreMedium
      : colors.scoreLow;

  return (
    <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={[typography.h2, styles.title]}>Resumen de sesión</Text>

      <View style={styles.scoreCard}>
        <Text style={[typography.caption, styles.scoreLabel]}>Puntuación media</Text>
        <Text style={[styles.scoreValue, { color: scoreColor }]}>{session.averageScore}</Text>
        <Text style={typography.caption}>/ 100</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[typography.h3, styles.statValue]}>
            {minutes > 0 ? `${minutes}m ` : ''}{seconds}s
          </Text>
          <Text style={[typography.caption, styles.statLabel]}>Duración</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[typography.h3, styles.statValue]}>{session.feedbackHistory.length}</Text>
          <Text style={[typography.caption, styles.statLabel]}>Análisis</Text>
        </View>
      </View>

      <Text style={[typography.h3, styles.sectionTitle]}>Correcciones más frecuentes</Text>
      {session.feedbackHistory
        .flatMap((f) => f.corrections)
        .filter((v, i, arr) => arr.indexOf(v) === i)
        .slice(0, 5)
        .map((correction, i) => (
          <View key={i} style={styles.correctionRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={typography.body}>{correction}</Text>
          </View>
        ))}

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.popToTop()}
        activeOpacity={0.85}
      >
        <Text style={typography.button}>Volver a posturas</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  title: { marginBottom: spacing.lg },
  scoreCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  scoreLabel: { marginBottom: spacing.xs },
  scoreValue: { fontSize: 64, fontWeight: '800', lineHeight: 72 },
  statsRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  statValue: { marginBottom: spacing.xs },
  statLabel: {},
  sectionTitle: { marginBottom: spacing.md },
  correctionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  bullet: { fontSize: 18, lineHeight: 22 },
  button: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
