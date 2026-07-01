import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import RoutineListScreen from '../screens/routines/RoutineListScreen';
import RoutineDetailScreen from '../screens/routines/RoutineDetailScreen';
import { Routine } from '../types';

export type RoutinesStackParamList = {
  RoutineList: undefined;
  RoutineDetail: { routine: Routine };
};

const Stack = createNativeStackNavigator<RoutinesStackParamList>();

export default function RoutinesNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutineList" component={RoutineListScreen} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
    </Stack.Navigator>
  );
}
