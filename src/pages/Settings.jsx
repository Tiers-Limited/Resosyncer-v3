import { useState, useEffect } from "react";
import {
  Form,
  Input,
  Button,
  message,
  Avatar,
  Table,
  Modal,
  Tag,
  DatePicker,
  Upload,
  Divider,
  Tooltip,
  Checkbox,
  InputNumber,
  Select,
  TimePicker,
  Switch,
  Steps,
} from "antd";
import {
  UserOutlined,
  PlusOutlined,
  DeleteOutlined,
  CalendarOutlined,
  CameraOutlined,
  LoadingOutlined,
  LockOutlined,
  TeamOutlined,
  BankOutlined,
  IdcardOutlined,
  MailOutlined,
  PhoneOutlined,
  SafetyOutlined,
  SettingOutlined,
  ClockCircleOutlined,
  QrcodeOutlined,
  MobileOutlined,
  CheckCircleOutlined,
  KeyOutlined,
  EditOutlined,
  DashboardOutlined,
  ProjectOutlined,
  FileTextOutlined,
  BarChartOutlined,
  CustomerServiceOutlined,
  AlertOutlined,
  DollarOutlined,
  UserAddOutlined,
  FileProtectOutlined,
  ReadOutlined,
  FolderOutlined,
  MessageOutlined,
  CreditCardOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  DisconnectOutlined,
  GlobalOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { buildCompanyEmail, buildOtpEmail } from "../lib/emailTemplates";
import dayjs from "dayjs";
import {
  disconnectGoogleCalander,
  getGoogleCalanderStatus,
} from "./integrations/GoogleCalander/api";
import {
  disconnectDocusign,
  getDocusignStatus,
} from "./integrations/DocuSign/api";
import {
  disconnectLinkedin,
  getLinkedinStatus,
} from "./integrations/LinkedIn/api";

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Email API helper
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Email send failed:", data);
      return { success: false, error: data };
    }
    console.log("Email sent:", data.messageId);
    return { success: true, data };
  } catch (err) {
    console.error("Email send error:", err);
    return { success: false, error: err.message };
  }
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHtml = (otp, name) =>
  buildOtpEmail({
    otp,
    name,
    title: "Your verification code",
    intro: `Hi ${name}, use the code below to enable Email OTP on your account.`,
    variant: "company",
    companyName: "Resosyncer",
  });

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Shared Layout Helpers
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const SectionTitle = ({ children }) => (
  <p className="settings-section-title">
    {children}
  </p>
);

const SettingRow = ({ label, description, children, border = true }) => (
  <div
    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-4 ${border ? "border-b border-slate-100" : ""}`}
  >
    <div className="mr-0 sm:mr-8">
      <div className="text-[13px] font-semibold text-slate-800">{label}</div>
      {description && (
        <div className="text-xs text-slate-400 mt-0.5 leading-relaxed">
          {description}
        </div>
      )}
    </div>
    <div className="flex-shrink-0">{children}</div>
  </div>
);

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const INTEGRATION_CATALOG = [
  {
    key: "jira",
    name: "Jira",
    logo: "https://cdn.worldvectorlogo.com/logos/jira-1.svg",
    description: "Sync issues, projects, and sprint status.",
    setupRoute: "/projects",
  },
  {
    key: "trello",
    name: "Trello",
    logo: "https://images.icon-icons.com/836/PNG/512/Trello_icon-icons.com_66775.png",
    description: "Connect boards and cards with workspace tasks.",
    setupRoute: "/projects",
  },
  {
    key: "clickup",
    name: "ClickUp",
    logo: "https://img.icons8.com/color/1200/clickup.jpg",
    description: "Mirror lists, tasks, assignees, and due dates.",
    setupRoute: "/projects",
  },
  {
    key: "asana",
    name: "Asana",
    logo: "https://cdn.freebiesupply.com/logos/large/2x/asana-1-logo-png-transparent.png",
    description: "Link projects and workload tracking.",
    setupRoute: "/projects",
  },
  {
    key: "linkedin",
    name: "LinkedIn",
    logo: "https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png",
    description:
      "Connect LinkedIn for recruitment posting and profile sharing.",
    setupRoute: "/recruitment",
  },
  {
    key: "google_calendar",
    name: "Google Calendar",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/500px-Google_Calendar_icon_%282020%29.svg.png",
    description: "Sync meetings, reminders, and team availability.",
    setupRoute: "/meetings",
  },
  {
    key: "docusign",
    name: "DocuSign",
    logo: "https://static.wikia.nocookie.net/logopedia/images/a/ac/DocuSign_2024_S.svg",
    description: "Manage contracts and signature workflows.",
    setupRoute: "/contract-maker",
  },
];

const JIRA_CONNECTED_STORAGE_KEY = "jira_backend_connected_at";
const ASANA_CONNECTED_STORAGE_KEY = "asana_backend_connected_at";
const TRELLO_CONNECTED_STORAGE_KEY = "trello_backend_connected_at";
const CLICKUP_CONNECTED_STORAGE_KEY = "clickup_backend_connected_at";

const PROVIDER_ALIASES = {
  jira: ["jira"],
  trello: ["trello"],
  clickup: ["clickup"],
  asana: ["asana"],
  linkedin: ["linkedin", "linked_in"],
  google_calendar: ["google_calendar", "googlecalander", "google_calendar_api"],
  docusign: ["docusign", "docsign", "docu_sign"],
};

const toCanonicalProvider = (provider) => {
  const raw = String(provider || "")
    .trim()
    .toLowerCase();
  if (!raw) return "";
  const compact = raw.replace(/[^a-z0-9]/g, "");
  if (compact.includes("jira")) return "jira";
  if (compact.includes("trello")) return "trello";
  if (compact.includes("clickup")) return "clickup";
  if (compact.includes("asana")) return "asana";
  if (compact.includes("linkedin")) return "linkedin";
  if (compact.includes("googlecalendar") || compact.includes("googlecalander"))
    return "google_calendar";
  if (compact.includes("docusign") || compact.includes("docsign"))
    return "docusign";
  for (const [canonical, aliases] of Object.entries(PROVIDER_ALIASES)) {
    if (aliases.includes(raw)) return canonical;
  }
  return raw;
};

const isIntegrationDisconnected = (row) => {
  const payload = row?.connection_data || {};
  const payloadStatus = String(payload?.status || "").toLowerCase();
  return (
    payload?.connected === false ||
    payload?.is_connected === false ||
    payload?.active === false ||
    payloadStatus === "disconnected"
  );
};

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Page permission definitions (mirrors admin sidebar)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const PAGE_GROUPS = [
  {
    group: "Workspace",
    pages: [
      { key: "/dashboard", label: "Dashboard", icon: <DashboardOutlined /> },
      { key: "/projects", label: "Projects", icon: <ProjectOutlined /> },
      { key: "/employees", label: "Employees", icon: <UserOutlined /> },
      { key: "/teams", label: "Teams", icon: <TeamOutlined /> },
    ],
  },
  {
    group: "Operations",
    pages: [
      { key: "/meetings", label: "Meetings", icon: <VideoCameraOutlined /> },
      { key: "/monitor", label: "Attendance", icon: <FileTextOutlined /> },
      {
        key: "/payroll",
        label: "Payroll",
        icon: <ClockCircleOutlined />,
      },
      { key: "/standups", label: "Standup Stats", icon: <BarChartOutlined /> },
      { key: "/requests", label: "Requests", icon: <FileTextOutlined /> },
      { key: "/leads", label: "Leads", icon: <CustomerServiceOutlined /> },
      { key: "/payments", label: "Payments", icon: <DollarOutlined /> },
    ],
  },
  {
    group: "Resources",
    pages: [
      { key: "/recruitment", label: "Recruitment", icon: <UserAddOutlined /> },
      {
        key: "/contract-maker",
        label: "Contracts",
        icon: <FileProtectOutlined />,
      },
      { key: "/training-material", label: "Training", icon: <ReadOutlined /> },
      { key: "/documents", label: "Documents", icon: <FolderOutlined /> },
      {
        key: "/communication",
        label: "Communication",
        icon: <MessageOutlined />,
      },
      {
        key: "/support",
        label: "Customer Support",
        icon: <CustomerServiceOutlined />,
      },
      {
        key: "/report-problem",
        label: "Report a Problem",
        icon: <AlertOutlined />,
      },
      {
        key: "/subscription",
        label: "Subscription",
        icon: <CreditCardOutlined />,
      },
      { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
    ],
  },
];

const ALL_PAGE_KEYS = PAGE_GROUPS.flatMap((g) => g.pages.map((p) => p.key));

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Admin Permissions Modal
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const AdminPermissionsModal = ({
  admin,
  visible,
  onClose,
  onSave,
  dark = false,
}) => {
  const [permissions, setPermissions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (admin) {
      setPermissions(admin.permissions || ALL_PAGE_KEYS);
    }
  }, [admin]);

  const toggle = (key) => {
    setPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const toggleGroup = (group) => {
    const keys = group.pages.map((p) => p.key);
    const allSelected = keys.every((k) => permissions.includes(k));
    if (allSelected) {
      setPermissions((prev) => prev.filter((k) => !keys.includes(k)));
    } else {
      setPermissions((prev) => [...new Set([...prev, ...keys])]);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    await onSave(admin.id, permissions);
    setSaving(false);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3 py-1">
          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <SafetyOutlined className="text-slate-500 text-sm" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800">
              Page Access for {admin?.full_name}
            </div>
            <div className="text-xs text-slate-400 font-normal">
              Control which pages this admin can access
            </div>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Save Permissions"
      confirmLoading={saving}
      okButtonProps={{
        style: {
          backgroundColor: "#001529",
          borderColor: "#001529",
          borderRadius: 7,
          fontWeight: 600,
          height: 36,
        },
      }}
      width={520}
      className={dark ? "settings-dark-modal" : ""}
    >
      <div className="mt-4 space-y-5">
        {PAGE_GROUPS.map((group) => {
          const keys = group.pages.map((p) => p.key);
          const allSelected = keys.every((k) => permissions.includes(k));
          const someSelected = keys.some((k) => permissions.includes(k));
          return (
            <div key={group.group}>
              {/* Group header with select-all */}
              <div
                className="flex items-center justify-between mb-2 pb-1 border-b border-slate-100 cursor-pointer group"
                onClick={() => toggleGroup(group)}
              >
                <span className="text-[10.5px] font-bold tracking-widest uppercase text-slate-400 group-hover:text-slate-600 transition-colors">
                  {group.group}
                </span>
                <Checkbox
                  checked={allSelected}
                  indeterminate={!allSelected && someSelected}
                  onChange={() => toggleGroup(group)}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs text-slate-400"
                >
                  <span className="text-[11px] text-slate-400">All</span>
                </Checkbox>
              </div>

              {/* Page rows */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {group.pages.map((page) => {
                  const isOn = permissions.includes(page.key);
                  return (
                    <div
                      key={page.key}
                      onClick={() => toggle(page.key)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border cursor-pointer transition-all select-none
                        ${
                          isOn
                            ? "bg-[#001529] border-[#001529] text-white"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
                        }`}
                    >
                      <span className="text-[13px]">{page.icon}</span>
                      <span className="text-[12px] font-semibold">
                        {page.label}
                      </span>
                      {isOn && (
                        <CheckCircleOutlined className="ml-auto text-[11px] opacity-70" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="text-xs text-slate-400 pt-1">
          {permissions.length} of {ALL_PAGE_KEYS.length} pages enabled
        </div>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   2FA Section Component
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const TwoFactorSection = ({ profile, dark = false }) => {
  const [emailOtpEnabled, setEmailOtpEnabled] = useState(false);
  const [totpEnabled, setTotpEnabled] = useState(false);
  const [totpSetupVisible, setTotpSetupVisible] = useState(false);
  const [emailOtpSetupVisible, setEmailOtpSetupVisible] = useState(false);
  const [totpStep, setTotpStep] = useState(0);
  const [qrData, setQrData] = useState(null);
  const [totpSecret, setTotpSecret] = useState(null);
  const [totpFactorId, setTotpFactorId] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [loadingTotp, setLoadingTotp] = useState(false);
  const [loadingEmailOtp, setLoadingEmailOtp] = useState(false);
  const [emailOtpCode, setEmailOtpCode] = useState("");
  // Custom email OTP state
  const [storedOtp, setStoredOtp] = useState(null);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const twoFactorPrimaryBtnStyle = {
    backgroundColor: dark ? "#ffffff" : "#3453b7",
    borderColor: dark ? "#ffffff" : "#3453b7",
    color: dark ? "#0f172a" : "#ffffff",
    borderRadius: 7,
    fontWeight: 600,
  };

  useEffect(() => {
    loadTwoFactorStatus();
  }, []);

  // Resend cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const loadTwoFactorStatus = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("totp_enabled, email_otp_enabled")
        .eq("id", profile.id)
        .single();
      if (!error && data) {
        setTotpEnabled(data.totp_enabled || false);
        setEmailOtpEnabled(data.email_otp_enabled || false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  /* ---------------- TOTP (Authenticator App) ---------------- */
  const handleSetupTotp = async () => {
    setLoadingTotp(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });
      if (error) throw error;
      setTotpFactorId(data.id);
      setQrData(data.totp.qr_code);
      setTotpSecret(data.totp.secret);
      setTotpStep(0);
      setTotpSetupVisible(true);
    } catch (e) {
      message.error("Failed to start TOTP setup: " + e.message);
    } finally {
      setLoadingTotp(false);
    }
  };

  const handleVerifyTotp = async () => {
    setLoadingTotp(true);
    try {
      if (!totpFactorId)
        throw new Error("Setup session expired. Please start again.");
      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: totpFactorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: totpFactorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });
      if (verifyError) throw verifyError;
      await supabase
        .from("profiles")
        .update({ totp_enabled: true })
        .eq("id", profile.id);
      setTotpEnabled(true);
      setTotpSetupVisible(false);
      setVerifyCode("");
      setTotpFactorId(null);
      message.success("Authenticator app enabled!");
    } catch (e) {
      message.error("Verification failed: " + e.message);
    } finally {
      setLoadingTotp(false);
    }
  };

  const handleDisableTotp = async () => {
    Modal.confirm({
      title: "Disable Authenticator App?",
      content: "You will no longer need your authenticator app to sign in.",
      okText: "Disable",
      okButtonProps: { danger: true },
      className: dark ? "settings-dark-modal" : "",
      onOk: async () => {
        try {
          const factors = await supabase.auth.mfa.listFactors();
          const factor = factors.data?.totp?.[0];
          if (factor) await supabase.auth.mfa.unenroll({ factorId: factor.id });
          await supabase
            .from("profiles")
            .update({ totp_enabled: false })
            .eq("id", profile.id);
          setTotpEnabled(false);
          message.success("Authenticator app disabled");
        } catch (e) {
          message.error("Failed: " + e.message);
        }
      },
    });
  };

  /* ---------------- Email OTP -------- uses custom email API ---------------- */
  const sendOtpEmail = async () => {
    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 min
    setStoredOtp(otp);
    setOtpExpiry(expiry);
    setEmailOtpCode("");
    setResendCooldown(60);
    await sendEmail({
      to: profile.email,
      subject: "Your Resosyncer verification code",
      body: otpEmailHtml(otp, profile.full_name || "there"),
      companyName: "Resosyncer",
    });
  };

  const handleSetupEmailOtp = async () => {
    setLoadingEmailOtp(true);
    try {
      await sendOtpEmail();
      setEmailOtpSetupVisible(true);
      message.success("Verification code sent to " + profile.email);
    } catch (e) {
      message.error("Failed to send code: " + e.message);
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (resendCooldown > 0) return;
    setLoadingEmailOtp(true);
    try {
      await sendOtpEmail();
      message.success("New code sent!");
    } catch (e) {
      message.error("Failed to resend: " + e.message);
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setLoadingEmailOtp(true);
    try {
      if (!storedOtp)
        throw new Error("No code found. Please request a new one.");
      if (Date.now() > otpExpiry) {
        message.error("Code has expired. Please request a new one.");
        setEmailOtpCode("");
        return;
      }
      if (emailOtpCode !== storedOtp) {
        message.error("Incorrect code. Please try again.");
        setEmailOtpCode("");
        return;
      }
      await supabase
        .from("profiles")
        .update({ email_otp_enabled: true })
        .eq("id", profile.id);
      setEmailOtpEnabled(true);
      setEmailOtpSetupVisible(false);
      setEmailOtpCode("");
      setStoredOtp(null);
      message.success("Email OTP enabled!");
    } catch (e) {
      message.error("Verification failed: " + e.message);
    } finally {
      setLoadingEmailOtp(false);
    }
  };

  const handleDisableEmailOtp = () => {
    Modal.confirm({
      title: "Disable Email OTP?",
      content: "You will no longer receive an OTP code on your email at login.",
      okText: "Disable",
      okButtonProps: { danger: true },
      className: dark ? "settings-dark-modal" : "",
      onOk: async () => {
        await supabase
          .from("profiles")
          .update({ email_otp_enabled: false })
          .eq("id", profile.id);
        setEmailOtpEnabled(false);
        message.success("Email OTP disabled");
      },
    });
  };

  return (
    <>
      <Divider className="my-6" />
      <SectionTitle>Two-Factor Authentication</SectionTitle>
      <p className="text-xs text-slate-400 mb-5 leading-relaxed">
        Add an extra layer of security to your account. When enabled, you will
        need to verify your identity each time you sign in.
      </p>

      {/* Email OTP */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 mb-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MailOutlined className="text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-bold text-slate-800">
                Email OTP
              </span>
              {emailOtpEnabled && (
                <Tag
                  className="rounded-full text-[10px] font-bold border-0 px-2"
                  color="green"
                >
                  Enabled
                </Tag>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Receive a one-time passcode to{" "}
              <span className="font-medium text-slate-500">
                {profile?.email}
              </span>{" "}
              each time you sign in.
            </p>
          </div>
          <div className="flex-shrink-0">
            {emailOtpEnabled ? (
              <Button
                size="small"
                danger
                onClick={handleDisableEmailOtp}
                className="rounded-lg text-xs font-semibold"
              >
                Disable
              </Button>
            ) : (
              <Button
                size="small"
                type="primary"
                loading={loadingEmailOtp}
                onClick={handleSetupEmailOtp}
                style={twoFactorPrimaryBtnStyle}
              >
                Enable
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Authenticator App (TOTP) */}
      <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 mb-3">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-violet-50 border border-violet-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MobileOutlined className="text-violet-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-bold text-slate-800">
                Authenticator App
              </span>
              {totpEnabled && (
                <Tag
                  className="rounded-full text-[10px] font-bold border-0 px-2"
                  color="green"
                >
                  Enabled
                </Tag>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use an authenticator app like Google Authenticator or Authy to
              generate time-based codes.
            </p>
          </div>
          <div className="flex-shrink-0">
            {totpEnabled ? (
              <Button
                size="small"
                danger
                onClick={handleDisableTotp}
                className="rounded-lg text-xs font-semibold"
              >
                Disable
              </Button>
            ) : (
              <Button
                size="small"
                type="primary"
                loading={loadingTotp}
                onClick={handleSetupTotp}
                style={twoFactorPrimaryBtnStyle}
              >
                Set Up
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* TOTP Setup Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <QrcodeOutlined className="text-violet-500" />
            <span className="text-sm font-bold text-slate-800">
              Set Up Authenticator App
            </span>
          </div>
        }
        open={totpSetupVisible}
        onCancel={() => {
          setTotpSetupVisible(false);
          setVerifyCode("");
          setTotpStep(0);
          setTotpFactorId(null);
        }}
        footer={null}
        width={420}
        className={dark ? "settings-dark-modal" : ""}
      >
        <Steps
          current={totpStep}
          size="small"
          className="my-4"
          items={[
            { title: "Scan QR" },
            { title: "Verify Code" },
            { title: "Done" },
          ]}
        />

        {totpStep === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-slate-500 mb-4">
              Open your authenticator app and scan this QR code.
            </p>
            {qrData ? (
              <div className="inline-block p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                <img src={qrData} alt="QR Code" className="w-40 h-40" />
              </div>
            ) : (
              <div className="w-40 h-40 mx-auto bg-slate-100 rounded-xl flex items-center justify-center">
                <LoadingOutlined className="text-slate-400 text-2xl" />
              </div>
            )}
            {totpSecret && (
              <div className="mt-4">
                <p className="text-[11px] text-slate-400 mb-1">
                  Or enter the secret key manually:
                </p>
                <code className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg font-mono tracking-widest select-all">
                  {totpSecret}
                </code>
              </div>
            )}
            <Button
              type="primary"
              className="mt-5 w-full rounded-lg font-semibold"
              style={{
                ...twoFactorPrimaryBtnStyle,
                height: 36,
              }}
              onClick={() => setTotpStep(1)}
            >
              I've scanned it
            </Button>
          </div>
        )}

        {totpStep === 1 && (
          <div className="py-2">
            <p className="text-xs text-slate-500 mb-4 text-center">
              Enter the 6-digit code shown in your authenticator app.
            </p>
            <Input
              size="large"
              maxLength={6}
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              className="text-center text-lg font-mono tracking-widest rounded-xl"
              onPressEnter={handleVerifyTotp}
            />
            <Button
              type="primary"
              loading={loadingTotp}
              className="mt-4 w-full rounded-lg font-semibold"
              style={{
                ...twoFactorPrimaryBtnStyle,
                height: 36,
              }}
              onClick={handleVerifyTotp}
              disabled={verifyCode.length !== 6}
            >
              Verify & Enable
            </Button>
            <Button
              type="text"
              className="mt-2 w-full text-slate-400 text-xs"
              onClick={() => setTotpStep(0)}
            >
              Back
            </Button>
          </div>
        )}
      </Modal>

      {/* Email OTP Verify Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2">
            <MailOutlined className="text-blue-500" />
            <span className="text-sm font-bold text-slate-800">
              Verify Your Email
            </span>
          </div>
        }
        open={emailOtpSetupVisible}
        onCancel={() => {
          setEmailOtpSetupVisible(false);
          setEmailOtpCode("");
          setStoredOtp(null);
        }}
        footer={null}
        width={380}
        className={dark ? "settings-dark-modal" : ""}
      >
        <div className="py-2">
          <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 mb-5">
            <p className="text-xs text-blue-700 leading-relaxed m-0">
              A 6-digit code was sent to{" "}
              <span className="font-bold">{profile?.email}</span>. It expires in
              10 minutes.
            </p>
          </div>
          <Input
            size="large"
            maxLength={6}
            value={emailOtpCode}
            onChange={(e) => setEmailOtpCode(e.target.value.replace(/\D/g, ""))}
            placeholder="000000"
            className="text-center text-lg font-mono tracking-widest rounded-xl mb-3"
            onPressEnter={handleVerifyEmailOtp}
          />
          <Button
            type="primary"
            loading={loadingEmailOtp}
            className="w-full rounded-lg font-semibold mb-2"
            style={{
              ...twoFactorPrimaryBtnStyle,
              height: 36,
            }}
            onClick={handleVerifyEmailOtp}
            disabled={emailOtpCode.length !== 6}
          >
            Verify & Enable
          </Button>
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <span className="text-xs text-slate-400">Didn't receive it?</span>
            <button
              onClick={handleResendEmailOtp}
              disabled={resendCooldown > 0 || loadingEmailOtp}
              style={{
                color:
                  resendCooldown > 0 ? "#94a3b8" : dark ? "#e5e7eb" : "#3453b7",
                background: "none",
                border: "none",
                cursor: resendCooldown > 0 ? "default" : "pointer",
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {resendCooldown > 0
                ? `Resend in ${resendCooldown}s`
                : "Resend code"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};

/* ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
   Main Settings Component
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ */
const Settings = () => {
  const { profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(window.location.search || "");
    return params.get("tab") || "profile";
  });
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [holidayForm] = Form.useForm();

  const [admins, setAdmins] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [holidayModalVisible, setHolidayModalVisible] = useState(false);
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [generalLoading, setGeneralLoading] = useState(false);

  // Permissions modal
  const [permissionsAdmin, setPermissionsAdmin] = useState(null);
  const [permissionsModalVisible, setPermissionsModalVisible] = useState(false);

  // General settings state
  const [weekOffDays, setWeekOffDays] = useState(["Saturday", "Sunday"]);
  const [workingHours, setWorkingHours] = useState(8);
  const [checkInTime, setCheckInTime] = useState(dayjs("09:00", "HH:mm"));
  const [checkOutTime, setCheckOutTime] = useState(dayjs("18:00", "HH:mm"));
  const [lateGraceMins, setLateGraceMins] = useState(15);
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [halfDayHours, setHalfDayHours] = useState(4);
  const [workingModel, setWorkingModel] = useState("fixed");
  const [integrations, setIntegrations] = useState({});
  const [integrationsLoading, setIntegrationsLoading] = useState(false);
  const [integrationActionLoading, setIntegrationActionLoading] = useState({});

  const primaryBtn = {
    backgroundColor: dark ? "#ffffff" : "#3453b7",
    borderColor: dark ? "#ffffff" : "#3453b7",
    color: dark ? "#0f172a" : "#ffffff",
    borderRadius: 7,
    fontWeight: 600,
    height: 36,
  };
  const selectedToggleStyle = {
    backgroundColor: dark ? "#ffffff" : "#3453b7",
    borderColor: dark ? "#ffffff" : "#3453b7",
    color: dark ? "#0f172a" : "#ffffff",
  };

  const parseAmount = (value) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  };
  const salaryCurrency = profile?.currency || "PKR";
  const baseSalary =
    profile?.salary_type === "commission"
      ? parseAmount(profile?.base_salary)
      : parseAmount(profile?.salary_amount);
  const allowanceItems = Array.isArray(profile?.allowance_items)
    ? profile.allowance_items
    : parseAmount(profile?.allowances) > 0
      ? [{ label: "Allowances", amount: parseAmount(profile?.allowances) }]
      : [];
  const deductionItems = Array.isArray(profile?.tax_deduction_items)
    ? profile.tax_deduction_items
    : parseAmount(profile?.tax_deductions) > 0
      ? [
          {
            label: "Tax Deductions",
            amount: parseAmount(profile?.tax_deductions),
          },
        ]
      : [];
  const allowanceTotal = allowanceItems.reduce(
    (sum, row) => sum + parseAmount(row?.amount),
    0,
  );
  const deductionTotal = deductionItems.reduce(
    (sum, row) => sum + parseAmount(row?.amount),
    0,
  );
  const finalSalary = baseSalary + allowanceTotal - deductionTotal;
  const formatSalary = (amount) =>
    `${salaryCurrency} ${parseAmount(amount).toLocaleString()}`;

  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const tab = params.get("tab");
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
      return;
    }
    if (!tab && activeTab !== "profile") {
      setActiveTab("profile");
    }
  }, [location.search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.role === "admin") return;
    if (activeTab !== "integrations") return;
    setActiveTab("profile");
    const params = new URLSearchParams(location.search || "");
    params.set("tab", "profile");
    navigate(`/settings?${params.toString()}`, { replace: true });
  }, [profile?.role, activeTab, location.search, navigate]);

  useEffect(() => {
    if (profile?.role !== "admin") return;
    fetchIntegrationConnections();
  }, [profile?.id, profile?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (profile?.role !== "admin") return;
    if (activeTab !== "integrations") return;
    fetchIntegrationConnections();
  }, [activeTab, profile?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = (nextKey) => {
    setActiveTab(nextKey);
    const params = new URLSearchParams(location.search || "");
    params.set("tab", nextKey);
    navigate(`/settings?${params.toString()}`, { replace: true });
  };

  const fetchIntegrationConnections = async () => {
    if (!profile?.id || profile?.role !== "admin") return;
    setIntegrationsLoading(true);
    try {
      const { data, error } = await supabase
        .from("integration_connections")
        .select("provider, connection_data, updated_at")
        .eq("user_id", profile.id);
      if (error) throw error;
      const next = {};
      (data || []).forEach((row) => {
        const key = toCanonicalProvider(row?.provider);
        if (key && !isIntegrationDisconnected(row)) next[key] = true;
      });
      if (localStorage.getItem(JIRA_CONNECTED_STORAGE_KEY)) next.jira = true;
      if (localStorage.getItem(ASANA_CONNECTED_STORAGE_KEY)) next.asana = true;
      if (localStorage.getItem(TRELLO_CONNECTED_STORAGE_KEY))
        next.trello = true;
      if (localStorage.getItem(CLICKUP_CONNECTED_STORAGE_KEY))
        next.clickup = true;

      const [googleResult, docusignResult, linkedinResult] =
        await Promise.allSettled([
          getGoogleCalanderStatus(),
          getDocusignStatus(),
          getLinkedinStatus(),
        ]);
      if (
        googleResult.status === "fulfilled" &&
        googleResult.value?.connected
      ) {
        next.google_calendar = true;
      }
      if (
        docusignResult.status === "fulfilled" &&
        docusignResult.value?.connected
      ) {
        next.docusign = true;
      }
      if (
        linkedinResult.status === "fulfilled" &&
        linkedinResult.value?.connected
      ) {
        next.linkedin = true;
      }

      setIntegrations(next);
    } catch (err) {
      console.error("Failed to load integration connections:", err);
      message.error("Failed to load integrations");
    } finally {
      setIntegrationsLoading(false);
    }
  };

  const handleOpenIntegrationSetup = (item) => {
    if (!item?.setupRoute) return;
    if (["jira", "asana", "trello", "clickup"].includes(item.key)) {
      localStorage.setItem("integrations_selected_provider", item.key);
    }
    navigate(item.setupRoute);
  };

  const handleDisconnectIntegration = async (item) => {
    if (!profile?.id) return;
    const canonical = item.key;
    const aliases = PROVIDER_ALIASES[canonical] || [canonical];
    setIntegrationActionLoading((prev) => ({ ...prev, [canonical]: true }));
    try {
      if (canonical === "google_calendar") {
        await disconnectGoogleCalander();
      } else if (canonical === "docusign") {
        await disconnectDocusign();
      } else if (canonical === "linkedin") {
        await disconnectLinkedin();
      }

      const { error } = await supabase
        .from("integration_connections")
        .delete()
        .eq("user_id", profile.id)
        .in("provider", aliases);
      if (error) throw error;

      setIntegrations((prev) => ({ ...prev, [canonical]: false }));
      message.success(`${item.name} disconnected`);
    } catch (err) {
      console.error(`Failed to disconnect ${item?.name}:`, err);
      message.error(err?.message || `Failed to disconnect ${item?.name}`);
    } finally {
      setIntegrationActionLoading((prev) => ({ ...prev, [canonical]: false }));
    }
  };

  /* ---------------- Handlers ---------------- */
  const handleUpdateProfile = async (values) => {
    setProfileLoading(true);
    try {
      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
        bio: values.bio || null,
        nationality: values.nationality || null,
        languages: values.languages || [],
      };
      if (values.cnic) updateData.cnic = values.cnic;
      if (values.dob) updateData.dob = values.dob.format("YYYY-MM-DD");
      if (values.bank_name) updateData.bank_name = values.bank_name;
      if (values.bank_account_number)
        updateData.bank_account_number = values.bank_account_number;
      if (values.bank_account_name)
        updateData.bank_account_name = values.bank_account_name;
      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);
      if (error) throw error;
      message.success("Profile updated successfully");
    } catch {
      message.error("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePhotoUpload = async (file) => {
    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ user_photo: publicUrl })
        .eq("id", profile.id);
      if (updateError) throw updateError;
      message.success("Photo updated");
      window.location.reload();
    } catch {
      message.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
    return false;
  };

  const handleChangePassword = async (values) => {
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch {
      message.error("Failed to change password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveGeneral = async () => {
    setGeneralLoading(true);
    try {
      const settings = {
        tenant_id: profile.tenant_id,
        working_model: workingModel,
        week_off_days: weekOffDays,
        working_hours: workingHours,
        overtime_enabled: overtimeEnabled,
        half_day_hours: halfDayHours,
        ...(workingModel === "fixed" && {
          check_in_time: checkInTime?.format("HH:mm"),
          check_out_time: checkOutTime?.format("HH:mm"),
          late_grace_minutes: lateGraceMins,
        }),
      };
      const { error } = await supabase
        .from("workspace_settings")
        .upsert(settings, { onConflict: "tenant_id" });
      if (error) throw error;
      message.success("Workspace settings saved");
    } catch {
      message.error("Failed to save settings");
    } finally {
      setGeneralLoading(false);
    }
  };

  const fetchHolidays = async () => {
    setLoadingHolidays(true);
    try {
      const { data, error } = await supabase
        .from("public_holidays")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .order("date", { ascending: true });
      if (error) throw error;
      setHolidays(data || []);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const fetchGeneralSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("workspace_settings")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .single();
      if (error || !data) return;
      setWorkingModel(data.working_model || "fixed");
      setWeekOffDays(data.week_off_days || ["Saturday", "Sunday"]);
      setWorkingHours(data.working_hours || 8);
      setOvertimeEnabled(data.overtime_enabled ?? true);
      setHalfDayHours(data.half_day_hours || 4);
      if (data.check_in_time)
        setCheckInTime(dayjs(data.check_in_time, "HH:mm"));
      if (data.check_out_time)
        setCheckOutTime(dayjs(data.check_out_time, "HH:mm"));
      setLateGraceMins(data.late_grace_minutes ?? 15);
    } catch (e) {
      console.error("Failed to load workspace settings:", e);
    }
  };

  const handleAddHoliday = async (values) => {
    setLoadingHolidays(true);
    try {
      const { error } = await supabase.from("public_holidays").insert([
        {
          name: values.name,
          date: values.date.format("YYYY-MM-DD"),
          created_by: profile.id,
          tenant_id: profile.tenant_id,
        },
      ]);
      if (error) throw error;
      message.success("Holiday added");
      setHolidayModalVisible(false);
      holidayForm.resetFields();
      fetchHolidays();
    } catch {
      message.error("Failed to add holiday");
    } finally {
      setLoadingHolidays(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      const { error } = await supabase
        .from("public_holidays")
        .delete()
        .eq("id", id);
      if (error) throw error;
      message.success("Holiday deleted");
      fetchHolidays();
    } catch {
      message.error("Failed to delete holiday");
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "admin")
        .eq("tenant_id", profile.tenant_id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setAdmins(data || []);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleAddAdmin = async (values) => {
    setLoadingAdmins(true);
    try {
      const {
        data: { session: adminSessionBeforeCreate },
      } = await supabase.auth.getSession();

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { emailRedirectTo: `${window.location.origin}/signin` },
      });
      if (authError) throw authError;
      if (!authData?.user) throw new Error("Failed to create admin user");

      if (
        adminSessionBeforeCreate?.access_token &&
        adminSessionBeforeCreate?.refresh_token
      ) {
        const { error: restoreSessionError } = await supabase.auth.setSession({
          access_token: adminSessionBeforeCreate.access_token,
          refresh_token: adminSessionBeforeCreate.refresh_token,
        });
        if (restoreSessionError) {
          console.error(
            "Failed to restore admin session:",
            restoreSessionError,
          );
        }
      }

      const { error: profileError } = await supabase.from("profiles").insert([
        {
          id: authData.user.id,
          email: values.email,
          full_name: values.full_name,
          role: "admin",
          contact: values.contact,
          tenant_id: profile.tenant_id,
          permissions: ALL_PAGE_KEYS, // full access by default
        },
      ]);
      if (profileError) throw profileError;

      let appName =
        profile?.company_name ||
        import.meta.env.VITE_COMPANY_NAME ||
        import.meta.env.VITE_APP_NAME ||
        "";
      if (!appName && profile?.tenant_id) {
        const { data: tenantData } = await supabase
          .from("tenants")
          .select("name")
          .eq("id", profile.tenant_id)
          .single();
        appName = tenantData?.name || "";
      }
      appName = appName || "Resosyncer";

      const loginUrl = `${window.location.origin}/signin`;
      const safeName = escapeHtml(values.full_name || "there");
      const safeEmail = escapeHtml(values.email);
      const safePassword = escapeHtml(values.password);

      const credentialsHtml = buildCompanyEmail({
        companyName: appName,
        title: "Admin account credentials",
        intro: `Hello ${values.full_name || "there"}, you were added as an administrator for ${appName}.`,
        contentHtml: `
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Email:</strong> ${safeEmail}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Password:</strong> ${safePassword}</p>
          <p style="margin:0 0 8px;font-size:14px;color:#334155;"><strong>Login URL:</strong> <a href="${loginUrl}" style="color:#334155;">${loginUrl}</a></p>
          <p style="margin:0;font-size:14px;color:#334155;">Please change your password after first login.</p>
        `,
      });

      await sendEmail({
        to: values.email,
        subject: `${appName} admin login credentials`,
        body: credentialsHtml,
        companyName: appName,
      });

      message.success("Admin added");
      setAdminModalVisible(false);
      adminForm.resetFields();
      fetchAdmins();
    } catch (error) {
      message.error("Failed: " + error.message);
    } finally {
      setLoadingAdmins(false);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (adminId === profile.id) {
      message.error("Cannot delete your own account");
      return;
    }
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", adminId);
      if (error) throw error;
      message.success("Admin removed");
      fetchAdmins();
    } catch {
      message.error("Failed to remove admin");
    }
  };

  const handleSavePermissions = async (adminId, permissions) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ permissions })
        .eq("id", adminId);
      if (error) throw error;
      message.success("Permissions updated");
      fetchAdmins();
    } catch {
      message.error("Failed to update permissions");
    }
  };

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchAdmins();
      fetchHolidays();
      fetchGeneralSettings();
    }
  }, [profile]);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  /* ---------------- Columns ---------------- */
  const adminColumns = [
    {
      title: "Administrator",
      key: "admin",
      render: (_, r) => (
        <div className="flex items-center gap-3 py-1">
          <Avatar
            size={38}
            src={r.user_photo}
            icon={<UserOutlined />}
            style={{ flexShrink: 0 }}
          />
          <div>
            <div className="text-[13px] font-semibold text-slate-800 leading-snug">
              {r.full_name}
            </div>
            <div className="text-xs text-slate-400">{r.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Contact",
      dataIndex: "contact",
      key: "contact",
      render: (t) => (
        <span className="text-sm text-slate-500">{t || "N/A"}</span>
      ),
    },
    {
      title: "Page Access",
      key: "permissions",
      render: (_, r) => {
        const count = r.permissions?.length ?? ALL_PAGE_KEYS.length;
        const total = ALL_PAGE_KEYS.length;
        const isFull = count === total;
        return (
          <Tag
            className="rounded-full text-[11px] font-semibold border-0 px-2.5 cursor-pointer"
            color={isFull ? "geekblue" : count === 0 ? "red" : "orange"}
          >
            {isFull ? "Full Access" : `${count} / ${total} pages`}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      render: (_, r) => (
        <Tag
          className="rounded-full text-[11px] font-semibold border-0 px-2.5"
          color={r.id === profile.id ? "geekblue" : "green"}
        >
          {r.id === profile.id ? "You" : "Active"}
        </Tag>
      ),
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, r) => (
        <div className="flex items-center gap-1 justify-end">
          <Tooltip title="Edit Permissions">
            <Button
              type="text"
              size="small"
              icon={<SafetyOutlined />}
              className="text-slate-400 hover:text-blue-500"
              onClick={() => {
                setPermissionsAdmin(r);
                setPermissionsModalVisible(true);
              }}
            />
          </Tooltip>
          {r.id !== profile.id && (
            <Tooltip title="Remove">
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() =>
                  Modal.confirm({
                    title: "Remove Administrator",
                    content: `Remove ${r.full_name} as admin?`,
                    okText: "Remove",
                    okButtonProps: { danger: true },
                    className: dark ? "settings-dark-modal" : "",
                    onOk: () => handleDeleteAdmin(r.id),
                  })
                }
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  const holidayColumns = [
    {
      title: "Holiday",
      dataIndex: "name",
      key: "name",
      render: (t) => (
        <span className="text-[13px] font-semibold text-slate-800">{t}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      render: (d) => (
        <span className="text-sm text-slate-500 tabular-nums">
          {dayjs(d).format("MMM DD, YYYY")}
        </span>
      ),
    },
    {
      title: "Day",
      dataIndex: "date",
      key: "day",
      render: (d) => {
        const day = dayjs(d).format("dddd");
        const weekend = ["Saturday", "Sunday"].includes(day);
        return (
          <Tag
            className="rounded-full text-[11px] font-semibold border-0 px-2.5"
            color={weekend ? "orange" : "blue"}
          >
            {day}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      align: "right",
      render: (_, r) => (
        <Tooltip title="Delete">
          <Button
            type="text"
            danger
            size="small"
            icon={<DeleteOutlined />}
            onClick={() =>
              Modal.confirm({
                title: "Delete Holiday",
                content: `Remove "${r.name}" from public holidays?`,
                okText: "Delete",
                okButtonProps: { danger: true },
                className: dark ? "settings-dark-modal" : "",
                onOk: () => handleDeleteHoliday(r.id),
              })
            }
          />
        </Tooltip>
      ),
    },
  ];

  const tabItems = [
    /* ---------------- Profile ---------------- */
    {
      key: "profile",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <UserOutlined />
          Profile
        </span>
      ),
      children: (
        <div className="settings-profile-shell">
          <Form
            id="profile-form"
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
            requiredMark={false}
            initialValues={{
              full_name: profile?.full_name,
              email: profile?.email,
              contact: profile?.contact,
              address: profile?.address,
              cnic: profile?.cnic,
              nationality: profile?.nationality,
              languages: profile?.languages || [],
              bio: profile?.bio,
              dob: profile?.dob ? dayjs(profile.dob) : null,
              bank_name: profile?.bank_name,
              bank_account_number: profile?.bank_account_number,
              bank_account_name: profile?.bank_account_name,
            }}
          >
            <div className="settings-profile-card">
            <SectionTitle>
              <span className="inline-flex items-center gap-2">
                <UserOutlined />
                Personal Information
              </span>
            </SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5 settings-profile-grid">
              <Form.Item
                name="full_name"
                label={
                  <span className="settings-field-label">
                    Full Name
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-300 text-xs" />}
                  placeholder="Your full name"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={
                  <span className="settings-field-label">
                    Email
                  </span>
                }
              >
                <Input
                  prefix={<MailOutlined className="text-slate-300 text-xs" />}
                  disabled
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="contact"
                label={
                  <span className="settings-field-label">
                    Contact Number
                  </span>
                }
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-300 text-xs" />}
                  placeholder="+92 300 0000000"
                  className="rounded-lg"
                />
              </Form.Item>
              {profile?.role !== "admin" && (
                <Form.Item
                  name="nationality"
                  label={
                    <span className="settings-field-label">
                      Nationality / Country
                    </span>
                  }
                >
                  <Input
                    prefix={<GlobalOutlined className="text-slate-300 text-xs" />}
                    placeholder="e.g. Pakistani, American"
                    className="rounded-lg"
                  />
                </Form.Item>
              )}
              {profile?.role !== "admin" && (
                <Form.Item
                  name="cnic"
                  label={
                    <span className="settings-field-label">
                      National ID / Passport
                    </span>
                  }
                >
                  <Input
                    prefix={<IdcardOutlined className="text-slate-300 text-xs" />}
                    placeholder="12345-1234567-1"
                    className="rounded-lg"
                  />
                </Form.Item>
              )}
              <Form.Item
                name="dob"
                label={
                  <span className="settings-field-label">
                    Date of Birth
                  </span>
                }
              >
                <DatePicker
                  className="w-full rounded-lg"
                  format="YYYY-MM-DD"
                  placeholder="Select date"
                />
              </Form.Item>
            </div>
            {profile?.role !== "admin" && (
              <Form.Item
                name="languages"
                label={
                  <span className="settings-field-label">
                    Languages Spoken
                  </span>
                }
              >
                <Select
                  mode="multiple"
                  allowClear
                  placeholder="Select languages"
                  className="rounded-lg"
                  options={[
                    "English",
                    "Urdu",
                    "Arabic",
                    "French",
                    "German",
                    "Spanish",
                    "Hindi",
                    "Chinese (Mandarin)",
                  ].map((lang) => ({ label: lang, value: lang }))}
                />
              </Form.Item>
            )}
            <Form.Item
              name="address"
              label={
                <span className="settings-field-label">
                  Address
                </span>
              }
            >
              <Input.TextArea
                rows={2}
                placeholder="Street, City, Country"
                className="rounded-lg"
              />
            </Form.Item>
            {profile?.role !== "admin" && (
              <Form.Item
                name="bio"
                label={
                  <span className="settings-field-label">
                    Bio
                  </span>
                }
              >
                <Input.TextArea
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className="rounded-lg"
                />
              </Form.Item>
            )}
            </div>

            <div className="settings-save-bar">
              <Button
                type="primary"
                htmlType="submit"
                form="profile-form"
                loading={profileLoading}
                className="w-full sm:w-auto settings-profile-save-btn"
                style={primaryBtn}
              >
                Save Changes
              </Button>
            </div>

            {profile?.role !== "admin" && (
              <>
                <Divider className="my-5" />
                <SectionTitle>Compensation</SectionTitle>
                <div
                  className="rounded-xl px-5 py-4 mb-5"
                  style={{
                    border: dark ? "1px solid #2a2b31" : "1px solid #e2e8f0",
                    background: dark ? "#17181c" : "#f8fafc",
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        border: dark
                          ? "1px solid #2f3138"
                          : "1px solid #e2e8f0",
                        background: dark ? "#141416" : "#ffffff",
                      }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-widest uppercase mb-1"
                        style={{ color: dark ? "#9ca3af" : "#94a3b8" }}
                      >
                        Base Salary
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: dark ? "#f3f4f6" : "#1e293b" }}
                      >
                        {formatSalary(baseSalary)}
                      </div>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        border: dark
                          ? "1px solid #2f3857"
                          : "1px solid #dbeafe",
                        background: dark ? "rgba(37,99,235,0.12)" : "#eff6ff",
                      }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-widest uppercase mb-1"
                        style={{ color: dark ? "#93c5fd" : "#60a5fa" }}
                      >
                        Allowances
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: dark ? "#bfdbfe" : "#1d4ed8" }}
                      >
                        {formatSalary(allowanceTotal)}
                      </div>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        border: dark
                          ? "1px solid #4a2a36"
                          : "1px solid #ffe4e6",
                        background: dark ? "rgba(225,29,72,0.12)" : "#fff1f2",
                      }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-widest uppercase mb-1"
                        style={{ color: dark ? "#fda4af" : "#fb7185" }}
                      >
                        Deductions
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: dark ? "#fecdd3" : "#be123c" }}
                      >
                        {formatSalary(deductionTotal)}
                      </div>
                    </div>
                    <div
                      className="rounded-lg px-3 py-2.5"
                      style={{
                        border: dark
                          ? "1px solid #234236"
                          : "1px solid #bbf7d0",
                        background: dark ? "rgba(22,163,74,0.12)" : "#f0fdf4",
                      }}
                    >
                      <div
                        className="text-[10px] font-bold tracking-widest uppercase mb-1"
                        style={{ color: dark ? "#86efac" : "#22c55e" }}
                      >
                        Final Salary
                      </div>
                      <div
                        className="text-sm font-bold"
                        style={{ color: dark ? "#bbf7d0" : "#15803d" }}
                      >
                        {formatSalary(finalSalary)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    {profile?.salary_type === "commission" && (
                      <span
                        className="text-xs rounded-full px-3 py-1 border"
                        style={{
                          color: dark ? "#cbd5e1" : "#64748b",
                          background: dark ? "#141416" : "#ffffff",
                          borderColor: dark ? "#2f3138" : "#e2e8f0",
                        }}
                      >
                        Commission: {profile?.commission_rate || 0}%
                      </span>
                    )}
                    <span
                      className="text-xs rounded-full px-3 py-1 border"
                      style={{
                        color: dark ? "#cbd5e1" : "#64748b",
                        background: dark ? "#141416" : "#ffffff",
                        borderColor: dark ? "#2f3138" : "#e2e8f0",
                      }}
                    >
                      Contact admin to update
                    </span>
                  </div>
                </div>

                <Divider className="my-5" />
                <SectionTitle>Bank Account</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-5">
                  <Form.Item
                    name="bank_name"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        Bank Name
                      </span>
                    }
                  >
                    <Input
                      prefix={
                        <BankOutlined className="text-slate-300 text-xs" />
                      }
                      placeholder="e.g., HBL, Alfalah"
                      className="rounded-lg"
                    />
                  </Form.Item>
                  <Form.Item
                    name="bank_account_name"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        Account Title
                      </span>
                    }
                  >
                    <Input
                      placeholder="Account holder name"
                      className="rounded-lg"
                    />
                  </Form.Item>
                  <Form.Item
                    name="bank_account_number"
                    label={
                      <span className="text-xs font-medium text-slate-600">
                        Account Number
                      </span>
                    }
                  >
                    <Input
                      placeholder="e.g., 1234567890"
                      className="rounded-lg"
                    />
                  </Form.Item>
                </div>
              </>
            )}
          </Form>
        </div>
      ),
    },

    /* ---------------- Security ---------------- */
    {
      key: "password",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <LockOutlined />
          Security
        </span>
      ),
      children: (
        <div className="max-w-lg pt-2">
          {/* Change Password */}
          <div className="mb-6">
            <h3 className="text-[13px] font-bold text-slate-800">
              Change Password
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Use a strong password with at least 6 characters and a mix of
              letters, numbers and symbols.
            </p>
          </div>
          <div className="max-w-sm">
            <Form
              form={passwordForm}
              layout="vertical"
              onFinish={handleChangePassword}
              requiredMark={false}
            >
              <Form.Item
                name="new_password"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    New Password
                  </span>
                }
                rules={[
                  { required: true, message: "Required" },
                  { min: 6, message: "Min 6 characters" },
                ]}
              >
                <Input.Password
                  prefix={<SafetyOutlined className="text-slate-300 text-xs" />}
                  placeholder="New password"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="confirm_password"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Confirm Password
                  </span>
                }
                dependencies={["new_password"]}
                rules={[
                  { required: true, message: "Required" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("new_password") === value)
                        return Promise.resolve();
                      return Promise.reject(
                        new Error("Passwords do not match"),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<SafetyOutlined className="text-slate-300 text-xs" />}
                  placeholder="Confirm password"
                  className="rounded-lg"
                />
              </Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={passwordLoading}
                className="w-full sm:w-auto"
                style={primaryBtn}
              >
                Update Password
              </Button>
            </Form>
          </div>

          {/* 2FA Section */}
          <TwoFactorSection profile={profile} dark={dark} />
        </div>
      ),
    },
    ...(profile?.role === "admin"
      ? [
          {
            key: "integrations",
            label: (
              <span className="flex items-center gap-1.5 text-[13px]">
                <LinkOutlined />
                Integrations
              </span>
            ),
            children: (
              <div className="max-w-3xl pt-2">
                <div className="mb-6 pb-5 border-b border-slate-100">
                  <h3 className="text-[13px] font-bold text-slate-800">
                    Integrations
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Connect and manage third-party tools for your workspace.
                  </p>
                </div>
                <div className="space-y-2.5">
                  {INTEGRATION_CATALOG.map((item) => {
                    const connected = integrations[item.key] === true;
                    const actionLoading =
                      integrationActionLoading[item.key] === true;
                    return (
                      <div
                        key={item.key}
                        className="rounded-xl px-4 py-3"
                        style={{
                          background: dark ? "#1a1b20" : "#f8fafc",
                        }}
                      >
                        <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0"
                              style={{
                                background: dark ? "#0f1115" : "#ffffff",
                              }}
                            >
                              <img
                                src={item.logo}
                                alt={item.name}
                                className="w-6 h-6 object-contain"
                              />
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-slate-800">
                                {item.name}
                              </div>
                              <div className="text-xs text-slate-400 mt-0.5 truncate">
                                {item.description}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-auto justify-end flex-wrap sm:flex-nowrap">
                            <Tag
                              color={connected ? "green" : "default"}
                              className="!m-0 text-center"
                              style={{
                                minWidth: 108,
                                borderColor: connected
                                  ? dark
                                    ? "#22c55e"
                                    : "#16a34a"
                                  : dark
                                    ? "#4b5563"
                                    : "#cbd5e1",
                                background: connected
                                  ? dark
                                    ? "rgba(34,197,94,0.18)"
                                    : "#f0fdf4"
                                  : dark
                                    ? "rgba(148,163,184,0.14)"
                                    : "#f8fafc",
                                color: connected
                                  ? dark
                                    ? "#bbf7d0"
                                    : "#166534"
                                  : dark
                                    ? "#e5e7eb"
                                    : "#334155",
                                fontWeight: 600,
                              }}
                            >
                              {connected ? "Connected" : "Not connected"}
                            </Tag>
                            <div className="flex items-center gap-2">
                              <Button
                                size="small"
                                icon={<LinkOutlined />}
                                onClick={() => handleOpenIntegrationSetup(item)}
                                style={{
                                  borderColor: dark ? "#93c5fd" : "#cbd5e1",
                                  background: dark
                                    ? "rgba(59,130,246,0.16)"
                                    : "#ffffff",
                                  color: dark ? "#dbeafe" : "#334155",
                                  fontWeight: 600,
                                }}
                              >
                                Open setup
                              </Button>
                              {connected && (
                                <Button
                                  size="small"
                                  loading={actionLoading}
                                  icon={<DisconnectOutlined />}
                                  onClick={() =>
                                    handleDisconnectIntegration(item)
                                  }
                                  style={{
                                    borderColor: dark ? "#fb7185" : "#fca5a5",
                                    background: dark
                                      ? "rgba(244,63,94,0.16)"
                                      : "#fff1f2",
                                    color: dark ? "#fecdd3" : "#b91c1c",
                                    fontWeight: 600,
                                  }}
                                >
                                  Disconnect
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {integrationsLoading && (
                    <div className="text-xs text-slate-400 pt-1">
                      Loading integrations...
                    </div>
                  )}
                </div>
              </div>
            ),
          },
        ]
      : []),
  ];

  if (profile?.role === "admin") {
    /* ---------------- General Settings ---------------- */
    tabItems.push({
      key: "general",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <SettingOutlined />
          General
        </span>
      ),
      children: (
        <div className="max-w-2xl pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 pb-5 border-b border-slate-100">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">
                Workspace Settings
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure attendance, working hours and payroll defaults for
                your team
              </p>
            </div>
            <Button
              type="primary"
              loading={generalLoading}
              onClick={handleSaveGeneral}
              className="w-full sm:w-auto"
              style={primaryBtn}
            >
              Save Settings
            </Button>
          </div>

          <SectionTitle>Weekly Off Days</SectionTitle>
          <div className="mb-6">
            <p className="text-xs text-slate-400 mb-3">
              Select which days are considered off days for the entire
              workspace.
            </p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const selected = weekOffDays.includes(day);
                return (
                  <button
                    key={day}
                    onClick={() =>
                      setWeekOffDays(
                        selected
                          ? weekOffDays.filter((d) => d !== day)
                          : [...weekOffDays, day],
                      )
                    }
                    className={`px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer ${
                      selected
                        ? ""
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                    style={selected ? selectedToggleStyle : undefined}
                  >
                    {day.slice(0, 3)}
                  </button>
                );
              })}
            </div>
            {weekOffDays.length > 0 && (
              <p className="text-xs text-slate-400 mt-2">
                {weekOffDays.join(", ")}{" "}
                {weekOffDays.length === 1 ? "is" : "are"} marked as off days
              </p>
            )}
          </div>

          <Divider className="my-5" />

          <SectionTitle>Working Model</SectionTitle>
          <SettingRow
            label="Company Working Model"
            description="Choose how your company tracks attendance timing"
          >
            <div style={{ display: "flex", gap: 8 }}>
              {["Fixed", "Flexible"].map((model) => {
                const val = model.toLowerCase();
                const selected = workingModel === val;
                return (
                  <div
                    key={val}
                    onClick={() => setWorkingModel(val)}
                    className={`px-5 py-2 rounded-lg text-[13px] font-semibold border transition-all cursor-pointer ${
                      selected
                        ? ""
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                    style={selected ? selectedToggleStyle : undefined}
                  >
                    {model}
                  </div>
                );
              })}
            </div>
          </SettingRow>

          {workingModel === "fixed" && (
            <>
              <Divider />
              <SectionTitle>Working Hours</SectionTitle>
              <SettingRow
                label="Working Hours / Day"
                description="Standard daily working hours"
              >
                <InputNumber
                  min={1}
                  max={24}
                  value={workingHours}
                  onChange={(v) => setWorkingHours(v)}
                  className="w-20"
                  addonAfter="hrs"
                />
              </SettingRow>
              <SettingRow
                label="Default Check-in Time"
                description="Expected arrival time for employees"
              >
                <TimePicker
                  value={checkInTime}
                  onChange={(t) => setCheckInTime(t)}
                  format="hh:mm A"
                  className="w-32"
                  allowClear={false}
                />
              </SettingRow>
              <SettingRow
                label="Default Check-out Time"
                description="Expected departure time for employees"
              >
                <TimePicker
                  value={checkOutTime}
                  onChange={(t) => setCheckOutTime(t)}
                  format="hh:mm A"
                  className="w-32"
                  allowClear={false}
                />
              </SettingRow>
              <SettingRow
                label="Late Grace Period"
                description="Minutes after check-in before marking late"
              >
                <InputNumber
                  min={0}
                  max={120}
                  value={lateGraceMins}
                  onChange={(v) => setLateGraceMins(v)}
                  className="w-20"
                  addonAfter="min"
                />
              </SettingRow>
              <SettingRow
                label="Half Day Hours"
                description="Minimum hours to count as half day"
              >
                <InputNumber
                  min={1}
                  max={12}
                  value={halfDayHours}
                  onChange={(v) => setHalfDayHours(v)}
                  className="w-20"
                  addonAfter="hrs"
                />
              </SettingRow>
            </>
          )}

          <Divider className="my-5" />
          <SectionTitle>Overtime</SectionTitle>
          <SettingRow
            label="Enable Overtime"
            description="Track and calculate hours worked beyond the default working hours"
          >
            <Switch
              checked={overtimeEnabled}
              onChange={setOvertimeEnabled}
              style={
                overtimeEnabled
                  ? { backgroundColor: dark ? "#ffffff" : "#3453b7" }
                  : {}
              }
            />
          </SettingRow>
        </div>
      ),
    });

    /* ---------------- Admins ---------------- */
    tabItems.push({
      key: "admins",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <TeamOutlined />
          Administrators
        </span>
      ),
      children: (
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">
                Administrators
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {admins.length} admin{admins.length !== 1 ? "s" : ""} with
                workspace access. Click{" "}
                <SafetyOutlined className="text-slate-400" /> to manage page
                permissions
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdminModalVisible(true)}
              className="w-full sm:w-auto"
              style={primaryBtn}
            >
              Add Admin
            </Button>
          </div>

          <Table
            columns={adminColumns}
            dataSource={admins}
            rowKey="id"
            loading={loadingAdmins}
            size="middle"
            scroll={{ x: 760 }}
            pagination={{
              pageSize: 10,
              showTotal: (t) => `${t} admins`,
              size: "small",
            }}
          />

          {/* Permissions Modal */}
          <AdminPermissionsModal
            admin={permissionsAdmin}
            visible={permissionsModalVisible}
            onClose={() => {
              setPermissionsModalVisible(false);
              setPermissionsAdmin(null);
            }}
            onSave={handleSavePermissions}
            dark={dark}
          />

          {/* Add Admin Modal */}
          <Modal
            title={
              <span className="text-sm font-bold text-slate-800">
                Add Administrator
              </span>
            }
            open={adminModalVisible}
            onCancel={() => {
              setAdminModalVisible(false);
              adminForm.resetFields();
            }}
            onOk={() => adminForm.submit()}
            okText="Add Administrator"
            okButtonProps={{ style: primaryBtn }}
            confirmLoading={loadingAdmins}
            width={460}
            className={dark ? "settings-dark-modal" : ""}
          >
            <Form
              form={adminForm}
              layout="vertical"
              onFinish={handleAddAdmin}
              className="mt-4"
              requiredMark={false}
            >
              <Form.Item
                name="full_name"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Full Name
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <Input
                  prefix={<UserOutlined className="text-slate-300 text-xs" />}
                  placeholder="Full name"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Email
                  </span>
                }
                rules={[{ required: true }, { type: "email" }]}
              >
                <Input
                  prefix={<MailOutlined className="text-slate-300 text-xs" />}
                  placeholder="Email address"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="contact"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Contact
                  </span>
                }
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-300 text-xs" />}
                  placeholder="Phone number"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Password
                  </span>
                }
                rules={[
                  { required: true },
                  { min: 6, message: "Min 6 characters" },
                ]}
              >
                <Input.Password
                  placeholder="Set a password"
                  className="rounded-lg"
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    });

    /* ---------------- Holidays ---------------- */
    tabItems.push({
      key: "holidays",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <CalendarOutlined />
          Holidays
        </span>
      ),
      children: (
        <div className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">
                Public Holidays
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {holidays.filter((h) => dayjs(h.date).isAfter(dayjs())).length}{" "}
                upcoming |{" "}
                {
                  holidays.filter(
                    (h) => dayjs(h.date).year() === dayjs().year(),
                  ).length
                }{" "}
                this year
              </p>
            </div>
            <Button
              type="primary"
              icon={<CalendarOutlined />}
              onClick={() => setHolidayModalVisible(true)}
              className="w-full sm:w-auto"
              style={primaryBtn}
            >
              Add Holiday
            </Button>
          </div>

          <Table
            columns={holidayColumns}
            dataSource={holidays}
            rowKey="id"
            loading={loadingHolidays}
            size="middle"
            scroll={{ x: 680 }}
            pagination={{
              pageSize: 10,
              showTotal: (t) => `${t} holidays`,
              size: "small",
            }}
          />

          <Modal
            title={
              <span className="text-sm font-bold text-slate-800">
                Add Public Holiday
              </span>
            }
            open={holidayModalVisible}
            onCancel={() => {
              setHolidayModalVisible(false);
              holidayForm.resetFields();
            }}
            onOk={() => holidayForm.submit()}
            okText="Add Holiday"
            okButtonProps={{ style: primaryBtn }}
            confirmLoading={loadingHolidays}
            width={400}
            className={dark ? "settings-dark-modal" : ""}
          >
            <Form
              form={holidayForm}
              layout="vertical"
              onFinish={handleAddHoliday}
              className="mt-4"
              requiredMark={false}
            >
              <Form.Item
                name="name"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Holiday Name
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <Input
                  placeholder="e.g., Independence Day"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="date"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Date
                  </span>
                }
                rules={[{ required: true, message: "Required" }]}
              >
                <DatePicker
                  className="w-full rounded-lg"
                  format="MMMM DD, YYYY"
                  placeholder="Select a date"
                />
              </Form.Item>
            </Form>
          </Modal>
        </div>
      ),
    });
  }

  const validTabKeys = tabItems.map((t) => t.key);
  const resolvedActiveTab = validTabKeys.includes(activeTab)
    ? activeTab
    : "profile";

  return (
    <div
      className={`p-3 sm:p-6 min-h-screen settings-page ${dark ? "settings-dark" : ""}`}
      style={{ background: dark ? "#141416" : "#ffffff" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        .settings-dark .bg-white { background-color: #16171b !important; }
        .settings-dark .bg-slate-50,
        .settings-dark .bg-slate-50\\/50 { background-color: #1b1c21 !important; }
        .settings-dark .bg-slate-100 { background-color: #252830 !important; }
        .settings-dark .border-slate-100,
        .settings-dark .border-slate-200 { border-color: #2b2f38 !important; }
        .settings-dark .text-slate-900,
        .settings-dark .text-slate-800,
        .settings-dark .text-slate-700 { color: #f3f4f6 !important; }
        .settings-dark .text-slate-600,
        .settings-dark .text-slate-500 { color: #d1d5db !important; }
        .settings-dark .text-slate-400,
        .settings-dark .text-slate-300 { color: #9ca3af !important; }
        .settings-dark .ant-divider { border-color: #2b2f38 !important; }
        .settings-dark .ant-input,
        .settings-dark .ant-input-affix-wrapper,
        .settings-dark .ant-input-number,
        .settings-dark .ant-input-number-group-addon,
        .settings-dark .ant-picker,
        .settings-dark .ant-select-selector,
        .settings-dark .ant-select-selection-search-input {
          background: #1b1c21 !important;
          border-color: #2b2f38 !important;
          color: #f3f4f6 !important;
        }
        .settings-dark .ant-input::placeholder,
        .settings-dark .ant-input-number input::placeholder,
        .settings-dark .ant-picker-input > input::placeholder { color: #6b7280 !important; }
        .settings-dark .ant-input-prefix,
        .settings-dark .ant-picker-suffix,
        .settings-dark .ant-select-arrow,
        .settings-dark .ant-input-password-icon { color: #9ca3af !important; }
        .settings-dark .ant-picker-input > input,
        .settings-dark .ant-input-number input,
        .settings-dark .ant-select-selection-item { color: #f3f4f6 !important; }
        .settings-dark .ant-table { background: #16171b !important; color: #e5e7eb !important; }
        .settings-dark .ant-table-container table > thead > tr > th {
          background: #1b1c21 !important;
          color: #d1d5db !important;
          border-bottom: 1px solid #2b2f38 !important;
        }
        .settings-dark .ant-table-tbody > tr > td {
          background: #16171b !important;
          color: #e5e7eb !important;
          border-bottom-color: #2b2f38 !important;
        }
        .settings-dark .ant-table-tbody > tr:hover > td { background: #1b1c21 !important; }
        .settings-dark .ant-pagination .ant-pagination-item,
        .settings-dark .ant-pagination .ant-pagination-prev .ant-pagination-item-link,
        .settings-dark .ant-pagination .ant-pagination-next .ant-pagination-item-link {
          background: #1b1c21 !important;
          border-color: #2b2f38 !important;
        }
        .settings-dark .ant-pagination .ant-pagination-item a,
        .settings-dark .ant-pagination .ant-pagination-prev .ant-pagination-item-link,
        .settings-dark .ant-pagination .ant-pagination-next .ant-pagination-item-link {
          color: #d1d5db !important;
        }
        .settings-dark .ant-pagination .ant-pagination-item-active { border-color: #3b82f6 !important; }
        .settings-dark .ant-empty-description { color: #9ca3af !important; }
        .settings-dark-modal .ant-modal-content {
          background: #16171b !important;
          border: 1.5px solid #2b2f38 !important;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.45) !important;
        }
        .settings-dark-modal .ant-modal-header { background: transparent !important; }
        .settings-dark-modal .ant-modal-title,
        .settings-dark-modal .ant-modal-confirm-title { color: #f3f4f6 !important; }
        .settings-dark-modal .ant-modal-confirm-content,
        .settings-dark-modal .ant-modal-body { color: #d1d5db !important; }
        .settings-dark-modal .ant-modal-close,
        .settings-dark-modal .ant-modal-confirm-btns .ant-btn-default { color: #d1d5db !important; }
        .settings-dark-modal .ant-modal-close:hover { color: #f3f4f6 !important; }
        .settings-dark-modal .bg-white { background-color: #16171b !important; }
        .settings-dark-modal .bg-slate-100 { background-color: #252830 !important; }
        .settings-dark-modal .text-slate-900,
        .settings-dark-modal .text-slate-800,
        .settings-dark-modal .text-slate-700 { color: #f3f4f6 !important; }
        .settings-dark-modal .text-slate-600,
        .settings-dark-modal .text-slate-500 { color: #d1d5db !important; }
        .settings-dark-modal .text-slate-400,
        .settings-dark-modal .text-slate-300 { color: #9ca3af !important; }
        .settings-dark-modal .border-slate-100,
        .settings-dark-modal .border-slate-200 { border-color: #2b2f38 !important; }
        .settings-dark-modal .ant-steps-item-title,
        .settings-dark-modal .ant-steps-item-description { color: #d1d5db !important; }
        .settings-dark-modal .ant-steps-item-wait .ant-steps-item-icon {
          background: #1b1c21 !important;
          border-color: #2b2f38 !important;
        }
        .settings-page {
          font-family: "DM Sans", sans-serif;
        }
        .settings-profile-shell { max-width: 980px; padding-top: 6px; }
        .settings-profile-hero {
          border: 1px solid ${dark ? "#2b2f38" : "#e5e7eb"};
          border-radius: 18px;
          padding: 20px 26px;
          margin-bottom: 18px;
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
          background: ${dark ? "#16171b" : "#ffffff"};
        }
        .settings-profile-avatar {
          border-radius: 18px !important;
          box-shadow: ${dark ? "0 0 0 4px #202127" : "0 0 0 4px #f3f4f6"};
        }
        .settings-profile-avatar-upload {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 2px solid ${dark ? "#16171b" : "#ffffff"};
          background: #0a0a0a;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: opacity .15s;
        }
        .settings-profile-avatar-upload:hover { opacity: .9; }
        .settings-profile-info { flex: 1; min-width: 0; }
        .settings-profile-name {
          font-size: 22px;
          line-height: 1.02;
          font-weight: 700;
          color: ${dark ? "#f3f4f6" : "#0f172a"};
          letter-spacing: -0.02em;
        }
        .settings-profile-role {
          margin-top: 6px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .08em;
          color: ${dark ? "#9ca3af" : "#94a3b8"};
        }
        .settings-profile-chip {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 9px;
          background: ${dark ? "#202127" : "#f3f4f6"};
          color: ${dark ? "#d1d5db" : "#64748b"};
          font-size: 11.5px;
          font-weight: 600;
        }
        .settings-profile-save-btn {
          height: 38px;
          border-radius: 10px !important;
          font-weight: 700 !important;
        }
        .settings-save-bar {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
          margin-bottom: 2px;
        }
        @media (max-width: 640px) {
          .settings-profile-name {
            font-size: 19px;
          }
          .settings-save-bar {
            justify-content: stretch;
          }
        }
        .settings-profile-card {
          border: 1px solid ${dark ? "#2b2f38" : "#e5e7eb"};
          border-radius: 18px;
          padding: 22px;
          background: ${dark ? "#16171b" : "#ffffff"};
        }
        .settings-section-title {
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: .08em;
          font-weight: 700;
          color: ${dark ? "#9ca3af" : "#94a3b8"};
          margin-bottom: 16px;
        }
        .settings-field-label {
          font-size: 13px;
          font-weight: 600;
          color: ${dark ? "#d1d5db" : "#475569"};
        }
        .settings-tabs-wrap {
          background: ${dark ? "#202127" : "#f3f4f6"};
          border: 1px solid ${dark ? "#2b2f38" : "#e5e7eb"};
          border-radius: 12px;
          padding: 3px;
          display: inline-flex;
          flex-wrap: nowrap;
          gap: 2px;
          min-width: max-content;
        }
        .settings-tab-btn {
          border: none;
          background: transparent;
          color: ${dark ? "#9ca3af" : "#6b7280"};
          font-size: 13px;
          font-weight: 600;
          border-radius: 9px;
          padding: 8px 14px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all .15s;
          cursor: pointer;
          white-space: nowrap;
        }
        .settings-tab-btn.active {
          background: ${dark ? "#141416" : "#ffffff"};
          color: ${dark ? "#f3f4f6" : "#111827"};
          box-shadow: ${dark ? "none" : "0 1px 4px rgba(0,0,0,.08)"};
        }
        .settings-tab-btn:hover:not(.active) {
          color: ${dark ? "#e5e7eb" : "#374151"};
        }
      `}</style>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your account and workspace preferences
        </p>
      </div>

      <div className="settings-profile-shell">
        <div className="settings-profile-hero">
          <div className="relative inline-block settings-profile-avatar-wrap">
            <Avatar
              size={78}
              shape="square"
              src={profile?.user_photo}
              icon={<UserOutlined />}
              className="settings-profile-avatar"
            />
            <Upload
              showUploadList={false}
              beforeUpload={handlePhotoUpload}
              accept="image/*"
            >
              <button className="settings-profile-avatar-upload">
                {uploadingPhoto ? (
                  <LoadingOutlined style={{ fontSize: 11 }} />
                ) : (
                  <CameraOutlined style={{ fontSize: 11 }} />
                )}
              </button>
            </Upload>
          </div>
          <div className="settings-profile-info">
            <div className="settings-profile-name">
              {profile?.full_name || "Your Name"}
            </div>
            <div className="settings-profile-role">
              {String(profile?.role || "employee")
                .replace(/_/g, " ")
                .toUpperCase()}
            </div>
            <div className="settings-profile-chip">
              <MailOutlined />
              <span>{profile?.email}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        <div className="px-1 sm:px-2 overflow-x-auto">
          <div className="settings-tabs-wrap">
            {tabItems.map((tab) => {
              const active = resolvedActiveTab === tab.key;
              const showUsersBadge = tab.key === "admins";
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => handleTabChange(tab.key)}
                  className={`settings-tab-btn ${active ? "active" : ""}`}
                >
                  <span className="inline-flex items-center gap-2">
                    {tab.label}
                    {showUsersBadge && (
                      <span
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-bold"
                        style={{
                          background: dark ? "#252830" : "#f1f5f9",
                          color: dark ? "#d1d5db" : "#64748b",
                        }}
                      >
                        {admins.length}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-0">
          {tabItems.find((t) => t.key === resolvedActiveTab)?.children}
        </div>
      </div>
    </div>
  );
};

export default Settings;
