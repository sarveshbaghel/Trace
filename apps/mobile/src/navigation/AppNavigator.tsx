import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { ReportScreen } from '../screens/ReportScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { MapScreen } from '../screens/MapScreen';
import { ReportSummaryScreen } from '../screens/ReportSummaryScreen';

import { useAuthStore } from '../store/authStore';

const Stack = createNativeStackNavigator();

export const AppNavigator = () => {
  const token = useAuthStore((state) => state.token);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {token ? (
          // Authenticated Screens
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Map" component={MapScreen} />
            <Stack.Screen name="ReportSummary" component={ReportSummaryScreen} />
          </>
        ) : (
          // Unauthenticated Screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
