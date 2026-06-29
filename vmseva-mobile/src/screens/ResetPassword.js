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
import { authAPI } from '../api';
import { theme } from '../styles/theme';

const rules = [
  { id: 'len',     label: 'At least 8 characters',       test: p => p.length >= 8 },
  { id: 'upper',   label: 'One uppercase letter',         test: p => /[A-Z]/.test(p) },
  { id: 'lower',   label: 'One lowercase letter',         test: p => /[a-z]/.test(p) },
  { id: 'number',  label: 'One number',                   test: p => /[0-9]/.test(p) },
  { id: 'special', label: 'One special character',        test: p => /[^A-Za-z0-9]/.test(p) },
];

function getStrength(p) {
  if (!p) return { score: 0, label: '', color: '' };
  const passed = rules.filter(r => r.test(p)).length;
  if (passed <= 2) return { score: 20, label: 'Weak', color: theme.colors.error };
  if (passed === 3) return { score: 50, label: 'Fair', color: theme.colors.warning };
  if (passed === 4) return { score: 75, label: 'Good', color: '#44aaff' };
  return { score: 100, label: 'Strong', color: theme.colors.success };
}

export default function ResetPassword({ route, navigation }) {
  const email = route.params?.email;
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const strength = getStrength(password);
  const allRulesPassed = rules.filter(r => r.test(password)).length >= 4;
  const passwordsMatch = password === confirm && confirm.length > 0;

  const handleReset = async () => {
    if (!allRulesPassed) {
      setError('Password does not meet requirements');
      return;
    }
    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.resetPassword({ email, new_password: password });
      setMsg('Password reset successfully!');
      setTimeout(() => {
        navigation.navigate('Login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
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
          <Text style={s.subtitle}>Set a new password</Text>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {msg ? (
            <View style={s.successBox}>
              <Text style={s.successText}>{msg}</Text>
            </View>
          ) : null}

          {!msg && (
            <View>
              <View style={s.field}>
                <Text style={s.label}>New Password</Text>
                <View style={s.passwordContainer}>
                  <TextInput
                    style={[s.input, s.passwordInput]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showPw}
                    autoCapitalize="none"
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity style={s.eyeButton} onPress={() => setShowPw(!showPw)}>
                    <Text style={s.eyeText}>{showPw ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>

                {password ? (
                  <View style={s.strengthContainer}>
                    <View style={s.strengthBar}>
                      <View
                        style={[
                          s.strengthFill,
                          { width: `${strength.score}%`, backgroundColor: strength.color },
                        ]}
                      />
                    </View>
                    <Text style={[s.strengthLabel, { color: strength.color }]}>
                      {strength.label}
                    </Text>
                  </View>
                ) : null}
              </View>

              {password ? (
                <View style={s.rulesBox}>
                  {rules.map((r) => {
                    const passed = r.test(password);
                    return (
                      <View key={r.id} style={s.ruleRow}>
                        <View style={[s.ruleDot, passed && s.ruleDotPassed]} />
                        <Text style={[s.ruleLabel, passed && s.ruleLabelPassed]}>
                          {r.label}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <View style={[s.field, { marginTop: 14 }]}>
                <Text style={s.label}>Confirm Password</Text>
                <View style={s.passwordContainer}>
                  <TextInput
                    style={[
                      s.input,
                      s.passwordInput,
                      confirm && !passwordsMatch && { borderColor: theme.colors.error },
                    ]}
                    placeholder="••••••••"
                    placeholderTextColor={theme.colors.textMuted}
                    secureTextEntry={!showCf}
                    autoCapitalize="none"
                    value={confirm}
                    onChangeText={setConfirm}
                  />
                  <TouchableOpacity style={s.eyeButton} onPress={() => setShowCf(!showCf)}>
                    <Text style={s.eyeText}>{showCf ? 'Hide' : 'Show'}</Text>
                  </TouchableOpacity>
                </View>
                {confirm && !passwordsMatch ? (
                  <Text style={s.matchTextError}>Passwords do not match</Text>
                ) : null}
                {confirm && passwordsMatch ? (
                  <Text style={s.matchTextSuccess}>✓ Passwords match</Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={s.btnPrimary}
                onPress={handleReset}
                disabled={loading || !allRulesPassed || !passwordsMatch}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <Text style={s.btnPrimaryText}>Reset Password</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={s.footer}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>← Back to Sign in</Text>
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
  successBox: {
    backgroundColor: theme.colors.successMuted,
    borderColor: 'rgba(0, 204, 102, 0.2)',
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 10,
    marginBottom: 16,
  },
  successText: {
    color: theme.colors.success,
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
  strengthContainer: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  strengthBar: {
    flex: 1,
    height: 3,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    marginRight: 10,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  rulesBox: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 12,
    marginBottom: 16,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ruleDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.textMuted,
    marginRight: 8,
  },
  ruleDotPassed: {
    backgroundColor: theme.colors.success,
  },
  ruleLabel: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  ruleLabelPassed: {
    color: theme.colors.success,
  },
  matchTextError: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
  matchTextSuccess: {
    fontSize: 12,
    color: theme.colors.success,
    marginTop: 4,
  },
  btnPrimary: {
    backgroundColor: theme.colors.text,
    borderRadius: theme.roundness.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: theme.colors.bg,
    fontSize: 14,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerLink: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});
