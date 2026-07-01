import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeScreen from '../screens/home/HomeScreen';
import RoutineListScreen from '../screens/routines/RoutineListScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import PostureNavigator from './PostureNavigator';
import { colors } from '../theme';
import {
  CamaraIcon,
  ClasesIcon,
  InicioIcon,
  PerfilIcon,
  ProgramasIcon,
} from '../components/icons/TabIcons';

export type AppTabParamList = {
  Home: undefined;
  Routines: undefined;
  Posture: undefined;
  Progress: undefined;
};

const Tab = createBottomTabNavigator<AppTabParamList>();

const TAB_HEIGHT = 64;

function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const barHeight = TAB_HEIGHT + insets.bottom;

  return (
    <View style={{ overflow: 'visible' }}>
      {/* Floating camera button */}
      <TouchableOpacity
        onPress={() => navigation.navigate('Posture')}
        style={[styles.floatingCamera, { bottom: barHeight + 12 }]}
        activeOpacity={0.85}
      >
        <CamaraIcon size={30} />
      </TouchableOpacity>

      {/* Tab bar */}
      <View style={[styles.tabBar, { height: barHeight, paddingBottom: insets.bottom }]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const color = colors.textMuted;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={[styles.tabItem, isFocused && styles.tabItemActive]}
              activeOpacity={0.7}
            >
              {options.tabBarIcon?.({ focused: isFocused, color, size: 24 })}
              <Text style={[styles.tabLabel, { color }]}>{options.title ?? route.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <InicioIcon color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Routines"
        component={RoutineListScreen}
        options={{
          title: 'Programas',
          tabBarIcon: ({ color }) => <ProgramasIcon color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Posture"
        component={PostureNavigator}
        options={{
          title: 'Clases',
          tabBarIcon: ({ color }) => <ClasesIcon color={color} size={24} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <PerfilIcon color={color} size={24} />,
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.inputBorder,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 10,
    gap: 4,
  },
  tabItemActive: {
    backgroundColor: colors.backgroundLight,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  floatingCamera: {
    position: 'absolute',
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 29,
    backgroundColor: colors.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2F4F75',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 1,
    elevation: 6,
    zIndex: 100,
  },
});
