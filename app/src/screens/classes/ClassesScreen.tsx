import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking,
} from 'react-native';
import { getLiveClasses, LiveClass } from '../../services/homeService';
import { colors, spacing, radius, typography } from '../../theme';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function ClassCard({ item }: { item: LiveClass }) {
  const date = new Date(item.scheduledAt);
  const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const dateStr = date.toLocaleDateString('es-ES', { weekday: 'long', day: '2-digit', month: 'long' });

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={item.enlace ? 0.8 : 1}
      onPress={() => item.enlace && Linking.openURL(item.enlace)}
    >
      <View style={styles.timeBlock}>
        <Text style={styles.timeText}>{timeStr}</Text>
        <Text style={styles.dateText}>{dateStr}</Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.infoBlock}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardInstructor}>{item.instructorName}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>{item.durationMinutes} min</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={styles.metaText}>
            {DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty}
          </Text>
          {item.enlace && <Text style={styles.joinText}>Unirse →</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function ClassesScreen() {
  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLiveClasses()
      .then((data) => {
        const sorted = [...data].sort(
          (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
        );
        setClasses(sorted);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>Clases en Directo</Text>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => <ClassCard item={item} />}
        ListEmptyComponent={
          <Text style={[typography.body, styles.empty]}>
            No hay clases programadas próximamente.
          </Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginBottom: spacing.lg },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  timeBlock: { alignItems: 'center', minWidth: 52 },
  timeText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.black,
    lineHeight: 24,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 2,
    textTransform: 'capitalize',
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.primary,
    opacity: 0.25,
  },
  infoBlock: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  cardInstructor: {
    fontSize: 13,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexWrap: 'wrap',
  },
  metaText: { fontSize: 13, color: colors.black, opacity: 0.7 },
  metaDot: { fontSize: 13, color: colors.black, opacity: 0.4 },
  joinText: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  empty: {
    textAlign: 'center',
    opacity: 0.6,
    marginTop: spacing.xl,
  },
});
