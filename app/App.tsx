import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin } from './src/services/googleSignIn';
import RootNavigator from './src/navigation/RootNavigator';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

export default function App() {
  return (
    <>
      <StatusBar style="dark" />
      <RootNavigator />
    </>
  );
}
