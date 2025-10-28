import { useAuthStore } from '../../lib/stores/auth.store';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const stats = [
    { name: 'Total Incidents', value: '24', change: '+12%', icon: '⚠️', color: 'bg-red-500' },
    { name: 'Open CAPAs', value: '18', change: '+5%', icon: '📋', color: 'bg-orange-500' },
    { name: 'Open Hazards', value: '12', change: '-8%', icon: '☢️', color: 'bg-yellow-500' },
    { name: 'Active Users', value: '156', change: '+3%', icon: '👥', color: 'bg-green-500' },
  ];

  const recentIncidents = [
    { id: 'INC-2025-0024', title: 'Slip and Fall in Production Area', severity: 'Medium', date: 'Oct 27, 2025' },
    { id: 'INC-2025-0023', title: 'Chemical Spill in Lab', severity: 'High', date: 'Oct 26, 2025' },
    { id: 'INC-2025-0022', title: 'Near Miss - Forklift Operation', severity: 'Low', date: 'Oct 25, 2025' },
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
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                <p className="text-sm text-green-600 mt-2">{stat.change} from last month</p>
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
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Incidents</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono text-gray-500">{incident.id}</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          incident.severity === 'High'
                            ? 'bg-red-100 text-red-800'
                            : incident.severity === 'Medium'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">{incident.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{incident.date}</p>
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
