import { ImageSourcePropType } from 'react-native';
import { PostureId } from '../types';

export const POSTURE_IMAGES: Record<PostureId, ImageSourcePropType> = {
  hundred: require('../../assets/postures/hundred.jpg'),
  single_leg_circles: require('../../assets/postures/single_leg_circles.jpg'),
  rolling_like_a_ball: require('../../assets/postures/rolling_like_a_ball.jpg'),
  single_leg_stretch: require('../../assets/postures/single_leg_stretch.jpg'),
  double_leg_stretch: require('../../assets/postures/double_leg_stretch.png'),
  spine_stretch: require('../../assets/postures/spine_stretch.png'),
  plank: require('../../assets/postures/plank.png'),
};
