import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { usePostureHistory } from '../../hooks/usePostureHistory';
import { PostureSession } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';

function SessionItem({ session }: { session: PostureSession }) {
  const date = new Date(session.startedAt).toLocaleDateString('es-ES', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
  const scoreColor =
    session.averageScore >= 80 ? colors.scoreHigh : session.averageScore >= 50 ? colors.scoreMedium : colors.scoreLow;

  return (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={[typography.h3, styles.postureName]}>
          {session.postureId.replace(/_/g, ' ')}
        </Text>
        <Text style={[typography.caption, styles.date]}>{date}</Text>
      </View>
      <Text style={[styles.score, { color: scoreColor }]}>{session.averageScore}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const { sessionHistory, isLoading, error } = usePostureHistory();

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>Mi Progreso</Text>

      {isLoading && <ActivityIndicator size="large" color={colors.black} style={styles.loader} />}

      {error && <Text style={[typography.body, styles.error]}>{error}</Text>}

      {!isLoading && (
        <FlatList
          data={sessionHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ gap: spacing.md }}
          renderItem={({ item }) => <SessionItem session={item} />}
          ListEmptyComponent={
            <Text style={[typography.body, styles.empty]}>
              Aún no tienes sesiones registradas.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  title: { marginBottom: spacing.lg },
  loader: { marginTop: spacing.xl },
  error: { color: colors.scoreLow, textAlign: 'center', marginTop: spacing.lg },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: spacing.xl },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { flex: 1 },
  postureName: { textTransform: 'capitalize', marginBottom: spacing.xs },
  date: {},
  score: { fontSize: 28, fontWeight: '800' },
});
