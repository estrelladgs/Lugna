import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { authService } from '../../services/authService';
import { useAuthStore } from '../../store/authStore';
import { colors, spacing, radius, typography } from '../../theme';

type RootParamList = { Register: undefined; Login: undefined };

export default function RegisterScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const setUser = useAuthStore((s) => s.setUser);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    await setUser(
      { id: 'demo', name: 'Demo Usuario', email: 'demo@lugna.app', createdAt: new Date().toISOString() },
      { accessToken: 'demo-token', refreshToken: 'demo-refresh' }
    );
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authService.register({ name, email, password });
      await setUser(user, tokens);
    } catch {
      Alert.alert('Error', 'No se pudo crear la cuenta. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[typography.h2, styles.title]}>Crea tu cuenta</Text>

      <View style={styles.form}>
        <Text style={typography.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          placeholder="Inserta tu nombre"
          placeholderTextColor={colors.textMuted}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <Text style={[typography.label, styles.fieldLabel]}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Inserta tu email"
          placeholderTextColor={colors.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={[typography.label, styles.fieldLabel]}>Contraseña</Text>
        <TextInput
          style={styles.input}
          placeholder="Inserta tu contraseña"
          placeholderTextColor={colors.textMuted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Text style={[typography.label, styles.fieldLabel]}>Repetir contraseña</Text>
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
        <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
          <Text style={styles.socialIcon}>G</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.socialButton} activeOpacity={0.8}>
          <Text style={styles.socialIcon}></Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={typography.button}>Registrarme</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin} activeOpacity={0.7}>
        <Text style={styles.demoText}>Entrar en modo demo (sin backend)</Text>
      </TouchableOpacity>

      <View style={styles.dotsRow}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, i === 3 ? styles.dotActive : styles.dotInactive]} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.lg,
    paddingBottom: spacing.xxl,
  },
  title: { marginBottom: spacing.lg },
  form: { gap: spacing.xs },
  fieldLabel: { marginTop: spacing.md },
  input: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontSize: 15,
    color: colors.black,
    marginTop: spacing.xs,
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
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: { fontSize: 22, fontWeight: '700' },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  demoButton: {
    marginTop: spacing.md,
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  demoText: {
    fontSize: 13,
    color: colors.textMuted,
    textDecorationLine: 'underline',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotActive: { backgroundColor: colors.dotActive, width: 20 },
  dotInactive: { backgroundColor: colors.dotInactive },
});
