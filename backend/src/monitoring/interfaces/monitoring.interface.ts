export interface SystemHealth {
  cpuUsage: number;
  memoryUsage: {
    total: number;
    free: number;
    used: number;
    percentage: number;
  };
  uptime: number;
  timestamp: Date;
}

export interface TrafficStats {
  requestsTotal: number;
  requestsLastHour: number;
  avgResponseTime: number;
  errorRate: number;
}
