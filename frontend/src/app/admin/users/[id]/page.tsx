'use client';

import React, { useState, useEffect, use, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import api from '@/lib/api';
import {
    User, Mail, Calendar, Shield, MapPin, Gamepad2, ArrowLeft,
    Wallet, TrendingUp, TrendingDown, Clock, AlertCircle, Loader2, Edit
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/Dialog";
import { Select } from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { UserRole, ROLE_LABELS, getRoleColor, ROLE_HIERARCHY_LEVELS } from '@/lib/roles';
import { WalletAdjustmentModal } from '@/components/admin/WalletAdjustmentModal';

interface UserDetails {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string;
    country?: string;
    bio?: string;
    riotId?: string;
    pubgId?: string;
    bgmiId?: string;
    freeFireId?: string;
    createdAt: string;
    banned: boolean;
    wallet: {
        id: string;
        balance: number;
    };
    teams: {
        team: {
            id: string;
            name: string;
            game: string;
        };
        role: string;
    }[];
    _count?: {
        tournaments: number;
    };
}

interface Transaction {
    id: string;
    type: string;
    amount: number;
    status: string;
    method: string;
    reference?: string;
    description?: string;
    createdAt: string;
}

export default function UserDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use()
    const { id: userId } = use(params);
    const router = useRouter();

    const [user, setUser] = useState<UserDetails | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [txLoading, setTxLoading] = useState(true);
    const [roleModalOpen, setRoleModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [updatingRole, setUpdatingRole] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState<string>('');
    const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
                const userObj = JSON.parse(userStr);
                setCurrentUserRole(userObj.role || '');
            }
        } catch (e) { console.error('Error parsing user', e); }
    }, []);

    const fetchUserDetails = useCallback(async () => {
        try {
            const res = await api.get(`/users/admin/${userId}`);
            setUser(res.data);
        } catch (err) {
            console.error('Failed to fetch user:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const fetchUserTransactions = useCallback(async () => {
        try {
            const res = await api.get(`/wallet/admin/users/${userId}/transactions`);
            setTransactions(res.data.transactions || []);
        } catch (err) {
            console.error('Failed to fetch transactions:', err);
        } finally {
            setTxLoading(false);
        }
    }, [userId]);

    useEffect(() => {
        fetchUserDetails();
        fetchUserTransactions();
    }, [fetchUserDetails, fetchUserTransactions]);

    const handleUpdateRole = async () => {
        if (!selectedRole || !user) return;
        setUpdatingRole(true);
        try {
            await api.patch(`/users/admin/${user.id}/role`, { role: selectedRole });
            // Refresh user details
            fetchUserDetails();
            setRoleModalOpen(false);
        } catch (err: any) {
            console.error('Failed to update role:', err);
            alert(err.response?.data?.message || 'Failed to update role');
        } finally {
            setUpdatingRole(false);
        }
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8" /></div>;
    if (!user) return <div className="text-center py-20 text-muted-foreground">User not found</div>;

    return (
        <div className="space-y-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4 pl-0 hover:pl-2 transition-all">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Users
            </Button>

            {/* Profile Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader className="pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <div className="w-24 h-24 rounded-[2rem] bg-primary/10 border-4 border-background shadow-xl flex items-center justify-center text-4xl font-black text-primary overflow-hidden shrink-0 cursor-pointer hover:border-primary/50 transition-colors">
                                            {user.avatar ? (
                                                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                                            ) : (
                                                user.name?.[0]?.toUpperCase() || user.email[0]?.toUpperCase()
                                            )}
                                        </div>
                                    </DialogTrigger>
                                    {user.avatar && (
                                        <DialogContent className="sm:max-w-md border-border/50 bg-background/80 backdrop-blur-xl p-0 overflow-hidden rounded-[2rem]">
                                            <div className="w-full aspect-square relative flex items-center justify-center bg-black/50">
                                                <img src={user.avatar} alt={user.name} className="max-w-full max-h-full object-contain" />
                                            </div>
                                        </DialogContent>
                                    )}
                                </Dialog>
                                <div>
                                    <h1 className="text-2xl font-bold flex items-center gap-2">
                                        {user.name || 'Unnamed User'}
                                        <Badge className={`${getRoleColor(user.role)} text-xs border`}>
                                            <Shield className="w-3 h-3 mr-1" />
                                            {ROLE_LABELS[user.role as UserRole] || user.role}
                                        </Badge>
                                        {user.banned && <Badge variant="destructive" className="text-xs">Banned</Badge>}
                                    </h1>
                                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                        <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
                                        <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    {user.country && <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1"><MapPin className="w-4 h-4" /> {user.country}</div>}
                                </div>
                            </div>
                            <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" size="sm" onClick={() => setSelectedRole(user.role)}>
                                        <Edit className="w-4 h-4 mr-2" /> Manage Role
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Update User Role</DialogTitle>
                                        <DialogDescription>
                                            Change the access level for {user.name}. Higher roles have more permissions.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="py-4">
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <Select
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                            >
                                                {Object.values(UserRole).map((role) => (
                                                    <option key={role} value={role}>
                                                        {ROLE_LABELS[role]}
                                                    </option>
                                                ))}
                                            </Select>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Note: You can only assign roles lower than your own.
                                            </p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
                                        <Button onClick={handleUpdateRole} disabled={updatingRole}>
                                            {updatingRole && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            {updatingRole ? 'Updating...' : 'Save Changes'}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Game IDs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-border">
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">Riot ID</span>
                                <p className="font-medium text-sm">{user.riotId || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">BGMI ID</span>
                                <p className="font-medium text-sm">{user.bgmiId || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">FreeFire ID</span>
                                <p className="font-medium text-sm">{user.freeFireId || '-'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-muted-foreground">PUBG ID</span>
                                <p className="font-medium text-sm">{user.pubgId || '-'}</p>
                            </div>
                        </div>

                        {/* Teams */}
                        <div>
                            <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                <Gamepad2 className="w-4 h-4" /> Teams
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {user.teams.length === 0 ? <span className="text-sm text-muted-foreground italic">No teams joined</span> :
                                    user.teams.map((t) => (
                                        <Badge key={t.team.id} variant="outline" className="pl-2 pr-3 py-1">
                                            {t.team.name} <span className="ml-2 text-[10px] opacity-70">({t.team.game})</span>
                                        </Badge>
                                    ))
                                }
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Wallet Summary */}
                <Card className="h-full">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" /> Wallet
                        </CardTitle>
                        {(currentUserRole === 'ULTIMATE_ADMIN' || currentUserRole === 'SUPERADMIN') && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-2 text-primary"
                                onClick={() => setIsAdjustmentModalOpen(true)}
                            >
                                <Wallet className="w-4 h-4" /> Adjust
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="text-center py-6 bg-primary/5 rounded-lg border border-primary/10">
                            <span className="text-sm text-muted-foreground">Current Balance</span>
                            <div className="text-4xl font-bold text-primary mt-1">
                                {user.wallet?.balance?.toLocaleString() || 0} Coins
                            </div>
                        </div>
                        <div className="space-y-2">
                            {/* Mini stats could go here */}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Total Transactions</span>
                                <span className="font-medium">{transactions.length}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Wallet Status</span>
                                <span className="font-medium text-green-500">Active</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transaction History */}
            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Full financial record for this user</CardDescription>
                </CardHeader>
                <CardContent>
                    {txLoading ? (
                        <div className="py-8 text-center"><Loader2 className="animate-spin h-6 w-6 mx-auto" /></div>
                    ) : transactions.length === 0 ? (
                        <div className="py-8 text-center text-muted-foreground">No transactions found</div>
                    ) : (
                        <div className="relative overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3">Method</th>
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Reference/Desc</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className="border-b border-border hover:bg-muted/20">
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center gap-1 font-medium ${tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? 'text-green-500' : 'text-red-500'
                                                    }`}>
                                                    {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                    {tx.type.replace('_', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 font-bold">
                                                {tx.type === 'DEPOSIT' || tx.type === 'WINNINGS' ? '+' : '-'}{tx.amount} Coins
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant={tx.status === 'COMPLETED' ? 'default' : tx.status === 'PENDING' ? 'outline' : 'destructive'} className="text-[10px]">
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">{tx.method}</td>
                                            <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{formatDate(tx.createdAt)}</td>
                                            <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={tx.description || tx.reference}>
                                                {tx.reference || tx.description || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <WalletAdjustmentModal
                isOpen={isAdjustmentModalOpen}
                onClose={() => setIsAdjustmentModalOpen(false)}
                user={user ? { id: user.id, name: user.name || 'User', email: user.email } : null}
                onSuccess={() => {
                    fetchUserDetails();
                    fetchUserTransactions();
                }}
            />
        </div>
    );
}
