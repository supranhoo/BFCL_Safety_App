import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './lib/stores/auth.store';
import LoginPage from './pages/auth/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardPage from './pages/dashboard/DashboardPage';
import ProtectedRoute from './components/auth/ProtectedRoute';
import IncidentListPage from './pages/incidents/IncidentListPage';

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="incidents" element={<IncidentListPage />} />
          <Route path="investigations" element={<div className="text-2xl font-bold">Investigations (Coming Soon)</div>} />
          <Route path="capas" element={<div className="text-2xl font-bold">CAPAs (Coming Soon)</div>} />
          <Route path="hazards" element={<div className="text-2xl font-bold">Hazards (Coming Soon)</div>} />
          <Route path="training" element={<div className="text-2xl font-bold">Training (Coming Soon)</div>} />
          <Route path="audits" element={<div className="text-2xl font-bold">Audits (Coming Soon)</div>} />
          <Route path="ppe" element={<div className="text-2xl font-bold">PPE (Coming Soon)</div>} />
          <Route path="drills" element={<div className="text-2xl font-bold">Mock Drills (Coming Soon)</div>} />
          <Route path="reports" element={<div className="text-2xl font-bold">Reports (Coming Soon)</div>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
