import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  Image,
  ListRenderItemInfo,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, radius, typography } from '../../theme';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  title: string;
  body: string;
  image: any;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    title: 'Bienvenido a tu\nviaje de Pilates',
    body: '',
    image: require('../../../assets/onboarding1.png'),
  },
  {
    id: '2',
    title: '¿Qué es Pilates?',
    body: 'Descubre un método que conecta cuerpo y mente. Fortalece tu centro de energía, mejora tu postura, gana flexibilidad y coordinación, y siente cómo cada movimiento transforma tu bienestar. ¡Tu viaje hacia un cuerpo más fuerte y ágil comienza aquí!',
    image: require('../../../assets/onboarding2.png'),
  },
  {
    id: '3',
    title: 'IA para tu\ncorrección postural',
    body: 'Nuestra tecnología analiza tu postura al instante, detectando desalineaciones y desequilibrios musculares. Corrige hábitos incorrectos, previene lesiones y reduce dolores musculoesqueléticos mientras entrenas.',
    image: require('../../../assets/onboarding3.png'),
  },
];

type RootParamList = { Onboarding: undefined; Register: undefined; Login: undefined };

export default function OnboardingScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootParamList>>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<Slide>>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigation.replace('Register');
    } else {
      const next = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: next });
      setCurrentIndex(next);
    }
  };

  const renderItem = ({ item }: ListRenderItemInfo<Slide>) => (
    <View style={styles.slide}>
      <View style={styles.imageContainer}>
        <Image source={item.image} style={styles.illustration} resizeMode="contain" />
      </View>
      <Text style={[typography.h2, styles.title]}>{item.title}</Text>
      {item.body ? <Text style={[typography.body, styles.body]}>{item.body}</Text> : null}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={styles.footer}>
        <View style={styles.dotsRow}>
          {[...Array(SLIDES.length)].map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext} activeOpacity={0.85}>
          <Text style={typography.button}>{currentIndex === 0 ? 'Empezar' : 'Siguiente'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  slide: {
    width,
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl + spacing.xl,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  illustration: {
    width: width * 0.55,
    height: width * 0.55,
  },
  title: {
    textAlign: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  body: {
    textAlign: 'center',
    color: colors.black,
    opacity: 0.75,
  },
  footer: {
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    gap: spacing.lg,
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
  button: {
    width: '100%',
    backgroundColor: colors.white,
    paddingVertical: spacing.md + 2,
    borderRadius: radius.pill,
    alignItems: 'center',
  },
});
