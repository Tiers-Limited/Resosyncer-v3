import { useEffect, useState } from "react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { useLocation } from "react-router-dom";
import Register from "./pages/register";
import SignIn from "./pages/SignIn";
import AdminSetup from "./pages/AdminSetup";
import Dashboard from "./pages/Dashboard";
import PMDashboard from "./pages/PMDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Projects from "./pages/Projects";
import PMProjects from "./pages/PMProjects";
import PMTickets from "./pages/PMTickets";
import EmployeeProjects from "./pages/EmployeeProjects";
import EmployeeTickets from "./pages/EmployeeTickets";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Teams from "./pages/Teams";
import Requests from "./pages/Requests";
import EmployeeRequests from "./pages/EmployeeRequests";
import EmployeeStatsPage from "./pages/EmployeeStats";
import Leads from "./pages/Leads";
import Payments from "./pages/Payments";
import Documents from "./pages/Documents";
import Communication from "./pages/Communication";
import Settings from "./pages/Settings";
import EmployeeProfile from "./pages/EmployeeProfile";
import LetterGeneration from "./pages/LetterGeneration";
import EmployeeTimingStats from "./pages/ActivityMonitor";
import StandupAttendance from "./pages/StandupAttendance";
import EmployeeAttendanceProfile from "./pages/employeeAttendances";
import StandupStats from "./pages/employeeStandups";
import AdminTrainingMaterials from "./pages/adminTraining";
import EmployeeTrainingMaterials from "./pages/employeesTraining";
import ContractGenerator from "./pages/ContractMaker";
import Recruitment from "./pages/recruitment";
import RecruitmentPipeline from "./pages/recruitmentPipeline";
import AdminStandupStats from "./pages/adminStandups";
import ApplyPage from "./pages/applyPage";
import ApplicationTrackingPage from "./pages/applicationStatus";
import AiInterviewPage from "./pages/aiInterview";
import InterviewReviewPage from "./pages/InterviewReview";
import MeetingRoom from "./pages/meetingsroom";
import MeetingsPage from "./pages/mettingspage";
import SubscriptionManagement from "./pages/subscriptions";
import SupportCenter from "./pages/SupportCenter";
import ReportProblem from "./pages/ReportProblem";
import MainLayout from "./components/Layout/MainLayout";

// Super-Admin
import SuperadminDashboard from "./pages/superadmin/Platform/overview";
import TenantsPage from "./pages/superadmin/Platform/tenants";
import TenantDetailPage from "./pages/superadmin/Platform/tenantDetails";
import AdminPlans from "./pages/superadmin/Platform/plans";
import DiscountsPage from "./pages/superadmin/Platform/discounts";

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const AuthLoadingScreen = () => {
  const [dark, setDark] = useState(getIsDarkTheme);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => setDark(getIsDarkTheme());

    syncTheme();
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", syncTheme);
    } else if (typeof media.addListener === "function") {
      media.addListener(syncTheme);
    }

    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      if (typeof media.removeEventListener === "function") {
        media.removeEventListener("change", syncTheme);
      } else if (typeof media.removeListener === "function") {
        media.removeListener(syncTheme);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: dark ? "#141416" : "#f8fafc",
        transition: "background-color 0.2s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: 8,
        }}
      >
        <DotLottieReact
          src="/Ryzent.lottie"
          loop
          autoplay
          style={{ width: 140, height: 140 }}
        />
      </div>
    </div>
  );
};

const ProtectedRoute = ({
  children,
  pmComponent,
  adminComponent,
  employeeComponent,
  saComponent,
  routePath,
}) => {
  const { user, loading, profile } = useAuth();
  const location = useLocation();
  const path = location.pathname;
  const ALWAYS_ALLOWED_ADMIN_ROUTES = new Set([
    "/dashboard",
    "/support",
    "/report-problem",
  ]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (
    profile?.role === "admin" &&
    Array.isArray(profile?.permissions) &&
    routePath
  ) {
    if (
      !ALWAYS_ALLOWED_ADMIN_ROUTES.has(routePath) &&
      !profile.permissions.includes(routePath)
    ) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  let component = children;

  if (profile?.role === "superadmin" && saComponent) {
    component = saComponent;
  } else if (profile?.role === "project_manager" && pmComponent) {
    component = pmComponent;
  } else if (profile?.role === "employee" && employeeComponent) {
    component = employeeComponent;
  } else if (adminComponent) {
    component = adminComponent;
  }

  const isMeetingRoute = path === "/meeting" || /^\/meet\/[^/]+$/.test(path);

  if (isMeetingRoute) {
    return component;
  }

  return <MainLayout>{component}</MainLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/apply/:jobId" element={<ApplyPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/ai-interview/:applicantId" element={<AiInterviewPage />} />

          <Route
            path="/track/:applicantId"
            element={<ApplicationTrackingPage />}
          />

          {/* /dashboard is always allowed — it's the fallback redirect target */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute
                saComponent={<SuperadminDashboard />}
                pmComponent={<PMDashboard />}
                adminComponent={<Dashboard />}
                employeeComponent={<EmployeeDashboard />}
              />
            }
          />

          <Route
            path="/tenants"
            element={<ProtectedRoute saComponent={<TenantsPage />} />}
          />

          <Route
            path="/subscription-plans"
            element={<ProtectedRoute saComponent={<AdminPlans />} />}
          />

          <Route
            path="/discounts"
            element={<ProtectedRoute saComponent={<DiscountsPage />} />}
          />

          <Route
            path="/subscription"
            element={<ProtectedRoute adminComponent={<SubscriptionManagement />} />}
          />

          <Route
            path="/tenants/:id"
            element={<ProtectedRoute saComponent={<TenantDetailPage />} />}
          />

          <Route
            path="/projects"
            element={
              <ProtectedRoute
                routePath="/projects"
                pmComponent={<PMProjects />}
                adminComponent={<Projects />}
                employeeComponent={<EmployeeProjects />}
              />
            }
          />

          <Route
            path="/training-material"
            element={
              <ProtectedRoute
                routePath="/training-material"
                adminComponent={<AdminTrainingMaterials />}
                employeeComponent={<EmployeeTrainingMaterials />}
              />
            }
          />

          <Route
            path="/meetings"
            element={<ProtectedRoute adminComponent={<MeetingRoom />} />}
          />

          <Route
            path="/meet/:roomId"
            element={<MeetingsPage />}
          />

          <Route
            path="/contract-maker"
            element={
              <ProtectedRoute
                routePath="/contract-maker"
                adminComponent={<ContractGenerator />}
              />
            }
          />

          <Route
            path="/recruitment"
            element={
              <ProtectedRoute
                routePath="/recruitment"
                adminComponent={<Recruitment />}
              />
            }
          />
          <Route
            path="/recruitment/pipeline"
            element={
              <ProtectedRoute
                routePath="/recruitment"
                adminComponent={<RecruitmentPipeline />}
              />
            }
          />
          <Route
            path="/recruitment/interviews/:applicantId"
            element={
              <ProtectedRoute
                routePath="/recruitment"
                adminComponent={<InterviewReviewPage />}
              />
            }
          />

          <Route
            path="/employees"
            element={
              <ProtectedRoute routePath="/employees">
                <Employees />
              </ProtectedRoute>
            }
          />

          {/* Detail pages inherit the parent route's permission */}
          <Route
            path="/employees/:id"
            element={
              <ProtectedRoute routePath="/employees">
                <EmployeeDetail />
              </ProtectedRoute>
            }
          />

          <Route
            path="/teams"
            element={
              <ProtectedRoute routePath="/teams">
                <Teams />
              </ProtectedRoute>
            }
          />

          <Route
            path="/requests"
            element={
              <ProtectedRoute
                routePath="/requests"
                adminComponent={<Requests />}
                pmComponent={<Requests />}
                employeeComponent={<EmployeeRequests />}
              />
            }
          />

          <Route
            path="/monitor"
            element={
              <ProtectedRoute
                routePath="/monitor"
                adminComponent={<EmployeeTimingStats />}
              />
            }
          />

          <Route
            path="/stats"
            element={
              <ProtectedRoute
                routePath="/stats"
                adminComponent={<EmployeeStatsPage />}
              />
            }
          />

          <Route
            path="/standups"
            element={
              <ProtectedRoute
                routePath="/standups"
                adminComponent={<AdminStandupStats />}
                employeeComponent={<StandupStats />}
                pmComponent={<StandupAttendance />}
              />
            }
          />

          <Route
            path="/attendance"
            element={
              <ProtectedRoute
                employeeComponent={<EmployeeAttendanceProfile />}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute employeeComponent={<EmployeeProfile />}>
                <Settings />
              </ProtectedRoute>
            }
          />

          <Route
            path="/leads"
            element={
              <ProtectedRoute routePath="/leads">
                <Leads />
              </ProtectedRoute>
            }
          />

          <Route
            path="/payments"
            element={
              <ProtectedRoute routePath="/payments">
                <Payments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/documents"
            element={
              <ProtectedRoute routePath="/documents">
                <Documents />
              </ProtectedRoute>
            }
          />

          <Route
            path="/communication"
            element={
              <ProtectedRoute routePath="/communication">
                <Communication />
              </ProtectedRoute>
            }
          />

          <Route
            path="/support"
            element={
              <ProtectedRoute
                routePath="/support"
                saComponent={<SupportCenter />}
                adminComponent={<SupportCenter />}
              />
            }
          />

          <Route
            path="/report-problem"
            element={
              <ProtectedRoute
                routePath="/report-problem"
                saComponent={<Navigate to="/dashboard" replace />}
                pmComponent={<ReportProblem />}
                adminComponent={<ReportProblem />}
                employeeComponent={<ReportProblem />}
              />
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute routePath="/settings">
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
                routePath="/projects"
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
