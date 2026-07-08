import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import PostureSelectScreen from '../screens/posture/PostureSelectScreen';
import PostureCameraScreen from '../screens/posture/PostureCameraScreen';
import PostureResultScreen from '../screens/posture/PostureResultScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';
import { PostureId, PostureSession } from '../types';

export type PostureStackParamList = {
  PostureSelect: undefined;
  PostureCamera: { postureId: PostureId; postureName: string };
  PostureResult: { session: PostureSession };
  PrivacyPolicy: undefined;
};

const Stack = createNativeStackNavigator<PostureStackParamList>();

export default function PostureNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PostureSelect" component={PostureSelectScreen} />
      <Stack.Screen name="PostureCamera" component={PostureCameraScreen} />
      <Stack.Screen name="PostureResult" component={PostureResultScreen} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
    </Stack.Navigator>
  );
}
