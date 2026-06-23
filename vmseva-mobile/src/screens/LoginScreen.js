import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const submit = async () => {
    try {
      await login(email, password);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>VMSeva</Text>
      <Text style={s.subtitle}>Sign in to continue</Text>
      <TextInput style={s.input} placeholder="Email" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Password" secureTextEntry
        value={password} onChangeText={setPassword} />
      <TouchableOpacity style={s.btn} onPress={submit}>
        <Text style={s.btnText}>Login</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
        <Text style={s.link}>Forgot password?</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={s.link}>No account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor:'#f0f2f5' },
  title: { fontSize:32, fontWeight:'bold', color:'#e94560', textAlign:'center', marginBottom:4 },
  subtitle: { textAlign:'center', color:'#666', marginBottom:32 },
  input: { backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:'#ddd' },
  btn: { backgroundColor:'#e94560', padding:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  btnText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  link: { textAlign:'center', color:'#1a1a2e', marginTop:8 },
});
