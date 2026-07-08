import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import { getActivity, getProgress } from '../../services/homeService';
import { RachaIcon } from '../../components/icons/TabIcons';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';
import { showAlert } from '../../utils/alert';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'ProgressHome'>;

// ─── Donut Chart (small) ─────────────────────────────────────────────────────

function DonutChart({ percentage, size = 90 }: { percentage: number; size?: number }) {
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - Math.min(percentage, 100) / 100);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={colors.backgroundLight} strokeWidth={strokeWidth} fill="none"
      />
      <Circle
        cx={size / 2} cy={size / 2} r={r}
        stroke={colors.primary} strokeWidth={strokeWidth} fill="none"
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90, ${size / 2}, ${size / 2})`}
      />
      <SvgText
        x={size / 2} y={size / 2 + 6}
        textAnchor="middle" fontSize={16} fontWeight="700" fill={colors.black}
      >
        {Math.round(percentage)}%
      </SvgText>
    </Svg>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const updateUser = useAuthStore((s) => s.updateUser);
  const logout = useAuthStore((s) => s.logout);
  const scrollRef = useScrollToTopOnFocus<ScrollView>();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);

  const [streakDays, setStreakDays] = useState(0);
  const [percentage, setPercentage] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [lastProgramName, setLastProgramName] = useState<string | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    try {
      const [act, prog] = await Promise.all([getActivity(), getProgress()]);
      setStreakDays(act.streakDays);
      setPercentage(prog.percentage);
      setTotalSessions(prog.totalSessions);
      setLastProgramName(prog.lastProgramName);
    } catch { /* ignore */ } finally {
      setLoadingStats(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const updated = await authService.updateProfile(name.trim(), email.trim());
      await updateUser(updated);
    } catch {
      // API not available — update locally
      if (user) await updateUser({ ...user, name: name.trim(), email: email.trim() });
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setEditing(false);
  };

  const handleDeleteAccount = () => {
    showAlert(
      'Eliminar cuenta',
      '¿Estás segura de que quieres eliminar tu cuenta? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.deleteAccount();
              logout();
            } catch {
              showAlert('Error', 'No se ha podido eliminar la cuenta. Inténtalo de nuevo.');
            }
          },
        },
      ],
    );
  };

  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar & name header */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName} numberOfLines={1}>{user?.name ?? 'Usuario'}</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)} style={styles.editButton}>
            <Text style={styles.editButtonText}>Editar perfil</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Editable fields */}
      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Nombre</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        ) : (
          <Text style={styles.fieldValue}>{user?.name ?? '—'}</Text>
        )}

        <View style={styles.separator} />

        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        {editing ? (
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="done"
          />
        ) : (
          <Text style={styles.fieldValue}>{user?.email ?? '—'}</Text>
        )}

        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity onPress={handleCancelEdit} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color={colors.primary} />
                : <Text style={styles.saveBtnText}>Guardar</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {!editing && (
          <>
            <View style={styles.separator} />
            <TouchableOpacity onPress={() => navigation.navigate('ChangePassword')}>
              <Text style={styles.changePasswordLink}>Cambiar contraseña</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Stats */}
      <Text style={styles.sectionTitle}>Tu progreso</Text>
      <View style={styles.statsCard}>
        {loadingStats ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.streakRow}>
                  <Text style={styles.statNumber}>{streakDays}</Text>
                  <RachaIcon size={18} />
                </View>
                <Text style={styles.statLabel}>
                  día{streakDays !== 1 ? 's' : ''} seguido{streakDays !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <DonutChart percentage={percentage} size={70} />
                <Text style={styles.statLabel}>programas completados</Text>
              </View>
            </View>

            <View style={styles.statsSeparator} />

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalSessions}</Text>
                <Text style={styles.statLabel}>
                  postura{totalSessions !== 1 ? 's' : ''} corregida{totalSessions !== 1 ? 's' : ''}
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.lastProgramValue} numberOfLines={2}>
                  {lastProgramName ?? '—'}
                </Text>
                <Text style={styles.statLabel}>último programa</Text>
              </View>
            </View>
          </>
        )}
      </View>

      <TouchableOpacity
        style={styles.historyBtn}
        onPress={() => navigation.navigate('SessionHistory')}
        activeOpacity={0.85}
      >
        <Text style={styles.historyBtnText}>Ver historial de correcciones</Text>
      </TouchableOpacity>

      {/* Legal */}
      <Text style={styles.sectionTitle}>Legal</Text>
      <View style={styles.legalCard}>
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => navigation.navigate('PrivacyPolicy')}
          activeOpacity={0.7}
        >
          <Text style={styles.legalRowText}>Política de Privacidad</Text>
          <Text style={styles.legalRowChevron}>›</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity
          style={styles.legalRow}
          onPress={() => navigation.navigate('TermsOfUse')}
          activeOpacity={0.7}
        >
          <Text style={styles.legalRowText}>Condiciones de Uso</Text>
          <Text style={styles.legalRowChevron}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Account actions */}
      <View style={styles.actionsSection}>
        <TouchableOpacity onPress={logout} style={styles.logoutBtn} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={styles.deleteBtn}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteText}>Eliminar cuenta</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  editButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  editButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },

  // Info card
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.black,
    marginBottom: spacing.xs,
  },
  input: {
    fontSize: 18,
    fontWeight: '500',
    color: colors.black,
    borderBottomWidth: 1.5,
    borderBottomColor: colors.primary,
    paddingVertical: spacing.xs,
    marginBottom: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.15,
    marginVertical: spacing.xs,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.primary },
  saveBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    minWidth: 80,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: colors.background },
  changePasswordLink: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    textDecorationLine: 'underline',
  },

  // Stats
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    marginBottom: spacing.md,
    marginLeft: spacing.sm,
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  statItem: { alignItems: 'center', flex: 1 },
  streakRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  statNumber: { fontSize: 30, fontWeight: '800', color: colors.black },
  statLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: 2,
  },
  statDivider: {
    width: 2,
    height: 56,
    backgroundColor: colors.primary,
    opacity: 0.5,
  },
  statsSeparator: {
    height: 1,
    backgroundColor: colors.primary,
    opacity: 0.15,
    width: '100%',
    marginVertical: spacing.md,
  },
  lastProgramValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.black,
    textAlign: 'center',
  },
  historyBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  historyBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },

  // Legal
  legalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  legalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
  },
  legalRowText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.black,
  },
  legalRowChevron: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.textMuted,
  },

  // Account actions
  actionsSection: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  logoutBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  logoutText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  deleteBtn: {
    backgroundColor: 'transparent',
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    borderWidth: 1.5,
    borderColor: '#C0392B',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C0392B',
  },
});
