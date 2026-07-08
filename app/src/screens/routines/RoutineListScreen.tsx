import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Animated, TextInput,
} from 'react-native';
import Svg, { Polygon, Circle, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { routineService } from '../../services/routineService';
import { Routine } from '../../types';
import { colors, spacing, radius, typography } from '../../theme';
import { RoutinesStackParamList } from '../../navigation/RoutinesNavigator';

type Nav = NativeStackNavigationProp<RoutinesStackParamList, 'RoutineList'>;

const HEADER_FADE_DISTANCE = 220;
const DEFAULT_HEADER_HEIGHT = 150;

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  beginner: colors.scoreHigh,
  intermediate: colors.scoreMedium,
  advanced: colors.scoreLow,
};

type DifficultyFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type DurationFilter = 'all' | 'short' | 'medium' | 'long';
type DropdownKey = 'level' | 'duration';

const LEVEL_OPTIONS: { value: DifficultyFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

const DURATION_OPTIONS: { value: DurationFilter; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'short', label: '< 15 min' },
  { value: 'medium', label: '15-30 min' },
  { value: 'long', label: '30+ min' },
];

function matchesDuration(minutes: number, filter: DurationFilter): boolean {
  switch (filter) {
    case 'short': return minutes < 15;
    case 'medium': return minutes >= 15 && minutes < 30;
    case 'long': return minutes >= 30;
    default: return true;
  }
}

function getYoutubeThumbnail(url?: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (!match) return null;
  return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`;
}

function SearchIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Circle cx={8} cy={8} r={6} stroke={colors.textMuted} strokeWidth={2} fill="none" />
      <Line x1={12.5} y1={12.5} x2={17} y2={17} stroke={colors.textMuted} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function RoutineCard({ routine, onPress }: { routine: Routine; onPress: () => void }) {
  const thumbnail = getYoutubeThumbnail(routine.enlace);
  const badgeColor = DIFFICULTY_COLOR[routine.difficulty] ?? colors.scoreMedium;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.imageWrapper}>
        <Image
          source={thumbnail ? { uri: thumbnail } : require('../../../assets/onboarding1.png')}
          style={styles.thumbnail}
          resizeMode="cover"
        />
        <View style={styles.imageShade} />
        <View style={[styles.badge, { backgroundColor: badgeColor }]}>
          <Text style={styles.badgeText}>
            {DIFFICULTY_LABEL[routine.difficulty] ?? routine.difficulty}
          </Text>
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{routine.durationMinutes} min</Text>
        </View>
        <View style={styles.playButton}>
          <Svg width={20} height={20} viewBox="0 0 20 20">
            <Polygon points="6,3 17,10 6,17" fill={colors.primary} />
          </Svg>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{routine.name}</Text>
        <Text style={styles.desc} numberOfLines={2}>{routine.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

function FilterDropdown<T extends string>({
  label,
  options,
  value,
  open,
  onToggle,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  open: boolean;
  onToggle: () => void;
  onChange: (value: T) => void;
}) {
  const selected = options.find((opt) => opt.value === value);

  return (
    <View style={styles.dropdownWrapper}>
      <TouchableOpacity style={styles.dropdownButton} onPress={onToggle} activeOpacity={0.8}>
        <View style={{ flex: 1 }}>
          <Text style={styles.dropdownButtonLabel}>{label}</Text>
          <Text style={styles.dropdownButtonValue} numberOfLines={1}>{selected?.label}</Text>
        </View>
        <Text style={[styles.dropdownArrow, open && styles.dropdownArrowOpen]}>⌄</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownPanel}>
          {options.map((opt, index) => {
            const isActive = opt.value === value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.dropdownOption,
                  index > 0 && styles.dropdownOptionBorder,
                  isActive && styles.dropdownOptionActive,
                ]}
                onPress={() => onChange(opt.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dropdownOptionText, isActive && styles.dropdownOptionTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

export default function RoutineListScreen() {
  const navigation = useNavigation<Nav>();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [headerHeight, setHeaderHeight] = useState(DEFAULT_HEADER_HEIGHT);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [durationFilter, setDurationFilter] = useState<DurationFilter>('all');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey | null>(null);
  const scrollY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    routineService.getRoutines()
      .then(setRoutines)
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

  const query = search.trim().toLowerCase();
  const filteredRoutines = routines.filter((r) => {
    if (difficultyFilter !== 'all' && r.difficulty !== difficultyFilter) return false;
    if (!matchesDuration(r.durationMinutes, durationFilter)) return false;
    if (query && !`${r.name} ${r.description}`.toLowerCase().includes(query)) return false;
    return true;
  });

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown((current) => (current === key ? null : key));
  };

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
        <Text style={styles.headerTitle}>Programas</Text>
        <Text style={styles.headerSubtitle}>
          Rutinas guiadas de pilates para mejorar tu postura y tu fuerza.
        </Text>
      </Animated.View>
      <FlatList
        data={filteredRoutines}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingTop: headerHeight + spacing.md }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.filtersWrapper}>
            <View style={styles.searchBar}>
              <SearchIcon />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar programas..."
                placeholderTextColor={colors.textMuted}
                value={search}
                onChangeText={setSearch}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Text style={styles.clearIcon}>✕</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.dropdownRow}>
              <FilterDropdown
                label="Nivel"
                options={LEVEL_OPTIONS}
                value={difficultyFilter}
                open={openDropdown === 'level'}
                onToggle={() => toggleDropdown('level')}
                onChange={(v) => { setDifficultyFilter(v); setOpenDropdown(null); }}
              />
              <FilterDropdown
                label="Duración"
                options={DURATION_OPTIONS}
                value={durationFilter}
                open={openDropdown === 'duration'}
                onToggle={() => toggleDropdown('duration')}
                onChange={(v) => { setDurationFilter(v); setOpenDropdown(null); }}
              />
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <RoutineCard
            routine={item}
            onPress={() => navigation.navigate('RoutineDetail', { routine: item })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.emptyCard}>
            <Text style={[typography.body, styles.empty]}>
              {routines.length === 0
                ? 'No hay rutinas disponibles aún.'
                : 'No hay programas que coincidan con tu búsqueda.'}
            </Text>
          </View>
        }
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
  list: { gap: spacing.lg, paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  filtersWrapper: { marginBottom: spacing.md, zIndex: 5 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    height: 46,
    gap: spacing.sm,
    marginBottom: spacing.sm,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: colors.black,
    paddingVertical: 0,
  },
  clearIcon: {
    fontSize: 14,
    color: colors.textMuted,
    paddingHorizontal: spacing.xs,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  dropdownWrapper: { flex: 1 },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  dropdownButtonLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownButtonValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 2,
  },
  dropdownArrow: {
    fontSize: 14,
    color: colors.textMuted,
    marginLeft: spacing.xs,
  },
  dropdownArrowOpen: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    marginTop: spacing.xs,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.backgroundLight,
  },
  dropdownOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownOptionBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.background,
  },
  dropdownOptionActive: {
    backgroundColor: colors.background,
  },
  dropdownOptionText: {
    fontSize: 13,
    color: colors.black,
  },
  dropdownOptionTextActive: {
    fontWeight: '700',
    color: colors.primary,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    overflow: 'hidden',
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 3,
  },
  imageWrapper: {
    width: '100%',
    height: 170,
    backgroundColor: colors.backgroundLight,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  imageShade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.08)',
  },
  badge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -22,
    marginLeft: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  cardBody: {
    padding: spacing.lg,
  },
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  desc: {
    fontSize: 14,
    color: colors.black,
    opacity: 0.7,
    lineHeight: 20,
  },
  empty: { textAlign: 'center', opacity: 0.6 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginTop: spacing.md,
  },
});
