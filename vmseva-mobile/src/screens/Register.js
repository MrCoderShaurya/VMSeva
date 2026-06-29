import React, { useState, useRef, useEffect } from 'react';
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

export default function Register({ navigation }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const otpRefs = useRef([]);

  const strength = getStrength(password);
  const allRulesPassed = rules.filter(r => r.test(password)).length >= 4;
  const passwordsMatch = password === confirm && confirm.length > 0;

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const sendOTP = async () => {
    if (!email || !fullName) {
      setError('Full Name and Email are required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.sendOTP({ email, type: 'register' });
      setStep(2);
      setResendTimer(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (text, index) => {
    const cleanText = text.replace(/\D/g, '');
    const nextOtp = [...otp];
    nextOtp[index] = cleanText;
    setOtp(nextOtp);

    // Auto focus next
    if (cleanText && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.verifyOTP({ email, otp: otpCode, type: 'register' });
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const register = async () => {
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
      await authAPI.register({ email, password, full_name: fullName });
      navigation.navigate('Login', { registered: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
          <Text style={s.subtitle}>
            {step === 1 && 'Create your account'}
            {step === 2 && 'Verify your email'}
            {step === 3 && 'Set your password'}
          </Text>

          <View style={s.steps}>
            {[1, 2, 3].map((num) => (
              <View
                key={num}
                style={[
                  s.stepDot,
                  step === num && s.stepDotActive,
                  step > num && s.stepDotDone,
                ]}
              />
            ))}
          </View>

          {error ? (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1 — Profile Details */}
          {step === 1 && (
            <View>
              <View style={s.field}>
                <Text style={s.label}>Full Name</Text>
                <TextInput
                  style={s.input}
                  placeholder="John Doe"
                  placeholderTextColor={theme.colors.textMuted}
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
              <View style={s.field}>
                <Text style={s.label}>Email</Text>
                <TextInput
                  style={s.input}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <TouchableOpacity style={s.btnPrimary} onPress={sendOTP} disabled={loading}>
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <Text style={s.btnPrimaryText}>Send OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2 — OTP Input */}
          {step === 2 && (
            <View>
              <Text style={s.otpText}>We sent a 6-digit code to</Text>
              <Text style={s.otpEmail}>{email}</Text>

              <View style={s.otpGrid}>
                {otp.map((val, idx) => (
                  <TextInput
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    style={s.otpInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={val}
                    onChangeText={(text) => handleOtpChange(text, idx)}
                    onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                    textAlign="center"
                  />
                ))}
              </View>

              <TouchableOpacity
                style={s.btnPrimary}
                onPress={verifyOTP}
                disabled={loading || otp.join('').length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <Text style={s.btnPrimaryText}>Verify OTP</Text>
                )}
              </TouchableOpacity>

              <View style={s.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={s.resendText}>Resend in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={sendOTP}>
                    <Text style={s.resendButton}>Resend OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                style={s.btnGhost}
                onPress={() => {
                  setStep(1);
                  setOtp(['', '', '', '', '', '']);
                  setError('');
                }}
              >
                <Text style={s.btnGhostText}>← Change email</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3 — Password Setup */}
          {step === 3 && (
            <View>
              <View style={s.field}>
                <Text style={s.label}>Password</Text>
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
                onPress={register}
                disabled={loading || !allRulesPassed || !passwordsMatch}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.bg} />
                ) : (
                  <Text style={s.btnPrimaryText}>Create Account</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          <View style={s.footer}>
            <Text style={s.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={s.footerLink}>Sign in</Text>
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
    marginBottom: 16,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  stepDotActive: {
    backgroundColor: theme.colors.text,
    width: 20,
  },
  stepDotDone: {
    backgroundColor: theme.colors.textSecondary,
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
  btnGhost: {
    backgroundColor: 'transparent',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  btnGhostText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  otpText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 4,
  },
  otpEmail: {
    fontSize: 14,
    color: theme.colors.text,
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: 16,
  },
  otpGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  otpInput: {
    width: 40,
    height: 48,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '600',
  },
  resendRow: {
    alignItems: 'center',
    marginVertical: 10,
  },
  resendText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  resendButton: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
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
