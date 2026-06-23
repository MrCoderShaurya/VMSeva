import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { authAPI } from '../api';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async () => {
    try {
      await authAPI.forgotPassword({ email });
      setSent(true);
    } catch {
      Alert.alert('Error', 'Something went wrong.');
    }
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Forgot Password</Text>
      {sent ? (
        <Text style={s.success}>Reset link sent! Check your email.</Text>
      ) : (
        <>
          <TextInput style={s.input} placeholder="Enter your email" autoCapitalize="none"
            keyboardType="email-address" value={email} onChangeText={setEmail} />
          <TouchableOpacity style={s.btn} onPress={submit}>
            <Text style={s.btnText}>Send Reset Link</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={s.link}>← Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, justifyContent:'center', padding:24, backgroundColor:'#f0f2f5' },
  title: { fontSize:24, fontWeight:'bold', color:'#1a1a2e', textAlign:'center', marginBottom:32 },
  input: { backgroundColor:'#fff', padding:12, borderRadius:8, marginBottom:12, borderWidth:1, borderColor:'#ddd' },
  btn: { backgroundColor:'#e94560', padding:14, borderRadius:8, alignItems:'center', marginBottom:12 },
  btnText: { color:'#fff', fontWeight:'bold', fontSize:16 },
  link: { textAlign:'center', color:'#1a1a2e', marginTop:16 },
  success: { textAlign:'center', color:'green', fontSize:16, marginBottom:16 },
});
