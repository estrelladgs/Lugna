import React, { useState } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { GoogleSignin, isErrorWithCode, statusCodes } from '../../services/googleSignIn';
import { getErrorMessage } from '../../utils/errors';
import { showAlert } from '../../utils/alert';
import { colors } from '../../theme';

type Props = {
  onCredential: (idToken: string) => Promise<void>;
};

export default function GoogleAuthButton({ onCredential }: Props) {
  const [loading, setLoading] = useState(false);

  const handlePress = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (response.type !== 'success' || !response.data.idToken) {
        return;
      }
      await onCredential(response.data.idToken);
    } catch (err) {
      if (!isErrorWithCode(err) || err.code !== statusCodes.SIGN_IN_CANCELLED) {
        showAlert('Error', getErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.icon}>G</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: { fontSize: 22, fontWeight: '700' },
});
