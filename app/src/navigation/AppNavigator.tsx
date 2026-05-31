import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import HomeScreen from '../screens/home/HomeScreen';
import RoutineListScreen from '../screens/routines/RoutineListScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import PostureNavigator from './PostureNavigator';
import { colors } from '../theme';

export type AppTabParamList = {
  Home: undefined;
  Routines: undefined;
  Posture: undefined;
  Progress: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.inputBorder,
        },
        tabBarActiveTintColor: colors.black,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Inicio', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutineListScreen}
        options={{ title: 'Rutinas', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📋</Text> }}
      />
      <Tab.Screen
        name="Posture"
        component={PostureNavigator}
        options={{ title: 'Postura', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🧘</Text> }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progreso', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📈</Text> }}
      />
    </Tab.Navigator>
  );
}
