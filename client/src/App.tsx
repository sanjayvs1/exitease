import { Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './components/ThemeProvider';
import { Toaster } from './components/ui/sonner';
import ProtectedRoute from './components/ProtectedRoute';
import RoleBasedRoute from './components/RoleBasedRoute';
import RoleBasedRedirect from './components/RoleBasedRedirect';
import Header from './components/Header';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ResigForm from './pages/ResigForm';
import './App.css';

function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <AuthProvider>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* HR-only dashboard */}
            <Route path="/dash" element={
              <RoleBasedRoute allowedRoles={['HR']}>
                <Header />
                <Dashboard />
              </RoleBasedRoute>
            } />

            {/* Employee resignation form - accessible to all authenticated users */}
            <Route path="/resign" element={
              <ProtectedRoute>
                <Header />
                <ResigForm />
              </ProtectedRoute>
            } />

            {/* Default redirect based on role */}
            <Route path="/" element={<RoleBasedRedirect />} />
          </Routes>

          <Toaster richColors />
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
