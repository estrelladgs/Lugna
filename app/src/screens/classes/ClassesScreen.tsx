import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Linking, Animated,
} from 'react-native';
import { getLiveClasses, LiveClass } from '../../services/homeService';
import { colors, spacing, radius, typography } from '../../theme';

const HEADER_FADE_DISTANCE = 220;
const DEFAULT_HEADER_HEIGHT = 150;

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
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const scrollY = useRef(new Animated.Value(0)).current;

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

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, HEADER_FADE_DISTANCE],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });
  const headerTranslate = scrollY.interpolate({
    inputRange: [0, HEADER_FADE_DISTANCE],
    outputRange: [0, -40],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Animated.View
        pointerEvents="none"
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
        style={[
          styles.header,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] },
        ]}
      >
        <Text style={styles.headerTitle}>Clases en Directo</Text>
        <Text style={styles.headerSubtitle}>
          Únete a nuestras sesiones en vivo con instructoras certificadas.
        </Text>
      </Animated.View>
      <FlatList
        data={classes}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: headerHeight + spacing.md }]}
        renderItem={({ item }) => <ClassCard item={item} />}
        ListEmptyComponent={
          <Text style={[typography.body, styles.empty]}>
            No hay clases programadas próximamente.
          </Text>
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: colors.header,
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
  },
  list: { gap: spacing.md, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
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
