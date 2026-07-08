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
import { GoogleSignin, isErrorWithCode, statusCodes } from '../../services/googleSignIn';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { getErrorMessage } from '../../utils/errors';
import { showAlert } from '../../utils/alert';
import { useScrollToTopOnFocus } from '../../hooks/useScrollToTopOnFocus';
import { colors, spacing, radius, typography } from '../../theme';

type RootParamList = { Register: undefined; Login: undefined };

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const setUser = useAuthStore((s) => s.setUser);
  const scrollRef = useScrollToTopOnFocus<ScrollView>();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) {
        return;
      }
      const { user, tokens } = await authService.googleLogin(response.data.idToken);
      await setUser(user, tokens);
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Error', getErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showAlert('Error', 'Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      showAlert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authService.register({ name, email, password });
      await setUser(user, tokens);
    } catch (err) {
      showAlert('Error', getErrorMessage(err, 'No se pudo crear la cuenta. Inténtalo de nuevo.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[typography.h1, styles.title]}>Crea tu cuenta</Text>

        <View style={styles.form}>
          <Text style={[typography.label, styles.labelIndent]}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Inserta tu nombre"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <Text style={[typography.label, styles.fieldLabel, styles.labelIndent]}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Inserta tu email"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={[typography.label, styles.fieldLabel, styles.labelIndent]}>Contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Inserta tu contraseña"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[typography.label, styles.fieldLabel, styles.labelIndent]}>Repetir contraseña</Text>
          <TextInput
            style={styles.input}
            placeholder="Repite la contraseña"
            placeholderTextColor={colors.textMuted}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <Text style={styles.loginText}>
          Ya tengo cuenta.{' '}
          <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            Iniciar Sesión
          </Text>
        </Text>

        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            activeOpacity={0.8}
            onPress={handleGoogleLogin}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.socialIcon}>G</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={handleRegister}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={typography.button}>Registrarme</Text>
          )}
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={[styles.dot, i === 3 ? styles.dotActive : styles.dotInactive]} />
          ))}
        </View>
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
  title: { marginBottom: spacing.lg, textAlign: 'center', fontSize: 40, fontWeight: '700' },
  form: { gap: spacing.xs },
  fieldLabel: { marginTop: spacing.md },
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
  loginText: {
    marginTop: spacing.lg,
    fontSize: 13,
    color: colors.black,
    textAlign: 'center',
  },
  loginLink: {
    textDecorationLine: 'underline',
    fontWeight: '600',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  socialButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { fontSize: 22, fontWeight: '700' },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.dotActive, width: 20 },
  dotInactive: { backgroundColor: colors.background, borderWidth: 0.5, borderColor: colors.primary },
});
