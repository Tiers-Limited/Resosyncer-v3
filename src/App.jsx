import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import SignIn from './pages/SignIn';
import AdminSetup from './pages/AdminSetup';
import Dashboard from './pages/Dashboard';
import PMDashboard from './pages/PMDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Projects from './pages/Projects';
import PMProjects from './pages/PMProjects';
import PMTickets from './pages/PMTickets';
import EmployeeProjects from './pages/EmployeeProjects';
import EmployeeTickets from './pages/EmployeeTickets';
import Employees from './pages/Employees';
import EmployeeDetail from './pages/EmployeeDetail';
import Teams from './pages/Teams';
import Requests from './pages/Requests';
import EmployeeRequests from './pages/EmployeeRequests';
import Attendance from './pages/Attendance';
import EmployeeAttendance from './pages/EmployeeAttendance';
import Leads from './pages/Leads';
import Payments from './pages/Payments';
import Documents from './pages/Documents';
import Communication from './pages/Communication';
import Settings from './pages/Settings';
import EmployeeProfile from './pages/EmployeeProfile';
import LetterGeneration from './pages/LetterGeneration';
import MainLayout from './components/Layout/MainLayout';

const ProtectedRoute = ({ children, pmComponent, adminComponent, employeeComponent }) => {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  let component = children;

  if (profile?.role === 'project_manager' && pmComponent) {
    component = pmComponent;
  } else if (profile?.role === 'admin' && adminComponent) {
    component = adminComponent;
  } else if (profile?.role === 'employee' && employeeComponent) {
    component = employeeComponent;
  } else if (adminComponent) {
    component = adminComponent;
  }

  return <MainLayout>{component}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/signin" element={<SignIn />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                pmComponent={<PMDashboard />}
                adminComponent={<Dashboard />}
                employeeComponent={<EmployeeDashboard />}
              />
            }
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute
                pmComponent={<PMProjects />}
                adminComponent={<Projects />}
                employeeComponent={<EmployeeProjects />}
              />
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Employees />
              </ProtectedRoute>
            }
          />

          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute>
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute>
                <Teams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute
                adminComponent={<Requests />}
                pmComponent={<Requests />}
                employeeComponent={<EmployeeRequests />}
              />
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute
                adminComponent={<Attendance />}
                employeeComponent={<EmployeeAttendance />}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute
                employeeComponent={<EmployeeProfile />}
              >
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute>
                <Leads />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute>
                <Payments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/communication"
            element={
              <ProtectedRoute>
                <Communication />
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/letters"
            element={
              <ProtectedRoute>
                <LetterGeneration />
              </ProtectedRoute>
            }
          />

          <Route
            path="/projects/:projectId/tickets"
            element={
              <ProtectedRoute
                pmComponent={<PMTickets />}
                employeeComponent={<EmployeeTickets />}
              />
            }
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
