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
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';
import { theme } from '../styles/theme';

export default function Profile({ navigation }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '' });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!form.old_password || !form.new_password) {
      setError('Please fill in both password fields');
      return;
    }
    setMsg('');
    setError('');
    setLoading(true);
    try {
      await authAPI.changePassword(form);
      setMsg('Password changed successfully');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header bar */}
      <View style={s.navBar}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.navigate('Dashboard')}
        >
          <Text style={s.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={s.brand}>My Profile</Text>
        <View style={{ width: 80 }} /> 
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={s.scrollContainer} keyboardShouldPersistTaps="handled">
          <View style={s.card}>
            {/* User Metadata Header */}
            <View style={s.avatarRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>
                  {(user?.full_name || user?.email || '?')[0].toUpperCase()}
                </Text>
              </View>
              <View style={s.avatarInfo}>
                <Text style={s.name}>{user?.full_name || '—'}</Text>
                <Text style={s.email}>{user?.email}</Text>
              </View>
            </View>

            {/* Info Grid */}
            <View style={s.infoGrid}>
              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Status</Text>
                <View style={s.statusRow}>
                  <View
                    style={[
                      s.statusDot,
                      { backgroundColor: user?.is_active ? theme.colors.success : theme.colors.error },
                    ]}
                  />
                  <Text style={s.infoValue}>{user?.is_active ? 'Active' : 'Inactive'}</Text>
                </View>
              </View>

              <View style={s.infoItem}>
                <Text style={s.infoLabel}>Roles</Text>
                <View style={s.badgeContainer}>
                  {user?.roles?.length ? (
                    user.roles.map((r) => (
                      <View key={r.id} style={s.badge}>
                        <Text style={s.badgeText}>{r.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={s.mutedText}>None</Text>
                  )}
                </View>
              </View>
            </View>

            <View style={s.divider} />

            {/* Password Reset Section */}
            <Text style={s.sectionHeader}>Change Password</Text>

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

            <View style={s.field}>
              <Text style={s.label}>Current Password</Text>
              <View style={s.passwordContainer}>
                <TextInput
                  style={[s.input, s.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showOld}
                  autoCapitalize="none"
                  value={form.old_password}
                  onChangeText={(text) => setForm({ ...form, old_password: text })}
                />
                <TouchableOpacity style={s.eyeButton} onPress={() => setShowOld(!showOld)}>
                  <Text style={s.eyeText}>{showOld ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>New Password</Text>
              <View style={s.passwordContainer}>
                <TextInput
                  style={[s.input, s.passwordInput]}
                  placeholder="••••••••"
                  placeholderTextColor={theme.colors.textMuted}
                  secureTextEntry={!showNew}
                  autoCapitalize="none"
                  value={form.new_password}
                  onChangeText={(text) => setForm({ ...form, new_password: text })}
                />
                <TouchableOpacity style={s.eyeButton} onPress={() => setShowNew(!showNew)}>
                  <Text style={s.eyeText}>{showNew ? 'Hide' : 'Show'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity style={s.btnPrimary} onPress={handleSubmit} disabled={loading}>
              {loading ? (
                <ActivityIndicator color={theme.colors.bg} />
              ) : (
                <Text style={s.btnPrimaryText}>Update Password</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  navBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  backBtn: {
    width: 100,
    justifyContent: 'center',
  },
  backBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  scrollContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.lg,
    padding: 24,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '700',
  },
  avatarInfo: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    color: theme.colors.text,
  },
  email: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 12,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  infoValue: {
    fontSize: 13,
    color: theme.colors.text,
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  badge: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    color: theme.colors.text,
    fontSize: 11,
  },
  mutedText: {
    fontSize: 13,
    color: theme.colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: theme.colors.border,
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 16,
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
});
