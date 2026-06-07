import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView,
  Platform, Alert
} from 'react-native'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { COLORS } from '../constants/colors'

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigation.reset({
        index: 0,
        routes: [{ name: 'POS' }],
      })
    } catch (err) {
      Alert.alert('Login Failed', 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.inner}>
        <View style={styles.logoContainer}>
          <View style={styles.logoBox}>
            <Text style={styles.logoText}>S</Text>
          </View>
          <Text style={styles.brandName}>Siradify</Text>
          <Text style={styles.tagline}>From Vision to Reality.</Text>
          <Text style={styles.subtitle}>Sign in to your POS</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            placeholderTextColor={COLORS.textGray}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor={COLORS.textGray}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.navy} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>Siradify POS. Built for Africa.</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.navy,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBox: {
    width: 70,
    height: 70,
    backgroundColor: COLORS.gold,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: {
    color: COLORS.navy,
    fontSize: 32,
    fontWeight: '800',
  },
  brandName: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  tagline: {
    color: COLORS.gold,
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  button: {
    backgroundColor: COLORS.gold,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  buttonText: {
    color: COLORS.navy,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12,
    marginTop: 24,
  },
})