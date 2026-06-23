import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import DashboardScreen from '../screens/DashboardScreen';
import UsersScreen from '../screens/UsersScreen';
import UserRolesScreen from '../screens/UserRolesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AdminScreen from '../screens/AdminScreen';
import { View } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function UsersStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="UsersList" component={UsersScreen} options={{ title: 'Users' }} />
      <Stack.Screen name="UserRoles" component={UserRolesScreen} options={{ title: 'Manage Roles' }} />
    </Stack.Navigator>
  );
}

// Wrapper screens that check role before rendering
function AdminUsersTab() {
  const { hasRole } = useAuth();
  if (!hasRole('Admin')) return <View style={{ flex: 1 }} />;
  return <UsersStack />;
}

function AdminTab() {
  const { hasRole } = useAuth();
  if (!hasRole('Admin')) return <View style={{ flex: 1 }} />;
  return <AdminScreen />;
}

export default function AppNavigator() {
  const { hasRole } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#e94560',
        tabBarInactiveTintColor: '#999',
        headerStyle: { backgroundColor: '#1a1a2e' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text> }}
      />
      <Tab.Screen
        name="Users"
        component={AdminUsersTab}
        options={{
          headerShown: false,
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👥</Text>,
          tabBarButton: hasRole('Admin') ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Admin"
        component={AdminTab}
        options={{
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
          tabBarButton: hasRole('Admin') ? undefined : () => null,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text> }}
      />
    </Tab.Navigator>
  );
}
