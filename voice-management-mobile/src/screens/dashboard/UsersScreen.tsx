import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, Switch, ActivityIndicator, Modal, ScrollView } from 'react-native';
import Toast from 'react-native-toast-message';
import client from '../../api/client';

export default function UsersScreen() {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'create' | 'edit' | 'roles' | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([client.get('/users'), client.get('/roles')]);
      const basicUsers = usersRes.data || [];
      setRolesList(rolesRes.data || []);
      const detailed = await Promise.all(
        basicUsers.map(async (u: any) => {
          try {
            const rolesRes = await client.get(`/users/${u.id}/roles`);
            return { ...u, is_active: u.is_active !== false, roles: rolesRes.data || [] };
          } catch {
            return { ...u, is_active: u.is_active !== false, roles: [] };
          }
        })
      );
      setUsers(detailed);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleToggleStatus = async (user: any) => {
    const next = !user.is_active;
    try {
      await client.patch(`/users/${user.id}/status`, { is_active: next });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, is_active: next } : u));
      Toast.show({ type: 'success', text1: `User ${next ? 'activated' : 'deactivated'}` });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to change status' });
    }
  };

  const handleCreateUser = async () => {
    if (!formEmail || !formPassword) { Toast.show({ type: 'error', text1: 'All fields required' }); return; }
    setActionLoading(true);
    try {
      await client.post('/auth/register', { email: formEmail, password: formPassword });
      Toast.show({ type: 'success', text1: 'User created!' });
      setModalType(null); setFormEmail(''); setFormPassword('');
      fetchUsers();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to create user' });
    } finally { setActionLoading(false); }
  };

  const handleEditUser = async () => {
    if (!formEmail || !currentUser) return;
    setActionLoading(true);
    try {
      await client.put(`/users/${currentUser.id}`, { email: formEmail });
      Toast.show({ type: 'success', text1: 'Email updated!' });
      setModalType(null); fetchUsers();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update email' });
    } finally { setActionLoading(false); }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await client.delete(`/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      Toast.show({ type: 'success', text1: 'User deleted' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete user' });
    }
  };

  const handleToggleRole = async (userId: number, roleId: number, hasRole: boolean) => {
    try {
      if (hasRole) { await client.delete(`/users/${userId}/roles/${roleId}`); }
      else { await client.post(`/users/${userId}/roles`, { roleId }); }
      Toast.show({ type: 'success', text1: hasRole ? 'Role removed' : 'Role assigned' });
      fetchUsers();
      setCurrentUser((prev: any) => ({
        ...prev,
        roles: hasRole ? prev.roles.filter((r: any) => r.id !== roleId) : [...prev.roles, { id: roleId }],
      }));
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to modify role' });
    }
  };

  const filtered = users.filter((u) => u.email.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput style={styles.search} placeholder="Search by email..." placeholderTextColor="#aaa" value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.addBtn} onPress={() => { setFormEmail(''); setFormPassword(''); setModalType('create'); }}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(u) => u.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.emailText}>{item.email}</Text>
            <Text style={styles.idText}>ID: {item.id}</Text>
            <View style={styles.rolesRow}>
              {item.roles?.map((r: any) => (
                <View key={r.id} style={styles.badge}><Text style={styles.badgeText}>{r.name}</Text></View>
              ))}
              {(!item.roles || item.roles.length === 0) && <Text style={styles.noRole}>No roles</Text>}
            </View>
            <View style={styles.cardActions}>
              <View style={styles.switchRow}>
                <Switch value={item.is_active} onValueChange={() => handleToggleStatus(item)} trackColor={{ true: '#6366f1' }} />
                <Text style={styles.statusText}>{item.is_active ? 'Active' : 'Suspended'}</Text>
              </View>
              <View style={styles.actionBtns}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setCurrentUser(item); setFormEmail(item.email); setModalType('edit'); }}>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => { setCurrentUser(item); setModalType('roles'); }}>
                  <Text style={styles.actionBtnText}>Roles</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDeleteUser(item.id)}>
                  <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No users found.</Text>}
      />

      {/* CREATE / EDIT MODAL */}
      <Modal visible={modalType === 'create' || modalType === 'edit'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalType === 'create' ? 'Add New User' : 'Edit Email'}</Text>
            <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#aaa" value={formEmail} onChangeText={setFormEmail} keyboardType="email-address" autoCapitalize="none" />
            {modalType === 'create' && (
              <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#aaa" value={formPassword} onChangeText={setFormPassword} secureTextEntry />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={modalType === 'create' ? handleCreateUser : handleEditUser} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ROLES MODAL */}
      <Modal visible={modalType === 'roles'} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Manage Roles</Text>
            <Text style={styles.modalSubtitle}>{currentUser?.email}</Text>
            <ScrollView>
              {rolesList.map((role) => {
                const assigned = currentUser?.roles?.some((r: any) => r.id === role.id);
                return (
                  <View key={role.id} style={styles.roleRow}>
                    <Text style={styles.roleName}>{role.role_name}</Text>
                    <Switch value={assigned} onValueChange={() => handleToggleRole(currentUser.id, role.id, assigned)} trackColor={{ true: '#6366f1' }} />
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.saveBtn} onPress={() => setModalType(null)}>
              <Text style={styles.saveBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9', padding: 16 },
  topBar: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  search: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 13, backgroundColor: '#fff', color: '#000' },
  addBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, elevation: 1 },
  emailText: { fontSize: 14, fontWeight: '600', color: '#111' },
  idText: { fontSize: 11, color: '#aaa', marginBottom: 6 },
  rolesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 10 },
  badge: { backgroundColor: '#ede9fe', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, color: '#6366f1' },
  noRole: { fontSize: 11, color: '#aaa' },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusText: { fontSize: 12, color: '#666' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtn: { borderColor: '#fecaca' },
  actionBtnText: { fontSize: 12, color: '#333' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  modalSubtitle: { fontSize: 12, color: '#888', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: '#000' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 4 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
  roleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  roleName: { fontSize: 14, color: '#333', textTransform: 'capitalize' },
});
