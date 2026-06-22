import React, { useState, useEffect } from 'react';
import client from '@/api/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Loader2, ArrowUpDown } from 'lucide-react';
import { Label } from '@/components/ui/label';

export const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sorting
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Form states
  const [currentRole, setCurrentRole] = useState<any>(null);
  const [formName, setFormName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await client.get('/roles');
      setRoles(response.data || []);
    } catch {
      toast.error('Failed to load roles from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) return;

    setActionLoading(true);
    try {
      await client.post('/roles', { role_name: formName });
      toast.success('Role created successfully!');
      setIsCreateOpen(false);
      setFormName('');
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to create role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !currentRole) return;

    setActionLoading(true);
    try {
      await client.put(`/roles/${currentRole.id}`, { role_name: formName });
      toast.success('Role name updated successfully!');
      setIsEditOpen(false);
      setFormName('');
      fetchRoles();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm('Warning: Deleting this role will cascade delete assignments from users. Continue?')) return;
    try {
      await client.delete(`/roles/${roleId}`);
      toast.success('Role deleted from system database');
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
    } catch {
      toast.error('Failed to delete role');
    }
  };

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredRoles = roles
    .filter((r) => r.role_name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const comparison = a.role_name.localeCompare(b.role_name);
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
          placeholder="Filter roles database table..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md bg-card"
        />
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Add Role
        </Button>
      </div>

      <div className="rounded-md border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-[120px]">Role ID</TableHead>
              <TableHead className="cursor-pointer hover:bg-muted" onClick={toggleSort}>
                <div className="flex items-center gap-1">
                  Role Name <ArrowUpDown className="h-3 w-3" />
                </div>
              </TableHead>
              <TableHead className="w-[200px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No matching roles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow key={role.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs text-muted-foreground">{role.id}</TableCell>
                  <TableCell className="font-medium capitalize">{role.role_name}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setCurrentRole(role);
                          setFormName(role.role_name);
                          setIsEditOpen(true);
                        }}
                        title="Edit Role Name"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleDeleteRole(role.id)}
                        className="text-destructive hover:bg-destructive/10"
                        title="Delete Role"
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
            <DialogTitle>Add New Role Record</DialogTitle>
            <DialogDescription>Define a new security role in the PostgreSQL database table.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateRole} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                type="text"
                placeholder="e.g. support, manager"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* EDIT DIALOG */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modify Role Title</DialogTitle>
            <DialogDescription>Update the name of Role ID: {currentRole?.id}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditRole} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label>Role Name</Label>
              <Input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={actionLoading}>
                {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Role
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
