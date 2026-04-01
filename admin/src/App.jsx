import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Owners from './pages/Owners';
import Customers from './pages/Customers';
import Drugs from './pages/Drugs';
import Reports from './pages/Reports';
import Invitations from './pages/Invitations';
import Scans from './pages/Scans';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={isAuthenticated() ? <Navigate to="/dashboard" replace /> : <Login />}
        />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="owners" element={<Owners />} />
          <Route path="customers" element={<Customers />} />
          <Route path="drugs" element={<Drugs />} />
          <Route path="reports" element={<Reports />} />
          <Route path="invitations" element={<Invitations />} />
          <Route path="scans" element={<Scans />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
