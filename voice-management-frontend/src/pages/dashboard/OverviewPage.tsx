import React, { useState, useEffect } from 'react';
import client from '@/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, UserCheck } from 'lucide-react';

export const OverviewPage: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalRoles: 0,
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOverview = async () => {
      try {
        const [usersRes, rolesRes] = await Promise.all([
          client.get('/users'),
          client.get('/roles'),
        ]);

        const allUsers = usersRes.data || [];
        const activeUsersCount = allUsers.filter((u: any) => u.is_active !== false).length;

        // Fetch user status list properly (the raw list only returns email and ID; we can details stats by fetching individual user status or simply utilizing total users list)
        // Since we refactored user.routes.js, it returns id and email and is_active is checked:
        setStats({
          totalUsers: allUsers.length,
          activeUsers: activeUsersCount,
          totalRoles: (rolesRes.data || []).length,
        });

        setRecentUsers(allUsers.slice(-5).reverse());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOverview();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-500' },
    { title: 'Active Accounts', value: stats.activeUsers, icon: UserCheck, color: 'text-green-500' },
    { title: 'Configured Roles', value: stats.totalRoles, icon: Shield, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className="border-border shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold tracking-tight">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-md font-semibold">Recently Registered Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User ID</TableHead>
                <TableHead>Email Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                    No users registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                recentUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell className="font-medium">{user.email}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
