import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { routineService } from '../../services/routineService';
import { Routine } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';
import { RoutinesStackParamList } from '../../navigation/RoutinesNavigator';

type Nav = NativeStackNavigationProp<RoutinesStackParamList, 'RoutineList'>;

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
}

export default function RoutineListScreen() {
  const navigation = useNavigation<Nav>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    routineService.getRoutines()
      .then(setRoutines)
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
      <Text style={[typography.h2, styles.title]}>Programas</Text>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const thumbnail = getYoutubeThumbnail(item.enlace);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('RoutineDetail', { routine: item })}
              activeOpacity={0.85}
            >
              <View style={styles.cardInner}>
                {thumbnail && (
                  <Image
                    source={{ uri: thumbnail }}
                    style={styles.thumbnail}
                    resizeMode="cover"
                  />
                )}
                <View style={styles.cardBody}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{item.durationMinutes} min</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaText}>
                      {DIFFICULTY_LABEL[item.difficulty] ?? item.difficulty}
                    </Text>
                  </View>
                  <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <Text style={[typography.body, styles.empty]}>
            No hay rutinas disponibles aún.
          </Text>
        }
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
  list: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  cardInner: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: colors.backgroundLight,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  metaText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  metaDot: { fontSize: 13, color: colors.primary, opacity: 0.5 },
  desc: {
    fontSize: 14,
    color: colors.black,
    opacity: 0.75,
    lineHeight: 20,
  },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: spacing.xl },
});
