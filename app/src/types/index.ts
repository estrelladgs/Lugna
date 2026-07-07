export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type PostureId =
  | 'hundred'
  | 'single_leg_circles'
  | 'rolling_like_a_ball'
  | 'single_leg_stretch'
  | 'double_leg_stretch'
  | 'spine_stretch'
  | 'plank';

export interface Posture {
  id: PostureId;
  name: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  muscleGroups: string[];
  imageUrl?: string;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

export interface PostureFeedback {
  isCorrect: boolean;
  score: number;
  corrections: string[];
  landmarks?: Landmark[];
  incorrectLandmarks?: number[];
}

export interface PostureSession {
  id: string;
  postureId: PostureId;
  postureName?: string;
  startedAt: string;
  endedAt?: string;
  durationSeconds: number;
  averageScore: number;
  feedbackHistory: PostureFeedback[];
}

export interface Routine {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  enlace?: string;
}

export interface ProgressEntry {
  date: string;
  postureId: PostureId;
  averageScore: number;
  durationSeconds: number;
}
