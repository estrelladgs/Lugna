import React, { useEffect, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { getErrorMessage } from '../../utils/errors';
import { showAlert } from '../../utils/alert';
import { colors } from '../../theme';

type Props = {
  onCredential: (idToken: string) => Promise<void>;
};

const CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

declare global {
  interface Window {
    google?: any;
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('No se pudo cargar Google Identity Services.'));
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export default function GoogleAuthButton({ onCredential }: Props) {
  const containerRef = useRef<View>(null);
  const [loading, setLoading] = useState(false);
  const onCredentialRef = useRef(onCredential);
  onCredentialRef.current = onCredential;

  useEffect(() => {
    if (!CLIENT_ID) {
      console.warn('Falta EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: el login con Google no funcionará en web.');
      return;
    }

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        const node = containerRef.current as unknown as HTMLElement | null;
        if (cancelled || !node) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: { credential: string }) => {
            setLoading(true);
            try {
              await onCredentialRef.current(response.credential);
            } catch (err) {
              showAlert('Error', getErrorMessage(err, 'No se pudo iniciar sesión con Google.'));
            } finally {
              setLoading(false);
            }
          },
        });
        window.google.accounts.id.renderButton(node, {
          type: 'icon',
          shape: 'circle',
          theme: 'outline',
          size: 'large',
        });
      })
      .catch((err) => console.warn(err));

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <View style={styles.wrapper}>
      <View ref={containerRef} style={styles.buttonSlot} />
      {loading && (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
  },
  buttonSlot: {
    width: 52,
    height: 52,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
