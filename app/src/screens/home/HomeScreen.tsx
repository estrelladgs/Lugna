import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../store/authStore';
import { AppTabParamList } from '../../navigation/AppNavigator';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = BottomTabNavigationProp<AppTabParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      <Text style={[typography.h1, styles.greeting]}>
        Hola, {user?.name?.split(' ')[0] ?? 'alumna'} 👋
      </Text>
      <Text style={[typography.body, styles.subtitle]}>¿Lista para entrenar hoy?</Text>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Posture')}
        activeOpacity={0.85}
      >
        <Text style={typography.h3}>Análisis postural</Text>
        <Text style={[typography.body, styles.cardBody]}>
          Activa la cámara y recibe correcciones en tiempo real con IA.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Routines')}
        activeOpacity={0.85}
      >
        <Text style={typography.h3}>Mis rutinas</Text>
        <Text style={[typography.body, styles.cardBody]}>
          Explora y sigue tus rutinas de pilates personalizadas.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('Progress')}
        activeOpacity={0.85}
      >
        <Text style={typography.h3}>Mi progreso</Text>
        <Text style={[typography.body, styles.cardBody]}>
          Revisa tu evolución y puntuaciones de sesiones pasadas.
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  greeting: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl, opacity: 0.7 },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardBody: { marginTop: spacing.xs, opacity: 0.7 },
});
