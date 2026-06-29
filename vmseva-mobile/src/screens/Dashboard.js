import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import api, { usersAPI, modulesAPI } from '../api';
import { theme } from '../styles/theme';

const PAGE_SIZE = 10; // Change to 10 for cleaner phone layout

export default function Dashboard({ navigation }) {
  const { user, logout, hasRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [allRoles, setAllRoles] = useState([]);
  const [userRoles, setUserRoles] = useState({});
  const [logs, setLogs] = useState([]);
  const [msg, setMsg] = useState({ text: '', ok: true });
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('users');
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState([]);
  const [moduleInput, setModuleInput] = useState('');
  const [moduleDesc, setModuleDesc] = useState('');
  const [moduleActive, setModuleActive] = useState(true);
  const [userPage, setUserPage] = useState(1);
  const [logPage, setLogPage] = useState(1);
  const [expandedModuleId, setExpandedModuleId] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [moduleRoleFilters, setModuleRoleFilters] = useState({});
  const [activeModuleDropdown, setActiveModuleDropdown] = useState(null);

  const isAdmin = hasRole('Admin');
  const isPreachingUser = user?.roles?.some(r => {
    const n = r.name.toLowerCase();
    return n.includes('admin') || n.includes('counselor') || n.includes('counsellor') || n.includes('internal manager') || n.includes('im') || n.includes('incharge') || n.includes('in-charge') || n.includes('ic') || n.includes('assistant') || n.includes('mentor') || n.includes('frontliner');
  });

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 2000);
  }, []);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const [usersRes, rolesRes, logsRes, modulesRes] = await Promise.all([
        usersAPI.getAll(),
        api.get('/admin/roles'),
        api.get('/admin/audit-logs').catch(() => ({ data: [] })),
        modulesAPI.getAll().catch(() => ({ data: [] })),
      ]);
      setUsers(usersRes.data);
      setAllRoles(rolesRes.data);
      setLogs(logsRes.data);
      setModules(modulesRes.data);

      const map = {};
      await Promise.all(
        usersRes.data.map(async (u) => {
          try {
            const { data } = await usersAPI.getRoles(u.id);
            map[u.id] = data;
          } catch {
            map[u.id] = [];
          }
        })
      );
      setUserRoles(map);
    } catch (err) {
      flash('Failed to load dashboard data', false);
    } finally {
      setLoading(false);
    }
  }, [isAdmin, flash]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleRole = useCallback(
    async (userId, role) => {
      const current = userRoles[userId] || [];
      const has = current.some((r) => r.id === role.id);
      const optimistic = has
        ? current.filter((r) => r.id !== role.id)
        : [...current, role];

      setUserRoles((prev) => ({ ...prev, [userId]: optimistic }));
      try {
        if (has) {
          await usersAPI.removeRole(userId, role.id);
        } else {
          await usersAPI.assignRole(userId, role.id);
        }
        flash(has ? `− ${role.name}` : `+ ${role.name}`);
      } catch (err) {
        setUserRoles((prev) => ({ ...prev, [userId]: current }));
        flash('Failed to update role', false);
      }
    },
    [userRoles, flash]
  );

  const toggleStatus = useCallback(
    async (id) => {
      const u = users.find((u) => u.id === id);
      if (!u) return;

      setUsers((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, is_active: !item.is_active } : item
        )
      );

      try {
        await usersAPI.toggleStatus(id);
        flash(u.is_active ? 'Deactivated' : 'Activated');
      } catch (err) {
        setUsers((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, is_active: !item.is_active } : item
          )
        );
        flash('Failed to toggle status', false);
      }
    },
    [users, flash]
  );

  const handleCreateModule = useCallback(async () => {
    if (!moduleInput.trim()) return;
    try {
      const { data } = await modulesAPI.create({
        name: moduleInput.trim(),
        description: moduleDesc.trim() || null,
        active: moduleActive
      });
      setModules(prev => [...prev, data]);
      setModuleInput('');
      setModuleDesc('');
      setModuleActive(true);
      flash('Module created successfully');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch (err) {
      flash(err.response?.data?.message || 'Failed to create module', false);
    }
  }, [moduleInput, moduleDesc, moduleActive, flash]);

  const handleToggleModuleStatus = useCallback(async (id) => {
    try {
      const { data } = await modulesAPI.toggleStatus(id);
      setModules(prev => prev.map(m => m.id === id ? { ...m, active: data.active } : m));
      flash(data.active ? 'Module activated' : 'Module deactivated');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      flash('Failed to toggle status', false);
    }
  }, [flash]);

  const handleDeleteModule = useCallback(async (id) => {
    try {
      await modulesAPI.delete(id);
      setModules(prev => prev.filter(m => m.id !== id));
      flash('Module deleted');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      flash('Failed to delete module', false);
    }
  }, [flash]);

  const handleAssignModule = useCallback(async (userId, moduleName) => {
    const prevUsers = [...users];
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, module: moduleName || null } : u));
    try {
      await usersAPI.assignModule(userId, moduleName || null);
      flash(moduleName ? `Assigned to ${moduleName}` : 'Module unassigned');
      api.get('/admin/audit-logs').then(r => setLogs(r.data)).catch(() => { });
    } catch {
      setUsers(prevUsers);
      flash('Failed to assign module', false);
    }
  }, [users, flash]);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.full_name || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalUserPages = Math.ceil(filteredUsers.length / PAGE_SIZE);
  const paginatedUsers = filteredUsers.slice((userPage - 1) * PAGE_SIZE, userPage * PAGE_SIZE);

  const totalLogPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginatedLogs = logs.slice((logPage - 1) * PAGE_SIZE, logPage * PAGE_SIZE);
  const renderUserItem = ({ item, index }) => {
    const isMe = item.id === user?.id;
    const exp = expandedId === item.id;
    const roles = userRoles[item.id] || [];
    const rowNum = (userPage - 1) * PAGE_SIZE + index + 1;

    return (
      <View style={s.userRowContainer}>
        <View style={[s.userRow, exp && s.userRowExpandedActive]}>
          <Text style={s.rowNum}>{rowNum}</Text>

          <View style={s.avatarCol}>
            <View style={s.uAvatar}>
              <Text style={s.uAvatarText}>
                {(item.full_name || item.email)[0].toUpperCase()}
              </Text>
            </View>
          </View>

          <View style={s.infoCol}>
            <View style={s.nameContainer}>
              <Text style={s.userName} numberOfLines={1}>
                {item.full_name || '—'}
              </Text>
              {isMe && <Text style={s.meBadge}>me</Text>}
            </View>
            <Text style={s.userEmail} numberOfLines={1}>
              {item.email}
            </Text>

            <View style={s.roleTagsContainer}>
              {item.module && (
                <View style={s.moduleTagMobile}>
                  <Text style={s.moduleTagMobileText}>{item.module}</Text>
                </View>
              )}
              {roles.length > 0 ? (
                roles.map((r) => (
                  <View key={r.id} style={s.roleTag}>
                    <Text style={s.roleTagText}>{r.name}</Text>
                  </View>
                ))
              ) : (
                !item.module && <Text style={s.noRolesText}>—</Text>
              )}
            </View>
          </View>

          <View style={s.statusCol}>
            <View style={[s.statusBadge, item.is_active ? s.statusBadgeActive : s.statusBadgeInactive]}>
              <Text style={[s.statusBadgeText, item.is_active ? s.statusTextActive : s.statusTextInactive]}>
                {item.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>

          <View style={s.actionsCol}>
            {!isMe && (
              <View style={s.actionButtons}>
                <TouchableOpacity
                  style={s.abButton}
                  onPress={() => toggleStatus(item.id)}
                >
                  <Text style={s.abButtonText}>
                    {item.is_active ? 'Deact' : 'Act'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.abButton, exp && s.abButtonActive]}
                  onPress={() => setExpandedId(exp ? null : item.id)}
                >
                  <Text style={[s.abButtonText, exp && s.abButtonTextActive]}>
                    Manage
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Roles & Module assignment collapsible view */}
        {exp && (
          <View style={s.roleSelectionPanel}>
            <Text style={s.roleSelectionTitle}>Assign roles:</Text>
            <View style={s.rolesButtonGrid}>
              {allRoles.map((role) => {
                const has = roles.some((r) => r.id === role.id);
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={[s.roleChoiceButton, has && s.roleChoiceButtonSelected]}
                    onPress={() => toggleRole(item.id, role)}
                  >
                    <Text style={[s.roleChoiceText, has && s.roleChoiceTextSelected]}>
                      {has ? '✓ ' : ''}{role.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[s.roleSelectionTitle, { marginTop: 12 }]}>Assign module:</Text>
            <View style={s.rolesButtonGrid}>
              <TouchableOpacity
                style={[s.roleChoiceButton, !item.module && s.roleChoiceButtonSelected, { borderColor: '#555' }]}
                onPress={() => handleAssignModule(item.id, null)}
              >
                <Text style={[s.roleChoiceText, !item.module && s.roleChoiceTextSelected]}>
                  No Module
                </Text>
              </TouchableOpacity>
              {modules.map((m) => {
                const has = item.module === m.name;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[s.roleChoiceButton, has && s.roleChoiceButtonSelected, { borderColor: '#00cc6633' }]}
                    onPress={() => handleAssignModule(item.id, m.name)}
                  >
                    <Text style={[s.roleChoiceText, has && s.roleChoiceTextSelected]}>
                      {has ? '✓ ' : ''}{m.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderLogItem = ({ item, index }) => {
    const isExpanded = expandedLogId === item.id;
    const rowNum = (logPage - 1) * PAGE_SIZE + index + 1;
    return (
      <View style={s.logRowContainer}>
        <View style={s.logRow}>
          <TouchableOpacity
            style={s.logNumBtn}
            onPress={() => setExpandedLogId(isExpanded ? null : item.id)}
          >
            <Text style={s.logNumText}>{rowNum}</Text>
          </TouchableOpacity>
          <View style={s.logActionCol}>
            <View style={s.logTagContainer}>
              <Text style={s.logTagText}>{item.action}</Text>
            </View>
          </View>
          <View style={s.logUserCol}>
            <Text style={s.logUserText} numberOfLines={1}>{item.performed_by || 'system'}</Text>
            <Text style={s.logIpText}>{item.ip_address}</Text>
          </View>
          <View style={s.logDateCol}>
            <Text style={s.logDateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
            <Text style={s.logTimeText}>{new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </View>
        </View>
        {isExpanded && (
          <View style={s.logDetailPanel}>
            <Text style={s.logDetailTitle}>Log Details:</Text>
            <View style={s.logDetailRow}>
              <Text style={s.logDetailLabel}>Target Type: </Text>
              <Text style={s.logDetailValue}>{item.target_type || '—'}</Text>
            </View>
            <View style={s.logDetailRow}>
              <Text style={s.logDetailLabel}>Target ID: </Text>
              <Text style={s.logDetailValue}>{item.target_id || '—'}</Text>
            </View>
            {item.meta && (
              <View style={s.logDetailRow}>
                <Text style={s.logDetailLabel}>Metadata: </Text>
                <Text style={s.logDetailValue}>{JSON.stringify(item.meta, null, 2)}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

  const renderUserPagination = () => {
    if (totalUserPages <= 1) return null;
    return (
      <View style={s.pagContainer}>
        <Text style={s.pagInfo}>
          {(userPage - 1) * PAGE_SIZE + 1}–{Math.min(userPage * PAGE_SIZE, filteredUsers.length)} of {filteredUsers.length}
        </Text>
        <View style={s.pagButtons}>
          <TouchableOpacity
            style={[s.pagBtn, userPage === 1 && s.pagBtnDisabled]}
            disabled={userPage === 1}
            onPress={() => setUserPage(p => p - 1)}
          >
            <Text style={s.pagBtnText}>←</Text>
          </TouchableOpacity>
          {Array.from({ length: totalUserPages }, (_, i) => i + 1).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.pagBtn, userPage === p && s.pagBtnActive]}
              onPress={() => setUserPage(p)}
            >
              <Text style={[s.pagBtnText, userPage === p && s.pagBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.pagBtn, userPage === totalUserPages && s.pagBtnDisabled]}
            disabled={userPage === totalUserPages}
            onPress={() => setUserPage(p => p + 1)}
          >
            <Text style={s.pagBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderLogPagination = () => {
    if (totalLogPages <= 1) return null;
    return (
      <View style={s.pagContainer}>
        <Text style={s.pagInfo}>
          {(logPage - 1) * PAGE_SIZE + 1}–{Math.min(logPage * PAGE_SIZE, logs.length)} of {logs.length}
        </Text>
        <View style={s.pagButtons}>
          <TouchableOpacity
            style={[s.pagBtn, logPage === 1 && s.pagBtnDisabled]}
            disabled={logPage === 1}
            onPress={() => setLogPage(p => p - 1)}
          >
            <Text style={s.pagBtnText}>←</Text>
          </TouchableOpacity>
          {Array.from({ length: totalLogPages }, (_, i) => i + 1).map((p) => (
            <TouchableOpacity
              key={p}
              style={[s.pagBtn, logPage === p && s.pagBtnActive]}
              onPress={() => setLogPage(p)}
            >
              <Text style={[s.pagBtnText, logPage === p && s.pagBtnTextActive]}>{p}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.pagBtn, logPage === totalLogPages && s.pagBtnDisabled]}
            disabled={logPage === totalLogPages}
            onPress={() => setLogPage(p => p + 1)}
          >
            <Text style={s.pagBtnText}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Toast Alert Flash Messages */}
      {msg.text ? (
        <View
          style={[
            s.toast,
            {
              backgroundColor: msg.ok ? 'rgba(0, 204, 102, 0.15)' : 'rgba(255, 68, 68, 0.15)',
              borderColor: msg.ok ? 'rgba(0, 204, 102, 0.3)' : 'rgba(255, 68, 68, 0.3)',
            },
          ]}
        >
          <Text style={[s.toastText, { color: msg.ok ? theme.colors.success : theme.colors.error }]}>
            {msg.text}
          </Text>
        </View>
      ) : null}

      {/* Header bar */}
      <View style={s.navBar}>
        <Text style={s.brand}>VMSeva</Text>
        <View style={s.navActions}>
          {isPreachingUser && (
            <TouchableOpacity
              style={[s.profileBtn, { backgroundColor: 'rgba(108,99,255,0.1)', borderColor: '#6c63ff', marginRight: 6 }]}
              onPress={() => navigation.navigate('Preaching')}
            >
              <Text style={[s.profileBtnText, { color: '#8b85ff' }]}>Preaching</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={s.profileBtn}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={s.profileBtnText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.logoutBtn} onPress={logout}>
            <Text style={s.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading && users.length === 0 ? (
        <View style={s.centerLoading}>
          <ActivityIndicator size="large" color={theme.colors.text} />
        </View>
      ) : (
        <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Welcome User Card */}
          <View style={s.welcomeCard}>
            <View style={s.welcomeAvatar}>
              <Text style={s.welcomeAvatarText}>
                {(user?.full_name || user?.email || '?')[0].toUpperCase()}
              </Text>
            </View>
            <View style={s.welcomeInfo}>
              <Text style={s.welcomeName}>Welcome, {user?.full_name || user?.email}</Text>
              <Text style={s.welcomeSub}>
                {user?.roles?.map((r) => r.name).join(' · ') || 'No roles'}
              </Text>
            </View>
          </View>

          {/* Non-Admin dashboard */}
          {!isAdmin && (
            <View style={s.card}>
              <Text style={s.cardLabel}>Your Account</Text>
              <View style={s.nonAdminStatusRow}>
                <View style={[s.statusDot, user?.is_active ? s.dotActive : s.dotInactive]} />
                <Text style={s.nonAdminStatusText}>
                  {user?.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
              <View style={s.nonAdminRolesContainer}>
                {user?.roles?.length ? (
                  user.roles.map((r) => (
                    <View key={r.id} style={s.nonAdminRoleBadge}>
                      <Text style={s.nonAdminRoleText}>{r.name}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={s.mutedText}>No roles assigned</Text>
                )}
              </View>
            </View>
          )}

          {/* Admin Dashboard */}
          {isAdmin && (
            <View>
              {/* Stats Grid */}
              <View style={s.statsGrid}>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: '#6c63ff' }]}>{users.length}</Text>
                  <Text style={s.statLabel}>Total Users</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: theme.colors.success }]}>
                    {users.filter((u) => u.is_active).length}
                  </Text>
                  <Text style={s.statLabel}>Active</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: theme.colors.error }]}>
                    {users.filter((u) => !u.is_active).length}
                  </Text>
                  <Text style={s.statLabel}>Inactive</Text>
                </View>
                <View style={s.statCard}>
                  <Text style={[s.statNum, { color: theme.colors.warning }]}>{logs.length}</Text>
                  <Text style={s.statLabel}>Audit Logs</Text>
                </View>
              </View>
              {/* Tabs selector */}
              <View style={s.tabBar}>
                <TouchableOpacity
                  style={[s.tabButton, tab === 'users' && s.tabButtonActive]}
                  onPress={() => { setTab('users'); setUserPage(1); }}
                >
                  <Text style={[s.tabText, tab === 'users' && s.tabTextActive]}>Users</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabButton, tab === 'modules' && s.tabButtonActive]}
                  onPress={() => setTab('modules')}
                >
                  <Text style={[s.tabText, tab === 'modules' && s.tabTextActive]}>Modules</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.tabButton, tab === 'logs' && s.tabButtonActive]}
                  onPress={() => { setTab('logs'); setLogPage(1); }}
                >
                  <Text style={[s.tabText, tab === 'logs' && s.tabTextActive]}>Audit Logs</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar for Users tab */}
              {tab === 'users' && (
                <TextInput
                  style={s.searchBar}
                  placeholder="Search users..."
                  placeholderTextColor={theme.colors.textMuted}
                  value={search}
                  onChangeText={(text) => { setSearch(text); setUserPage(1); }}
                  autoCapitalize="none"
                />
              )}

              {/* Data sheets */}
              {tab === 'users' && (
                <View>
                  <View style={s.sheet}>
                    <View style={s.colHead}>
                      <Text style={[s.colHeadText, s.chNum]}>#</Text>
                      <Text style={[s.colHeadText, s.chUser]}>User / Modules</Text>
                      <Text style={[s.colHeadText, s.chStatus]}>Status</Text>
                      <Text style={[s.colHeadText, s.chActions]}>Actions</Text>
                    </View>
                    <FlatList
                      data={paginatedUsers}
                      renderItem={renderUserItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                      ListEmptyComponent={
                        <Text style={s.emptyText}>No users found</Text>
                      }
                    />
                  </View>
                  {renderUserPagination()}
                </View>
              )}

              {/* Modules Tab */}
              {tab === 'modules' && (
                <View style={{ gap: 16 }}>
                  <View style={s.card}>
                    <Text style={s.cardLabel}>Create New Module</Text>
                    <TextInput
                      style={s.searchBar}
                      placeholder="Enter module name..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={moduleInput}
                      onChangeText={setModuleInput}
                      autoCapitalize="none"
                    />
                    <TextInput
                      style={[s.searchBar, { height: 60, textAlignVertical: 'top', marginTop: 8 }]}
                      placeholder="Enter description (optional)..."
                      placeholderTextColor={theme.colors.textMuted}
                      value={moduleDesc}
                      onChangeText={setModuleDesc}
                      multiline
                    />
                    <TouchableOpacity
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 8 }}
                      onPress={() => setModuleActive(p => !p)}
                    >
                      <View style={{ width: 18, height: 18, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: moduleActive ? '#6c63ff' : 'transparent', borderRadius: 4 }}>
                        {moduleActive && <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>✓</Text>}
                      </View>
                      <Text style={{ color: theme.colors.text, fontSize: 13 }}>Active</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[s.abButton, { backgroundColor: '#6c63ff', borderColor: '#6c63ff', paddingVertical: 8, marginTop: 4 }]} onPress={handleCreateModule}>
                      <Text style={[s.abButtonText, { color: '#fff', fontWeight: 'bold', fontSize: 12 }]}>Create Module</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={s.sheet}>
                    <View style={s.colHead}>
                      <Text style={[s.colHeadText, s.chNum]}>#</Text>
                      <Text style={[s.colHeadText, { flex: 1.2, marginLeft: 10 }]}>Module Name / Desc</Text>
                      <Text style={[s.colHeadText, { width: 75, textAlign: 'center' }]}>Users & Roles</Text>
                      <Text style={[s.colHeadText, { width: 70, textAlign: 'center' }]}>Status</Text>
                      <Text style={[s.colHeadText, { width: 60, textAlign: 'center' }]}>Delete</Text>
                    </View>
                    {modules.length === 0 ? (
                      <Text style={s.emptyText}>No modules created yet</Text>
                    ) : (
                      modules.map((m, idx) => {
                        const assignedUsers = users.filter((u) => u.module === m.name);
                        const selectedRole = moduleRoleFilters[m.id] || 'all';
                        const roleFilteredUsers = assignedUsers.filter((u) => {
                          if (selectedRole === 'all') return true;
                          const roles = userRoles[u.id] || [];
                          return roles.some((r) => r.name === selectedRole);
                        });
                        const isExpanded = expandedModuleId === m.id;
                        return (
                          <View key={m.id} style={s.moduleRowContainer}>
                            <View style={s.moduleRow}>
                              <Text style={s.moduleNum}>{idx + 1}</Text>
                              <View style={{ flex: 1.2, paddingHorizontal: 8 }}>
                                <Text style={s.moduleName}>{m.name}</Text>
                                <Text style={s.moduleDesc} numberOfLines={2}>{m.description || 'No description'}</Text>
                              </View>
                              
                              <View style={{ width: 75, alignItems: 'center', gap: 4 }}>
                                <TouchableOpacity
                                  style={{
                                    borderWidth: 1,
                                    borderColor: '#333',
                                    borderRadius: 4,
                                    paddingHorizontal: 4,
                                    paddingVertical: 2,
                                    backgroundColor: '#111',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 2,
                                  }}
                                  onPress={() => setActiveModuleDropdown(m.id)}
                                >
                                  <Text style={{ color: '#aaa', fontSize: 8, fontWeight: '500' }} numberOfLines={1}>
                                    {selectedRole === 'all' ? 'All Roles' : selectedRole}
                                  </Text>
                                  <Text style={{ color: '#666', fontSize: 6 }}>▼</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[s.moduleUsersCountBtn, isExpanded && s.moduleUsersCountBtnActive, { width: '100%' }]}
                                  onPress={() => setExpandedModuleId(isExpanded ? null : m.id)}
                                >
                                  <Text style={[s.moduleUsersCountText, isExpanded && s.moduleUsersCountTextActive, { fontSize: 8 }]} numberOfLines={1}>
                                    {roleFilteredUsers.length} {selectedRole === 'all' ? 'Users' : selectedRole}
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <TouchableOpacity
                                style={[s.moduleStatusBtn, m.active ? s.moduleStatusBtnActive : s.moduleStatusBtnInactive]}
                                onPress={() => handleToggleModuleStatus(m.id)}
                              >
                                <Text style={[s.moduleStatusText, m.active ? s.moduleStatusTextActive : s.moduleStatusTextInactive]}>
                                  {m.active ? 'Active' : 'Inactive'}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity style={s.deleteModuleBtn} onPress={() => handleDeleteModule(m.id)}>
                                <Text style={s.deleteModuleBtnText}>Delete</Text>
                              </TouchableOpacity>
                            </View>

                            {isExpanded && (
                              <View style={s.moduleManagePanel}>
                                <Text style={s.moduleManageTitle}>
                                  Manage Module Assignment {selectedRole !== 'all' ? `(${selectedRole}s only)` : ''}:
                                </Text>
                                <Text style={s.moduleManageSub}>Tap users to assign/remove them from this module</Text>
                                <View style={s.userChipsGrid}>
                                  {users.filter((u) => {
                                    if (selectedRole === 'all') return true;
                                    const roles = userRoles[u.id] || [];
                                    return roles.some((r) => r.name === selectedRole);
                                  }).map((u) => {
                                    const isAssigned = u.module === m.name;
                                    const inOtherModule = u.module && u.module !== m.name;
                                    return (
                                      <TouchableOpacity
                                        key={u.id}
                                        style={[
                                          s.userChip,
                                          isAssigned && s.userChipActive,
                                          inOtherModule && s.userChipOther,
                                        ]}
                                        onPress={() => handleAssignModule(u.id, isAssigned ? null : m.name)}
                                      >
                                        <Text style={[
                                          s.userChipText,
                                          isAssigned && s.userChipTextActive,
                                          inOtherModule && s.userChipTextOther,
                                        ]}>
                                          {isAssigned ? '✓ ' : '+ '}
                                          {u.full_name || u.email}
                                          {inOtherModule ? ` (${u.module})` : ''}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </View>
                </View>
              )}

              {/* Audit Logs tab */}
              {tab === 'logs' && (
                <View>
                  <View style={s.sheet}>
                    <View style={s.colHead}>
                      <Text style={[s.colHeadText, s.chNum]}>#</Text>
                      <Text style={[s.colHeadText, s.chAction]}>Action</Text>
                      <Text style={[s.colHeadText, s.chUser]}>User / IP</Text>
                      <Text style={[s.colHeadText, s.chDate]}>Date / Time</Text>
                    </View>
                    <FlatList
                      data={paginatedLogs}
                      renderItem={renderLogItem}
                      keyExtractor={(item) => item.id.toString()}
                      scrollEnabled={false}
                      ListEmptyComponent={
                        <Text style={s.emptyText}>No logs yet</Text>
                      }
                    />
                  </View>
                  {renderLogPagination()}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Role Selector Dropdown Backdrop/Overlay */}
      {activeModuleDropdown !== null && (
        <View style={StyleSheet.absoluteFill}>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setActiveModuleDropdown(null)}
          >
            <View
              style={{
                width: 260,
                backgroundColor: '#161616',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: '#2a2a2a',
                paddingVertical: 10,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              <Text
                style={{
                  color: '#666',
                  fontSize: 10,
                  fontWeight: '700',
                  paddingHorizontal: 16,
                  paddingVertical: 6,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  borderBottomWidth: 1,
                  borderBottomColor: '#222',
                  marginBottom: 6,
                }}
              >
                Select Role Filter
              </Text>
              
              <TouchableOpacity
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 12,
                  backgroundColor: (!moduleRoleFilters[activeModuleDropdown] || moduleRoleFilters[activeModuleDropdown] === 'all') ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                }}
                onPress={() => {
                  setModuleRoleFilters((prev) => ({ ...prev, [activeModuleDropdown]: 'all' }));
                  setActiveModuleDropdown(null);
                }}
              >
                <Text
                  style={{
                    color: (!moduleRoleFilters[activeModuleDropdown] || moduleRoleFilters[activeModuleDropdown] === 'all') ? '#fff' : '#aaa',
                    fontSize: 13,
                    fontWeight: (moduleRoleFilters[activeModuleDropdown] === 'all' || !moduleRoleFilters[activeModuleDropdown]) ? '600' : '400',
                  }}
                >
                  All Roles
                </Text>
              </TouchableOpacity>

              {allRoles.map((role) => {
                const isSelected = moduleRoleFilters[activeModuleDropdown] === role.name;
                return (
                  <TouchableOpacity
                    key={role.id}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                      backgroundColor: isSelected ? 'rgba(108, 99, 255, 0.12)' : 'transparent',
                    }}
                    onPress={() => {
                      setModuleRoleFilters((prev) => ({ ...prev, [activeModuleDropdown]: role.name }));
                      setActiveModuleDropdown(null);
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? '#fff' : '#aaa',
                        fontSize: 13,
                        fontWeight: isSelected ? '600' : '400',
                      }}
                    >
                      {role.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  toast: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 90 : 70,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: theme.roundness.lg,
    borderWidth: 1,
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  toastText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  navBar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  brand: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.roundness.sm,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  profileBtnText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '500',
  },
  logoutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.roundness.sm,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  logoutBtnText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  welcomeAvatarText: {
    color: theme.colors.text,
    fontWeight: 'bold',
    fontSize: 18,
  },
  welcomeInfo: {
    flex: 1,
  },
  welcomeName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  welcomeSub: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 20,
    marginBottom: 16,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  nonAdminStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  dotActive: {
    backgroundColor: theme.colors.success,
  },
  dotInactive: {
    backgroundColor: theme.colors.error,
  },
  nonAdminStatusText: {
    color: theme.colors.text,
    fontSize: 14,
  },
  nonAdminRolesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  nonAdminRoleBadge: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  nonAdminRoleText: {
    color: '#ccc',
    fontSize: 12,
  },
  mutedText: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.md,
    padding: 16,
  },
  statNum: {
    fontSize: 26,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 16,
  },
  tabButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabButtonActive: {
    borderBottomColor: theme.colors.text,
  },
  tabText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  tabTextActive: {
    color: theme.colors.text,
    fontWeight: '600',
  },
  searchBar: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.sm,
    color: theme.colors.text,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    marginBottom: 16,
  },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.sm,
    overflow: 'hidden',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 30,
  },
  // User flatlist elements
  userRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  userRowExpandedActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.04)',
  },
  rowNum: {
    width: 24,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  avatarCol: {
    marginRight: 10,
  },
  uAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uAvatarText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  infoCol: {
    flex: 2,
    justifyContent: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  userName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  meBadge: {
    fontSize: 9,
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    color: theme.colors.textMuted,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 6,
    marginLeft: 4,
  },
  userEmail: {
    color: theme.colors.textSecondary,
    fontSize: 11,
    marginTop: 1,
  },
  roleTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  roleTag: {
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    borderColor: 'rgba(108, 99, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  roleTagText: {
    color: '#8b85ff',
    fontSize: 9,
    fontWeight: '500',
  },
  noRolesText: {
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  statusCol: {
    width: 65,
    alignItems: 'center',
  },
  statusBadge: {
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusBadgeActive: {
    backgroundColor: theme.colors.successMuted,
  },
  statusBadgeInactive: {
    backgroundColor: theme.colors.errorMuted,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '600',
  },
  statusTextActive: {
    color: theme.colors.success,
  },
  statusTextInactive: {
    color: theme.colors.error,
  },
  actionsCol: {
    flex: 1.2,
    alignItems: 'flex-end',
    paddingRight: 4,
  },
  actionButtons: {
    flexDirection: 'column',
    gap: 4,
    width: '100%',
  },
  abButton: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 4,
    paddingVertical: 4,
    alignItems: 'center',
  },
  abButtonActive: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  abButtonText: {
    fontSize: 9,
    color: theme.colors.textSecondary,
  },
  abButtonTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  // Collapsible role management panel
  roleSelectionPanel: {
    backgroundColor: '#0d0d0d',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    paddingVertical: 10,
    paddingLeft: 34,
    paddingRight: 10,
  },
  roleSelectionTitle: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginBottom: 6,
  },
  rolesButtonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChoiceButton: {
    backgroundColor: '#1a1a1a',
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  roleChoiceButtonSelected: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  roleChoiceText: {
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  roleChoiceTextSelected: {
    color: '#ffffff',
    fontWeight: '500',
  },
  // Audit log row elements
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  logNum: {
    width: 24,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  logActionCol: {
    flex: 1.2,
  },
  logTagContainer: {
    backgroundColor: theme.colors.surface2,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  logTagText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  logUserCol: {
    flex: 2,
    paddingHorizontal: 8,
  },
  logUserText: {
    color: '#888',
    fontSize: 11,
  },
  logIpText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    marginTop: 1,
  },
  logDateCol: {
    flex: 1.5,
    alignItems: 'flex-end',
  },
  logDateText: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  logTimeText: {
    color: theme.colors.textMuted,
    fontSize: 9,
    marginTop: 1,
  },
  moduleTagMobile: {
    backgroundColor: 'rgba(0, 204, 102, 0.12)',
    borderColor: 'rgba(0, 204, 102, 0.25)',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  moduleTagMobileText: {
    color: '#00cc66',
    fontSize: 9,
    fontWeight: '500',
  },
  pagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    marginTop: 10,
    borderRadius: theme.roundness.sm,
  },
  pagInfo: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pagButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  pagBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 5,
    backgroundColor: theme.colors.surface2,
  },
  pagBtnDisabled: {
    opacity: 0.3,
  },
  pagBtnActive: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  pagBtnText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  pagBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  createModuleRow: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
  },
  moduleInput: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.roundness.sm,
    color: theme.colors.text,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
  },
  createModuleBtn: {
    backgroundColor: '#6c63ff',
    borderRadius: theme.roundness.sm,
    paddingVertical: 8,
    alignItems: 'center',
  },
  createModuleBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  moduleNum: {
    width: 24,
    color: theme.colors.textMuted,
    fontSize: 11,
    textAlign: 'center',
  },
  moduleName: {
    color: theme.colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  moduleDesc: {
    color: theme.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  moduleStatusBtn: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  moduleStatusBtnActive: {
    backgroundColor: 'rgba(0, 204, 102, 0.12)',
  },
  moduleStatusBtnInactive: {
    backgroundColor: 'rgba(255, 68, 68, 0.12)',
  },
  moduleStatusText: {
    fontSize: 9,
    fontWeight: '600',
  },
  moduleStatusTextActive: {
    color: '#00cc66',
  },
  moduleStatusTextInactive: {
    color: '#ff4444',
  },
  deleteModuleBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255, 68, 68, 0.3)',
    borderRadius: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  deleteModuleBtnText: {
    fontSize: 10,
    color: '#ff4444',
  },
  // Sheet headers
  colHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0d0d0d',
    borderBottomWidth: 2,
    borderBottomColor: '#2a2a2a',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  colHeadText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chNum: {
    width: 24,
    textAlign: 'center',
  },
  chUser: {
    flex: 2.2,
    marginLeft: 10,
  },
  chStatus: {
    width: 65,
    textAlign: 'center',
  },
  chActions: {
    flex: 1.2,
    textAlign: 'right',
    paddingRight: 14,
  },
  chAction: {
    flex: 1.2,
    marginLeft: 10,
  },
  chDate: {
    flex: 1.5,
    textAlign: 'right',
  },
  // Audit log details
  logRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  logNumBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  logNumText: {
    color: theme.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  logDetailPanel: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#161616',
    paddingLeft: 34,
  },
  logDetailTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  logDetailRow: {
    flexDirection: 'row',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  logDetailLabel: {
    fontSize: 10,
    color: theme.colors.textMuted,
    width: 80,
  },
  logDetailValue: {
    fontSize: 10,
    color: theme.colors.text,
    flex: 1,
  },
  // Module manage users
  moduleRowContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e1e',
  },
  moduleUsersCountBtn: {
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 8,
  },
  moduleUsersCountBtnActive: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  moduleUsersCountText: {
    fontSize: 10,
    color: '#8b85ff',
    fontWeight: '600',
  },
  moduleUsersCountTextActive: {
    color: '#ffffff',
  },
  moduleManagePanel: {
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#161616',
    paddingLeft: 34,
  },
  moduleManageTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  moduleManageSub: {
    fontSize: 9,
    color: theme.colors.textMuted,
    marginBottom: 8,
  },
  userChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  userChip: {
    backgroundColor: '#161616',
    borderColor: '#222',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userChipActive: {
    backgroundColor: 'rgba(0, 204, 102, 0.12)',
    borderColor: 'rgba(0, 204, 102, 0.3)',
  },
  userChipOther: {
    backgroundColor: 'rgba(255, 170, 0, 0.08)',
    borderColor: 'rgba(255, 170, 0, 0.2)',
  },
  userChipText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  userChipTextActive: {
    color: '#00cc66',
    fontWeight: '600',
  },
  userChipTextOther: {
    color: '#ffaa00',
  },
});
