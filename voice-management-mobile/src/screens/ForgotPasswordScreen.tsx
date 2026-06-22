import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import client from '../api/client';

const passwordRules = [
  { label: 'At least 8 characters', test: (v: string) => v.length >= 8 },
  { label: 'Uppercase letter', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Lowercase letter', test: (v: string) => /[a-z]/.test(v) },
  { label: 'Number', test: (v: string) => /\d/.test(v) },
  { label: 'Special character', test: (v: string) => /[!@#$%^&*]/.test(v) },
];

export default function ForgotPasswordScreen({ navigation }: any) {
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const isStrongPassword = (v: string) => passwordRules.every((r) => r.test(v));

  const handleRequest = async () => {
    if (!email) return;
    setLoading(true);
    try {
      await client.post('/auth/forgot-password', { email });
      Toast.show({ type: 'success', text1: 'Reset code sent to your email' });
      setStep('reset');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || err.message || 'Network error' });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!token || !newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'All fields are required' });
      return;
    }
    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords must match' });
      return;
    }
    if (!isStrongPassword(newPassword)) {
      Toast.show({ type: 'error', text1: 'Password does not meet all requirements' });
      return;
    }
    setLoading(true);
    try {
      await client.post('/auth/reset-password', { token, newPassword });
      Toast.show({ type: 'success', text1: 'Password reset! Please login.' });
      navigation.navigate('Login');
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.message || 'Failed to reset password' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Reset Password</Text>

      {step === 'request' ? (
        <>
          <Text style={styles.subtitle}>Enter your email to receive reset instructions</Text>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@example.com"
            placeholderTextColor="#888"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TouchableOpacity style={styles.button} onPress={handleRequest} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Request Token</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkCenter}>Back to login</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.subtitle}>Enter the OTP from your email and set a new password</Text>
          <Text style={styles.label}>Reset Code (OTP)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#888"
            value={token}
            onChangeText={setToken}
            keyboardType="number-pad"
          />
          <Text style={styles.label}>New Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor="#888"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry={!showNew}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNew(!showNew)}>
              <Text style={styles.eyeText}>{showNew ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          {newPassword.length > 0 && (
            <View style={styles.rulesContainer}>
              {passwordRules.map((rule) => (
                <Text key={rule.label} style={[styles.ruleText, rule.test(newPassword) ? styles.rulePassed : styles.ruleFailed]}>
                  {rule.test(newPassword) ? '✓' : '○'} {rule.label}
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.label}>Confirm New Password</Text>
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
          <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setStep('request')}>
            <Text style={styles.linkCenter}>Request a new token</Text>
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
  linkCenter: { textAlign: 'center', color: '#6366f1', fontSize: 12, marginTop: 4 },
});
