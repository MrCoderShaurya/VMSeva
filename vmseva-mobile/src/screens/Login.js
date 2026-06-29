import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { theme } from '../styles/theme';

export default function Login({ navigation }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
    if (!form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await login(form.email, form.password);
      // Navigation will be automatically updated by App.js AuthState,
      // but if not, stack navigator can handle it.
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={s.container}
    >
      <ScrollView contentContainerStyle={s.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <Text style={s.logo}>VMSeva</Text>
          <Text style={s.subtitle}>Sign in to your account</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={s.field}>
            <Text style={s.label}>Email</Text>
            <TextInput
              style={s.input}
              placeholder="you@example.com"
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={form.email}
              onChangeText={(email) => setForm({ ...form, email })}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>Password</Text>
            <View style={s.passwordContainer}>
              <TextInput
                style={[s.input, s.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={theme.colors.textMuted}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                autoComplete="password"
                value={form.password}
                onChangeText={(password) => setForm({ ...form, password })}
              />
              <TouchableOpacity style={s.eyeButton} onPress={() => setShowPw(!showPw)}>
                <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={s.btnPrimary} onPress={handleLogin} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={theme.colors.bg} />
            ) : (
              <Text style={s.btnPrimaryText}>Sign In</Text>
            )}
          </TouchableOpacity>

          <View style={s.row}>
            <TouchableOpacity
              style={s.checkboxContainer}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[s.checkbox, rememberMe && s.checkboxChecked]}>
                {rememberMe && <Text style={s.checkboxCheckmark}>✓</Text>}
              </View>
              <Text style={s.rowText}>Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
              <Text style={s.linkText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={s.divider}>
            <View style={s.dividerLine} />
            <Text style={s.dividerText}>or</Text>
            <View style={s.dividerLine} />
          </View>

          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.footerLink}>Register</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.lg,
    padding: 30,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: theme.colors.errorMuted,
    borderColor: 'rgba(255, 68, 68, 0.2)',
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 10,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    fontSize: 13,
    textAlign: 'center',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    color: theme.colors.text,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    fontSize: 14,
  },
  passwordContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    paddingRight: 55,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
  },
  eyeText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  btnPrimary: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.roundness.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  btnPrimaryText: {
    color: theme.colors.bg,
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 16,
    height: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 3,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface2,
  },
  checkboxChecked: {
    backgroundColor: theme.colors.text,
    borderColor: theme.colors.text,
  },
  checkboxCheckmark: {
    color: theme.colors.bg,
    fontSize: 10,
    fontWeight: 'bold',
    lineHeight: 12,
  },
  rowText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.border,
  },
  dividerText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    paddingHorizontal: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
});
