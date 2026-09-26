import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AgencyProvider } from './context/AgencyContext';
import { ToastProvider } from './context/ToastContext';

import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { CustomersPage } from './pages/CustomersPage';
import { CustomerDetailPage } from './pages/CustomerDetailPage';
import { LeadsPage } from './pages/LeadsPage';
import { InsurancePage } from './pages/InsurancePage';
import { RenewalsPage } from './pages/RenewalsPage';
import { FollowupsPage } from './pages/FollowupsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { CommissionsPage } from './pages/CommissionsPage';
import { LedgerPage } from './pages/LedgerPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { ActivityPage } from './pages/ActivityPage';
import { TeamPage } from './pages/TeamPage';
import { SettingsPage } from './pages/SettingsPage';

const ProtectedRoute = ({ children }) => {
  const { currentUser } = useAuth();
  if (!currentUser) return <Navigate to="/login" replace />;
  return children;
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AgencyProvider>
          <ToastProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/auth/callback" element={<AuthCallbackPage />} />

              <Route path="/" element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }>
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="customers/:id" element={<CustomerDetailPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="insurance" element={<InsurancePage />} />
                <Route path="policies" element={<InsurancePage />} />
                <Route path="renewals" element={<RenewalsPage />} />
                <Route path="followups" element={<FollowupsPage />} />
                <Route path="follow-ups" element={<FollowupsPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="commissions" element={<CommissionsPage />} />
                <Route path="ledger" element={<LedgerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="activity" element={<ActivityPage />} />
                <Route path="team" element={<TeamPage />} />
                <Route path="agents" element={<TeamPage />} />
                <Route path="settings" element={<SettingsPage />} />

                {/* Legacy / Mutual Funds redirect */}
                <Route path="mutual-funds" element={<Navigate to="/insurance" replace />} />
                <Route path="imports" element={<Navigate to="/documents" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ToastProvider>
        </AgencyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
