import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.welcome}>Welcome 👋</Text>
        <Text style={s.name}>{user?.full_name || user?.email}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Account Info</Text>
        <Text style={s.row}><Text style={s.label}>Email: </Text>{user?.email}</Text>
        <Text style={s.row}><Text style={s.label}>Status: </Text>
          <Text style={{color: user?.is_active ? 'green' : 'red'}}>
            {user?.is_active ? '✅ Active' : '❌ Inactive'}
          </Text>
        </Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Your Roles</Text>
        {user?.roles?.length ? (
          <View style={s.badgeRow}>
            {user.roles.map(r => (
              <View key={r.id} style={s.badge}>
                <Text style={s.badgeText}>{r.name}</Text>
              </View>
            ))}
          </View>
        ) : <Text style={s.noRoles}>No roles assigned</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:'#f0f2f5' },
  header: { backgroundColor:'#1a1a2e', padding:24, paddingTop:40 },
  welcome: { color:'#aaa', fontSize:14 },
  name: { color:'#fff', fontSize:22, fontWeight:'bold', marginTop:4 },
  card: { backgroundColor:'#fff', margin:16, marginBottom:0, padding:16, borderRadius:12, elevation:2 },
  cardTitle: { fontWeight:'bold', fontSize:16, color:'#1a1a2e', marginBottom:12 },
  row: { fontSize:14, color:'#333', marginBottom:6 },
  label: { fontWeight:'600' },
  badgeRow: { flexDirection:'row', flexWrap:'wrap', gap:8 },
  badge: { backgroundColor:'#e94560', paddingHorizontal:12, paddingVertical:4, borderRadius:12 },
  badgeText: { color:'#fff', fontSize:12 },
  noRoles: { color:'#999' },
});
