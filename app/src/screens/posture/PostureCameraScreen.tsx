import React, { useRef, useCallback, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { usePostureSession } from '../../hooks/usePostureSession';
import FeedbackOverlay from '../../components/posture/FeedbackOverlay';
import SkeletonOverlay from '../../components/posture/SkeletonOverlay';
import { PostureStackParamList } from '../../navigation/PostureNavigator';
import { POSTURE_GUIDES } from '../../constants/postureGuides';
import { colors, spacing, radius, typography } from '../../theme';

type Nav = NativeStackNavigationProp<PostureStackParamList, 'PostureCamera'>;
type Route = RouteProp<PostureStackParamList, 'PostureCamera'>;

export default function PostureCameraScreen() {
  const navigation = useNavigation<Nav>();
  const { params: { postureId, postureName } } = useRoute<Route>();
  const { activeSession, latestFeedback, analysisError, frameStats, begin, analyzeFrame, finish } = usePostureSession();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [showGuide, setShowGuide] = useState(true);
  const [pictureSize, setPictureSize] = useState<string | undefined>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCorrectRef = useRef<boolean | null>(null);
  const cameraReadyRef = useRef(false);
  const [cameraReadyDisplay, setCameraReadyDisplay] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const successPlayer = useAudioPlayer(require('../../../assets/sounds/success.wav'));
  const errorPlayer = useAudioPlayer(require('../../../assets/sounds/error.wav'));

  const guide = POSTURE_GUIDES[postureId];

  useEffect(() => {
    if (!latestFeedback) return;
    const prev = prevCorrectRef.current;
    if (prev !== null && prev !== latestFeedback.isCorrect) {
      const player = latestFeedback.isCorrect ? successPlayer : errorPlayer;
      player.seekTo(0);
      player.play();
    }
    prevCorrectRef.current = latestFeedback.isCorrect;
  }, [latestFeedback, successPlayer, errorPlayer]);

  const handleCameraReady = useCallback(() => {
    cameraReadyRef.current = true;
    setCameraReadyDisplay(true);
    (async () => {
      try {
        const sizes = await cameraRef.current?.getAvailablePictureSizesAsync();
        const parsed = (sizes ?? [])
          .map((s) => {
            const match = /^(\d+)x(\d+)$/.exec(s);
            return match ? { value: s, area: parseInt(match[1], 10) * parseInt(match[2], 10), minSide: Math.min(parseInt(match[1], 10), parseInt(match[2], 10)) } : null;
          })
          .filter((s): s is { value: string; area: number; minSide: number } => s !== null)
          .sort((a, b) => a.area - b.area);
        // Prefer the smallest size that still keeps enough detail for pose detection (>=480px on the short side).
        const chosen = parsed.find((s) => s.minSide >= 480) ?? parsed[0];
        if (chosen) setPictureSize(chosen.value);
      } catch {
        // keep default (full) resolution if sizes can't be queried
      }
    })();
  }, []);

  const startSession = useCallback(() => {
    setShowGuide(false);
    prevCorrectRef.current = null;
    setCaptureError(null);
    begin(postureId);
    intervalRef.current = setInterval(async () => {
      if (!cameraRef.current) {
        setCaptureError('La cámara todavía no está lista (sin referencia).');
        return;
      }
      try {
        const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
        if (!photo?.base64) {
          setCaptureError('La captura no devolvió datos de imagen (base64 vacío).');
          return;
        }
        setCaptureError(null);
        await analyzeFrame(photo.base64);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setCaptureError(`Fallo al capturar foto: ${message}`);
        console.warn('[posture] takePictureAsync failed', err);
      }
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

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!permission) return <View style={styles.container} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={[typography.h3, styles.permissionTitle]}>Acceso a la cámara</Text>
        <Text style={[typography.body, styles.permissionText]}>
          Para corregir tu postura en "{postureName}" necesitamos acceder a la cámara frontal.
          La imagen se analiza en tiempo real en tu dispositivo y en nuestro servidor únicamente
          para detectar los puntos de tu cuerpo: no se guarda ni se comparte con nadie.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission} activeOpacity={0.85}>
          <Text style={typography.button}>Entendido, activar cámara</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        pictureSize={pictureSize}
        onCameraReady={handleCameraReady}
      />

      {!showGuide && latestFeedback?.landmarks && (
        <SkeletonOverlay
          landmarks={latestFeedback.landmarks}
          incorrectLandmarks={latestFeedback.incorrectLandmarks}
        />
      )}
      {!showGuide && latestFeedback && <FeedbackOverlay feedback={latestFeedback} />}
      {!showGuide && (
        <View style={styles.statusBanner}>
          <Text style={[typography.caption, styles.statusText]}>
            Cámara: {cameraReadyDisplay ? 'lista' : 'iniciando…'} · Fotogramas: {frameStats.sent} (✓{frameStats.ok} / ✗{frameStats.failed})
          </Text>
        </View>
      )}
      {!showGuide && (captureError || analysisError) && (
        <View style={styles.errorBanner}>
          <Text style={[typography.caption, styles.errorText]}>{captureError ?? analysisError}</Text>
        </View>
      )}

      {showGuide && (
        <View style={styles.guideOverlay}>
          <View style={styles.guideCard}>
            <Text style={[typography.h3, styles.guideTitle]}>{postureName}</Text>
            <Text style={[typography.body, styles.guideText]}>{guide.cameraPosition}</Text>
            {guide.tips.map((tip, i) => (
              <Text key={i} style={[typography.caption, styles.guideTip]}>• {tip}</Text>
            ))}
            <TouchableOpacity style={styles.startBtn} onPress={startSession} activeOpacity={0.85}>
              <Text style={typography.button}>Comenzar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!showGuide && (
        <View style={styles.controls}>
          <TouchableOpacity style={styles.stopBtn} onPress={stopSession} activeOpacity={0.85}>
            <Text style={[typography.button, { color: colors.white }]}>Finalizar</Text>
          </TouchableOpacity>
        </View>
      )}
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
  permissionTitle: { marginBottom: spacing.md, textAlign: 'center' },
  permissionText: { textAlign: 'center', marginBottom: spacing.lg },
  permissionButton: {
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.pill,
  },
  guideOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  guideCard: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '100%',
  },
  guideTitle: { marginBottom: spacing.sm, textTransform: 'capitalize' },
  guideText: { marginBottom: spacing.md },
  guideTip: { marginBottom: spacing.xs },
  startBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: spacing.xxl,
    left: spacing.xl,
    right: spacing.xl,
  },
  statusBanner: {
    position: 'absolute',
    top: spacing.xxl,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  statusText: {
    color: colors.white,
    textAlign: 'center',
  },
  errorBanner: {
    position: 'absolute',
    top: spacing.xxl + 40,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.alert,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    color: colors.white,
    textAlign: 'center',
  },
  stopBtn: {
    backgroundColor: colors.black,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
