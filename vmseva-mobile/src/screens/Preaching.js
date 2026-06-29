import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import api from '../api';
import { theme } from '../styles/theme';

export default function Preaching({ navigation }) {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  // Creation/Edit Form States
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '' });

  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(null);
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptMembers, setDeptMembers] = useState([]);
  const [addMemberForm, setAddMemberForm] = useState({ user_id: '', role: '' });
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Sorting & Search States
  const [sortBy, setSortBy] = useState('name'); // name, membersCount, createdAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [searchQuery, setSearchQuery] = useState('');

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 2500);
  }, []);

  // API Call: Fetch all events
  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/preaching/events');
      setEvents(data);
      if (data.length > 0 && !selectedEvent) {
        setSelectedEvent(data[0]);
      }
    } catch (err) {
      flash('Failed to load events list', false);
    } finally {
      setLoading(false);
    }
  }, [selectedEvent, flash]);

  // API Call: Fetch departments of selected event
  const loadDepartments = useCallback(async (eventId) => {
    if (!eventId) return;
    setDeptLoading(true);
    try {
      const { data } = await api.get(`/preaching/events/${eventId}/departments`, {
        params: { sortBy, order: sortOrder }
      });
      setDepartments(data);
    } catch (err) {
      flash('Failed to load departments', false);
    } finally {
      setDeptLoading(false);
    }
  }, [sortBy, sortOrder, flash]);

  // API Call: Fetch system users (for member assignments)
  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/preaching/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users cache', err);
    }
  }, []);

  // API Call: Fetch department members
  const loadDeptMembers = useCallback(async (deptId) => {
    try {
      const { data } = await api.get(`/preaching/departments/${deptId}/members`);
      setDeptMembers(data);
    } catch (err) {
      flash('Failed to load department members', false);
    }
  }, [flash]);

  useEffect(() => {
    loadEvents();
    loadUsers();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      loadDepartments(selectedEvent.id);
      setSelectedDeptId(null);
      setDeptMembers([]);
    }
  }, [selectedEvent, sortBy, sortOrder, loadDepartments]);

  useEffect(() => {
    if (selectedDeptId) {
      loadDeptMembers(selectedDeptId);
    }
  }, [selectedDeptId, loadDeptMembers]);

  // Event handlers
  const handleAddEvent = async () => {
    if (!newEvent.title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }
    try {
      const { data } = await api.post('/preaching/events', newEvent);
      setShowAddEvent(false);
      setNewEvent({ title: '', description: '', event_date: '' });
      flash('Event created successfully');
      loadEvents();
      setSelectedEvent(data);
    } catch (err) {
      flash('Failed to create event', false);
    }
  };

  const handleUpdateEvent = async () => {
    if (!showEditEvent.title.trim()) {
      Alert.alert('Error', 'Event title is required');
      return;
    }
    try {
      const { data } = await api.put(`/preaching/events/${showEditEvent.id}`, showEditEvent);
      setShowEditEvent(null);
      flash('Event updated successfully');
      loadEvents();
      setSelectedEvent(data);
    } catch (err) {
      flash('Failed to update event', false);
    }
  };

  const handleDeleteEvent = async (id) => {
    Alert.alert(
      'Delete Event',
      'Are you sure you want to delete this event? This will remove all its departments and assignments.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/preaching/events/${id}`);
              flash('Event deleted');
              setSelectedEvent(null);
              loadEvents();
            } catch (err) {
              flash('Failed to delete event', false);
            }
          }
        }
      ]
    );
  };

  // Department handlers
  const handleAddDept = async () => {
    if (!newDept.name.trim() || !selectedEvent) {
      Alert.alert('Error', 'Department name is required');
      return;
    }
    try {
      await api.post(`/preaching/events/${selectedEvent.id}/departments`, newDept);
      setShowAddDept(false);
      setNewDept({ name: '', description: '' });
      flash('Department created!');
      loadDepartments(selectedEvent.id);
    } catch (err) {
      flash('Failed to create department', false);
    }
  };

  const handleUpdateDept = async () => {
    if (!showEditDept.name.trim()) {
      Alert.alert('Error', 'Department name is required');
      return;
    }
    try {
      await api.put(`/preaching/departments/${showEditDept.id}`, showEditDept);
      setShowEditDept(null);
      flash('Department updated!');
      loadDepartments(selectedEvent.id);
    } catch (err) {
      flash('Failed to update department', false);
    }
  };

  const handleDeleteDept = async (deptId) => {
    Alert.alert(
      'Delete Department',
      'Are you sure you want to delete this department?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/preaching/departments/${deptId}`);
              flash('Department removed');
              if (selectedDeptId === deptId) setSelectedDeptId(null);
              loadDepartments(selectedEvent.id);
            } catch (err) {
              flash('Failed to delete department', false);
            }
          }
        }
      ]
    );
  };

  // Member handlers
  const handleAddDeptMember = async () => {
    if (!addMemberForm.user_id || !selectedDeptId) {
      Alert.alert('Error', 'Please select a user');
      return;
    }
    try {
      await api.post(`/preaching/departments/${selectedDeptId}/members`, addMemberForm);
      setAddMemberForm({ user_id: '', role: '' });
      flash('Member assigned successfully');
      loadDeptMembers(selectedDeptId);
      loadDepartments(selectedEvent.id); // update members count badge
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to assign member', false);
    }
  };

  const handleRemoveDeptMember = async (userId) => {
    if (!selectedDeptId) return;
    try {
      await api.delete(`/preaching/departments/${selectedDeptId}/members/${userId}`);
      flash('Member removed');
      loadDeptMembers(selectedDeptId);
      loadDepartments(selectedEvent.id);
    } catch (err) {
      flash('Failed to remove member', false);
    }
  };

  // Client-side search filtering over departments
  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) return departments;
    return departments.filter(d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [departments, searchQuery]);

  const selectedUserObject = useMemo(() => {
    return users.find(u => u.id.toString() === addMemberForm.user_id);
  }, [users, addMemberForm.user_id]);

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER NAVBAR */}
      <View style={s.navBar}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={s.brand}>Preaching Management</Text>
        <View style={{ width: 60 }} />
      </View>

      {/* FLASH TOAST */}
      {msg.text ? (
        <View style={[s.toast, { backgroundColor: msg.ok ? 'rgba(2, 132, 199, 0.95)' : 'rgba(239, 68, 68, 0.95)' }]}>
          <Text style={s.toastText}>{msg.text}</Text>
        </View>
      ) : null}

      {/* EVENT TABS */}
      <View style={{ height: 65, borderBottomWidth: 1, borderBottomColor: '#222', backgroundColor: '#161e2e' }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, alignItems: 'center', gap: 10 }}>
          <TouchableOpacity style={[s.addEventTab, { backgroundColor: theme.colors.primary }]} onPress={() => setShowAddEvent(true)}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>+ New Event</Text>
          </TouchableOpacity>

          {events.map(ev => (
            <TouchableOpacity
              key={ev.id}
              style={[s.eventTab, selectedEvent?.id === ev.id && s.eventTabActive]}
              onPress={() => setSelectedEvent(ev)}
            >
              <Text style={[s.eventTabText, selectedEvent?.id === ev.id && s.eventTabTextActive]}>{ev.title}</Text>
              <Text style={s.eventTabDate}>{ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'No date'}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* MAIN SCREEN CONTENT */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        {selectedEvent ? (
          <View style={{ gap: 16 }}>
            {/* Event Description Card */}
            <View style={s.eventHeaderCard}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={s.eventHeaderTitle}>{selectedEvent.title}</Text>
                  <Text style={s.eventHeaderDesc}>{selectedEvent.description || 'No description'}</Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <TouchableOpacity style={s.actionBtn} onPress={() => setShowEditEvent(selectedEvent)}>
                    <Text style={s.actionBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.actionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]} onPress={() => handleDeleteEvent(selectedEvent.id)}>
                    <Text style={[s.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Sorting & Search Controls */}
            <View style={s.controlsCard}>
              <View style={s.searchRow}>
                <TextInput
                  style={s.searchInput}
                  placeholder="Search departments..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                <TouchableOpacity style={s.addDeptBtn} onPress={() => setShowAddDept(true)}>
                  <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>+ Dept</Text>
                </TouchableOpacity>
              </View>

              <View style={s.sortingRow}>
                <Text style={{ color: '#94a3b8', fontSize: 11, fontWeight: '600' }}>Sort By:</Text>
                
                <TouchableOpacity style={[s.sortOpt, sortBy === 'name' && s.sortOptActive]} onPress={() => setSortBy('name')}>
                  <Text style={[s.sortOptText, sortBy === 'name' && s.sortOptTextActive]}>Name</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.sortOpt, sortBy === 'membersCount' && s.sortOptActive]} onPress={() => setSortBy('membersCount')}>
                  <Text style={[s.sortOptText, sortBy === 'membersCount' && s.sortOptTextActive]}>Members</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.sortOpt, sortBy === 'createdAt' && s.sortOptActive]} onPress={() => setSortBy('createdAt')}>
                  <Text style={[s.sortOptText, sortBy === 'createdAt' && s.sortOptTextActive]}>Date</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.orderToggle} onPress={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                  <Text style={{ color: '#38bdf8', fontSize: 11, fontWeight: 'bold' }}>{sortOrder.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Department List */}
            <Text style={s.sectionTitle}>Departments</Text>
            {deptLoading ? (
              <ActivityIndicator color={theme.colors.primary} style={{ marginVertical: 20 }} />
            ) : filteredDepartments.length === 0 ? (
              <Text style={s.emptyText}>No departments found for this event.</Text>
            ) : (
              filteredDepartments.map(d => (
                <TouchableOpacity
                  key={d.id}
                  style={[s.deptItemCard, selectedDeptId === d.id && s.deptItemCardActive]}
                  onPress={() => setSelectedDeptId(d.id)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.deptName}>{d.name}</Text>
                    <View style={{ flexDirection: 'row', gap: 10 }}>
                      <TouchableOpacity onPress={() => setShowEditDept(d)}>
                        <Text style={{ color: '#38bdf8', fontSize: 12 }}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDeleteDept(d.id)}>
                        <Text style={{ color: '#ef4444', fontSize: 12 }}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={s.deptDesc}>{d.description || 'No description provided'}</Text>
                  <View style={s.deptBadge}>
                    <Text style={s.deptBadgeText}>{d.members_count || 0} Members</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Selected Department Members Panel */}
            {selectedDeptId && (
              <View style={s.membersPanel}>
                <Text style={s.panelTitle}>Department Members Management</Text>

                {/* Add Member Component */}
                <View style={s.addMemberForm}>
                  <Text style={s.label}>Assign System User</Text>
                  
                  {/* Custom dropdown trigger */}
                  <TouchableOpacity style={s.dropdownTrigger} onPress={() => setShowUserDropdown(!showUserDropdown)}>
                    <Text style={{ color: '#fff', fontSize: 13 }}>
                      {selectedUserObject ? `${selectedUserObject.full_name} (${selectedUserObject.email})` : 'Select user...'}
                    </Text>
                    <Text style={{ color: '#64748b' }}>▼</Text>
                  </TouchableOpacity>

                  {showUserDropdown && (
                    <View style={s.dropdownList}>
                      <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                        {users.map(u => (
                          <TouchableOpacity
                            key={u.id}
                            style={s.dropdownItem}
                            onPress={() => {
                              setAddMemberForm({ ...addMemberForm, user_id: u.id.toString() });
                              setShowUserDropdown(false);
                            }}
                          >
                            <Text style={{ color: '#fff', fontSize: 12 }}>{u.full_name} ({u.email})</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}

                  <TextInput
                    style={[s.searchInput, { marginTop: 10 }]}
                    placeholder="Role (e.g. Coordinator, Volunteer)"
                    placeholderTextColor="#64748b"
                    value={addMemberForm.role}
                    onChangeText={role => setAddMemberForm({ ...addMemberForm, role })}
                  />

                  <TouchableOpacity style={s.submitBtn} onPress={handleAddDeptMember}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>Assign Member</Text>
                  </TouchableOpacity>
                </View>

                {/* Members List */}
                <View style={{ gap: 8 }}>
                  {deptMembers.length === 0 ? (
                    <Text style={s.emptyMutedText}>No members assigned yet.</Text>
                  ) : (
                    deptMembers.map(m => (
                      <View key={m.user_id} style={s.memberRow}>
                        <View>
                          <Text style={s.memberName}>{m.full_name}</Text>
                          <Text style={s.memberRole}>{m.role || 'Volunteer'}</Text>
                        </View>
                        <TouchableOpacity style={s.removeBtn} onPress={() => handleRemoveDeptMember(m.user_id)}>
                          <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>Remove</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              </View>
            )}
          </View>
        ) : (
          <View style={s.emptyState}>
            <Text style={{ fontSize: 32 }}>📅</Text>
            <Text style={{ color: '#64748b', fontSize: 14, fontWeight: '500', marginTop: 10 }}>
              Select or create an event to get started
            </Text>
          </View>
        )}
      </ScrollView>

      {/* MODALS */}
      {/* 1. Add Event */}
      {showAddEvent && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>New Event</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Event Title"
              placeholderTextColor="#64748b"
              value={newEvent.title}
              onChangeText={title => setNewEvent({ ...newEvent, title })}
            />
            <TextInput
              style={[s.modalInput, { height: 60 }]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              multiline
              value={newEvent.description}
              onChangeText={description => setNewEvent({ ...newEvent, description })}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Date (e.g. YYYY-MM-DD)"
              placeholderTextColor="#64748b"
              value={newEvent.event_date}
              onChangeText={event_date => setNewEvent({ ...newEvent, event_date })}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnSec} onPress={() => setShowAddEvent(false)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPrim} onPress={handleAddEvent}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </div>
      )}

      {/* 2. Edit Event */}
      {showEditEvent && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit Event</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Event Title"
              placeholderTextColor="#64748b"
              value={showEditEvent.title}
              onChangeText={title => setShowEditEvent({ ...showEditEvent, title })}
            />
            <TextInput
              style={[s.modalInput, { height: 60 }]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              multiline
              value={showEditEvent.description || ''}
              onChangeText={description => setShowEditEvent({ ...showEditEvent, description })}
            />
            <TextInput
              style={s.modalInput}
              placeholder="Date (e.g. YYYY-MM-DD)"
              placeholderTextColor="#64748b"
              value={showEditEvent.event_date ? showEditEvent.event_date.split('T')[0] : ''}
              onChangeText={event_date => setShowEditEvent({ ...showEditEvent, event_date })}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnSec} onPress={() => setShowEditEvent(null)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPrim} onPress={handleUpdateEvent}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </div>
      )}

      {/* 3. Add Dept */}
      {showAddDept && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>New Department</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Department Name"
              placeholderTextColor="#64748b"
              value={newDept.name}
              onChangeText={name => setNewDept({ ...newDept, name })}
            />
            <TextInput
              style={[s.modalInput, { height: 60 }]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              multiline
              value={newDept.description}
              onChangeText={description => setNewDept({ ...newDept, description })}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnSec} onPress={() => setShowAddDept(false)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPrim} onPress={handleAddDept}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </div>
      )}

      {/* 4. Edit Dept */}
      {showEditDept && (
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Edit Department</Text>
            <TextInput
              style={s.modalInput}
              placeholder="Department Name"
              placeholderTextColor="#64748b"
              value={showEditDept.name}
              onChangeText={name => setShowEditDept({ ...showEditDept, name })}
            />
            <TextInput
              style={[s.modalInput, { height: 60 }]}
              placeholder="Description"
              placeholderTextColor="#64748b"
              multiline
              value={showEditDept.description || ''}
              onChangeText={description => setShowEditDept({ ...showEditDept, description })}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.btnSec} onPress={() => setShowEditDept(null)}>
                <Text style={{ color: '#fff' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnPrim} onPress={handleUpdateDept}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </div>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0b0f19' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { padding: 4 },
  backBtnText: { color: '#38bdf8', fontSize: 12, fontWeight: '600' },
  brand: { fontSize: 14, fontWeight: '700', color: '#fff' },
  
  addEventTab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6, justifyContent: 'center' },
  eventTab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', justifyContent: 'center' },
  eventTabActive: { backgroundColor: '#0284c7', borderColor: '#38bdf8' },
  eventTabText: { fontSize: 12, fontWeight: '600', color: '#94a3b8' },
  eventTabTextActive: { color: '#fff' },
  eventTabDate: { fontSize: 9, color: '#64748b', marginTop: 2 },

  scroll: { flex: 1 },
  scrollContent: { padding: 16 },

  eventHeaderCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14 },
  eventHeaderTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  eventHeaderDesc: { color: '#94a3b8', fontSize: 12, marginTop: 4 },

  actionBtn: { paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 6 },
  actionBtnText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },

  controlsCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 12, gap: 10 },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, height: 38, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, color: '#fff', fontSize: 13, backgroundColor: '#0b0f19' },
  addDeptBtn: { backgroundColor: '#0284c7', paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },

  sortingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sortOpt: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#1e293b' },
  sortOptActive: { backgroundColor: '#0369a1' },
  sortOptText: { color: '#94a3b8', fontSize: 11, fontWeight: '500' },
  sortOptTextActive: { color: '#fff' },
  orderToggle: { marginLeft: 'auto', paddingHorizontal: 8 },

  sectionTitle: { color: '#38bdf8', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 8 },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', marginVertical: 20 },

  deptItemCard: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, gap: 6 },
  deptItemCardActive: { borderColor: '#38bdf8', backgroundColor: '#0f172a' },
  deptName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  deptDesc: { color: '#94a3b8', fontSize: 12 },
  deptBadge: { backgroundColor: '#0369a1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, width: 'fit-content', alignSelf: 'flex-start' },
  deptBadgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },

  membersPanel: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 12, padding: 14, gap: 14 },
  panelTitle: { color: '#fff', fontSize: 13, fontWeight: '700', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 6 },
  addMemberForm: { backgroundColor: '#0b0f19', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8, padding: 12 },
  label: { color: '#94a3b8', fontSize: 11, fontWeight: '600', marginBottom: 6 },
  dropdownTrigger: { height: 38, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, backgroundColor: '#0b0f19', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownList: { borderWidth: 1, borderColor: '#334155', borderRadius: 8, backgroundColor: '#0f172a', marginTop: 4, padding: 4 },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  submitBtn: { backgroundColor: '#0284c7', borderRadius: 8, height: 38, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  
  emptyMutedText: { color: '#64748b', fontSize: 11, fontStyle: 'italic', textAlign: 'center', marginVertical: 10 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  memberName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  memberRole: { color: '#38bdf8', fontSize: 10, marginTop: 2 },
  removeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 300 },

  toast: { position: 'absolute', top: 50, left: 16, right: 16, zIndex: 1100, borderRadius: 8, padding: 12, alignItems: 'center', justifyContent: 'center' },
  toastText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },

  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalContent: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 16, padding: 20, width: '90%', gap: 12 },
  modalTitle: { color: '#fff', fontSize: 15, fontWeight: '700' },
  modalInput: { height: 38, borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 12, color: '#fff', fontSize: 13, backgroundColor: '#0b0f19' },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 },
  btnSec: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b' },
  btnPrim: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0284c7' },
});
