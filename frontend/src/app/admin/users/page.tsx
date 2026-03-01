'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import {
    Users, Search, Shield, Ban, Trash2, Loader2,
    UserCheck, Crown, Mail, Calendar, Wallet, Trophy,
    MoreHorizontal, ChevronDown
} from 'lucide-react';
import { UserRole, ROLE_LABELS, getRoleColor, ROLE_HIERARCHY_LEVELS } from '@/lib/roles';
import { WalletAdjustmentModal } from '@/components/admin/WalletAdjustmentModal';
import { toast } from 'sonner';

interface UserData {
    id: string;
    name: string | null;
    email: string;
    role: string;
    avatar?: string;
    country?: string;
    banned: boolean;
    createdAt: string;
    wallet?: { balance: number };
    _count?: { teams: number; notifications: number; tournaments: number };
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [filtered, setFiltered] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('ALL');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [actionMenuId, setActionMenuId] = useState<string | null>(null);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [adjustmentUser, setAdjustmentUser] = useState<{ id: string, name: string, email: string } | null>(null);
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    useEffect(() => {
        fetchUsers();
        // Get current user role from local storage
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const user = JSON.parse(userStr);
                setCurrentUserRole(user.role || '');
            }
        } catch (e) { console.error('Error parsing user', e); }
    }, []);

    useEffect(() => {
        let result = users;
        if (search) {
            const q = search.toLowerCase();
            result = result.filter(u =>
                u.name?.toLowerCase().includes(q) ||
                u.email.toLowerCase().includes(q) ||
                u.id.toLowerCase().includes(q)
            );
        }
        if (roleFilter !== 'ALL') {
            result = result.filter(u => u.role === roleFilter);
        }
        setFiltered(result);
    }, [search, roleFilter, users]);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users');
            setUsers(res.data);
        } catch (err: any) {
            console.error('Failed to fetch users:', err);
            if (err.response?.status === 401) window.location.href = '/login';
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: string) => {
        setProcessingId(userId);
        try {
            await api.patch(`/users/admin/${userId}/role`, { role: newRole });
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to update role');
        } finally {
            setProcessingId(null);
            setActionMenuId(null);
        }
    };

    const handleToggleBan = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!confirm(`${user?.banned ? 'Unban' : 'Ban'} ${user?.name || user?.email}?`)) return;
        setProcessingId(userId);
        try {
            await api.post(`/users/admin/${userId}/toggle-ban`);
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed');
        } finally {
            setProcessingId(null);
            setActionMenuId(null);
        }
    };

    const handleDelete = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!confirm(`PERMANENTLY DELETE ${user?.name || user?.email}? This cannot be undone!`)) return;
        setProcessingId(userId);
        try {
            await api.delete(`/users/admin/${userId}`);
            await fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || 'Failed to delete');
        } finally {
            setProcessingId(null);
            setActionMenuId(null);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

    const totalBalance = users.reduce((sum, u) => sum + (u.wallet?.balance || 0), 0);
    const adminCount = users.filter(u => u.role === 'ADMIN' || u.role === 'SUPERADMIN').length;
    const bannedCount = users.filter(u => u.banned).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Users className="h-8 w-8 text-primary" />
                        User Management
                    </h1>
                    <p className="text-muted-foreground">{users.length} registered users on the platform</p>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold">{users.length}</p>
                        <p className="text-xs text-muted-foreground">Total Users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-primary">{adminCount}</p>
                        <p className="text-xs text-muted-foreground">Admins</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-green-500">₹{totalBalance.toLocaleString('en-IN')}</p>
                        <p className="text-xs text-muted-foreground">Total Wallet Balance</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-2xl font-bold text-red-500">{bannedCount}</p>
                        <p className="text-xs text-muted-foreground">Banned Users</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, email, or ID..."
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'USER', 'ADMIN', 'SUPERADMIN'].map(role => (
                                <Button
                                    key={role}
                                    size="sm"
                                    variant={roleFilter === role ? 'default' : 'outline'}
                                    onClick={() => setRoleFilter(role)}
                                >
                                    {role === 'ALL' ? 'All' : role}
                                </Button>
                            ))}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Users Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-muted/50 text-muted-foreground font-medium">
                                <tr>
                                    <th className="p-4 text-left">User</th>
                                    <th className="p-4 text-left">Role</th>
                                    <th className="p-4 text-left">Wallet</th>
                                    <th className="p-4 text-left">Activity</th>
                                    <th className="p-4 text-left">Status</th>
                                    <th className="p-4 text-left">Joined</th>
                                    <th className="p-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                                            No users found
                                        </td>
                                    </tr>
                                ) : filtered.map((user) => (
                                    <tr key={user.id} className={`hover:bg-muted/30 transition-colors ${user.banned ? 'opacity-60' : ''}`}>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                                    {user.name?.[0] || user.email[0]}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{user.name || 'Unnamed'}</p>
                                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                                                <Shield className="inline h-3 w-3 mr-1" />
                                                {ROLE_LABELS[user.role as UserRole] || user.role}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium">₹{(user.wallet?.balance || 0).toFixed(0)}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span title="Teams">{user._count?.teams || 0} teams</span>
                                                <span title="Tournaments">{user._count?.tournaments || 0} events</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {user.banned ? (
                                                <Badge className="bg-red-500/10 text-red-500 border-red-500/30">Banned</Badge>
                                            ) : (
                                                <Badge className="bg-green-500/10 text-green-500 border-green-500/30">Active</Badge>
                                            )}
                                        </td>
                                        <td className="p-4 text-muted-foreground text-xs">
                                            {formatDate(user.createdAt)}
                                        </td>
                                        <td className="p-4 text-right relative">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="mr-2"
                                                onClick={() => window.location.href = `/admin/users/${user.id}`}
                                            >
                                                <Users className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                                                disabled={processingId === user.id}
                                            >
                                                {processingId === user.id ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <MoreHorizontal className="h-4 w-4" />
                                                )}
                                            </Button>

                                            {/* Action Dropdown */}
                                            {actionMenuId === user.id && (
                                                <div className="absolute right-4 top-12 z-50 w-48 bg-card border border-border rounded-lg shadow-xl py-1 animate-in fade-in zoom-in-95">
                                                    {/* Only SUPERADMIN can change roles */}
                                                    {currentUserRole === 'SUPERADMIN' && (
                                                        <button
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                                            onClick={() => handleRoleChange(user.id, user.role === 'ADMIN' ? 'USER' : 'ADMIN')}
                                                        >
                                                            <Shield className="h-3.5 w-3.5" />
                                                            {user.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                                                        </button>
                                                    )}

                                                    {/* Admin cannot ban other Admins unless Super Admin */}
                                                    {(currentUserRole === 'SUPERADMIN' || (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN')) && (
                                                        <button
                                                            className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                                                            onClick={() => handleToggleBan(user.id)}
                                                        >
                                                            <Ban className="h-3.5 w-3.5" />
                                                            {user.banned ? 'Unban User' : 'Ban User'}
                                                        </button>
                                                    )}

                                                    {/* Only SUPERADMIN can delete users */}
                                                    {currentUserRole === 'SUPERADMIN' && (
                                                        <>
                                                            <hr className="my-1 border-border" />
                                                            <button
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-primary group"
                                                                onClick={() => {
                                                                    setAdjustmentUser({ id: user.id, name: user.name || 'User', email: user.email });
                                                                    setIsAdjustmentModalOpen(true);
                                                                    setActionMenuId(null);
                                                                }}
                                                            >
                                                                <Wallet className="h-3.5 w-3.5" />
                                                                Adjust Balance
                                                            </button>
                                                            <button
                                                                className="w-full px-4 py-2 text-left text-sm hover:bg-red-500/10 text-red-500 flex items-center gap-2"
                                                                onClick={() => handleDelete(user.id)}
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                Delete User
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <WalletAdjustmentModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                user={adjustmentUser}
                onSuccess={() => {
                    toast.success('Wallet updated successfully');
                    fetchUsers();
                }}
            />
        </div>
    );
}
