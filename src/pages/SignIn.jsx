import { useState, useEffect, useRef } from "react";
import { Form, Input, Button, message, Checkbox } from "antd";
import {
  UserOutlined,
  LockOutlined,
  ArrowRightOutlined,
  CheckCircleFilled,
  TeamOutlined,
  BarChartOutlined,
  FileProtectOutlined,
  MailOutlined,
  MobileOutlined,
  SafetyOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

/* ─────────────────────────────────────────────────────────
   Email helper
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
  <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; background: #ffffff;">
    <div style="background: linear-gradient(135deg, #0a0f1e 0%, #0f172a 100%); padding: 40px 48px 32px; border-radius: 16px 16px 0 0;">
      <div style="width: 44px; height: 44px; background: linear-gradient(135deg,#6366f1,#8b5cf6); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px;">
        <span style="color:#fff; font-weight:800; font-size:20px;">R</span>
      </div>
      <h1 style="color:#fff; margin:0; font-size:22px; font-weight:700; letter-spacing:-0.5px;">Your login code</h1>
      <p style="color:rgba(255,255,255,0.5); margin: 8px 0 0; font-size:14px;">Hi ${name}, use the code below to verify your identity.</p>
    </div>
    <div style="padding: 40px 48px; background: #f8fafc; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
      <div style="background:#fff; border: 2px dashed #e2e8f0; border-radius: 14px; padding: 28px; text-align: center; margin-bottom: 28px;">
        <div style="font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #0f172a; font-family: monospace;">${otp}</div>
        <p style="color:#94a3b8; font-size:12px; margin: 12px 0 0;">Expires in <strong>10 minutes</strong></p>
      </div>
      <p style="color:#64748b; font-size:13px; line-height:1.6; margin:0;">If you didn't attempt to sign in, you can safely ignore this email. Someone may have entered your email by mistake.</p>
    </div>
  </div>
`;

/* ─────────────────────────────────────────────────────────
   OTP Input — single hidden input, visual boxes overlay
   No blink, no setTimeout focus fighting, works on mobile
───────────────────────────────────────────────────────── */
const OtpBoxes = ({ value, onChange, disabled }) => {
  const inputRef = useRef(null);
  const [focused, setFocused] = useState(false);
  const digits = (value || "").split("").concat(Array(6).fill("")).slice(0, 6);
  const activeIdx = Math.min(value?.length ?? 0, 5);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 6);
    onChange(raw);
  };

  const handleKeyDown = (e) => {
    // Allow only digits, backspace, arrows, tab
    if (
      !/^\d$/.test(e.key) &&
      !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab"].includes(e.key)
    ) {
      e.preventDefault();
    }
  };

  return (
    <div
      className="flex gap-2.5 justify-center relative"
      onClick={() => inputRef.current?.focus()}
      style={{ cursor: "text" }}
    >
      {/* Hidden real input that captures all typing */}
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        value={value || ""}
        disabled={disabled}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          position: "absolute",
          opacity: 0,
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          cursor: "text",
          zIndex: 1,
          fontSize: 16, // prevent iOS zoom
        }}
      />

      {/* Visual boxes — purely decorative */}
      {digits.map((d, i) => {
        const isActive = focused && i === activeIdx;
        return (
          <div
            key={i}
            className="otp-box"
            style={{
              borderColor: isActive ? "#6366f1" : d ? "#94a3b8" : "#e2e8f0",
              background: isActive || d ? "#fff" : "#f8fafc",
              boxShadow: isActive ? "0 0 0 3px rgba(99,102,241,0.12)" : "none",
              transform: isActive ? "scale(1.04)" : "scale(1)",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            {d || (isActive ? <span className="otp-cursor" /> : null)}
          </div>
        );
      })}
    </div>
  );
};

/* ─────────────────────────────────────────────────────────
   Floating feature card
───────────────────────────────────────────────────────── */
const FeatureCard = ({ icon, title, desc, delay, x, y }) => (
  <div
    className="absolute flex items-start gap-3 rounded-2xl px-4 py-3 backdrop-blur-sm"
    style={{
      left: x,
      top: y,
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      animation: `float 6s ease-in-out ${delay}s infinite`,
      maxWidth: 220,
    }}
  >
    <div
      className="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 mt-0.5"
      style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}
    >
      {icon}
    </div>
    <div>
      <div className="text-white text-xs font-semibold leading-tight">
        {title}
      </div>
      <div
        className="text-xs mt-0.5 leading-snug"
        style={{ color: "rgba(255,255,255,0.5)" }}
      >
        {desc}
      </div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────
   Main SignIn
───────────────────────────────────────────────────────── */
const SignIn = () => {
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 2FA state
  const [twoFaStep, setTwoFaStep] = useState(null); // null | "choose" | "email" | "totp"
  const [pendingUser, setPendingUser] = useState(null); // { user, session }
  const [pendingProfile, setPendingProfile] = useState(null);
  const [otpCode, setOtpCode] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [storedOtp, setStoredOtp] = useState(null);
  const [otpExpiry, setOtpExpiry] = useState(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [verifying, setVerifying] = useState(false);

  const { signIn, resetPassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("error") === "unauthorized") {
      message.error(
        "This email is not registered. Please contact your administrator.",
      );
      window.history.replaceState({}, "", "/signin");
    }
  }, []);

  // Cooldown ticker
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  /* ── Step 1: Normal sign-in ── */
  const handleSignIn = async (values) => {
    setLoading(true);
    try {
      const { error, data } = await signIn(values.email, values.password);
      if (error) {
        message.error(error.message);
        return;
      }

      if (data?.user) {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select(
            "suspended, role, full_name, email, totp_enabled, email_otp_enabled",
          )
          .eq("id", data.user.id)
          .maybeSingle();

        if (profileError)
          console.warn("Profile fetch warning:", profileError.message);

        if (profile?.suspended) {
          message.error(
            "Your account has been suspended. Please contact your administrator.",
          );
          await supabase.auth.signOut();
          return;
        }

        const has2fa = profile?.totp_enabled || profile?.email_otp_enabled;

        if (has2fa) {
          // Store user context and pause navigation
          setPendingUser(data.user);
          setPendingProfile(profile);

          const bothEnabled = profile.totp_enabled && profile.email_otp_enabled;
          if (bothEnabled) {
            setTwoFaStep("choose");
          } else if (profile.totp_enabled) {
            setTwoFaStep("totp");
          } else {
            // Email OTP — send immediately
            await sendEmailOtp(profile);
            setTwoFaStep("email");
          }
        } else {
          message.success("Welcome back!");
          navigate("/dashboard");
        }
      }
    } catch {
      message.error("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  /* ── Send email OTP ── */
  const sendEmailOtp = async (profile) => {
    const otp = generateOtp();
    const expiry = Date.now() + 10 * 60 * 1000; // 10 min
    setStoredOtp(otp);
    setOtpExpiry(expiry);
    setOtpCode("");
    setResendCooldown(60);

    await sendEmail({
      to: profile.email,
      subject: "Your Resosyncer login code",
      body: otpEmailHtml(otp, profile.full_name || "there"),
      companyName: "Resosyncer",
    });
  };

  const handleChooseEmail = async () => {
    await sendEmailOtp(pendingProfile);
    setTwoFaStep("email");
  };

  const handleChooseTotp = () => setTwoFaStep("totp");

  /* ── Verify Email OTP ── */
  const handleVerifyEmailOtp = async () => {
    if (otpCode.length !== 6) return;
    setVerifying(true);
    try {
      if (Date.now() > otpExpiry) {
        message.error("Code has expired. Please request a new one.");
        setOtpCode("");
        return;
      }
      if (otpCode !== storedOtp) {
        message.error("Incorrect code. Please try again.");
        setOtpCode("");
        return;
      }
      message.success("Welcome back!");
      navigate("/dashboard");
    } finally {
      setVerifying(false);
    }
  };

  /* ── Verify TOTP (Authenticator App) ── */
  const handleVerifyTotp = async () => {
    if (totpCode.length !== 6) return;
    setVerifying(true);
    try {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const factor = factors?.totp?.[0];
      if (!factor) throw new Error("Authenticator factor not found");

      const { data: challengeData, error: challengeError } =
        await supabase.auth.mfa.challenge({ factorId: factor.id });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factor.id,
        challengeId: challengeData.id,
        code: totpCode,
      });
      if (verifyError) throw verifyError;

      message.success("Welcome back!");
      navigate("/dashboard");
    } catch (e) {
      message.error(e.message || "Invalid code. Please try again.");
      setTotpCode("");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    await sendEmailOtp(pendingProfile);
    message.success("New code sent!");
  };

  const handleCancel2fa = async () => {
    await supabase.auth.signOut();
    setPendingUser(null);
    setPendingProfile(null);
    setTwoFaStep(null);
    setOtpCode("");
    setTotpCode("");
  };

  /* ── Forgot password ── */
  const handleForgotPassword = async (values) => {
    setLoading(true);
    try {
      const { error } = await resetPassword(values.email);
      if (error) {
        message.error(error.message);
        return;
      }
      message.success("Password reset link sent! Check your inbox.");
      setShowForgot(false);
    } catch {
      message.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────────────────────────────────────────────────
     Render helpers for 2FA panels
  ───────────────────────────────────────────────────────── */
  const TwoFaShell = ({ children, backLabel, onBack }) => (
    <div
      className="w-full max-w-sm transition-all duration-500"
      style={{
        opacity: mounted ? 1 : 0,
        transform: mounted ? "translateY(0)" : "translateY(16px)",
      }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8 transition-colors"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
        }}
      >
        <ArrowLeftOutlined style={{ fontSize: 11 }} />
        {backLabel}
      </button>
      {children}
    </div>
  );

  /* ── 2FA: Choose method ── */
  const renderChoose = () => (
    <TwoFaShell backLabel="Back to sign in" onBack={handleCancel2fa}>
      <div className="mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg,#eef2ff,#ede9fe)" }}
        >
          <SafetyOutlined style={{ color: "#6366f1", fontSize: 22 }} />
        </div>
        <h2
          className="font-black mb-1.5 tracking-tight"
          style={{ fontSize: 26, color: "#0f172a" }}
        >
          Two-step verification
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          This account has extra security enabled. Choose how you'd like to
          verify.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleChooseEmail}
          className="w-full text-left rounded-2xl p-4 border-2 transition-all group hover:border-indigo-300 hover:bg-indigo-50/50"
          style={{
            background: "#f8fafc",
            border: "2px solid #e2e8f0",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#dbeafe,#ede9fe)" }}
            >
              <MailOutlined style={{ color: "#6366f1", fontSize: 18 }} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Email code</div>
              <div className="text-xs text-slate-400 mt-0.5">
                Send a 6-digit code to{" "}
                <span className="font-medium text-slate-500">
                  {pendingProfile?.email?.replace(/(.{2}).+(@.+)/, "$1•••$2")}
                </span>
              </div>
            </div>
            <ArrowRightOutlined className="ml-auto text-slate-300 group-hover:text-indigo-400 transition-colors" />
          </div>
        </button>

        <button
          onClick={handleChooseTotp}
          className="w-full text-left rounded-2xl p-4 border-2 transition-all group hover:border-violet-300 hover:bg-violet-50/50"
          style={{
            background: "#f8fafc",
            border: "2px solid #e2e8f0",
            cursor: "pointer",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg,#ede9fe,#fdf4ff)" }}
            >
              <MobileOutlined style={{ color: "#8b5cf6", fontSize: 18 }} />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">
                Authenticator app
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                Use Google Authenticator, Authy, or similar
              </div>
            </div>
            <ArrowRightOutlined className="ml-auto text-slate-300 group-hover:text-violet-400 transition-colors" />
          </div>
        </button>
      </div>
    </TwoFaShell>
  );

  /* ── 2FA: Email OTP ── */
  const renderEmailOtp = () => (
    <TwoFaShell
      backLabel={
        pendingProfile?.totp_enabled ? "Other method" : "Back to sign in"
      }
      onBack={() =>
        pendingProfile?.totp_enabled
          ? setTwoFaStep("choose")
          : handleCancel2fa()
      }
    >
      <div className="mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg,#dbeafe,#ede9fe)" }}
        >
          <MailOutlined style={{ color: "#6366f1", fontSize: 22 }} />
        </div>
        <h2
          className="font-black mb-1.5 tracking-tight"
          style={{ fontSize: 26, color: "#0f172a" }}
        >
          Check your inbox
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          We sent a 6-digit code to{" "}
          <span className="font-semibold text-slate-600">
            {pendingProfile?.email?.replace(/(.{2}).+(@.+)/, "$1•••$2")}
          </span>
          . It expires in 10 minutes.
        </p>
      </div>

      <div className="mb-6">
        <OtpBoxes value={otpCode} onChange={setOtpCode} disabled={verifying} />
      </div>

      <Button
        type="primary"
        block
        loading={verifying}
        disabled={otpCode.length !== 6}
        onClick={handleVerifyEmailOtp}
        style={{
          height: 48,
          fontSize: 15,
          fontWeight: 600,
          background:
            otpCode.length === 6
              ? "linear-gradient(135deg, #4f46e5, #7c3aed)"
              : undefined,
          border: "none",
          borderRadius: 12,
          boxShadow:
            otpCode.length === 6
              ? "0 4px 14px rgba(99,102,241,0.35)"
              : undefined,
        }}
      >
        Verify & sign in
      </Button>

      <div className="flex items-center justify-center gap-1.5 mt-5">
        <span className="text-xs text-slate-400">Didn't receive it?</span>
        <button
          onClick={handleResendOtp}
          disabled={resendCooldown > 0}
          className="text-xs font-semibold transition-colors"
          style={{
            color: resendCooldown > 0 ? "#94a3b8" : "#6366f1",
            background: "none",
            border: "none",
            cursor: resendCooldown > 0 ? "default" : "pointer",
            padding: 0,
          }}
        >
          {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
        </button>
      </div>
    </TwoFaShell>
  );

  /* ── 2FA: TOTP ── */
  const renderTotp = () => (
    <TwoFaShell
      backLabel={
        pendingProfile?.email_otp_enabled ? "Other method" : "Back to sign in"
      }
      onBack={() =>
        pendingProfile?.email_otp_enabled
          ? setTwoFaStep("choose")
          : handleCancel2fa()
      }
    >
      <div className="mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
          style={{ background: "linear-gradient(135deg,#ede9fe,#fdf4ff)" }}
        >
          <MobileOutlined style={{ color: "#8b5cf6", fontSize: 22 }} />
        </div>
        <h2
          className="font-black mb-1.5 tracking-tight"
          style={{ fontSize: 26, color: "#0f172a" }}
        >
          Authenticator code
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed">
          Open your authenticator app and enter the 6-digit code for{" "}
          <span className="font-semibold text-slate-600">Resosyncer</span>.
        </p>
      </div>

      <div className="mb-6">
        <OtpBoxes
          value={totpCode}
          onChange={setTotpCode}
          disabled={verifying}
        />
      </div>

      <Button
        type="primary"
        block
        loading={verifying}
        disabled={totpCode.length !== 6}
        onClick={handleVerifyTotp}
        style={{
          height: 48,
          fontSize: 15,
          fontWeight: 600,
          background:
            totpCode.length === 6
              ? "linear-gradient(135deg, #7c3aed, #8b5cf6)"
              : undefined,
          border: "none",
          borderRadius: 12,
          boxShadow:
            totpCode.length === 6
              ? "0 4px 14px rgba(139,92,246,0.35)"
              : undefined,
        }}
      >
        Verify & sign in
      </Button>

      <p className="text-xs text-slate-400 text-center mt-4 leading-relaxed">
        Code refreshes every 30 seconds in your app
      </p>
    </TwoFaShell>
  );

  /* ─────────────────────────────────────────────────────────
     Full render
  ───────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen flex signin-root">
      {/* ── LEFT — Brand panel ── */}
      <div
        className="hidden lg:flex flex-col relative overflow-hidden"
        style={{
          width: "52%",
          background:
            "linear-gradient(145deg, #0a0f1e 0%, #0f172a 45%, #111827 100%)",
          flexShrink: 0,
        }}
      >
        <div className="signin-grid" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 70% 55% at 30% 20%, rgba(99,102,241,0.18) 0%, transparent 65%)",
          }}
        />

        <div className="relative z-10 flex flex-col h-full p-12">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white"
              style={{
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                fontSize: 18,
              }}
            >
              R
            </div>
            <span className="text-white font-bold text-xl tracking-tight">
              Resosyncer
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center relative py-12">
            <div
              className="transition-all duration-700"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(20px)",
              }}
            >
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: "#a5b4fc" }}
                />
                Trusted by 500+ companies
              </div>
              <h1
                className="font-black leading-none mb-5"
                style={{
                  fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)",
                  color: "#fff",
                  letterSpacing: "-0.03em",
                }}
              >
                Run your whole
                <br />
                <span
                  style={{
                    background: "linear-gradient(90deg, #818cf8, #c084fc)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  company
                </span>
                <br />
                from one place.
              </h1>
              <p
                className="text-base leading-relaxed max-w-sm"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Projects, HR, attendance, payroll, leads — all connected. Built
                for teams that move fast.
              </p>
            </div>

            <FeatureCard
              icon={<TeamOutlined />}
              title="Team Management"
              desc="Roles, attendance & standups"
              delay={0}
              x="58%"
              y="5%"
            />
            <FeatureCard
              icon={<BarChartOutlined />}
              title="Live Analytics"
              desc="Real-time performance data"
              delay={1.5}
              x="52%"
              y="44%"
            />
            <FeatureCard
              icon={<FileProtectOutlined />}
              title="Contract Builder"
              desc="Generate & sign in minutes"
              delay={0.8}
              x="55%"
              y="80%"
            />
          </div>

          <div className="relative h-16 mb-2" />
        </div>
      </div>

      {/* ── RIGHT — Form panel ── */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 p-6 border-b border-slate-100">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-sm"
            style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
          >
            R
          </div>
          <span className="text-slate-900 font-bold text-lg tracking-tight">
            Resosyncer
          </span>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-8 py-12">
          {/* ── 2FA flows ── */}
          {twoFaStep === "choose" && renderChoose()}
          {twoFaStep === "email" && renderEmailOtp()}
          {twoFaStep === "totp" && renderTotp()}

          {/* ── Normal sign-in / forgot ── */}
          {!twoFaStep && (
            <div
              className="w-full max-w-sm transition-all duration-500"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? "translateY(0)" : "translateY(16px)",
              }}
            >
              {!showForgot ? (
                <>
                  <div className="mb-8">
                    <h2
                      className="font-black mb-1.5 tracking-tight"
                      style={{ fontSize: 28, color: "#0f172a" }}
                    >
                      Welcome back
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Sign in to your workspace
                    </p>
                  </div>

                  <Form
                    name="signin"
                    onFinish={handleSignIn}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="email"
                      label={
                        <span className="text-slate-700 text-sm font-medium">
                          Email address
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Invalid email address" },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-slate-300" />}
                        placeholder="you@company.com"
                        className="signin-input"
                      />
                    </Form.Item>

                    <Form.Item
                      name="password"
                      label={
                        <div className="flex items-center justify-between w-full">
                          <span className="text-slate-700 text-sm font-medium">
                            Password
                          </span>
                          <button
                            type="button"
                            onClick={() => setShowForgot(true)}
                            className="text-xs font-medium transition-colors"
                            style={{
                              color: "#6366f1",
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                            }}
                          >
                            Forgot password?
                          </button>
                        </div>
                      }
                      rules={[
                        {
                          required: true,
                          message: "Please enter your password",
                        },
                      ]}
                    >
                      <Input.Password
                        prefix={<LockOutlined className="text-slate-300" />}
                        placeholder="••••••••"
                        className="signin-input"
                      />
                    </Form.Item>

                    <Form.Item
                      name="remember"
                      valuePropName="checked"
                      className="!mb-6"
                    >
                      <Checkbox>
                        <span className="text-slate-500 text-sm">
                          Keep me signed in for 30 days
                        </span>
                      </Checkbox>
                    </Form.Item>

                    <Form.Item className="!mb-4">
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        icon={<ArrowRightOutlined />}
                        className="signin-btn !flex !items-center !justify-center !gap-2 !flex-row-reverse"
                        style={{
                          height: 48,
                          fontSize: 15,
                          fontWeight: 600,
                          background:
                            "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          border: "none",
                          borderRadius: 12,
                          boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                        }}
                      >
                        Sign in
                      </Button>
                    </Form.Item>
                  </Form>

                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-xs text-slate-300 font-medium">
                      OR
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  <div
                    className="rounded-2xl p-5 text-center"
                    style={{
                      background: "#f8fafc",
                      border: "1.5px solid #e2e8f0",
                    }}
                  >
                    <p className="text-slate-500 text-sm mb-3">
                      Don't have a workspace yet?
                    </p>
                    <Link to="/register">
                      <Button
                        block
                        className="!rounded-xl !font-semibold !text-sm"
                        style={{
                          height: 42,
                          borderColor: "#e2e8f0",
                          color: "#0f172a",
                          background: "#fff",
                        }}
                      >
                        Create your free account →
                      </Button>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setShowForgot(false)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 mb-8 transition-colors"
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    ← Back to sign in
                  </button>

                  <div className="mb-8">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: "#eef2ff" }}
                    >
                      <LockOutlined
                        style={{ color: "#6366f1", fontSize: 20 }}
                      />
                    </div>
                    <h2
                      className="font-black mb-1.5 tracking-tight"
                      style={{ fontSize: 28, color: "#0f172a" }}
                    >
                      Reset your password
                    </h2>
                    <p className="text-slate-400 text-sm">
                      Enter your work email and we'll send a reset link right
                      away.
                    </p>
                  </div>

                  <Form
                    name="forgot"
                    onFinish={handleForgotPassword}
                    layout="vertical"
                    size="large"
                    requiredMark={false}
                  >
                    <Form.Item
                      name="email"
                      label={
                        <span className="text-slate-700 text-sm font-medium">
                          Work email
                        </span>
                      }
                      rules={[
                        { required: true, message: "Please enter your email" },
                        { type: "email", message: "Invalid email address" },
                      ]}
                    >
                      <Input
                        prefix={<UserOutlined className="text-slate-300" />}
                        placeholder="you@company.com"
                        className="signin-input"
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        block
                        style={{
                          height: 48,
                          fontSize: 15,
                          fontWeight: 600,
                          background:
                            "linear-gradient(135deg, #4f46e5, #7c3aed)",
                          border: "none",
                          borderRadius: 12,
                          boxShadow: "0 4px 14px rgba(99,102,241,0.35)",
                        }}
                      >
                        Send reset link
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-300">© 2025 Resosyncer</span>
          <div className="flex items-center gap-4">
            {["Privacy", "Terms", "Help"].map((l) => (
              <a
                key={l}
                href="#"
                className="text-xs text-slate-300 hover:text-slate-500 transition-colors"
              >
                {l}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');

        .signin-root * { font-family: 'Instrument Sans', system-ui, sans-serif; }

        .signin-grid {
          position: absolute; inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 30%, transparent 100%);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        .signin-input.ant-input-affix-wrapper,
        .signin-input {
          border-radius: 10px !important;
          border-color: #e2e8f0 !important;
          height: 46px !important;
          background: #f8fafc !important;
          transition: all 0.2s ease !important;
        }
        .signin-input.ant-input-affix-wrapper:hover,
        .signin-input:hover { border-color: #cbd5e1 !important; background: #fff !important; }
        .signin-input.ant-input-affix-wrapper-focused,
        .signin-input:focus {
          border-color: #6366f1 !important; background: #fff !important;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1) !important;
        }
        .signin-input .ant-input { background: transparent !important; font-size: 14px !important; }

        .signin-btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 6px 20px rgba(99,102,241,0.4) !important;
        }
        .signin-btn { transition: all 0.2s ease !important; }

        .ant-form-item-label > label {
          font-size: 13px !important; font-weight: 500 !important;
          color: #374151 !important; width: 100% !important;
        }
        .ant-checkbox-checked .ant-checkbox-inner { background-color: #6366f1 !important; border-color: #6366f1 !important; }
        .ant-checkbox-wrapper:hover .ant-checkbox-inner { border-color: #6366f1 !important; }

        /* OTP boxes */
        .otp-box {
          width: 46px; height: 54px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 800;
          color: #0f172a;
          font-family: 'Courier New', monospace;
          transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease, background 0.15s ease;
          user-select: none;
          position: relative;
          flex-shrink: 0;
        }
        .otp-cursor {
          display: inline-block;
          width: 2px;
          height: 24px;
          background: #6366f1;
          border-radius: 2px;
          animation: otp-blink 1s step-end infinite;
        }
        @keyframes otp-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default SignIn;
