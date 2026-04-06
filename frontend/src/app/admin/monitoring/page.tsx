'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { 
  Activity, 
  Shield, 
  Server, 
  Globe, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Cpu, 
  HardDrive, 
  Clock,
  ExternalLink
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { monitoringService, MonitoringStats, SecurityLog } from '@/services/monitoring.service';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

const StatCard = ({ title, value, icon: Icon, color, trend }: any) => {
  const colorMap: any = {
    indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/20',
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-500 hover:bg-cyan-500/20',
    rose: 'bg-rose-500/10 border-rose-500/20 text-rose-500 hover:bg-rose-500/20',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500/20',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-500 hover:bg-purple-500/20',
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl relative overflow-hidden group"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 ${colorMap[color].split(' ')[0]} blur-3xl -mr-16 -mt-16 group-hover:opacity-40 transition-all duration-500`} />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm font-medium mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
          {trend && (
            <p className={`text-xs mt-2 ${trend.startsWith('+') ? 'text-emerald-400' : 'text-rose-400'} flex items-center gap-1 font-medium`}>
              {trend} <span className="text-slate-500 font-normal">from last cycle</span>
            </p>
          )}
        </div>
        <div className={`p-3 rounded-2xl ${colorMap[color].split(' ').slice(0, 2).join(' ')} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colorMap[color].split(' ')[2]}`} />
        </div>
      </div>
    </motion.div>
  );
};

const SeverityBadge = ({ severity }: { severity: string }) => {
  const colors: any = {
    LOW: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    MEDIUM: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
    HIGH: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    CRITICAL: 'bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${colors[severity] || colors.LOW}`}>
      {severity}
    </span>
  );
};

export default function MonitoringDashboard() {
  const [stats, setStats] = useState<MonitoringStats | null>(null);
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<any[]>([]);

  const fetchStats = async () => {
    try {
      const data = await monitoringService.getDashboardStats();
      setStats(data);
      
      const newHistoryPoint = {
        time: format(new Date(), 'HH:mm:ss'),
        requests: data.traffic.totalRequestsSinceRestart % 100, // For demo visual effect
        load: Math.round(data.health.cpuUsage * 10),
      };
      
      setHistory(prev => [...prev.slice(-19), newHistoryPoint]);
      
      const logData = await monitoringService.getSecurityLogs(10);
      setLogs(logData);
    } catch (error) {
      console.error('Failed to fetch monitoring data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Server className="w-12 h-12 text-indigo-500 animate-bounce" />
        <p className="text-slate-400 font-medium">Connecting to Hyper-Monitoring Hub...</p>
      </div>
    </div>
  );

  return (
    <div className="p-8 space-y-8 max-w-[1600px] mx-auto bg-black min-h-screen text-slate-200 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            Monitoring Hub <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">Advanced</span>
          </h1>
          <p className="text-slate-500 mt-1 font-medium italic">Live system health and security intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
            <span className="text-emerald-400 text-sm font-bold">Systems Operational</span>
          </div>
          <button 
            onClick={fetchStats}
            className="p-3 bg-slate-900 border border-white/10 rounded-2xl hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-5 h-5 text-indigo-400" />
          </button>
        </div>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <StatCard 
          title="Active Sessions" 
          value={stats?.realtime.activeSessions || 0} 
          icon={Globe} 
          color="indigo" 
          trend="+12%"
        />
        <StatCard 
          title="New Users (24h)" 
          value={stats?.realtime.newUsers24h || 0} 
          icon={Zap} 
          color="purple" 
          trend="+5%"
        />
        <StatCard 
          title="Traffic Since Restart" 
          value={`${stats?.traffic.totalRequestsSinceRestart || 0} Req`} 
          icon={Activity} 
          color="cyan" 
          trend="Stable"
        />
        <StatCard 
          title="Security Alerts" 
          value={stats?.realtime.securityAlerts || 0} 
          icon={Shield} 
          color="rose" 
          trend="-2 from last peak"
        />
        <StatCard 
          title="API Error Rate" 
          value={`${stats?.traffic.errorRate.toFixed(2)}%`} 
          icon={AlertTriangle} 
          color="amber" 
          trend="Healthy"
        />
        <StatCard 
          title="Financial Volume" 
          value={`$${stats?.financial.totalVolume.toLocaleString()}`} 
          icon={HardDrive} 
          color="emerald" 
          trend="+24%"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Main Chart */}
        <div className="xl:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              Traffic Intelligence
            </h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                <span className="text-xs text-slate-400 font-medium">Requests</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-cyan-500 rounded-full" />
                <span className="text-xs text-slate-400 font-medium">Load %</span>
              </div>
            </div>
          </div>
          <div className="h-[250px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="time" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="requests"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRequests)"
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLoad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Top Endpoints</h4>
              <div className="space-y-4">
                {stats?.traffic.topEndpoints.map((endpoint, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 font-mono truncate max-w-[200px]">{endpoint.path}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500" 
                          style={{ width: `${(endpoint.count / stats.traffic.totalRequestsSinceRestart) * 100}%` }} 
                        />
                      </div>
                      <span className="text-xs font-black text-white">{endpoint.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Recent Admin Activity</h4>
              <div className="space-y-4">
                {stats?.recentActivity.map((act, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]" />
                    <div>
                      <p className="text-xs text-white font-medium">{act.action}</p>
                      <p className="text-[10px] text-slate-500">{act.admin?.name} • {format(new Date(act.createdAt), 'HH:mm')}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] p-8 self-start">
          <h3 className="text-xl font-bold text-white mb-8 flex items-center gap-2">
            <Server className="w-5 h-5 text-indigo-400" />
            Infrastructure Status
          </h3>

          <div className="space-y-8">
            {/* Memory Gauge */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-slate-300">Memory Usage</span>
                </div>
                <span className="text-sm font-black text-white">{stats?.health.memoryUsage.percentage}%</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${stats?.health.memoryUsage.percentage}%` }}
                  className={`h-full bg-gradient-to-r ${stats!.health.memoryUsage.percentage > 80 ? 'from-rose-500 to-orange-500' : 'from-emerald-500 to-cyan-500'}`}
                />
              </div>
              <div className="mt-2 flex justify-between text-[10px] text-slate-500 font-medium">
                <span>{(stats!.health.memoryUsage.used / 1024 / 1024 / 1024).toFixed(1)} GB used</span>
                <span>{(stats!.health.memoryUsage.total / 1024 / 1024 / 1024).toFixed(1)} GB total</span>
              </div>
            </div>

            {/* CPU Gauge */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span className="text-sm font-semibold text-slate-300">CPU Load (1m)</span>
                </div>
                <span className="text-sm font-black text-white">{stats?.health.cpuUsage.toFixed(2)}</span>
              </div>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(stats!.health.cpuUsage * 100, 100)}%` }}
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                />
              </div>
            </div>

            {/* Uptime */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5">
                <div className="p-3 bg-indigo-500/10 rounded-xl">
                  <Clock className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold leading-none mb-1">System Uptime</p>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {Math.floor(stats!.traffic.uptimeSeconds / 3600)}h {Math.floor((stats!.traffic.uptimeSeconds % 3600) / 60)}m {stats!.traffic.uptimeSeconds % 60}s
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Logs Table */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden">
        <div className="p-8 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-rose-500/10 rounded-lg">
                <Shield className="w-5 h-5 text-rose-500" />
             </div>
             <div>
                <h3 className="text-xl font-bold text-white">Security Intelligence Feed</h3>
                <p className="text-xs text-slate-500 font-medium">Real-time threat detection and audit logs</p>
             </div>
          </div>
          <button className="text-indigo-400 text-sm font-bold flex items-center gap-1 hover:text-indigo-300 transition-colors">
            View All Logs <ExternalLink className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.02]">
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Type / Method</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">IP Address</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Target Path</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Severity</th>
                <th className="px-8 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence>
                {logs.map((log) => (
                  <motion.tr 
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-white/[0.02] bg-transparent transition-colors group cursor-pointer"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-md ${log.severity === 'CRITICAL' ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800 text-slate-400'}`}>
                           < Zap className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{log.type}</p>
                          <p className="text-[10px] text-indigo-400 font-black uppercase">{log.method}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm text-slate-300 font-mono bg-slate-800/50 px-2 py-1 rounded-md">{log.ipAddress}</span>
                    </td>
                    <td className="px-8 py-5">
                      <span className="text-sm text-slate-400 italic truncate max-w-[200px] block">{log.path}</span>
                    </td>
                    <td className="px-8 py-5">
                      <SeverityBadge severity={log.severity} />
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 font-medium">
                      {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {logs.length === 0 && (
             <div className="p-20 text-center">
               <CheckCircle2 className="w-12 h-12 text-emerald-500/20 mx-auto mb-4" />
               <p className="text-slate-500 font-medium">No security threats detected in the last cycle.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
