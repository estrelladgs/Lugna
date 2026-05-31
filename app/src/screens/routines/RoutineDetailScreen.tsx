import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { Routine } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';

type ParamList = { RoutineDetail: { routine: Routine } };

export default function RoutineDetailScreen() {
  const navigation = useNavigation();
  const { params: { routine } } = useRoute<RouteProp<ParamList, 'RoutineDetail'>>();

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

      <Text style={[typography.h3, styles.sectionTitle]}>Posturas ({routine.postures.length})</Text>
      {routine.postures.map((postureId, index) => (
        <View key={postureId} style={styles.postureRow}>
          <Text style={styles.index}>{index + 1}</Text>
          <Text style={[typography.body, styles.postureName]}>{postureId.replace(/_/g, ' ')}</Text>
        </View>
      ))}

      <TouchableOpacity style={styles.startButton} activeOpacity={0.85}>
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
  sectionTitle: { marginBottom: spacing.md },
  postureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  index: { fontSize: 16, fontWeight: '700', color: colors.textMuted, width: 24 },
  postureName: { textTransform: 'capitalize' },
  startButton: {
    marginTop: spacing.xl,
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
