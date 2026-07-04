import { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import API from './utils/api';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import InterviewSetup from './pages/InterviewSetup';
import InterviewSession from './pages/InterviewSession';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Pricing from './pages/Pricing';

// Auth Context
export const AuthContext = createContext(null);

export const useAuth = () => useContext(AuthContext);

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }
  return user ? children : <Navigate to="/" />;
}

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data } = await API.get('/auth/profile');
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = (userData) => {
    setUser(userData);
    setShowAuth(false);
  };

  const logout = async () => {
    try {
      await API.get('/auth/logout');
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
  };

  const updateCredits = (newCredits) => {
    setUser((prev) => (prev ? { ...prev, credits: newCredits } : null));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, showAuth, setShowAuth, updateCredits }}>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/interview"
              element={
                <ProtectedRoute>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/session/:id"
              element={
                <ProtectedRoute>
                  <InterviewSession />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:id"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute>
                  <History />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Pricing />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
