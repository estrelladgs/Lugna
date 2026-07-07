import React from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePostureHistory } from '../../hooks/usePostureHistory';
import { PostureSession } from '../../types';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'SessionHistory'>;

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return iso;
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return minutes > 0 ? `${minutes}m ${secs}s` : `${secs}s`;
}

function SessionRow({ session }: { session: PostureSession }) {
  const scoreColor =
    session.averageScore >= 80
      ? colors.scoreHigh
      : session.averageScore >= 50
      ? colors.scoreMedium
      : colors.scoreLow;

  return (
    <View style={styles.row}>
      <View style={styles.rowInfo}>
        <Text style={styles.rowProgram} numberOfLines={1}>
          {session.postureName ?? session.postureId}
        </Text>
        <Text style={styles.rowDate}>{formatDate(session.startedAt)}</Text>
      </View>
      <View style={styles.rowStats}>
        <Text style={styles.rowDuration}>{formatDuration(session.durationSeconds)}</Text>
        <Text style={[styles.rowScore, { color: scoreColor }]}>{Math.round(session.averageScore)}</Text>
      </View>
    </View>
  );
}

export default function SessionHistoryScreen() {
  const navigation = useNavigation<Nav>();
  const { sessionHistory, isLoading, error } = usePostureHistory();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={[typography.h2, styles.title]}>Historial de correcciones</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.center} size="large" color={colors.primary} />
      ) : error ? (
        <Text style={[typography.body, styles.empty]}>{error}</Text>
      ) : (
        <FlatList
          data={sessionHistory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <SessionRow session={item} />}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={[typography.body, styles.empty]}>
                Aún no has completado ninguna corrección.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xxl + spacing.lg },
  center: { marginTop: spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  backButtonText: { fontSize: 30, fontWeight: '700', color: colors.black, lineHeight: 32 },
  title: { flex: 1 },
  list: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  rowInfo: { flex: 1, marginRight: spacing.sm },
  rowProgram: { fontSize: 16, fontWeight: '700', color: colors.black },
  rowDate: { fontSize: 13, color: colors.textMuted, marginTop: 2, textTransform: 'capitalize' },
  rowStats: { alignItems: 'flex-end' },
  rowDuration: { fontSize: 14, fontWeight: '600', color: colors.black },
  rowScore: { fontSize: 13, fontWeight: '700', marginTop: 2 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  empty: { textAlign: 'center', opacity: 0.6 },
});
