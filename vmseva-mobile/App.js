import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import Login from './src/screens/Login';
import Register from './src/screens/Register';
import ForgotPassword from './src/screens/ForgotPassword';
import ResetPassword from './src/screens/ResetPassword';
import Dashboard from './src/screens/Dashboard';
import Profile from './src/screens/Profile';
import Preaching from './src/screens/Preaching';
import { theme } from './src/styles/theme';

const Stack = createStackNavigator();

function NavigationWrapper() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={s.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.text} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user === null ? (
          // Auth Flow Stack
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
            <Stack.Screen name="ResetPassword" component={ResetPassword} />
          </>
        ) : (
          // Main App Flow Stack
          <>
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen name="Preaching" component={Preaching} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <View style={s.container}>
        <StatusBar style="light" />
        <NavigationWrapper />
      </View>
    </AuthProvider>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
