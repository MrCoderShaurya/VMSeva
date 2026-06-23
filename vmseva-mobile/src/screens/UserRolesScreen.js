import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { usersAPI } from '../api';

const ALL_ROLES = [
  { id: 1, name: 'Admin' }, { id: 2, name: 'Overall Coordinator' },
  { id: 3, name: 'Internal Manager' }, { id: 4, name: 'Counselor' },
  { id: 5, name: 'Incharge' }, { id: 6, name: 'Assistant' }
];

export default function UserRolesScreen({ route }) {
  const { userId } = route.params;
  const [assigned, setAssigned] = useState([]);

  const load = () => usersAPI.getRoles(userId).then(r => setAssigned(r.data));
  useEffect(() => { load(); }, []);

  const toggle = async (role) => {
    const has = assigned.some(r => r.id === role.id);
    try {
      if (has) await usersAPI.removeRole(userId, role.id);
      else await usersAPI.assignRole(userId, role.id);
      load();
    } catch {
      Alert.alert('Error', 'Could not update role');
    }
  };

  const assignedIds = assigned.map(r => r.id);

  return (
    <View style={s.container}>
      <Text style={s.heading}>Manage Roles — User #{userId}</Text>
      <FlatList
        data={ALL_ROLES}
        keyExtractor={r => String(r.id)}
        numColumns={2}
        contentContainerStyle={{ padding:16 }}
        columnWrapperStyle={{ gap:12 }}
        renderItem={({ item }) => {
          const has = assignedIds.includes(item.id);
          return (
            <TouchableOpacity style={[s.card, has && s.cardActive]} onPress={() => toggle(item)}>
              <Text style={[s.roleName, has && s.roleNameActive]}>{item.name}</Text>
              <Text style={[s.status, has && s.statusActive]}>{has ? 'Assigned ✓' : 'Tap to assign'}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f2f5' },
  heading: { fontSize:16, fontWeight:'bold', color:'#1a1a2e', padding:16, paddingBottom:0 },
  card: { flex:1, backgroundColor:'#fff', borderRadius:10, padding:14, borderWidth:2, borderColor:'#ddd', marginBottom:12 },
  cardActive: { borderColor:'#e94560', backgroundColor:'#fff5f7' },
  roleName: { fontWeight:'600', color:'#333', marginBottom:4 },
  roleNameActive: { color:'#e94560' },
  status: { fontSize:11, color:'#999' },
  statusActive: { color:'#e94560' },
});
