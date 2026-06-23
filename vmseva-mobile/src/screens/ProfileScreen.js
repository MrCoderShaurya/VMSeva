import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [form, setForm] = useState({ old_password: '', new_password: '' });

  const changePassword = async () => {
    try {
      await authAPI.changePassword(form);
      Alert.alert('Success', 'Password changed successfully');
      setForm({ old_password: '', new_password: '' });
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed');
    }
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.avatar}>{(user?.full_name || user?.email || '?')[0].toUpperCase()}</Text>
        <Text style={s.name}>{user?.full_name || 'No name'}</Text>
        <Text style={s.email}>{user?.email}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Roles</Text>
        <View style={s.badgeRow}>
          {user?.roles?.length ? user.roles.map(r => (
            <View key={r.id} style={s.badge}>
              <Text style={s.badgeText}>{r.name}</Text>
            </View>
          )) : <Text style={s.noRoles}>No roles assigned</Text>}
        </View>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Change Password</Text>
        <TextInput style={s.input} placeholder="Old Password" secureTextEntry
          value={form.old_password} onChangeText={v => setForm({...form, old_password: v})} />
        <TextInput style={s.input} placeholder="New Password" secureTextEntry
          value={form.new_password} onChangeText={v => setForm({...form, new_password: v})} />
        <TouchableOpacity style={s.btn} onPress={changePassword}>
          <Text style={s.btnText}>Update Password</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={logout}>
        <Text style={s.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f2f5' },
  header: { backgroundColor:'#1a1a2e', padding:24, alignItems:'center' },
  avatar: { width:64, height:64, borderRadius:32, backgroundColor:'#e94560', textAlign:'center', lineHeight:64, fontSize:28, color:'#fff', fontWeight:'bold', overflow:'hidden' },
  name: { color:'#fff', fontSize:18, fontWeight:'bold', marginTop:8 },
  email: { color:'#aaa', fontSize:13, marginTop:2 },
  card: { backgroundColor:'#fff', margin:16, marginBottom:0, padding:16, borderRadius:12, elevation:2 },
  cardTitle: { fontWeight:'bold', fontSize:15, color:'#1a1a2e', marginBottom:12 },
  badgeRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  badge: { backgroundColor:'#e94560', paddingHorizontal:12, paddingVertical:4, borderRadius:12 },
  badgeText: { color:'#fff', fontSize:12 },
  noRoles: { color:'#999' },
  input: { backgroundColor:'#f5f5f5', padding:12, borderRadius:8, marginBottom:10, borderWidth:1, borderColor:'#eee' },
  btn: { backgroundColor:'#e94560', padding:12, borderRadius:8, alignItems:'center' },
  btnText: { color:'#fff', fontWeight:'bold' },
  logoutBtn: { margin:16, padding:14, backgroundColor:'#fff', borderRadius:12, alignItems:'center', borderWidth:1, borderColor:'#e94560' },
  logoutText: { color:'#e94560', fontWeight:'bold', fontSize:15 },
});
