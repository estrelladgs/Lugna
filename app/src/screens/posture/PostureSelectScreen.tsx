import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { postureService } from '../../services/postureService';
import { Posture } from '../../types';
import PostureCard from '../../components/posture/PostureCard';
import { PostureStackParamList } from '../../navigation/PostureNavigator';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<PostureStackParamList, 'PostureSelect'>;

export default function PostureSelectScreen() {
  const navigation = useNavigation<Nav>();
  const [postures, setPostures] = useState<Posture[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postureService.getPostures()
      .then(setPostures)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>Elige una postura</Text>
      <Text style={[typography.body, styles.subtitle]}>
        Selecciona un ejercicio para corregir tu postura en tiempo real con la cámara.
      </Text>
      <FlatList
        data={postures}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <PostureCard
            posture={item}
            onPress={() => navigation.navigate('PostureCamera', { postureId: item.id, postureName: item.name })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={[typography.body, styles.empty]}>No hay posturas disponibles.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: spacing.xs },
  subtitle: { color: colors.textMuted, marginBottom: spacing.lg },
  row: { gap: spacing.md },
  list: { gap: spacing.md, paddingBottom: spacing.xxl },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
  empty: { textAlign: 'center', opacity: 0.6 },
});
