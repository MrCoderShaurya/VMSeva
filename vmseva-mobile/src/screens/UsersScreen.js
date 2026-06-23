import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usersAPI } from '../api';

export default function UsersScreen({ navigation }) {
  const [users, setUsers] = useState([]);

  const load = () => usersAPI.getAll().then(r => setUsers(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const toggle = async (id) => {
    const { data } = await usersAPI.toggleStatus(id);
    setUsers(prev => prev.map(u => u.id === id ? {...u, is_active: data.is_active} : u));
  };

  return (
    <View style={s.container}>
      <FlatList
        data={users}
        keyExtractor={u => String(u.id)}
        contentContainerStyle={{ padding:16 }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.info}>
              <Text style={s.name}>{item.full_name || 'No name'}</Text>
              <Text style={s.email}>{item.email}</Text>
              <Text style={{color: item.is_active ? 'green' : 'red', fontSize:12}}>
                {item.is_active ? '● Active' : '● Inactive'}
              </Text>
            </View>
            <View style={s.actions}>
              <TouchableOpacity style={s.btnRed} onPress={() => toggle(item.id)}>
                <Text style={s.btnText}>{item.is_active ? 'Deactivate' : 'Activate'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnDark} onPress={() => navigation.navigate('UserRoles', { userId: item.id })}>
                <Text style={s.btnText}>Roles</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f2f5' },
  card: { backgroundColor:'#fff', borderRadius:10, padding:14, marginBottom:12, elevation:2 },
  info: { marginBottom:10 },
  name: { fontWeight:'bold', fontSize:15, color:'#1a1a2e' },
  email: { color:'#666', fontSize:13, marginVertical:2 },
  actions: { flexDirection:'row', gap:8 },
  btnRed: { backgroundColor:'#e94560', padding:8, borderRadius:6, flex:1, alignItems:'center' },
  btnDark: { backgroundColor:'#1a1a2e', padding:8, borderRadius:6, flex:1, alignItems:'center' },
  btnText: { color:'#fff', fontSize:12, fontWeight:'600' },
});
