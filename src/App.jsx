import React, { Suspense } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import IntroductionPage from './components/IntroductionPage';
import { TripPlanningProvider } from './context/TripPlanningContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './components/ui/NotificationSystem';
import CustomCursor from './components/ui/CustomCursor';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import BrandLogo from './components/ui/BrandLogo';

// Loading component
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-primary">
    <div className="spinner"></div>
  </div>
);

// Lazy load components with error handling
const TripDetailsForm = React.lazy(() => 
  import('./components/TripDetailsForm').catch(err => {
    console.error('Failed to load TripDetailsForm:', err);
    return { default: () => <div>Failed to load component. Please refresh the page.</div> };
  })
);

const TripPlanningDashboard = React.lazy(() => 
  import('./components/dashboard/TripPlanningDashboard')
);

const ItineraryGenerator = React.lazy(() =>
  import('./components/dashboard/ItineraryGenerator').catch(err => {
    console.error('Failed to load ItineraryGenerator:', err);
    return { default: () => <div>Failed to load component. Please refresh the page.</div> };
  })
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

function AppContent() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen flex flex-col bg-primary">
      <CustomCursor />
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand navbar-brand--image">
            <BrandLogo size={64} variant="full" className="navbar-brand-logo" />
          </Link>
          <ul className="navbar-nav">
            {user && (
              <>
                <li>
                  <Link 
                    to="/plan"
                    className={`navbar-link ${isActive('/plan') ? 'navbar-link-active' : ''}`}
                  >
                    Plan Trip
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/dashboard"
                    className={`navbar-link ${isActive('/dashboard') ? 'navbar-link-active' : ''}`}
                  >
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/itinerary"
                    className={`navbar-link ${isActive('/itinerary') ? 'navbar-link-active' : ''}`}
                  >
                    Itinerary
                  </Link>
                </li>
              </>
            )}
            {user ? (
              <>
                <li>
                  <span className="text-light" style={{ padding: 'var(--space-2) var(--space-4)' }}>
                    {user.name || user.email}
                  </span>
                </li>
                <li>
                  <button onClick={logout} className="btn btn-outline btn-sm">
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    to="/login"
                    className={`navbar-link ${isActive('/login') ? 'navbar-link-active' : ''}`}
                  >
                    Login
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="btn btn-cta btn-sm">
                    Sign Up
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
      </nav>

      <main className="flex-1 w-full bg-primary">
        <div className="container">
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<IntroductionPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/plan"
                element={
                  <ProtectedRoute>
                    <TripDetailsForm />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <TripPlanningDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/itinerary"
                element={
                  <ProtectedRoute>
                    <ItineraryGenerator />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <AuthProvider>
          <TripPlanningProvider>
            <AppContent />
          </TripPlanningProvider>
        </AuthProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
