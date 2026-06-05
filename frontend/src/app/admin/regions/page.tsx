"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Map, ShieldCheck, Globe, Search, RefreshCcw, Save } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

export default function RegionsPage() {
    const [regions, setRegions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchRegions();
    }, []);

    const fetchRegions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/admin/regions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRegions(data);
        } catch (error) {
            toast.error('Failed to fetch regions');
        } finally {
            setLoading(false);
        }
    };

    const toggleRegion = async (id: string, currentStatus: boolean) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/regions/toggle`, 
                { id, isEnabled: !currentStatus },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setRegions(regions.map(r => r.id === id ? { ...r, isEnabled: !currentStatus } : r));
            toast.success('Region updated successfully');
        } catch (error) {
            toast.error('Failed to update region');
        }
    };

    const seedRegions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/admin/regions/seed`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success('Initial regions seeded!');
            fetchRegions();
        } catch (error) {
            toast.error('Failed to seed regions');
        } finally {
            setLoading(false);
        }
    };

    const filteredRegions = regions.filter(r => 
        r.name.toLowerCase().includes(search.toLowerCase()) || 
        r.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card/50 backdrop-blur-xl p-6 rounded-3xl border border-border shadow-xl">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/40">
                        <Map className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight">Regional Controls</h1>
                        <p className="text-sm text-muted-foreground font-medium">Manage website availability by country or state</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={seedRegions} className="px-4 py-2 rounded-2xl bg-primary/10 text-primary hover:bg-primary/20 transition-all border border-primary/20 font-black text-xs tracking-widest flex items-center gap-2">
                        <Save className="w-4 h-4" /> SEED COUNTRIES
                    </button>
                    <button onClick={fetchRegions} className="p-3 rounded-2xl bg-muted/50 hover:bg-muted transition-all border border-border">
                        <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                    </button>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-6 rounded-3xl border border-border bg-card/30 backdrop-blur-md">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Countries</p>
                    <p className="text-3xl font-black">{regions.filter(r => r.type === 'COUNTRY').length}</p>
                </div>
                <div className="p-6 rounded-3xl border border-border bg-card/30 backdrop-blur-md">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Total Indian States</p>
                    <p className="text-3xl font-black">{regions.filter(r => r.type === 'STATE').length}</p>
                </div>
                <div className="p-6 rounded-3xl border border-border bg-card/30 backdrop-blur-md">
                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">Blocked Regions</p>
                    <p className="text-3xl font-black text-red-500">{regions.filter(r => !r.isEnabled).length}</p>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input 
                    type="text" 
                    placeholder="Search country or state..." 
                    className="w-full pl-12 pr-4 py-4 rounded-3xl bg-card border-border border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Regions List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {loading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-24 rounded-3xl bg-muted animate-pulse" />
                    ))
                ) : (
                    filteredRegions.map((region) => (
                        <motion.div 
                            layout
                            key={region.id}
                            className={cn(
                                "p-6 rounded-3xl border transition-all flex items-center justify-between",
                                region.isEnabled ? "bg-card border-border" : "bg-red-500/5 border-red-500/20"
                            )}
                        >
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                                    region.type === 'COUNTRY' ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500"
                                )}>
                                    {region.type === 'COUNTRY' ? <Globe className="w-5 h-5" /> : <Map className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-bold">{region.name}</p>
                                    <p className="text-[10px] uppercase tracking-widest font-black opacity-50">{region.type}</p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => toggleRegion(region.id, region.isEnabled)}
                                className={cn(
                                    "relative w-12 h-6 rounded-full transition-colors duration-200",
                                    region.isEnabled ? "bg-green-500" : "bg-muted-foreground/30"
                                )}
                            >
                                <motion.div 
                                    animate={{ x: region.isEnabled ? 24 : 4 }}
                                    className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                                />
                            </button>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

function cn(...classes: any[]) {
    return classes.filter(Boolean).join(' ');
}
