import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

type Step = 'email' | 'otp' | 'password';

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number', test: (v: string) => /\d/.test(v) },
  { label: 'Special character', test: (v: string) => /[!@#$%^&*]/.test(v) },
];

export default function RegisterScreen({ navigation }: any) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const isStrongPassword = (v: string) => passwordRules.every((r) => r.test(v));

  const handleSendOtp = async () => {
    setLoading(true);
    try {
      await client.post('/auth/send-email-otp', { email });
      Toast.show({ type: 'success', text1: 'OTP sent to your email' });
      setStep('otp');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.response?.data?.error || err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setLoading(true);
    try {
      await client.post('/auth/verify-email-otp', { email, otp });
      Toast.show({ type: 'success', text1: 'Email verified!' });
      setStep('password');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }
    if (!isStrongPassword(password)) {
      Toast.show({ type: 'error', text1: 'Password does not meet all requirements' });
      return;
    }
    setLoading(true);
    try {
      const res = await client.post('/auth/register', { email, password });
      await login(res.data.token);
      Toast.show({ type: 'success', text1: 'Welcome! Account created.' });
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Registration failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Create Admin Account</Text>

      {step === 'email' && (
        <>
          <Text style={styles.subtitle}>Enter your email to receive a verification code</Text>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send Verification Code</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.bottomLink}>Already have an account? <Text style={styles.linkBold}>Login here</Text></Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'otp' && (
        <>
          <Text style={styles.subtitle}>Enter the 6-digit code sent to {email}</Text>
          <Text style={styles.label}>Verification Code</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#888"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
          />
          <TouchableOpacity style={styles.button} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify Email</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('email')}>
            <Text style={styles.linkCenter}>Use a different email</Text>
          </TouchableOpacity>
        </>
      )}

      {step === 'password' && (
        <>
          <Text style={styles.subtitle}>Set a strong password for your account</Text>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Text style={styles.eyeText}>{showPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {password.length > 0 && (
            <View style={styles.rulesContainer}>
              {passwordRules.map((rule) => (
                <Text key={rule.label} style={[styles.ruleText, rule.test(password) ? styles.rulePassed : styles.ruleFailed]}>
                  {rule.test(password) ? '✓' : '○'} {rule.label}
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showConfirm}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
              <Text style={styles.eyeText}>{showConfirm ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 4, color: '#333' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 14, fontSize: 14, color: '#000' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, marginBottom: 8 },
  passwordInput: { flex: 1, padding: 12, fontSize: 14, color: '#000' },
  eyeText: { paddingHorizontal: 12, color: '#555', fontSize: 13 },
  rulesContainer: { marginBottom: 14 },
  ruleText: { fontSize: 12, marginBottom: 2 },
  rulePassed: { color: '#22c55e' },
  ruleFailed: { color: '#aaa' },
  button: { backgroundColor: '#6366f1', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 16, marginTop: 8 },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  bottomLink: { textAlign: 'center', fontSize: 12, color: '#888' },
  linkBold: { color: '#6366f1', fontWeight: '600' },
  linkCenter: { textAlign: 'center', color: '#6366f1', fontSize: 12, marginTop: 4 },
});
