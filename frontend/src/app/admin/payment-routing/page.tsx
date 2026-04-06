"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle, CreditCard, Plus, Trash2, Globe, RefreshCcw, Check } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const GATEWAYS = ['CASHFREE', 'PAYPAL', 'PAYONEER', 'WISE'];

export default function PaymentRoutingPage() {
    const [routes, setRoutes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newRoute, setNewRoute] = useState<{country: string, gateways: string[]}>({ country: '', gateways: [] });

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment-routing`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoutes(data);
        } catch (error) {
            toast.error('Failed to fetch routes');
        } finally {
            setLoading(false);
        }
    };

    const toggleGatewayInNewRoute = (g: string) => {
        if (newRoute.gateways.includes(g)) {
            setNewRoute({ ...newRoute, gateways: newRoute.gateways.filter(x => x !== g) });
        } else {
            setNewRoute({ ...newRoute, gateways: [...newRoute.gateways, g] });
        }
    };

    const handleAdd = async () => {
        if (!newRoute.country) return toast.error('Country name required');
        if (newRoute.gateways.length === 0) return toast.error('Select at least one gateway');
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment-routing`, 
                newRoute,
                { headers: { Authorization: `Bearer ${token}` }}
            );
            toast.success('Route added / updated successfully');
            setNewRoute({ country: '', gateways: [] });
            fetchRoutes();
        } catch (error) {
            toast.error('Failed to add route');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/admin/payment-routing/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRoutes(routes.filter(r => r.id !== id));
            toast.success('Route deleted successfully');
        } catch (error) {
            toast.error('Failed to delete route');
        }
    };

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/40">
                        <Shuffle className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Smart Payment Routing</h1>
                        <p className="text-sm text-muted-foreground font-medium">Link countries to specific payment gateways</p>
                    </div>
                </div>
                <button onClick={fetchRoutes} className="p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-all border border-border">
                    <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
            </div>

            {/* Quick Add Form */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 p-8 rounded-3xl bg-card border border-border shadow-xl relative overflow-hidden">
                <div className="md:col-span-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Country Name</p>
                    <input 
                        type="text" 
                        placeholder="e.g. Bangladesh" 
                        className="w-full p-4 rounded-2xl bg-muted/30 border border-border focus:border-primary outline-none transition-all font-medium"
                        value={newRoute.country}
                        onChange={(e) => setNewRoute({...newRoute, country: e.target.value})}
                    />
                </div>
                <div className="md:col-span-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3 ml-1">Available Gateways (Select Multiple)</p>
                    <div className="flex flex-wrap gap-2">
                        {GATEWAYS.map(g => (
                            <button 
                                key={g}
                                onClick={() => toggleGatewayInNewRoute(g)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-xs font-black tracking-widest border transition-all flex items-center gap-2",
                                    newRoute.gateways.includes(g) 
                                        ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                        : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40"
                                )}
                            >
                                {newRoute.gateways.includes(g) && <Check className="w-3 h-3" />}
                                {g}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="md:col-span-2 flex items-end">
                    <button 
                        onClick={handleAdd}
                        className="w-full h-[58px] rounded-2xl bg-primary text-primary-foreground font-black tracking-widest flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-5 h-5" /> SAVE
                    </button>
                </div>
            </div>

            {/* Default Rules Alert */}
            <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20 flex items-center gap-4 text-sm font-medium text-blue-400">
                <Globe className="w-5 h-5 shrink-0" />
                <p>Default Logic: India ➜ Cashfree | USA ➜ PayPal | UK ➜ Wise | Global ➜ Payoneer + Wise</p>
            </div>

            {/* Routes Table */}
            <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-border overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-muted/50 border-b border-border">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Country</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Gateways</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border/50">
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={3} className="px-6 py-8"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /></td>
                                </tr>
                            ))
                        ) : routes.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-muted-foreground font-medium italic">No custom routes established yet.</td>
                            </tr>
                        ) : (
                            routes.map((route) => (
                                <tr key={route.id} className="hover:bg-muted/20 transition-all group">
                                    <td className="px-6 py-5 font-bold tracking-tight text-lg">{route.country}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-2">
                                            {route.gateways.map((g: string) => (
                                                <div key={g} className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 text-[10px] font-black tracking-widest border border-indigo-500/20 uppercase">
                                                    <CreditCard className="w-3 h-3" /> {g}
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button 
                                            onClick={() => handleDelete(route.id)}
                                            className="p-3 rounded-xl text-red-500/50 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
