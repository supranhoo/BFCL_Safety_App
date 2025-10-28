import apiClient from './client';

export interface DashboardStats {
  totalIncidents: number;
  openCAPAs: number;
  openHazards: number;
  activeUsers: number;
  incidentsByType: Record<string, number>;
  incidentsBySeverity: Record<string, number>;
  capasByStatus: Record<string, number>;
}

export interface IncidentTrend {
  month: string;
  total: number;
  byType: Record<string, number>;
  bySeverity: Record<string, number>;
}

export interface CAPAEffectiveness {
  total: number;
  completed: number;
  onTime: number;
  overdue: number;
  completionRate: number;
  onTimeRate: number;
}

export const reportsApi = {
  getDashboardStats: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/reports/dashboard', {
      params: { startDate, endDate },
    });
    return response.data as DashboardStats;
  },

  getIncidentTrends: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/reports/incident-trends', {
      params: { startDate, endDate },
    });
    return response.data as IncidentTrend[];
  },

  getCAPAEffectiveness: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/reports/capa-effectiveness', {
      params: { startDate, endDate },
    });
    return response.data as CAPAEffectiveness;
  },

  getLTIFR: async (totalHoursWorked: number, startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/reports/ltifr', {
      params: { totalHoursWorked, startDate, endDate },
    });
    return response.data;
  },

  getTRIR: async (totalHoursWorked: number, startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/reports/trir', {
      params: { totalHoursWorked, startDate, endDate },
    });
    return response.data;
  },

  getOSHA300Log: async (year: number) => {
    const response = await apiClient.get('/reports/osha-300', {
      params: { year },
    });
    return response.data;
  },
};
