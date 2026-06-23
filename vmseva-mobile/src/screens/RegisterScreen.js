import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../api';

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' });

  const submit = async () => {
    try {
      await authAPI.register(form);
      Alert.alert('Success', 'Account created! Please login.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') }
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Create Account</Text>
      <TextInput style={s.input} placeholder="Full Name"
        value={form.full_name} onChangeText={v => setForm({...form, full_name: v})} />
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
        keyboardType="email-address" value={form.email} onChangeText={v => setForm({...form, email: v})} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry
        value={form.password} onChangeText={v => setForm({...form, password: v})} />
      <TouchableOpacity style={s.btn} onPress={submit}>
        <Text style={s.btnText}>Register</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>Already have account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor:'#f0f2f5' },
  title: { fontSize:28, fontWeight:'bold', color:'#1a1a2e', textAlign:'center', marginBottom:32 },
  input: { backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:'#ddd' },
  btn: { backgroundColor:'#1a1a2e', padding:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  btnText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  link: { textAlign:'center', color:'#e94560', marginTop:8 },
});
