import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal } from 'react-native';
import Toast from 'react-native-toast-message';
import client from '../../api/client';

export default function RolesScreen() {
  const [roles, setRoles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalType, setModalType] = useState<'create' | 'edit' | null>(null);
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await client.get('/roles');
      setRoles(res.data || []);
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to load roles' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const handleCreate = async () => {
    if (!formName) return;
    setActionLoading(true);
    try {
      await client.post('/roles', { role_name: formName });
      Toast.show({ type: 'success', text1: 'Role created!' });
      setModalType(null); setFormName(''); fetchRoles();
    } catch (err: any) {
      Toast.show({ type: 'error', text1: err.response?.data?.error || 'Failed to create role' });
    } finally { setActionLoading(false); }
  };

  const handleEdit = async () => {
    if (!formName || !currentRole) return;
    setActionLoading(true);
    try {
      await client.put(`/roles/${currentRole.id}`, { role_name: formName });
      Toast.show({ type: 'success', text1: 'Role updated!' });
      setModalType(null); setFormName(''); fetchRoles();
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to update role' });
    } finally { setActionLoading(false); }
  };

  const handleDelete = async (roleId: number) => {
    try {
      await client.delete(`/roles/${roleId}`);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
      Toast.show({ type: 'success', text1: 'Role deleted' });
    } catch {
      Toast.show({ type: 'error', text1: 'Failed to delete role' });
    }
  };

  const filtered = roles.filter((r) => r.role_name.toLowerCase().includes(search.toLowerCase()));

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" color="#6366f1" />;

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TextInput style={styles.search} placeholder="Search roles..." placeholderTextColor="#aaa" value={search} onChangeText={setSearch} />
        <TouchableOpacity style={styles.addBtn} onPress={() => { setFormName(''); setModalType('create'); }}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(r) => r.id.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.roleName}>{item.role_name}</Text>
              <Text style={styles.roleId}>ID: {item.id}</Text>
            </View>
            <View style={styles.actionBtns}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => { setCurrentRole(item); setFormName(item.role_name); setModalType('edit'); }}>
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item.id)}>
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No roles found.</Text>}
      />

      <Modal visible={modalType !== null} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{modalType === 'create' ? 'Add New Role' : 'Edit Role'}</Text>
            <TextInput
              style={styles.input}
              placeholder="Role name e.g. manager"
              placeholderTextColor="#aaa"
              value={formName}
              onChangeText={setFormName}
              autoCapitalize="none"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalType(null)}><Text>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={modalType === 'create' ? handleCreate : handleEdit} disabled={actionLoading}>
                {actionLoading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
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
  card: { backgroundColor: '#fff', borderRadius: 8, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 1 },
  roleName: { fontSize: 14, fontWeight: '600', color: '#111', textTransform: 'capitalize' },
  roleId: { fontSize: 11, color: '#aaa' },
  actionBtns: { flexDirection: 'row', gap: 6 },
  actionBtn: { borderWidth: 1, borderColor: '#ddd', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  deleteBtn: { borderColor: '#fecaca' },
  actionBtnText: { fontSize: 12, color: '#333' },
  empty: { textAlign: 'center', color: '#aaa', marginTop: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  modalBox: { backgroundColor: '#fff', borderRadius: 12, padding: 20 },
  modalTitle: { fontSize: 16, fontWeight: '700', marginBottom: 14 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 14, color: '#000' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: { backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
