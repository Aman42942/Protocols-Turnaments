import api from '@/lib/api';

export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  timestamp: string;
}

export interface MonitoringStats {
  health: SystemHealth;
  realtime: {
    activeSessions: number;
    totalUsers: number;
    totalTournaments: number;
    securityAlerts: number;
    newUsers24h: number;
  };
  traffic: {
    totalRequestsSinceRestart: number;
    errorRate: number;
    uptimeSeconds: number;
    topEndpoints: Array<{ path: string; count: number }>;
  };
  financial: {
    totalVolume: number;
  };
  recentActivity: Array<{
    id: string;
    action: string;
    createdAt: string;
    admin?: { name: string };
  }>;
}

export interface SecurityLog {
  id: string;
  type: string;
  ipAddress: string;
  path: string;
  method: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolved: boolean;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  payload?: string;
}

export const monitoringService = {
  getDashboardStats: async (): Promise<MonitoringStats> => {
    const response = await api.get('/monitoring/dashboard');
    return response.data;
  },

  getSecurityLogs: async (limit = 50): Promise<SecurityLog[]> => {
    const response = await api.get(`/monitoring/security-logs?limit=${limit}`);
    return response.data;
  },

  getHealth: async (): Promise<SystemHealth> => {
    const response = await api.get('/monitoring/health');
    return response.data;
  },
};
