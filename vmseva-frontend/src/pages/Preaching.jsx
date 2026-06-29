import { useEffect, useState, useCallback, useMemo } from 'react';
import { Navbar } from '../components/Navbar';
import api from '../api';

export default function Preaching() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deptLoading, setDeptLoading] = useState(false);
  const [msg, setMsg] = useState({ text: '', ok: true });

  // Modals & form states
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [showEditEvent, setShowEditEvent] = useState(null); // Event object being edited
  const [newEvent, setNewEvent] = useState({ title: '', description: '', event_date: '' });

  const [showAddDept, setShowAddDept] = useState(false);
  const [showEditDept, setShowEditDept] = useState(null); // Department object being edited
  const [newDept, setNewDept] = useState({ name: '', description: '' });

  const [selectedDeptId, setSelectedDeptId] = useState(null);
  const [deptMembers, setDeptMembers] = useState([]);
  const [addMemberForm, setAddMemberForm] = useState({ user_id: '', role: '' });

  // Sorting and filtering state
  const [sortBy, setSortBy] = useState('name'); // name, membersCount, createdAt
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  const [searchTerm, setSearchTerm] = useState('');

  const flash = useCallback((text, ok = true) => {
    setMsg({ text, ok });
    setTimeout(() => setMsg({ text: '', ok: true }), 3000);
  }, []);

  // Fetch all events
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

  // Fetch departments of selected event with sorting queries
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

  // Fetch all system users (for department member assignment dropdown)
  const loadUsers = useCallback(async () => {
    try {
      const { data } = await api.get('/preaching/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users cache', err);
    }
  }, []);

  // Fetch members of a selected department
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
  const handleAddEvent = async (e) => {
    e.preventDefault();
    if (!newEvent.title.trim()) return;
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

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    if (!showEditEvent.title.trim()) return;
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
    if (!window.confirm('Are you sure you want to delete this event? This will delete all its departments.')) return;
    try {
      await api.delete(`/preaching/events/${id}`);
      flash('Event deleted');
      setSelectedEvent(null);
      loadEvents();
    } catch (err) {
      flash('Failed to delete event', false);
    }
  };

  // Department handlers
  const handleAddDept = async (e) => {
    e.preventDefault();
    if (!newDept.name.trim() || !selectedEvent) return;
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

  const handleUpdateDept = async (e) => {
    e.preventDefault();
    if (!showEditDept.name.trim()) return;
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
    if (!window.confirm('Delete this department?')) return;
    try {
      await api.delete(`/preaching/departments/${deptId}`);
      flash('Department removed');
      if (selectedDeptId === deptId) setSelectedDeptId(null);
      loadDepartments(selectedEvent.id);
    } catch (err) {
      flash('Failed to delete department', false);
    }
  };

  // Member handlers
  const handleAddDeptMember = async (e) => {
    e.preventDefault();
    if (!addMemberForm.user_id || !selectedDeptId) return;
    try {
      await api.post(`/preaching/departments/${selectedDeptId}/members`, addMemberForm);
      setAddMemberForm({ user_id: '', role: '' });
      flash('Member assigned successfully');
      loadDeptMembers(selectedDeptId);
      loadDepartments(selectedEvent.id); // reload to update count
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
      loadDepartments(selectedEvent.id); // reload to update count
    } catch (err) {
      flash('Failed to remove member', false);
    }
  };

  // Client-side search filtering over departments
  const filteredDepartments = useMemo(() => {
    if (!searchTerm.trim()) return departments;
    return departments.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.description && d.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [departments, searchTerm]);

  return (
    <>
      <style>{`
        .layout-container {
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: 24px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          min-height: 85vh;
          font-family: 'Inter', system-ui, sans-serif;
          color: #e2e8f0;
        }
        .sidebar {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .main-panel {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
        }
        .sidebar-title {
          font-size: 16px;
          font-weight: 700;
          color: #38bdf8;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 8px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .event-item {
          padding: 12px 16px;
          background: #1e293b;
          border: 1px solid transparent;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .event-item:hover {
          border-color: #38bdf8;
          background: #1e293b99;
          transform: translateY(-2px);
        }
        .event-item-active {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          border-color: #38bdf8;
          box-shadow: 0 4px 12px rgba(2, 132, 199, 0.25);
        }
        .event-title {
          font-size: 14px;
          font-weight: 600;
          color: #ffffff;
        }
        .event-meta {
          font-size: 11px;
          color: #94a3b8;
        }
        .event-item-active .event-meta {
          color: #e0f2fe;
        }
        .btn-primary {
          background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          box-shadow: 0 2px 10px rgba(14, 165, 233, 0.2);
        }
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(14, 165, 233, 0.35);
        }
        .btn-secondary {
          background: #1e293b;
          color: #e2e8f0;
          border: 1px solid #334155;
          padding: 10px 18px;
          border-radius: 10px;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-secondary:hover {
          background: #334155;
          color: #ffffff;
        }
        .btn-danger {
          background: #ef4444;
          color: #ffffff;
          border: none;
          padding: 8px 12px;
          border-radius: 8px;
          font-weight: 600;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-danger:hover {
          background: #dc2626;
        }
        .form-input {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 10px 14px;
          color: #ffffff;
          font-size: 13px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        .form-input:focus {
          border-color: #38bdf8;
        }
        .sorting-bar {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 12px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 16px;
        }
        .sorting-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .sorting-select {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 6px 12px;
          color: #ffffff;
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }
        .dept-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }
        .dept-card {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 10px;
          position: relative;
        }
        .dept-card:hover {
          border-color: #38bdf8;
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        .dept-card-active {
          border-color: #0ea5e9;
          background: #0ea5e90a;
          box-shadow: 0 0 12px rgba(14, 165, 233, 0.15);
        }
        .dept-name {
          font-size: 15px;
          font-weight: 600;
          color: #ffffff;
        }
        .dept-desc {
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
          min-height: 36px;
        }
        .dept-badge {
          background: #0369a1;
          color: #e0f2fe;
          font-size: 11px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          width: fit-content;
        }
        .members-section {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .member-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
        }
        .member-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .member-name {
          font-size: 13px;
          font-weight: 600;
          color: #ffffff;
        }
        .member-role {
          font-size: 11px;
          color: #38bdf8;
          font-weight: 500;
        }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: #0f172a;
          border: 1px solid #1e293b;
          border-radius: 16px;
          padding: 24px;
          width: 100%;
          max-width: 460px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .notification-toast {
          position: fixed;
          top: 24px;
          right: 24px;
          z-index: 1100;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          font-size: 13px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          animation: slideIn 0.2s ease-out;
        }
        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <Navbar />

      {msg.text && (
        <div className="notification-toast" style={{
          background: msg.ok ? '#0284c7' : '#ef4444',
          color: '#ffffff',
          border: `1px solid ${msg.ok ? '#38bdf8' : '#f87171'}`
        }}>
          {msg.text}
        </div>
      )}

      <div className="layout-container">
        {/* SIDEBAR: EVENT SELECTOR */}
        <div className="sidebar">
          <div className="sidebar-title">
            <span>Events</span>
            <button className="btn-primary" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '11px' }} onClick={() => setShowAddEvent(true)}>
              + Add
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading events...</div>
            ) : events.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '13px' }}>No events. Add one to start.</div>
            ) : (
              events.map(ev => (
                <div
                  key={ev.id}
                  className={`event-item ${selectedEvent?.id === ev.id ? 'event-item-active' : ''}`}
                  onClick={() => setSelectedEvent(ev)}
                >
                  <span className="event-title">{ev.title}</span>
                  <span className="event-meta">
                    {ev.event_date ? new Date(ev.event_date).toLocaleDateString() : 'No date set'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* MAIN PANEL: DEPARTMENTS WORKSPACE */}
        <div className="main-panel">
          {selectedEvent ? (
            <>
              {/* Event Details Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
                <div>
                  <h1 style={{ fontSize: '20px', fontWeight: '800', color: '#ffffff', margin: 0 }}>{selectedEvent.title}</h1>
                  <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', margin: 0 }}>{selectedEvent.description || 'No description'}</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowEditEvent(selectedEvent)}>
                    Edit Event
                  </button>
                  <button className="btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleDeleteEvent(selectedEvent.id)}>
                    Delete Event
                  </button>
                </div>
              </div>

              {/* Sorting and Filtering Bar */}
              <div className="sorting-bar">
                <div className="sorting-controls">
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#94a3b8' }}>Sort By:</span>
                  <select className="sorting-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                    <option value="name">Alphabetical (Name)</option>
                    <option value="membersCount">Members Count</option>
                    <option value="createdAt">Date Created</option>
                  </select>

                  <button className="btn-secondary" style={{ padding: '4px 10px', fontSize: '12px' }} onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                    {sortOrder.toUpperCase()}
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <input
                    className="form-input"
                    placeholder="Search departments..."
                    style={{ padding: '6px 12px' }}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                  <button className="btn-primary" style={{ padding: '6px 14px' }} onClick={() => setShowAddDept(true)}>
                    + Add Dept
                  </button>
                </div>
              </div>

              {/* Department Cards Grid */}
              {deptLoading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Loading departments...</div>
              ) : filteredDepartments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748b', fontSize: '13px' }}>
                  No departments found. Create a department to manage staff.
                </div>
              ) : (
                <div className="dept-grid">
                  {filteredDepartments.map(d => (
                    <div
                      key={d.id}
                      className={`dept-card ${selectedDeptId === d.id ? 'dept-card-active' : ''}`}
                      onClick={() => setSelectedDeptId(d.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <span className="dept-name">{d.name}</span>
                        <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                          <button style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }} onClick={() => setShowEditDept(d)}>
                            Edit
                          </button>
                          <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '11px', fontWeight: '500' }} onClick={() => handleDeleteDept(d.id)}>
                            Delete
                          </button>
                        </div>
                      </div>
                      <span className="dept-desc">{d.description || 'No description provided'}</span>
                      <span className="dept-badge">{d.members_count || 0} Members</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Department Members Management */}
              {selectedDeptId && (
                <div className="members-section">
                  <div style={{ borderBottom: '1px solid #334155', paddingBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#ffffff', margin: 0 }}>
                      Department Members
                    </h3>
                  </div>

                  {/* Add Member Form */}
                  <form onSubmit={handleAddDeptMember} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <select
                      className="sorting-select"
                      style={{ flex: 1, minWidth: '180px', padding: '10px' }}
                      value={addMemberForm.user_id}
                      onChange={e => setAddMemberForm({ ...addMemberForm, user_id: e.target.value })}
                      required
                    >
                      <option value="">Select User to Assign...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                      ))}
                    </select>

                    <input
                      className="form-input"
                      placeholder="Role (e.g. Lead, Volunteer)"
                      value={addMemberForm.role}
                      onChange={e => setAddMemberForm({ ...addMemberForm, role: e.target.value })}
                    />

                    <button type="submit" className="btn-primary">
                      Assign Member
                    </button>
                  </form>

                  {/* Members List */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {deptMembers.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '16px', color: '#64748b', fontSize: '12px', background: '#0f172a', borderRadius: '8px', border: '1px solid #334155' }}>
                        No members assigned yet.
                      </div>
                    ) : (
                      deptMembers.map(m => (
                        <div key={m.user_id} className="member-row">
                          <div className="member-info">
                            <span className="member-name">{m.full_name}</span>
                            <span className="member-role">{m.role || 'Volunteer'}</span>
                          </div>
                          <button className="btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleRemoveDeptMember(m.user_id)}>
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12, color: '#64748b' }}>
              <span style={{ fontSize: '48px' }}>📅</span>
              <span style={{ fontSize: '14px', fontWeight: '500' }}>Select or create an event to manage departments</span>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Add Event */}
      {showAddEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Create Event</h3>
            <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                placeholder="Event Title"
                value={newEvent.title}
                onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                required
              />
              <textarea
                className="form-input"
                placeholder="Description"
                style={{ resize: 'vertical', minHeight: '60px' }}
                value={newEvent.description}
                onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
              />
              <input
                className="form-input"
                type="date"
                value={newEvent.event_date}
                onChange={e => setNewEvent({ ...newEvent, event_date: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddEvent(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Edit Event */}
      {showEditEvent && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Edit Event</h3>
            <form onSubmit={handleUpdateEvent} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                placeholder="Event Title"
                value={showEditEvent.title}
                onChange={e => setShowEditEvent({ ...showEditEvent, title: e.target.value })}
                required
              />
              <textarea
                className="form-input"
                placeholder="Description"
                style={{ resize: 'vertical', minHeight: '60px' }}
                value={showEditEvent.description || ''}
                onChange={e => setShowEditEvent({ ...showEditEvent, description: e.target.value })}
              />
              <input
                className="form-input"
                type="date"
                value={showEditEvent.event_date ? new Date(showEditEvent.event_date).toISOString().split('T')[0] : ''}
                onChange={e => setShowEditEvent({ ...showEditEvent, event_date: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditEvent(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Update Event</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Add Department */}
      {showAddDept && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Add Department</h3>
            <form onSubmit={handleAddDept} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                placeholder="Department Name"
                value={newDept.name}
                onChange={e => setNewDept({ ...newDept, name: e.target.value })}
                required
              />
              <textarea
                className="form-input"
                placeholder="Description"
                style={{ resize: 'vertical', minHeight: '60px' }}
                value={newDept.description}
                onChange={e => setNewDept({ ...newDept, description: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddDept(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Edit Department */}
      {showEditDept && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#ffffff', margin: 0 }}>Edit Department</h3>
            <form onSubmit={handleUpdateDept} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                className="form-input"
                placeholder="Department Name"
                value={showEditDept.name}
                onChange={e => setShowEditDept({ ...showEditDept, name: e.target.value })}
                required
              />
              <textarea
                className="form-input"
                placeholder="Description"
                style={{ resize: 'vertical', minHeight: '60px' }}
                value={showEditDept.description || ''}
                onChange={e => setShowEditDept({ ...showEditDept, description: e.target.value })}
              />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditDept(null)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
