import apiClient from './client';

export interface DashboardData {
  incidents: {
    total: number;
    open: number;
    closed: number;
    highSeverityOpen: number;
    recent: Array<{
      id: string;
      incidentNumber: string;
      description: string;
      severity: string;
      status: string;
      createdAt: string;
    }>;
  };
  capa: {
    open: number;
    overdue: number;
  };
  hazards: {
    open: number;
  };
  training: {
    upcoming: number;
  };
  generatedAt: string;
}

export const reportsApi = {
  async getDashboard(): Promise<DashboardData> {
    const res = await apiClient.get('/reports/dashboard');
    return res.data as DashboardData;
  },
};
