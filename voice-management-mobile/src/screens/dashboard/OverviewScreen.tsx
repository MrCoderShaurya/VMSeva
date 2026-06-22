import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import client from '../../api/client';

export default function OverviewScreen() {
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalRoles: 0 });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([client.get('/users'), client.get('/roles')]);
        const allUsers = usersRes.data || [];
        setStats({
          totalUsers: allUsers.length,
          activeUsers: allUsers.filter((u: any) => u.is_active !== false).length,
          totalRoles: (rolesRes.data || []).length,
        });
        setRecentUsers(allUsers.slice(-5).reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderTopColor: '#6366f1' }]}>
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#22c55e' }]}>
          <Text style={styles.statValue}>{stats.activeUsers}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderTopColor: '#a855f7' }]}>
          <Text style={styles.statValue}>{stats.totalRoles}</Text>
          <Text style={styles.statLabel}>Roles</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recently Registered</Text>
      <View style={styles.table}>
        <View style={styles.tableHeader}>
          <Text style={[styles.tableCell, styles.headerText, { flex: 0.3 }]}>ID</Text>
          <Text style={[styles.tableCell, styles.headerText]}>Email</Text>
        </View>
        {recentUsers.length === 0 ? (
          <Text style={styles.empty}>No users yet.</Text>
        ) : (
          recentUsers.map((u) => (
            <View key={u.id} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.mono, { flex: 0.3 }]}>{u.id}</Text>
              <Text style={styles.tableCell}>{u.email}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f9f9f9' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 8, padding: 16, borderTopWidth: 3, elevation: 1 },
  statValue: { fontSize: 22, fontWeight: 'bold', color: '#111' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  sectionTitle: { fontSize: 15, fontWeight: '600', marginBottom: 10, color: '#333' },
  table: { backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', elevation: 1 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#f3f4f6', padding: 10 },
  tableRow: { flexDirection: 'row', padding: 10, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  tableCell: { flex: 1, fontSize: 13, color: '#333' },
  headerText: { fontWeight: '600', color: '#555' },
  mono: { fontFamily: 'monospace', color: '#888', fontSize: 12 },
  empty: { padding: 16, textAlign: 'center', color: '#aaa' },
});
