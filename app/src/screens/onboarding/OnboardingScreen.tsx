import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  useWindowDimensions,
} from 'react-native';
import { Asset } from 'expo-asset';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';

const TOTAL_PAGES = 4;

const ONBOARDING_IMAGES = [
  require('../../../assets/Logo.png'),
  require('../../../assets/onboarding1.png'),
  require('../../../assets/onboarding2.png'),
  require('../../../assets/onboarding3.png'),
];

type RootParamList = { Onboarding: undefined; Register: undefined; Login: undefined };

// ─── Slide 1: Logo → Imagen → Título ────────────────────────────────────────

function SlideOne({ width }: { width: number }) {
  return (
    <View style={styles.slide}>
      <Image
        source={require('../../../assets/Logo.png')}
        style={{ width: width * 0.38, height: 72 }}
        resizeMode="contain"
      />
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/onboarding1.png')}
          style={{ width: width * 0.6, height: width * 0.6 }}
          resizeMode="contain"
        />
      </View>
      <Text style={[typography.h1, styles.titleBottom]}>
        {'Bienvenido a tu\nviaje de Pilates'}
      </Text>
    </View>
  );
}

// ─── Slide 2: Título → Texto → Imagen ───────────────────────────────────────

function SlideTwo({ width }: { width: number }) {
  return (
    <View style={styles.slide}>
      <Text style={[typography.h1, styles.titleTop]}>¿Qué es Pilates?</Text>
      <Text style={[typography.body, styles.body]}>
        Descubre un método que conecta cuerpo y mente. Fortalece tu centro de energía, mejora tu
        postura, gana flexibilidad y coordinación, y siente cómo cada movimiento transforma tu
        bienestar. ¡Tu viaje hacia un cuerpo más fuerte y ágil comienza aquí!
      </Text>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/onboarding2.png')}
          style={{ width: width * 0.6, height: width * 0.6 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

// ─── Slide 3: Título → Imagen → Texto ───────────────────────────────────────

function SlideThree({ width }: { width: number }) {
  return (
    <View style={styles.slide}>
      <Text style={[typography.h1, styles.titleTop]}>
        {'IA para tu\ncorrección postural'}
      </Text>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/onboarding3.png')}
          style={{ width: width * 0.6, height: width * 0.6 }}
          resizeMode="contain"
        />
      </View>
      <Text style={[typography.body, styles.body]}>
        Nuestra tecnología analiza tu postura al instante, detectando desalineaciones y
        desequilibrios musculares. Corrige hábitos incorrectos, previene lesiones y reduce dolores
        musculoesqueléticos mientras entrenas.
      </Text>
    </View>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Asset.loadAsync(ONBOARDING_IMAGES)
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAssetsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleNext = () => {
    if (currentIndex === 2) {
      navigation.replace('Register');
    } else {
      setCurrentIndex(currentIndex + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {assetsReady && (
        <>
          {currentIndex === 0 && <SlideOne width={width} />}
          {currentIndex === 1 && <SlideTwo width={width} />}
          {currentIndex === 2 && <SlideThree width={width} />}
        </>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{currentIndex === 0 ? 'Empezar' : 'Siguiente'}</Text>
        </TouchableOpacity>

        <View style={styles.dotsRow}>
          {[...Array(TOTAL_PAGES)].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  titleTop: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  titleBottom: {
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  body: {
    textAlign: 'center',
    color: colors.black,
    opacity: 0.75,
    marginBottom: spacing.sm,
  },
  footer: {
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  button: {
    width: '100%',
    backgroundColor: colors.backgroundLight,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.primary,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: spacing.xs + 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: colors.dotActive,
    width: 20,
  },
  dotInactive: {
    backgroundColor: colors.dotInactive,
  },
});
