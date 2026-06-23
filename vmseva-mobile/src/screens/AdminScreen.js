import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import api from '../api';

export default function AdminScreen() {
  const [data, setData] = useState(null);

  useEffect(() => { api.get('/admin/test').then(r => setData(r.data)).catch(() => {}); }, []);

  return (
    <ScrollView style={s.container}>
      <View style={s.card}>
        <Text style={s.title}>Admin Dashboard</Text>
        <Text style={s.confirm}>✅ Admin access confirmed</Text>
        {data && (
          <View style={s.pre}>
            <Text style={s.code}>{JSON.stringify(data, null, 2)}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f2f5', padding:16 },
  card: { backgroundColor:'#fff', borderRadius:12, padding:20, elevation:2 },
  title: { fontSize:20, fontWeight:'bold', color:'#1a1a2e', marginBottom:12 },
  confirm: { color:'green', fontSize:15, marginBottom:12 },
  pre: { backgroundColor:'#f5f5f5', padding:12, borderRadius:8 },
  code: { fontFamily:'monospace', fontSize:12, color:'#333' },
});
