import React from 'react';
import { Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Routine } from '../../types';
import { routineService } from '../../services/routineService';
import { colors, spacing, radius, typography } from '../../theme';

type ParamList = { RoutineDetail: { routine: Routine } };

export default function RoutineDetailScreen() {
  const navigation = useNavigation();
  const { params: { routine } } = useRoute<RouteProp<ParamList, 'RoutineDetail'>>();

  const handleStart = async () => {
    try {
      await routineService.startRoutine(routine.id);
    } catch {
      // continuamos aunque no se pueda guardar el progreso
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

      <Text style={[typography.h2, styles.title]}>{routine.name}</Text>
      <Text style={[typography.body, styles.meta]}>
        {routine.durationMinutes} min · {routine.difficulty}
      </Text>
      <Text style={[typography.body, styles.description]}>{routine.description}</Text>

      <TouchableOpacity style={styles.startButton} activeOpacity={0.85} onPress={handleStart}>
        <Text style={typography.button}>Comenzar rutina</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl },
  back: { marginBottom: spacing.lg },
  backText: { fontSize: 15, fontWeight: '600', color: colors.black },
  title: { marginBottom: spacing.xs },
  meta: { opacity: 0.6, marginBottom: spacing.md },
  description: { opacity: 0.8, marginBottom: spacing.lg },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
