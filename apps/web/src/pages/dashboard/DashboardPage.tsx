import { useState, useEffect } from 'react';
import { useAuthStore } from '../../lib/stores/auth.store';
import { incidentsApi } from '../../lib/api/incidents';
import type { Incident } from '../../lib/api/incidents';

interface DashboardStats {
  totalIncidents: number;
  openIncidents: number;
  closedIncidents: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats>({ totalIncidents: 0, openIncidents: 0, closedIncidents: 0 });
  const [recentIncidents, setRecentIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all incidents to calculate stats
      const allIncidents = await incidentsApi.list({ page: 1, limit: 100 });
      const incidents = allIncidents.data || [];
      
      // Calculate stats
      setStats({
        totalIncidents: incidents.length,
        openIncidents: incidents.filter((i: Incident) => 
          i.status === 'SUBMITTED' || i.status === 'UNDER_REVIEW' || i.status === 'UNDER_INVESTIGATION'
        ).length,
        closedIncidents: incidents.filter((i: Incident) => i.status === 'CLOSED').length,
      });

      // Get recent incidents
      const recent = await incidentsApi.list({ page: 1, limit: 5 });
      setRecentIncidents(recent.data || []);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.error || err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-red-100 text-red-800';
      case 'MEDIUM':
        return 'bg-orange-100 text-orange-800';
      case 'LOW':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
        <p className="text-red-700">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    { 
      name: 'Total Incidents', 
      value: stats.totalIncidents.toString(), 
      icon: '⚠️', 
      color: 'bg-red-500' 
    },
    { 
      name: 'Open Incidents', 
      value: stats.openIncidents.toString(), 
      icon: '🔓', 
      color: 'bg-orange-500' 
    },
    { 
      name: 'Closed Incidents', 
      value: stats.closedIncidents.toString(), 
      icon: '✅', 
      color: 'bg-green-500' 
    },
    { 
      name: 'System Status', 
      value: '✓', 
      icon: '💚', 
      color: 'bg-blue-500' 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}! 👋
        </h1>
        <p className="text-primary-100">
          Here's what's happening in your safety management system today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} h-12 w-12 rounded-lg flex items-center justify-center text-2xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
            <button
              onClick={loadDashboardData}
              className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
              title="Refresh"
            >
              ↻
            </button>
          </div>
          <div className="p-6">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📊</p>
                <p>No incidents found</p>
                <p className="text-sm mt-2">Create your first incident report</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentIncidents.map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono text-gray-500">{incident.incidentNumber}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(incident.severity)}`}>
                          {incident.severity}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mt-1">
                        {incident.incidentType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(incident.incidentDate)} at {incident.location}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                ))}
              </div>
            )}
            <button 
              onClick={() => window.location.href = '/incidents'}
              className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
            >
              View All Incidents →
            </button>
          </div>
        </div>

        {/* System Info */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">✅</span>
                  <span className="text-sm font-medium text-green-900">API Connected</span>
                </div>
                <p className="text-xs text-green-700">
                  Successfully connected to the BFCL Safety API. Real-time data is being displayed.
                </p>
              </div>
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">💾</span>
                  <span className="text-sm font-medium text-blue-900">Database Active</span>
                </div>
                <p className="text-xs text-blue-700">
                  PostgreSQL database is running and accessible. All data is persisted securely.
                </p>
              </div>
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">🔐</span>
                  <span className="text-sm font-medium text-purple-900">Authentication Working</span>
                </div>
                <p className="text-xs text-purple-700">
                  JWT authentication is active. You are logged in as {user?.email}.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center">
            <div className="text-3xl mb-2">⚠️</div>
            <div className="text-sm font-medium text-gray-900">Report Incident</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center">
            <div className="text-3xl mb-2">☢️</div>
            <div className="text-sm font-medium text-gray-900">Report Hazard</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center">
            <div className="text-3xl mb-2">📋</div>
            <div className="text-sm font-medium text-gray-900">Create CAPA</div>
          </button>
          <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition text-center">
            <div className="text-3xl mb-2">✅</div>
            <div className="text-sm font-medium text-gray-900">Schedule Audit</div>
          </button>
        </div>
      </div>
    </div>
  );
}
