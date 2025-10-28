import apiClient from './client';

export interface Incident {
  id: string;
  incidentNumber: string;
  incidentDate: string;
  incidentTime: string;
  location: string;
  department?: { id: string; name: string } | null;
  incidentType: 'INJURY' | 'ILLNESS' | 'NEAR_MISS' | 'PROPERTY_DAMAGE' | 'ENVIRONMENTAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'UNDER_INVESTIGATION' | 'CLOSED';
}

export interface PaginatedIncidents {
  data: Incident[];
  page: number;
  limit: number;
  total: number;
}

export const incidentsApi = {
  list: async (params?: IncidentListParams) => {
    const response = await apiClient.get('/incidents', { params });
    // Backend returns data directly, not wrapped
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get(`/incidents/${id}`);
    return response.data;
  },

  create: async (data: CreateIncidentData) => {
    const response = await apiClient.post('/incidents', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateIncidentData>) => {
    const response = await apiClient.put(`/incidents/${id}`, data);
    return response.data;
  },

  updateStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/incidents/${id}/status`, { status });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await apiClient.delete(`/incidents/${id}`);
    return response.data;
  },

  getStats: async (startDate?: string, endDate?: string) => {
    const response = await apiClient.get('/incidents/stats', {
      params: { startDate, endDate },
    });
    return response.data;
  },
};
