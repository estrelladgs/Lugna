import React, { useRef, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePostureSession } from '../../hooks/usePostureSession';
import FeedbackOverlay from '../../components/posture/FeedbackOverlay';
import SkeletonOverlay from '../../components/posture/SkeletonOverlay';
import { PostureStackParamList } from '../../navigation/PostureNavigator';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<PostureStackParamList, 'PostureCamera'>;
type Route = RouteProp<PostureStackParamList, 'PostureCamera'>;

export default function PostureCameraScreen() {
  const navigation = useNavigation<Nav>();
  const { params: { postureId } } = useRoute<Route>();
  const { activeSession, latestFeedback, begin, analyzeFrame, finish } = usePostureSession();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSession = useCallback(() => {
    begin(postureId);
    intervalRef.current = setInterval(async () => {
      if (!cameraRef.current) return;
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
        if (photo?.base64) await analyzeFrame(photo.base64);
      } catch {}
    }, 1500);
  }, [postureId, begin, analyzeFrame]);

  const stopSession = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    const session = await finish();
    if (session) {
      navigation.replace('PostureResult', { session });
    } else {
      navigation.goBack();
    }
  }, [finish, navigation]);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={[typography.body, styles.permissionText]}>
          Necesitamos acceso a la cámara para el análisis postural.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={typography.button}>Permitir cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="front" />

      {latestFeedback?.landmarks && <SkeletonOverlay landmarks={latestFeedback.landmarks} />}
      {latestFeedback && <FeedbackOverlay feedback={latestFeedback} />}

      <View style={styles.controls}>
        {!activeSession ? (
          <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.85}>
            <Text style={typography.button}>Iniciar sesión</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.stopBtn} onPress={stopSession} activeOpacity={0.85}>
            <Text style={[typography.button, { color: colors.white }]}>Finalizar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  permissionContainer: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionText: { textAlign: 'center', marginBottom: spacing.lg },
  permissionButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  controls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
  },
  startBtn: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: '#EF4444',
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
