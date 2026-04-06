
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import api from '@/lib/api';
import {
    Activity, Database, Cpu, HardDrive, Server, RefreshCw, CheckCircle, XCircle
} from 'lucide-react';

export default function HealthDashboard() {
    const [health, setHealth] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchHealth = async () => {
        setLoading(true);
        setError('');
        try {
            // Using the admin endpoint which might offer more details
            const res = await api.get('/health/admin');
            setHealth(res.data);
        } catch (err) {
            console.error('Failed to fetch health stats', err);
            setError('System services may be down');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Auto-refresh every 10 seconds
        const interval = setInterval(fetchHealth, 10000);
        return () => clearInterval(interval);
    }, []);

    const StatusBadge = ({ status }: { status: string }) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status === 'ok' || status === 'up'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
            {status === 'ok' || status === 'up'
                ? <CheckCircle className="w-3 h-3" />
                : <XCircle className="w-3 h-3" />}
            {status.toUpperCase()}
        </span>
    );

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                        <Activity className="h-8 w-8 text-primary" />
                        System Health
                    </h1>
                    <p className="text-muted-foreground">
                        Real-time system performance and status monitoring.
                    </p>
                </div>
                <Button onClick={fetchHealth} disabled={loading} variant="outline">
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {error && (
                <div className="p-4 rounded-md bg-red-50 text-red-900 border border-red-200">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {health && (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {/* Database Status */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Database</CardTitle>
                            <Database className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold flex items-center gap-2">
                                <StatusBadge status={health.database?.status || 'unknown'} />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                Latency: {health.database?.latency || 'N/A'}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Uptime */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {Math.floor(health.uptime / 60)}m {Math.floor(health.uptime % 60)}s
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                                System Online
                            </p>
                        </CardContent>
                    </Card>

                    {/* CPU Cores */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                            <CardTitle className="text-sm font-medium">CPU</CardTitle>
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {health.system?.cpu || 1} Cores
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 capitalize">
                                Platform: {health.system?.platform}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Memory Usage */}
                    <Card className="col-span-full">
                        <CardHeader>
                            <CardTitle>Memory Usage</CardTitle>
                            <CardDescription>Heap vs RSS vs System Total</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Heap Used</span>
                                    <div className="text-lg font-bold">{health.system?.memory?.heapUsed}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">RSS</span>
                                    <div className="text-lg font-bold">{health.system?.memory?.rss}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">System Free</span>
                                    <div className="text-lg font-bold">{health.system?.memory?.systemFree}</div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">System Total</span>
                                    <div className="text-lg font-bold">{health.system?.memory?.systemTotal}</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
