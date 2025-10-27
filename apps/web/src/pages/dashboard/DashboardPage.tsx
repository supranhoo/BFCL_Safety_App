import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { AlertTriangle, CheckSquare, ShieldAlert, Search } from 'lucide-react';
import api from '../../lib/api';
import type { DashboardStats } from '../../types';

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your safety management system
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Incidents
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.incidents.total || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.incidents.open || 0} open, {stats?.incidents.closed || 0} closed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active CAPAs
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.capas.open || 0}</div>
            <p className="text-xs text-danger-600 mt-1">
              {stats?.capas.overdue || 0} overdue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Hazards
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.hazards.open || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              Total: {stats?.hazards.total || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Investigations
            </CardTitle>
            <Search className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.investigations.pending || 0}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.investigations.approved || 0} approved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Incidents by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.incidents.byType && Object.entries(stats.incidents.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{type.replace('_', ' ')}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Incidents by Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.incidents.bySeverity && Object.entries(stats.incidents.bySeverity).map(([severity, count]) => (
                <div key={severity} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{severity}</span>
                  <span className="text-sm font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      <Card className="bg-primary-50 border-primary-200">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-primary-900 mb-2">
            Welcome to BFCL Safety Management System
          </h3>
          <p className="text-sm text-primary-700">
            Phase 3 frontend is now live! You can navigate through incidents, investigations, 
            CAPA tracking, and hazard management using the sidebar. More features coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
