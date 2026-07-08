import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { authService } from '../../services/authService';
import CodeAndPasswordStep from '../../components/auth/CodeAndPasswordStep';
import { ProgressStackParamList } from '../../navigation/ProgressNavigator';
import { showAlert } from '../../utils/alert';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<ProgressStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const email = user?.email ?? '';

  const [step, setStep] = useState<'request' | 'code' | 'success'>('request');
  const [sending, setSending] = useState(false);
  const scrollRef = useScrollToTopOnFocus<ScrollView>();

  const handleSendCode = async () => {
    setSending(true);
    try {
      await authService.forgotPassword(email);
      setStep('code');
    } catch {
      showAlert('Error', 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleChangePassword = async (code: string, newPassword: string) => {
    await authService.resetPassword(email, code, newPassword);
    setStep('success');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={[typography.h2, styles.title]}>Cambiar contraseña</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 'request' ? (
          <View style={styles.card}>
            <Text style={styles.helper}>
              Para cambiar tu contraseña te enviaremos un código de verificación a tu correo
              registrado: {email}
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={handleSendCode}
              activeOpacity={0.85}
              disabled={sending}
            >
              {sending
                ? <ActivityIndicator color={colors.primary} />
                : <Text style={typography.button}>Enviar código</Text>
              }
            </TouchableOpacity>
          </View>
        ) : step === 'code' ? (
          <View style={styles.card}>
            <CodeAndPasswordStep
              email={email}
              onSubmit={handleChangePassword}
              onResend={() => authService.forgotPassword(email).then(() => undefined)}
              submitLabel="Cambiar contraseña"
            />
          </View>
        ) : (
          <View style={styles.card}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>¡Contraseña actualizada!</Text>
            <Text style={[styles.helper, { textAlign: 'center' }]}>
              Tu contraseña se ha cambiado correctamente. Ya puedes usarla la próxima vez que
              inicies sesión.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.goBack()}
              activeOpacity={0.85}
            >
              <Text style={typography.button}>Volver a mi perfil</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingTop: spacing.xxl + spacing.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  backButtonText: { fontSize: 30, fontWeight: '700', color: colors.black, lineHeight: 32 },
  title: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.lg,
    shadowColor: colors.backgroundLight,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 2,
  },
  helper: {
    fontSize: 15,
    lineHeight: 21,
    color: colors.black,
    marginBottom: spacing.lg,
  },
  button: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  successIcon: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.scoreHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  successIconText: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.black,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
});
