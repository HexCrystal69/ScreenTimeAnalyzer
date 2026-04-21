import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Trends from './pages/Trends';
import AppUsage from './pages/AppUsage';
import Categories from './pages/Categories';
import DistractingApps from './pages/DistractingApps';
import Tasks from './pages/Tasks';
import Alerts from './pages/Alerts';
import OpportunityCost from './pages/OpportunityCost';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />
      <Route path="/" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
      <Route path="/trends" element={<ProtectedRoute><Layout><Trends /></Layout></ProtectedRoute>} />
      <Route path="/app-usage" element={<ProtectedRoute><Layout><AppUsage /></Layout></ProtectedRoute>} />
      <Route path="/categories" element={<ProtectedRoute><Layout><Categories /></Layout></ProtectedRoute>} />
      <Route path="/distracting-apps" element={<ProtectedRoute><Layout><DistractingApps /></Layout></ProtectedRoute>} />
      <Route path="/tasks" element={<ProtectedRoute><Layout><Tasks /></Layout></ProtectedRoute>} />
      <Route path="/alerts" element={<ProtectedRoute><Layout><Alerts /></Layout></ProtectedRoute>} />
      <Route path="/opportunity" element={<ProtectedRoute><Layout><OpportunityCost /></Layout></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Layout><Settings /></Layout></ProtectedRoute>} />
      <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ style: { background: '#1e2235', color: '#fff', border: '1px solid #2d3148' } }} />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
