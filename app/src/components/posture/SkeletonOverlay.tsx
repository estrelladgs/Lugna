import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';
import { Landmark } from '../../types';

const { width, height } = Dimensions.get('window');

// MediaPipe Pose connections (subset for visibility)
const CONNECTIONS: [number, number][] = [
  [11, 12], // shoulders
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 23], [12, 24], // torso
  [23, 24], // hips
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

interface Props {
  landmarks: Landmark[];
}

export default function SkeletonOverlay({ landmarks }: Props) {
  if (!landmarks || landmarks.length === 0) return null;

  const toScreen = (lm: Landmark) => ({
    x: lm.x * width,
    y: lm.y * height,
  });

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        {CONNECTIONS.map(([a, b], i) => {
          const lmA = landmarks[a];
          const lmB = landmarks[b];
          if (!lmA || !lmB) return null;
          if ((lmA.visibility ?? 1) < 0.5 || (lmB.visibility ?? 1) < 0.5) return null;
          const posA = toScreen(lmA);
          const posB = toScreen(lmB);
          return (
            <Line
              key={i}
              x1={posA.x} y1={posA.y}
              x2={posB.x} y2={posB.y}
              stroke="rgba(255,255,255,0.9)"
              strokeWidth={2}
            />
          );
        })}
        {landmarks.map((lm, i) => {
          if ((lm.visibility ?? 1) < 0.5) return null;
          const pos = toScreen(lm);
          return (
            <Circle
              key={i}
              cx={pos.x} cy={pos.y}
              r={5}
              fill="white"
              stroke="rgba(194,216,232,0.9)"
              strokeWidth={2}
            />
          );
        })}
      </Svg>
    </View>
  );
}
