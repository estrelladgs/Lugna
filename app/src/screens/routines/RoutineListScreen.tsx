import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../../services/api';
import { Routine } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';

type ParamList = { RoutineList: undefined; RoutineDetail: { routine: Routine } };

export default function RoutineListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ParamList>>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Routine[]>('/routines')
      .then(({ data }) => setRoutines(data))
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
      <Text style={[typography.h2, styles.title]}>Mis Rutinas</Text>
      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('RoutineDetail', { routine: item })}
            activeOpacity={0.85}
          >
            <Text style={typography.h3}>{item.name}</Text>
            <Text style={[typography.body, styles.meta]}>
              {item.durationMinutes} min · {item.difficulty}
            </Text>
            <Text style={[typography.body, styles.desc]} numberOfLines={2}>{item.description}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={[typography.body, styles.empty]}>No hay rutinas disponibles aún.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: spacing.lg },
  card: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.lg },
  meta: { opacity: 0.6, marginTop: spacing.xs },
  desc: { marginTop: spacing.xs, opacity: 0.75 },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: spacing.xl },
});
