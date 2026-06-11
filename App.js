import 'react-native-gesture-handler'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoginScreen from './src/screens/LoginScreen'
import POSScreen from './src/screens/POSScreen'
import POSScreenWeb from './src/screens/POSScreenWeb'
import ReceiptScreen from './src/screens/ReceiptScreen'
import OrdersScreen from './src/screens/OrdersScreen'
import { ActivityIndicator, View, Platform } from 'react-native'

const Stack = createStackNavigator()

function AppNavigator() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A1F44' }}>
        <ActivityIndicator color="#F5A623" size="large" />
      </View>
    )
  }

  const POS = Platform.OS === 'web' ? POSScreenWeb : POSScreen

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={user ? 'POS' : 'Login'}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="POS" component={POS} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
      <Stack.Screen name="Orders" component={OrdersScreen} />
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}