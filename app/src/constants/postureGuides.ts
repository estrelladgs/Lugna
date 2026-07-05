import { PostureId } from '../types';

export interface PostureGuide {
  cameraPosition: string;
  tips: string[];
}

export const POSTURE_GUIDES: Record<PostureId, PostureGuide> = {
  hundred: {
    cameraPosition: 'Colócate de perfil (lateral) a la cámara, a unos 2 metros, tumbado boca arriba con todo el cuerpo visible.',
    tips: ['Encuadra desde la cabeza hasta los pies.', 'Deja el móvil apoyado a la altura de tu cadera.'],
  },
  single_leg_circles: {
    cameraPosition: 'Colócate totalmente de frente a la cámara (perpendicular a ella), a unos 2 metros, tumbado boca arriba con todo el cuerpo visible.',
    tips: [
      'La cámara debe ver ambas caderas por igual para comprobar que la pelvis no se balancea.',
      'Puedes levantar cualquiera de las dos piernas para hacer los círculos.',
    ],
  },
  rolling_like_a_ball: {
    cameraPosition: 'Colócate de perfil a la cámara, a unos 2 metros, sentado con todo el cuerpo visible.',
    tips: ['Deja espacio detrás de ti para el balanceo hacia atrás.', 'Los pies deben quedar en el aire, sin tocar el suelo.'],
  },
  single_leg_stretch: {
    cameraPosition: 'Colócate de perfil a la cámara, a unos 2 metros, tumbado boca arriba con todo el cuerpo visible.',
    tips: ['Encuadra desde la cabeza hasta los pies.'],
  },
  double_leg_stretch: {
    cameraPosition: 'Colócate de perfil a la cámara, a unos 2 metros, tumbado boca arriba con todo el cuerpo visible.',
    tips: ['Encuadra desde la cabeza hasta los pies.'],
  },
  spine_stretch: {
    cameraPosition: 'Colócate de perfil a la cámara, a unos 2 metros, sentado con las piernas extendidas y todo el cuerpo visible.',
    tips: ['Deja espacio delante de ti para el estiramiento hacia adelante.'],
  },
  plank: {
    cameraPosition: 'Colócate de perfil a la cámara, a unos 2 metros, boca abajo con todo el cuerpo visible de cabeza a talones.',
    tips: [
      'Apoya el móvil a la altura del suelo para ver bien la línea del cuerpo.',
      'Apóyate en los antebrazos o las manos, con los codos doblados bajo los hombros.',
    ],
  },
};
