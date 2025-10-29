import { useEffect, useState } from 'react';
import { useAuthStore } from '../../lib/stores/auth.store';
import { reportsApi, type DashboardData } from '../../lib/api/reports';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const d = await reportsApi.getDashboard();
        if (mounted) {
          setData(d);
          setError(null);
        }
      } catch (e: any) {
        console.error('Failed to load dashboard', e?.response?.data || e?.message);
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
        {loading ? (
          <div className="col-span-4 text-center text-gray-600">Loading dashboard…</div>
        ) : error ? (
          <div className="col-span-4 text-center text-red-600">{error}</div>
        ) : data ? (
          <>
            <KpiCard name="Total Incidents" value={String(data.incidents.total)} icon="⚠️" color="bg-red-500" />
            <KpiCard name="Open Incidents" value={String(data.incidents.open)} icon="🚧" color="bg-orange-500" />
            <KpiCard name="Open CAPAs" value={String(data.capa.open)} icon="📋" color="bg-yellow-500" />
            <KpiCard name="Open Hazards" value={String(data.hazards.open)} icon="☢️" color="bg-green-500" />
          </>
        ) : null}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {(data?.incidents.recent || []).map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-gray-500">{incident.incidentNumber}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          incident.severity === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : incident.severity === 'MEDIUM'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">{incident.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{new Date(incident.createdAt).toLocaleString()}</p>
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
            <button className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition">
              View All Incidents →
            </button>
          </div>
        </div>

        {/* Overdue CAPAs */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Overdue CAPAs</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-red-900">CAPA-2025-0015</span>
                  <span className="text-xs font-medium text-red-700">7 days overdue</span>
                </div>
                <p className="text-sm font-medium text-red-900">
                  Install additional safety guards on Machine #5
                </p>
                <p className="text-xs text-red-700 mt-2">Assigned to: John Smith</p>
              </div>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-red-900">CAPA-2025-0012</span>
                  <span className="text-xs font-medium text-red-700">3 days overdue</span>
                </div>
                <p className="text-sm font-medium text-red-900">
                  Update chemical storage procedures
                </p>
                <p className="text-xs text-red-700 mt-2">Assigned to: Sarah Johnson</p>
              </div>
            </div>
            <button className="w-full mt-4 py-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition">
              View All CAPAs →
            </button>
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

function KpiCard({ name, value, icon, color }: { name: string; value: string; icon: string; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{name}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${color} h-12 w-12 rounded-lg flex items-center justify-center text-2xl`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
