import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme';

export default function CodeAndPasswordStep({
  email,
  onSubmit,
  onResend,
  submitLabel = 'Cambiar contraseña',
}: {
  email: string;
  onSubmit: (code: string, newPassword: string) => Promise<void>;
  onResend: () => Promise<void>;
  submitLabel?: string;
}) {
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim() || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(code.trim(), newPassword);
    } catch {
      Alert.alert('Error', 'Código inválido o caducado. Solicita uno nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      Alert.alert('Código reenviado', `Hemos enviado un nuevo código a ${email}.`);
    } catch {
      Alert.alert('Error', 'No se pudo reenviar el código. Inténtalo de nuevo.');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.form}>
      <Text style={styles.helper}>
        Hemos enviado un código de verificación a {email}. Introdúcelo junto con tu nueva contraseña.
      </Text>

      <Text style={[typography.label, styles.labelIndent]}>Código de verificación</Text>
      <TextInput
        style={styles.input}
        placeholder="000000"
        placeholderTextColor={colors.textMuted}
        value={code}
        onChangeText={setCode}
        keyboardType="number-pad"
        maxLength={6}
      />

      <Text style={[typography.label, styles.fieldLabel, styles.labelIndent]}>Nueva contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Inserta tu nueva contraseña"
        placeholderTextColor={colors.textMuted}
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
      />

      <Text style={[typography.label, styles.fieldLabel, styles.labelIndent]}>Repetir contraseña</Text>
      <TextInput
        style={styles.input}
        placeholder="Repite la nueva contraseña"
        placeholderTextColor={colors.textMuted}
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        activeOpacity={0.85}
        disabled={submitting}
      >
        {submitting
          ? <ActivityIndicator color={colors.primary} />
          : <Text style={typography.button}>{submitLabel}</Text>
        }
      </TouchableOpacity>

      <TouchableOpacity onPress={handleResend} disabled={resending} style={styles.resendBtn}>
        <Text style={styles.resendText}>
          {resending ? 'Reenviando…' : '¿No te ha llegado? Reenviar código'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.xs },
  helper: {
    fontSize: 14,
    color: colors.black,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
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
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  resendBtn: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  resendText: {
    fontSize: 13,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
