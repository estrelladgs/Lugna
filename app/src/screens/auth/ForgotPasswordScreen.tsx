import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../../services/authService';
import CodeAndPasswordStep from '../../components/auth/CodeAndPasswordStep';
import { showAlert } from '../../utils/alert';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';
import { colors, spacing, radius, typography } from '../../theme';

type RootParamList = { Login: undefined; ForgotPassword: undefined };

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const [step, setStep] = useState<'email' | 'code' | 'success'>('email');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useScrollToTopOnFocus<ScrollView>();

  const handleSendCode = async () => {
    if (!email.trim()) {
      showAlert('Error', 'Introduce tu correo electrónico.');
      return;
    }
    setSending(true);
    try {
      await authService.forgotPassword(email.trim());
      setStep('code');
    } catch {
      showAlert('Error', 'No se pudo enviar el código. Inténtalo de nuevo.');
    } finally {
      setSending(false);
    }
  };

  const handleReset = async (code: string, newPassword: string) => {
    await authService.resetPassword(email.trim(), code, newPassword);
    setStep('success');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.h1, styles.title]}>Recuperar contraseña</Text>

        {step === 'email' ? (
          <View style={styles.form}>
            <Text style={styles.helper}>
              Introduce el correo con el que te registraste. Te enviaremos un código de verificación
              para restablecer tu contraseña.
            </Text>
            <Text style={[typography.label, styles.labelIndent]}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Inserta tu email"
              placeholderTextColor={colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

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
          <CodeAndPasswordStep
            email={email.trim()}
            onSubmit={handleReset}
            onResend={() => authService.forgotPassword(email.trim()).then(() => undefined)}
            submitLabel="Restablecer contraseña"
          />
        ) : (
          <View style={styles.form}>
            <View style={styles.successIcon}>
              <Text style={styles.successIconText}>✓</Text>
            </View>
            <Text style={styles.successTitle}>¡Contraseña restablecida!</Text>
            <Text style={[styles.helper, { textAlign: 'center' }]}>
              Ya puedes iniciar sesión con tu nueva contraseña.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={typography.button}>Ir a iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        )}

        {step !== 'success' && (
          <Text style={styles.loginText}>
            ¿Ya la recuerdas?{' '}
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Iniciar Sesión
            </Text>
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.backgroundLight },
  scroll: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  title: { marginBottom: spacing.lg, textAlign: 'center', fontSize: 34, fontWeight: '700' },
  form: { gap: spacing.xs },
  helper: {
    fontSize: 14,
    color: colors.black,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  labelIndent: { paddingLeft: spacing.md },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    color: colors.black,
    marginTop: 2,
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  loginText: {
    marginTop: spacing.xl,
    fontSize: 13,
    color: colors.black,
    textAlign: 'center',
  },
  loginLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
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
