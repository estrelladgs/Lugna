import { useEffect } from 'react';
import {
  Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Image, View,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { routineService } from '../../services/routineService';
import { colors, spacing, radius, typography } from '../../theme';
import { RoutinesStackParamList } from '../../navigation/RoutinesNavigator';

type RouteProps = RouteProp<RoutinesStackParamList, 'RoutineDetail'>;

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`;
}

export default function RoutineDetailScreen() {
  const navigation = useNavigation();
  const { params: { routine } } = useRoute<RouteProps>();

  const thumbnail = getYoutubeThumbnail(routine.enlace);

  // Save as last viewed routine whenever user opens this screen
  useEffect(() => {
    routineService.saveLastRoutine({
      id: routine.id,
      name: routine.name,
      durationMinutes: routine.durationMinutes,
      progressPercent: 0,
      enlace: routine.enlace,
    }).catch(() => {});
  }, [routine]);

  const handleStart = async () => {
    try {
      await routineService.startRoutine(routine.id);
    } catch {
      // continue even if server is unreachable
    }
    if (routine.enlace) {
      Linking.openURL(routine.enlace);
    }
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>← Volver</Text>
      </TouchableOpacity>

      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}

      <View style={styles.content}>
        <Text style={[typography.h2, styles.title]}>{routine.name}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{routine.durationMinutes} min</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {DIFFICULTY_LABEL[routine.difficulty] ?? routine.difficulty}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Descripción</Text>
        <Text style={[typography.body, styles.description]}>{routine.description}</Text>

        <Text style={styles.sectionLabel}>Lo que trabajarás</Text>
        <Text style={[typography.body, styles.benefitText]}>
          Una rutina diseñada para mejorar tu bienestar mediante movimientos de pilates
          adaptados a tu nivel. Notarás los beneficios desde la primera sesión.
        </Text>

        <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
          <Text style={typography.button}>
            {routine.enlace ? 'Comenzar rutina ▶' : 'Comenzar rutina'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: spacing.xxl },
  back: { padding: spacing.xl, paddingBottom: spacing.sm },
  backText: { fontSize: 15, fontWeight: '600', color: colors.black },
  thumbnail: {
    width: '100%',
    height: 220,
    backgroundColor: colors.backgroundLight,
  },
  content: { padding: spacing.xl },
  title: { marginBottom: spacing.md },
  badgeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badge: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.black,
    opacity: 0.5,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  description: { opacity: 0.85, marginBottom: spacing.sm },
  benefitText: { opacity: 0.75 },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
