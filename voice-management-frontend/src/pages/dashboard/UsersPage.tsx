import React, { useState, useEffect } from 'react';
import client from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, ShieldAlert, Trash2, Loader2, ArrowUpDown, Eye, EyeOff } from 'lucide-react';
import { Label } from '@/components/ui/label';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [rolesList, setRolesList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Sorting
  const [sortField, setSortField] = useState<'id' | 'email'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRoleOpen, setIsRoleOpen] = useState(false);

  // Form states
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [confirmFormPassword, setConfirmFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isStrongPassword = (value: string) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(value);

  // Fetch all users and load their status/roles
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const [usersRes, rolesRes] = await Promise.all([
        client.get('/users'),
        client.get('/roles'),
      ]);

      const basicUsers = usersRes.data || [];
      setRolesList(rolesRes.data || []);

      // Fetch status & roles details for each user to build a complete spreadsheet row
      const detailedUsers = await Promise.all(
        basicUsers.map(async (u: any) => {
          try {
            // `users` endpoint now includes `is_active`; fetch roles per-user
            const userRolesRes = await client.get(`/users/${u.id}/roles`);
            return {
              ...u,
              is_active: u.is_active !== false,
              roles: userRolesRes.data || [],
            };
          } catch (err: any) {
            console.error(`Error fetching roles for user ${u.id}:`, err?.response?.status);
            return { ...u, is_active: u.is_active !== false, roles: [] };
          }
        })
      );

      setUsers(detailedUsers);
    } catch (err: any) {
      const message = err?.response?.data?.error || err?.response?.data?.message || 'Failed to load user database';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (user: any) => {
    const nextStatus = !user.is_active;
    try {
      await client.patch(`/users/${user.id}/status`, { is_active: nextStatus });
      toast.success(`User ${user.email} ${nextStatus ? 'activated' : 'deactivated'} successfully`);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: nextStatus } : u))
      );
    } catch (err: any) {
      toast.error('Failed to change user status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !formPassword || !confirmFormPassword) {
      toast.error('All fields are required');
      return;
    }
    if (formPassword !== confirmFormPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (!isStrongPassword(formPassword)) {
      toast.error('Password must be 8+ chars and include uppercase, lowercase, number, and symbol');
      return;
    }

    setActionLoading(true);
    try {
      await client.post('/users', { email: formEmail, password: formPassword });
      toast.success('User created successfully!');
      setIsCreateOpen(false);
      setFormEmail('');
      setFormPassword('');
      setConfirmFormPassword('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail || !currentUser) return;

    setActionLoading(true);
    try {
      await client.put(`/users/${currentUser.id}`, { email: formEmail });
      toast.success('Email updated successfully!');
      setIsEditOpen(false);
      fetchUsers();
    } catch (err: any) {
      toast.error('Failed to update email');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm('Are you sure you want to delete this user from the database?')) return;
    try {
      await client.delete(`/users/${userId}`);
      toast.success('User deleted from database');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      toast.error('Failed to delete user');
    }
  };

  const handleToggleRole = async (userId: number, roleId: number, hasRole: boolean) => {
    try {
      if (hasRole) {
        await client.delete(`/users/${userId}/roles/${roleId}`);
        toast.success('Role removed');
      } else {
        await client.post(`/users/${userId}/roles`, { roleId });
        toast.success('Role assigned');
      }
      // Update currentUser roles state immediately so the dialog reflects the change
      setCurrentUser((prev: any) => {
        if (!prev || prev.id !== userId) return prev;
        const updatedRoles = hasRole
          ? prev.roles.filter((r: any) => r.id !== roleId)
          : [...prev.roles, rolesList.find((r) => r.id === roleId)];
        return { ...prev, roles: updatedRoles };
      });
      setUsers((prev) =>
        prev.map((u) => {
          if (u.id !== userId) return u;
          const updatedRoles = hasRole
            ? u.roles.filter((r: any) => r.id !== roleId)
            : [...u.roles, rolesList.find((r) => r.id === roleId)];
          return { ...u, roles: updatedRoles };
        })
      );
    } catch (err: any) {
      toast.error('Failed to modify user roles');
    }
  };

  const handleSort = (field: 'id' | 'email') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter & sort
  const filteredUsers = users
    .filter((u) => u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'id') {
        comparison = a.id - b.id;
      } else {
        comparison = a.email.localeCompare(b.email);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Input
          placeholder="Filter database records by email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-card"
        />
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add User
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[100px] cursor-pointer hover:bg-muted" onClick={() => handleSort('id')}>
                <div className="flex items-center gap-1">
                  User ID <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="cursor-pointer hover:bg-muted" onClick={() => handleSort('email')}>
                <div className="flex items-center gap-1">
                  Email Address <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[120px]">Account Status</TableHead>
              <TableHead className="w-[250px]">Roles</TableHead>
              <TableHead className="w-[200px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No matching database records found.
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{user.id}</TableCell>
                  <TableCell className="font-medium">{user.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={user.is_active !== false}
                        onCheckedChange={() => handleToggleStatus(user)}
                      />
                      <span className="text-xs text-muted-foreground">
                        {user.is_active !== false ? 'Active' : 'Suspended'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.roles?.map((r: any) => (
                        <Badge key={r.id} variant="secondary">
                          {r.name}
                        </Badge>
                      ))}
                      {(!user.roles || user.roles.length === 0) && (
                        <span className="text-xs text-muted-foreground">No roles assigned</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setCurrentUser(user);
                          setFormEmail(user.email);
                          setIsEditOpen(true);
                        }}
                        title="Edit User Email"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setCurrentUser(user);
                          setIsRoleOpen(true);
                        }}
                        title="Manage Roles"
                      >
                        <ShieldAlert className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete User"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User Record</DialogTitle>
            <DialogDescription>Insert a new user credential directly into the PostgreSQL database.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="user@example.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <div className="relative">
                <Input
                  type={showFormPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                  onClick={() => setShowFormPassword(!showFormPassword)}
                  aria-label={showFormPassword ? 'Hide password' : 'Show password'}
                >
                  {showFormPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirm Password</Label>
              <Input
                type={showFormPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmFormPassword}
                onChange={(e) => setConfirmFormPassword(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Password must be 8+ chars and include uppercase, lowercase, number, and symbol.
            </p>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify User Email</DialogTitle>
            <DialogDescription>Update the registered email address for User ID: {currentUser?.id}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE ROLES DIALOG */}
      <Dialog open={isRoleOpen} onOpenChange={setIsRoleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Database Roles</DialogTitle>
            <DialogDescription>Toggle roles assigned to user: {currentUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Available System Roles</Label>
            <div className="grid gap-3">
              {rolesList.map((role) => {
                const isAssigned = currentUser?.roles?.some((r: any) => r.id === role.id);
                return (
                  <div key={role.id} className="flex items-center justify-between border rounded-lg p-3 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium capitalize">{role.role_name}</span>
                      <span className="text-xs text-muted-foreground">ID: {role.id}</span>
                    </div>
                    <Switch
                      checked={isAssigned}
                      onCheckedChange={() => handleToggleRole(currentUser.id, role.id, isAssigned)}
                    />
                  </div>
                );
              })}
              {rolesList.length === 0 && (
                <p className="text-sm text-center text-muted-foreground">No roles configured in database.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsRoleOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
