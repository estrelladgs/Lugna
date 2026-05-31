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

type RootParamList = { Login: undefined; Register: undefined };

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    await setUser(
      { id: 'demo', name: 'Demo Usuario', email: 'demo@lugna.app', createdAt: new Date().toISOString() },
      { accessToken: 'demo-token', refreshToken: 'demo-refresh' }
    );
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }
    setLoading(true);
    try {
      const { user, tokens } = await authService.login({ email, password });
      await setUser(user, tokens);
    } catch {
      Alert.alert('Error', 'Email o contraseña incorrectos.');
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
      <Text style={[typography.h2, styles.title]}>Iniciar Sesión</Text>

      <View style={styles.form}>
        <Text style={typography.label}>Email</Text>
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
      </View>

      <Text style={styles.registerText}>
        ¿No tienes cuenta?{' '}
        <Text style={styles.registerLink} onPress={() => navigation.navigate('Register')}>
          Regístrate
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
        onPress={handleLogin}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.black} />
        ) : (
          <Text style={typography.button}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.demoButton} onPress={handleDemoLogin} activeOpacity={0.7}>
        <Text style={styles.demoText}>Entrar en modo demo (sin backend)</Text>
      </TouchableOpacity>
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
  registerText: {
    marginTop: spacing.lg,
    fontSize: 13,
    color: colors.black,
    textAlign: 'center',
  },
  registerLink: {
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
});
