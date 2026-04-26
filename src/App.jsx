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
import Onboarding from "./pages/Onboarding";
import SignIn from "./pages/SignIn";
import AdminSetup from "./pages/AdminSetup";
import Dashboard from "./pages/Dashboard";
import PMDashboard from "./pages/PMDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import Projects from "./pages/Projects";
import PMProjects from "./pages/PMProjects";
import PMTickets from "./pages/PMTickets";
import PMPlanning from "./pages/PMPlanning";
import EmployeeProjects from "./pages/EmployeeProjects";
import EmployeeTickets from "./pages/EmployeeTickets";
import Employees from "./pages/Employees";
import EmployeeDetail from "./pages/EmployeeDetail";
import Teams from "./pages/Teams";
import Requests from "./pages/Requests";
import EmployeeRequests from "./pages/EmployeeRequests";
import EmployeeStatsPage from "./pages/Payroll";
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
import LandingPage from "./pages/Landing Pages/Home/LandingPage";
import PricingPage from "./pages/Landing Pages/Pricing/Pricing";
import SolutionsPage from "./pages/Landing Pages/Solutions/Solutions";
import ResourcesPage from "./pages/Landing Pages/Resources/Resources";
import ResourceDetailsPage from "./pages/Landing Pages/Resources/ResourceDetails";
import CommunityPage from "./pages/Landing Pages/Community/Community";
import CompanyPage from "./pages/Landing Pages/Company/Company";
import CareersPage from "./pages/Landing Pages/Careers/Careers";
import AIPage from "./pages/Landing Pages/AI/AI";
import ProductPage from "./pages/Landing Pages/Product/Product";
import ProductFeaturePage from "./pages/Landing Pages/Product/ProductFeature";
import SupportProductPage from "./pages/Landing Pages/Product/SupportProduct";
import ComparePage from "./pages/Landing Pages/Compare/ComparePage";
import TrustCenterPage from "./pages/Landing Pages/Trust Center/TrustCenter";
import StatusPage from "./pages/Landing Pages/Status/StatusPage";
import ClientProjectProgress from "./pages/ClientProjectProgress";
import ClientImportReview from "./pages/ClientImportReview";
import TrelloOAuthCallback from "./pages/TrelloOAuthCallback";
import JiraOAuthCallback from "./pages/JiraOAuthCallback";
import JiraIntegrationConnect from "./pages/integrations/Jira/Connect";
import JiraIntegrationCallback from "./pages/integrations/Jira/Callback";
import ProviderCallback from "./pages/integrations/ProviderCallback";
import GoogleCalanderCallback from "./pages/integrations/GoogleCalander/Callback";
import LinkedInCallback from "./pages/integrations/LinkedIn/Callback";
import DocuSignCallback from "./pages/integrations/DocuSign/Callback";

// Super-Admin
import SuperadminDashboard from "./pages/superadmin/Platform/overview";
import TenantsPage from "./pages/superadmin/Platform/tenants";
import TenantDetailPage from "./pages/superadmin/Platform/tenantDetails";
import AdminPlans from "./pages/superadmin/Platform/plans";
import DiscountsPage from "./pages/superadmin/Platform/discounts";
import SuperadminResourcesPage from "./pages/superadmin/Platform/resources";
import { supabase } from "./lib/supabase";

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const parseDateValue = (value) => {
  if (value == null || value === "") return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
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
          src="/loading.lottie"
          loop
          autoplay
          style={{ width: 70, height: 70 }}
        />
      </div>
    </div>
  );
};

const SubscriptionExpiredNotice = () => {
  const [dark, setDark] = useState(getIsDarkTheme);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => setDark(getIsDarkTheme());
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    media.addEventListener?.("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      media.removeEventListener?.("change", syncTheme);
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px 16px",
        background: dark
          ? "radial-gradient(1200px 600px at 10% 0%, rgba(15,23,42,0.45), transparent), #0f1115"
          : "radial-gradient(1200px 600px at 10% 0%, rgba(219,234,254,0.7), transparent), #f8fafc",
      }}
    >
      <style>{`
        @keyframes lockPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, .28); }
          70% { transform: scale(1.03); box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>
      <div
        style={{
          width: "100%",
          maxWidth: 700,
          borderRadius: 18,
          overflow: "hidden",
          border: `1px solid ${dark ? "#2b2f38" : "#dbe2ea"}`,
          background: dark ? "#151821" : "#ffffff",
          boxShadow: dark
            ? "0 24px 48px rgba(0,0,0,0.38)"
            : "0 24px 48px rgba(15,23,42,0.12)",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: `1px solid ${dark ? "#2b2f38" : "#e2e8f0"}`,
            background: dark
              ? "linear-gradient(90deg, rgba(127,29,29,.28), rgba(30,41,59,.18))"
              : "linear-gradient(90deg, #fef2f2, #eff6ff)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: dark ? "rgba(185,28,28,.35)" : "#fee2e2",
              display: "grid",
              placeItems: "center",
              color: dark ? "#fca5a5" : "#b91c1c",
              fontWeight: 700,
              animation: "lockPulse 1.8s ease-in-out infinite",
            }}
            aria-hidden="true"
          >
            !
          </div>
          <div style={{ fontSize: 14, fontWeight: 650, color: dark ? "#fecaca" : "#991b1b" }}>
            Workspace Locked
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <h2 style={{ margin: 0, fontSize: 28, lineHeight: 1.2, color: dark ? "#f8fafc" : "#0f172a" }}>
            Subscription has expired
          </h2>
          <p style={{ marginTop: 12, marginBottom: 0, color: dark ? "#cbd5e1" : "#334155", lineHeight: 1.65 }}>
            Your access is restricted because your company billing period has ended.
            Only the company owner or an admin can renew or upgrade the subscription.
          </p>

          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 12,
              border: `1px solid ${dark ? "#334155" : "#dbeafe"}`,
              background: dark ? "rgba(30,41,59,.35)" : "#f8fbff",
              color: dark ? "#dbeafe" : "#1e3a8a",
              fontSize: 13,
              fontWeight: 560,
            }}
          >
            Action required: Ask your company owner/admin to open the Subscription page and reactivate the plan.
          </div>

          <div
            style={{
              marginTop: 16,
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
            }}
          >
            {["Projects", "Meetings", "Attendance", "Communication"].map((item) => (
              <div
                key={item}
                style={{
                  borderRadius: 10,
                  border: `1px dashed ${dark ? "#374151" : "#cbd5e1"}`,
                  background: dark ? "#111827" : "#f8fafc",
                  padding: "10px 12px",
                  fontSize: 12.5,
                  color: dark ? "#9ca3af" : "#64748b",
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>{item}</span>
                <span>Locked</span>
              </div>
            ))}
          </div>
        </div>
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
  const [tenantLockLoaded, setTenantLockLoaded] = useState(false);
  const [tenantLocked, setTenantLocked] = useState(false);
  const authReady = !loading && !!user;
  const ALWAYS_ALLOWED_ADMIN_ROUTES = new Set([
    "/dashboard",
    "/support",
    "/report-problem",
  ]);

  useEffect(() => {
    let active = true;

    const resolveTenantLock = async () => {
      if (!authReady) {
        if (active) {
          setTenantLocked(false);
          setTenantLockLoaded(false);
        }
        return;
      }

      if (!profile?.tenant_id || profile?.role === "superadmin") {
        if (active) {
          setTenantLocked(false);
          setTenantLockLoaded(true);
        }
        return;
      }

      try {
        const { data, error } = await supabase
          .from("tenants")
          .select("status, current_period_end, trial_ends_at, plan_override")
          .eq("id", profile.tenant_id)
          .maybeSingle();

        if (error || !data) {
          if (active) {
            setTenantLocked(true);
            setTenantLockLoaded(true);
          }
          return;
        }

        if (data.plan_override === true) {
          if (active) {
            setTenantLocked(false);
            setTenantLockLoaded(true);
          }
          return;
        }

        const now = Date.now();
        const status = String(data.status || "").toLowerCase();
        const periodEnd = parseDateValue(data.current_period_end);
        const trialEnd = parseDateValue(data.trial_ends_at);

        const isInactiveStatus = ["expired", "inactive", "suspended"].includes(status);
        const isPeriodEnded = !!(periodEnd && periodEnd.getTime() < now);
        const hasTrialEnded = !!trialEnd && trialEnd.getTime() < now;
        const didBillingAdvancePastTrial =
          !!(trialEnd && periodEnd && periodEnd.getTime() > trialEnd.getTime());
        const isTrialExpired =
          hasTrialEnded &&
          (["trial", "trialing", "on_trial"].includes(status) ||
            !didBillingAdvancePastTrial);

        if (active) {
          setTenantLocked(isInactiveStatus || isPeriodEnded || isTrialExpired);
          setTenantLockLoaded(true);
        }
      } catch {
        if (active) {
          setTenantLocked(true);
          setTenantLockLoaded(true);
        }
      }
    };

    setTenantLockLoaded(false);
    resolveTenantLock();

    return () => {
      active = false;
    };
  }, [authReady, profile?.tenant_id, profile?.role]);

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!tenantLockLoaded) {
    return <AuthLoadingScreen />;
  }

  if (tenantLocked) {
    const isPmOrEmployee =
      profile?.role === "project_manager" || profile?.role === "employee";
    if (isPmOrEmployee && path !== "/subscription-expired") {
      return <Navigate to="/subscription-expired" replace />;
    }
    if (!isPmOrEmployee && path !== "/subscription") {
      return <Navigate to="/subscription" replace />;
    }
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
  } else if (profile?.role === "admin" && adminComponent) {
    component = adminComponent;
  }

  // Do not allow role fallthrough to another role's component.
  // If this route has no shared `children` fallback for current role, redirect.
  if (!component) {
    return <Navigate to="/dashboard" replace />;
  }

  const isMeetingRoute = path === "/meeting" || /^\/meet\/[^/]+$/.test(path);

  if (isMeetingRoute) {
    return component;
  }

  return <MainLayout>{component}</MainLayout>;
};

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/apply/:jobId" element={<ApplyPage />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/client/project-progress/:token" element={<ClientProjectProgress />} />
          <Route path="/client/import-review/:token" element={<ClientImportReview />} />
          <Route path="/oauth/trello-callback" element={<TrelloOAuthCallback />} />
          <Route path="/oauth/jira-callback" element={<JiraOAuthCallback />} />
          <Route path="/integrations/jira" element={<JiraIntegrationConnect />} />
          <Route
            path="/integrations/linkedin/callback"
            element={<LinkedInCallback />}
          />
          <Route
            path="/integrations/docusign/callback"
            element={<DocuSignCallback />}
          />
          <Route
            path="/integrations/asana/callback"
            element={<ProviderCallback provider="asana" />}
          />
          <Route
            path="/integrations/trello/callback"
            element={<ProviderCallback provider="trello" />}
          />
          <Route
            path="/integrations/clickup/callback"
            element={<ProviderCallback provider="clickup" />}
          />
          <Route
            path="/integrations/googleCalander/callback"
            element={<GoogleCalanderCallback />}
          />
          <Route
            path="/integrations/jira/callback"
            element={<JiraIntegrationCallback />}
          />
          <Route
            path="/integrations/jira/callback/*"
            element={<JiraIntegrationCallback />}
          />
          <Route path="/ai-interview/:applicantId" element={<AiInterviewPage />} />

          <Route
            path="/track/:applicantId"
            element={<ApplicationTrackingPage />}
          />

          {/* /dashboard is always allowed - it's the fallback redirect target */}
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
            path="/platform-resources"
            element={<ProtectedRoute saComponent={<SuperadminResourcesPage />} />}
          />

          <Route
            path="/subscription"
            element={
              <ProtectedRoute
                adminComponent={<SubscriptionManagement />}
              />
            }
          />
          <Route
            path="/subscription-expired"
            element={
              <ProtectedRoute
                adminComponent={<Navigate to="/subscription" replace />}
                pmComponent={<SubscriptionExpiredNotice />}
                employeeComponent={<SubscriptionExpiredNotice />}
              />
            }
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
            element={
              <ProtectedRoute
                saComponent={<MeetingRoom />}
                pmComponent={<MeetingRoom />}
                adminComponent={<MeetingRoom />}
                employeeComponent={<MeetingRoom />}
              />
            }
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
            path="/payroll"
            element={
              <ProtectedRoute
                routePath="/payroll"
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
              <ProtectedRoute
                employeeComponent={<EmployeeProfile />}
                pmComponent={<EmployeeProfile />}
              >
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
            path="/integrations/linkedin"
            element={<Navigate to="/recruitment" replace />}
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
              <ProtectedRoute
                routePath="/settings"
                pmComponent={<Navigate to="/profile" replace />}
                employeeComponent={<Navigate to="/profile" replace />}
              >
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
                adminComponent={<PMProjects />}
                employeeComponent={<EmployeeTickets />}
              />
            }
          />

          <Route
            path="/planning"
            element={<ProtectedRoute pmComponent={<PMPlanning />} />}
          />

          <Route path="/" element={<LandingPage />} />
          <Route path="/landing" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/solutions" element={<SolutionsPage />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/resources/:id" element={<ResourceDetailsPage />} />
          <Route path="/resources/*" element={<Navigate to="/resources" replace />} />
          <Route path="/community" element={<CommunityPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/careers" element={<CareersPage />} />
          <Route path="/trust-center" element={<TrustCenterPage />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/ai" element={<AIPage />} />
          <Route path="/ai/*" element={<AIPage />} />
          <Route path="/product" element={<ProductPage />} />
          <Route path="/products" element={<Navigate to="/product" replace />} />
          <Route path="/product/support" element={<SupportProductPage />} />
          <Route path="/product/:slug" element={<ProductFeaturePage />} />
          <Route path="/compare/:slug" element={<ComparePage />} />
          <Route path="/AI" element={<AIPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
