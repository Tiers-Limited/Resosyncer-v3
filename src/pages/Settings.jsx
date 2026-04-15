import { useState, useEffect } from "react";
import {
  Tabs,
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
  VideoCameraOutlined
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

/* ─────────────────────────────────────────────────────────
   Email API helper
───────────────────────────────────────────────────────── */
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
      console.error("❌ Email send failed:", data);
      return { success: false, error: data };
    }
    console.log("✅ Email sent:", data.messageId);
    return { success: true, data };
  } catch (err) {
    console.error("❌ Email send error:", err);
    return { success: false, error: err.message };
  }
};

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const otpEmailHtml = (otp, name) => `
  <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:480px;margin:0 auto;background:#ffffff;">
    <div style="background:linear-gradient(135deg,#001529 0%,#002144 100%);padding:36px 44px 28px;border-radius:16px 16px 0 0;">
      <div style="width:40px;height:40px;background:rgba(255,255,255,0.1);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="color:#fff;font-weight:800;font-size:18px;">R</span>
      </div>
      <h1 style="color:#fff;margin:0;font-size:20px;font-weight:700;letter-spacing:-0.5px;">Verify your email</h1>
      <p style="color:rgba(255,255,255,0.5);margin:8px 0 0;font-size:13px;">Hi ${name}, use the code below to enable Email OTP on your account.</p>
    </div>
    <div style="padding:36px 44px;background:#f8fafc;border-radius:0 0 16px 16px;border:1px solid #e2e8f0;border-top:none;">
      <div style="background:#fff;border:2px dashed #e2e8f0;border-radius:14px;padding:24px;text-align:center;margin-bottom:24px;">
        <div style="font-size:40px;font-weight:800;letter-spacing:12px;color:#001529;font-family:monospace;">${otp}</div>
        <p style="color:#94a3b8;font-size:12px;margin:10px 0 0;">Expires in <strong>10 minutes</strong></p>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">If you didn't request this, you can safely ignore this email.</p>
    </div>
  </div>
`;

/* ─────────────────────────────────────────────────────────
   Shared Layout Helpers
───────────────────────────────────────────────────────── */
const SectionTitle = ({ children }) => (
  <p className="text-[10.5px] font-bold tracking-widest uppercase text-slate-400 mb-4 mt-1">
    {children}
  </p>
);

const SettingRow = ({ label, description, children, border = true }) => (
  <div
    className={`flex items-center justify-between py-4 ${border ? "border-b border-slate-100" : ""}`}
  >
    <div className="mr-8">
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

/* ─────────────────────────────────────────────────────────
   Page permission definitions (mirrors admin sidebar)
───────────────────────────────────────────────────────── */
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
      { key: "/subscription", label: "Subscription", icon: <CreditCardOutlined /> },
      { key: "/settings", label: "Settings", icon: <SettingOutlined /> },
    ],
  },
];

const ALL_PAGE_KEYS = PAGE_GROUPS.flatMap((g) => g.pages.map((p) => p.key));

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/* ─────────────────────────────────────────────────────────
   Admin Permissions Modal
───────────────────────────────────────────────────────── */
const AdminPermissionsModal = ({ admin, visible, onClose, onSave, dark = false }) => {
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
              Page Access — {admin?.full_name}
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
              <div className="grid grid-cols-2 gap-1.5">
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

/* ─────────────────────────────────────────────────────────
   2FA Section Component
───────────────────────────────────────────────────────── */
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

  /* ── TOTP (Authenticator App) ── */
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

  /* ── Email OTP — uses custom email API ── */
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
                style={{
                  backgroundColor: "#001529",
                  borderColor: "#001529",
                  borderRadius: 7,
                  fontWeight: 600,
                }}
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
                style={{
                  backgroundColor: "#001529",
                  borderColor: "#001529",
                  borderRadius: 7,
                  fontWeight: 600,
                }}
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
                backgroundColor: "#001529",
                borderColor: "#001529",
                height: 36,
              }}
              onClick={() => setTotpStep(1)}
            >
              I've scanned it →
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
                backgroundColor: "#001529",
                borderColor: "#001529",
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
              ← Back
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
              backgroundColor: "#001529",
              borderColor: "#001529",
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
                color: resendCooldown > 0 ? "#94a3b8" : dark ? "#93c5fd" : "#001529",
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

/* ─────────────────────────────────────────────────────────
   Main Settings Component
───────────────────────────────────────────────────────── */
const Settings = () => {
  const { profile } = useAuth();
  const [dark, setDark] = useState(getIsDarkTheme);
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

  const primaryBtn = {
    backgroundColor: "#001529",
    borderColor: "#001529",
    borderRadius: 7,
    fontWeight: 600,
    height: 36,
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
      ? [{ label: "Tax Deductions", amount: parseAmount(profile?.tax_deductions) }]
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

  /* ── Handlers ── */
  const handleUpdateProfile = async (values) => {
    setProfileLoading(true);
    try {
      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
      });
      if (authError) throw authError;
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

  /* ── Columns ── */
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
      render: (t) => <span className="text-sm text-slate-500">{t || "—"}</span>,
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
    /* ── Profile ── */
    {
      key: "profile",
      label: (
        <span className="flex items-center gap-1.5 text-[13px]">
          <UserOutlined />
          Profile
        </span>
      ),
      children: (
        <div className="max-w-2xl pt-2">
          <div className="flex items-center gap-5 mb-8 pb-7 border-b border-slate-100">
            <div className="relative inline-block">
              <Avatar
                size={68}
                src={profile?.user_photo}
                icon={<UserOutlined />}
                className="ring-4 ring-slate-100 shadow-sm"
              />
              <Upload
                showUploadList={false}
                beforeUpload={handlePhotoUpload}
                accept="image/*"
              >
                <button className="absolute -bottom-1 -right-1 w-[26px] h-[26px] rounded-full bg-white border border-slate-200 shadow-md flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-400 transition-all cursor-pointer">
                  {uploadingPhoto ? (
                    <LoadingOutlined style={{ fontSize: 11 }} />
                  ) : (
                    <CameraOutlined style={{ fontSize: 11 }} />
                  )}
                </button>
              </Upload>
            </div>
            <div className="flex-1">
              <div className="text-[15px] font-bold text-slate-800">
                {profile?.full_name || "Your Name"}
              </div>
              <div className="text-xs text-slate-400 capitalize mt-0.5">
                {profile?.role} · {profile?.email}
              </div>
            </div>
            <Button
              type="primary"
              htmlType="submit"
              form="profile-form"
              loading={profileLoading}
              style={primaryBtn}
            >
              Save Changes
            </Button>
          </div>

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
              dob: profile?.dob ? dayjs(profile.dob) : null,
              bank_name: profile?.bank_name,
              bank_account_number: profile?.bank_account_number,
              bank_account_name: profile?.bank_account_name,
            }}
          >
            <SectionTitle>Personal Information</SectionTitle>
            <div className="grid grid-cols-2 gap-x-5">
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
                  placeholder="Your full name"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="email"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    Email Address
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
                  <span className="text-xs font-medium text-slate-600">
                    Phone Number
                  </span>
                }
              >
                <Input
                  prefix={<PhoneOutlined className="text-slate-300 text-xs" />}
                  placeholder="+92 300 0000000"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="cnic"
                label={
                  <span className="text-xs font-medium text-slate-600">
                    CNIC
                  </span>
                }
              >
                <Input
                  prefix={<IdcardOutlined className="text-slate-300 text-xs" />}
                  placeholder="12345-1234567-1"
                  className="rounded-lg"
                />
              </Form.Item>
              <Form.Item
                name="dob"
                label={
                  <span className="text-xs font-medium text-slate-600">
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
            <Form.Item
              name="address"
              label={
                <span className="text-xs font-medium text-slate-600">
                  Address
                </span>
              }
            >
              <Input.TextArea
                rows={2}
                placeholder="Your address"
                className="rounded-lg"
              />
            </Form.Item>

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
                        border: dark ? "1px solid #2f3138" : "1px solid #e2e8f0",
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
                        border: dark ? "1px solid #2f3857" : "1px solid #dbeafe",
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
                        border: dark ? "1px solid #4a2a36" : "1px solid #ffe4e6",
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
                        border: dark ? "1px solid #234236" : "1px solid #bbf7d0",
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
                <div className="grid grid-cols-2 gap-x-5">
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

    /* ── Security ── */
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
              Use a strong password — at least 6 characters with a mix of
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
  ];

  if (profile?.role === "admin") {
    /* ── General Settings ── */
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
          <div className="flex items-center justify-between mb-6 pb-5 border-b border-slate-100">
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
                    className={`px-4 py-2 rounded-lg text-[12px] font-semibold border transition-all cursor-pointer
                      ${
                        selected
                          ? "bg-[#001529] text-white border-[#001529]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
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
                    className={`px-5 py-2 rounded-lg text-[13px] font-semibold border transition-all cursor-pointer
                      ${
                        selected
                          ? "bg-[#001529] text-white border-[#001529]"
                          : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                      }`}
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
              style={overtimeEnabled ? { backgroundColor: "#001529" } : {}}
            />
          </SettingRow>
        </div>
      ),
    });

    /* ── Admins ── */
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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">
                Administrators
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {admins.length} admin{admins.length !== 1 ? "s" : ""} with
                workspace access · click{" "}
                <SafetyOutlined className="text-slate-400" /> to manage page
                permissions
              </p>
            </div>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setAdminModalVisible(true)}
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

    /* ── Holidays ── */
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
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[13px] font-bold text-slate-800">
                Public Holidays
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {holidays.filter((h) => dayjs(h.date).isAfter(dayjs())).length}{" "}
                upcoming ·{" "}
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

  return (
    <div
      className={`p-6 min-h-screen settings-page ${dark ? "settings-dark" : ""}`}
      style={{ background: dark ? "#141416" : "#ffffff" }}
    >
      <style>{`
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
        .settings-dark .ant-tabs-nav::before { border-bottom-color: #2b2f38 !important; }
        .settings-dark .ant-tabs-tab { color: #9ca3af !important; }
        .settings-dark .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: #f3f4f6 !important; }
        .settings-dark .ant-tabs-ink-bar { background: #60a5fa !important; }
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
      `}</style>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Manage your account and workspace preferences
        </p>
      </div>

      <Tabs
        items={tabItems}
        tabBarStyle={{
          marginBottom: 24,
          borderBottom: `1px solid ${dark ? "#2b2f38" : "#f1f5f9"}`,
        }}
        tabBarGutter={32}
      />
    </div>
  );
};

export default Settings;
