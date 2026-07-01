import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../../store/authStore';
import { AppTabParamList } from '../../navigation/AppNavigator';
import { colors, radius, spacing, typography } from '../../theme';
import { RachaIcon } from '../../components/icons/TabIcons';
import {
  ActivityData,
  ContinueRoutine,
  LiveClass,
  ProgressData,
  getActivity,
  getContinueRoutine,
  getLiveClasses,
  getProgress,
} from '../../services/homeService';

type Nav = BottomTabNavigationProp<AppTabParamList>;

// ─── Donut Chart ─────────────────────────────────────────────────────────────

function DonutChart({ percentage, size = 110 }: { percentage: number; size?: number }) {
  const strokeWidth = 14;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percentage, 100) / 100);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.backgroundLight}
        strokeWidth={strokeWidth}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={colors.black}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
      <SvgText
        x={size / 2}
        y={size / 2 + 7}
        textAnchor="middle"
        fontSize={20}
        fontWeight="700"
        fill={colors.black}
      >
        {Math.round(percentage)}%
      </SvgText>
    </Svg>
  );
}

// ─── Mini Calendar ────────────────────────────────────────────────────────────

const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function MiniCalendar({ activeDays }: { activeDays: string[] }) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const today = now.getDate();

  const activeSet = useMemo(() => new Set(activeDays), [activeDays]);

  const firstDayOfMonth = new Date(year, month, 1);
  // getDay() returns 0=Sun...6=Sat; convert to Mon-based (0=Mon...6=Sun)
  const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = firstDayOfMonth.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null);

  const isoDate = (day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  return (
    <View>
      <Text style={styles.calendarMonth}>{monthName}</Text>
      {/* Day headers */}
      <View style={styles.calendarRow}>
        {DAY_NAMES.map((d) => (
          <Text key={d} style={styles.calendarDayName}>{d}</Text>
        ))}
      </View>
      {/* Day grid */}
      {Array.from({ length: cells.length / 7 }, (_, row) => (
        <View key={row} style={styles.calendarRow}>
          {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
            if (!day) return <View key={col} style={styles.calendarCell} />;
            const isActive = activeSet.has(isoDate(day));
            const isToday = day === today;
            return (
              <View
                key={col}
                style={[
                  styles.calendarCell,
                  isActive && styles.calendarCellActive,
                  isToday && !isActive && styles.calendarCellToday,
                ]}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    isActive && styles.calendarDayTextActive,
                    isToday && !isActive && styles.calendarDayTextToday,
                  ]}
                >
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Live Class Card ─────────────────────────────────────────────────────────

function LiveClassCard({ item }: { item: LiveClass }) {
  const date = new Date(item.scheduledAt);
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity
      style={styles.liveCard}
      activeOpacity={item.enlace ? 0.7 : 1}
      onPress={() => item.enlace && Linking.openURL(item.enlace)}
      disabled={!item.enlace}
    >
      <Text style={styles.liveCardTitle} numberOfLines={1}>
        {item.title} – {time}
      </Text>
      <Text style={styles.liveCardInstructor} numberOfLines={1}>
        {item.instructorName}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Continue Routine Card ────────────────────────────────────────────────────

function ContinueCard({
  routine,
  onPress,
}: {
  routine: ContinueRoutine;
  onPress: () => void;
}) {
  const filled = Math.min(Math.max(routine.progressPercent, 0), 1);

  return (
    <TouchableOpacity style={styles.continueCard} onPress={onPress} activeOpacity={0.85}>
      <Text style={styles.continueSectionTitle}>Continuar entrenamiento</Text>
      <View style={styles.continueRow}>
        <View style={styles.yogaIconWrapper}>
          <Image source={require('../../../assets/onboarding1.png')} style={styles.yogaImage} resizeMode="cover" />
        </View>
        <View style={styles.continueInfo}>
          <Text style={styles.continueTitle} numberOfLines={2}>
            {routine.name}
          </Text>
          <Text style={styles.continueDuration}>{routine.durationMinutes} min</Text>
        </View>
      </View>
      {/* Progress bar */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${Math.round(filled * 100)}%` }]} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);

  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [activity, setActivity] = useState<ActivityData>({ activeDays: [], streakDays: 0 });
  const [progress, setProgress] = useState<ProgressData>({ completedLevels: 0, totalLevels: 8, percentage: 0 });
  const [continueRoutine, setContinueRoutine] = useState<ContinueRoutine | null>(null);

  const load = useCallback(async () => {
    try {
      const [classes, act, prog, cont] = await Promise.all([
        getLiveClasses(),
        getActivity(),
        getProgress(),
        getContinueRoutine(),
      ]);
      setLiveClasses(classes);
      setActivity(act);
      setProgress(prog);
      setContinueRoutine(cont);
    } catch {
      // backend not available — keep empty defaults
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const firstName = user?.name?.split(' ')[0] ?? 'alumna';

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.greeting}>¡Hola, {firstName}!</Text>
      </View>

      {/* Continue card — overlaps bottom half of header */}
      <View style={styles.continueCardWrapper}>
        {continueRoutine && continueRoutine.id ? (
          <ContinueCard
            routine={continueRoutine}
            onPress={() => navigation.navigate('Routines')}
          />
        ) : (
          <TouchableOpacity
            style={styles.continueCard}
            onPress={() => navigation.navigate('Routines')}
            activeOpacity={0.85}
          >
            <Text style={styles.continueSectionTitle}>Continuar entrenamiento</Text>
            <Text style={[typography.body, { opacity: 0.6 }]}>
              Explora tus rutinas de pilates
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.body}>
        {/* Live classes */}
        <Text style={styles.sectionTitle}>Próximas clases en directo</Text>
        {liveClasses.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
            style={styles.carousel}
          >
            {liveClasses.map((item) => (
              <LiveClassCard key={item.id} item={item} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyLive}>
            <Text style={[typography.body, { opacity: 0.5 }]}>No hay clases programadas</Text>
          </View>
        )}

        {/* Progress */}
        <Text style={styles.sectionTitle}>Tu progreso</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressRow}>
            {/* Calendar */}
            <View style={styles.progressHalf}>
              <MiniCalendar activeDays={activity.activeDays} />
              <View style={styles.streakRow}>
                <Text style={styles.streakText}>
                  {activity.streakDays} día{activity.streakDays !== 1 ? 's' : ''} seguido{activity.streakDays !== 1 ? 's' : ''} de actividad
                </Text>
                <RachaIcon size={13} />
              </View>
            </View>

            {/* Donut chart */}
            <View style={styles.progressHalf}>
              <View style={styles.donutWrapper}>
                <DonutChart percentage={progress.percentage} />
              </View>
              <Text style={styles.levelsText}>
                {Math.round(progress.percentage)}% de los niveles completados
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: { paddingBottom: 0 },

  // Header
  header: {
    backgroundColor: colors.header,
    paddingTop: 56,
    paddingHorizontal: spacing.lg,
    paddingBottom: 90,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
  },
  greeting: {
    fontSize: 30,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  continueSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.sm,
  },

  // Body
  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Continue card
  continueCardWrapper: {
    marginHorizontal: spacing.lg,
    marginTop: -75,
    marginBottom: spacing.sm,
  },
  continueCard: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.lg,
    shadowColor: '#99BDDF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.80,
    shadowRadius: 6,
    elevation: 4,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  yogaIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: radius.sm,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    overflow: 'hidden',
  },
  yogaImage: {
    width: '100%',
    height: '100%',
  },
  continueInfo: { flex: 1 },
  continueTitle: {
    fontSize: 17,
    fontWeight: '400',
    color: colors.black,
    lineHeight: 22,
  },
  continueDuration: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.backgroundLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 8,
    backgroundColor: colors.scoreHigh,
    borderRadius: 3,
  },

  // Section title
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.black,
    marginBottom: spacing.sm,
  },

  // Live classes carousel
  carousel: { marginBottom: spacing.lg },
  carouselContent: { paddingRight: spacing.lg, gap: spacing.sm },
  liveCard: {
    backgroundColor: colors.backgroundLight,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    justifyContent: 'center',
  },
  liveCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.black,
    marginBottom: 4,
  },
  liveCardInstructor: {
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyLive: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  // Progress section
  progressCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.backgroundLight,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.lg,
  },
  progressRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  progressHalf: {
    flex: 1,
    alignItems: 'center',
  },
  donutWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: 6,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
  },
  levelsText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.black,
    textAlign: 'center',
    marginTop: 8,
  },

  // Calendar
  calendarMonth: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.black,
    textTransform: 'capitalize',
    marginBottom: 4,
    textAlign: 'center',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarCell: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 1,
  },
  calendarCellActive: {
    backgroundColor: colors.black,
    borderRadius: 11,
  },
  calendarCellToday: {
    borderWidth: 1,
    borderColor: colors.black,
    borderRadius: 11,
  },
  calendarDayName: {
    width: 22,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  calendarDayText: {
    fontSize: 10,
    color: colors.black,
  },
  calendarDayTextActive: {
    color: colors.white,
    fontWeight: '700',
  },
  calendarDayTextToday: {
    color: colors.black,
    fontWeight: '700',
  },
});
