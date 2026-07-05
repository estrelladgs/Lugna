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
import { colors, spacing, typography } from '../../theme';

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
        <ActivityIndicator size="large" color={colors.black} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[typography.h2, styles.title]}>Elige una postura</Text>
      <FlatList
        data={postures}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={{ gap: spacing.md }}
        renderItem={({ item }) => (
          <PostureCard
            posture={item}
            onPress={() => navigation.navigate('PostureCamera', { postureId: item.id, postureName: item.name })}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.body, styles.empty]}>No hay posturas disponibles.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: spacing.lg },
  row: { gap: spacing.md },
  empty: { textAlign: 'center', opacity: 0.6, marginTop: spacing.xl },
});
