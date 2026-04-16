import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/* --- Design tokens -------------------------------------------------------- */
const T = {
  font: `'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif`,
  black: "#0f2747",
  gray50: "#f3f7ff",
  gray100: "#e8eef8",
  gray200: "#d9e2f1",
  gray300: "#bccbe0",
  gray400: "#8ba0bd",
  gray500: "#607a9d",
  gray700: "#2f4969",
  white: "#ffffff",
};

/* --- Steps data ----------------------------------------------------------- */
const STEPS = [
  {
    id: "team",
    illustration: "team",
    label: "Collaborate",
    title: "Add your whole\nteam to Ryzent.",
    body: "The best work happens together. Invite everyone, set their roles, and build a workspace where nothing gets lost.",
    items: [
      {
        head: "Instant team invites",
        sub: "Email invites sent in seconds from your dashboard",
      },
      {
        head: "Granular role control",
        sub: "Owner, Admin, Member, or Viewer - precisely assigned",
      },
      {
        head: "SSO & SAML 2.0",
        sub: "Enterprise-grade sign-on with OIDC support",
      },
    ],
  },
  {
    id: "projects",
    illustration: "projects",
    label: "Organize",
    title: "Create your projects\non Ryzent.",
    body: "Structure work around outcomes, not tools. Switch between boards, timelines, and lists without losing context.",
    items: [
      {
        head: "Board, list, or timeline",
        sub: "Pick the view that fits each project best",
      },
      {
        head: "Custom status workflows",
        sub: "Mirror exactly how your team works",
      },
      {
        head: "Live, multiplayer editing",
        sub: "Everyone sees changes the moment they happen",
      },
    ],
  },
  {
    id: "meetings",
    illustration: "meetings",
    label: "AI-powered",
    title: "Do meetings with\nAI summaries.",
    body: "Stop transcribing. Let AI capture decisions, surface action items, and connect them directly to your projects.",
    items: [
      {
        head: "Auto-generated summaries",
        sub: "Key decisions surfaced and shared instantly",
      },
      {
        head: "Action items become tasks",
        sub: "No more follow-up emails to assign work",
      },
      {
        head: "Full meeting search",
        sub: "Find any decision or discussion in seconds",
      },
    ],
  },
  {
    id: "rexa",
    illustration: "rexa",
    label: "Rexa AI",
    title: "Reduce manual hiring\nwith Rexa AI Agent.",
    body: "Rexa handles screening, scheduling, and follow-ups so your team can focus on what humans do best - judging people.",
    items: [
      {
        head: "Smart candidate screening",
        sub: "Rexa shortlists against your exact criteria",
      },
      {
        head: "Calendar-aware scheduling",
        sub: "Interviews booked without a single email thread",
      },
      {
        head: "Automated follow-ups",
        sub: "No candidate ever left waiting for a response",
      },
    ],
  },
  {
    id: "done",
    illustration: "done",
    label: "All set",
    title: "You're ready\nto go.",
    body: "Your workspace is live, your team is invited, and everything is configured. Time to sign in and ship something great.",
    items: [
      {
        head: "Workspace provisioned",
        sub: "Isolated namespace created for your organisation",
      },
      {
        head: "Invites dispatched",
        sub: "Teammates will receive their invites shortly",
      },
      { head: "All systems go", sub: "You're cleared for take-off" },
    ],
  },
];

/* --- Illustrations (pure SVG, inline) ------------------------------------ */
function Illustration({ type, size = 64 }) {
  const s = { width: size, height: size };

  if (type === "team")
    return (
      <svg {...s} viewBox="0 0 64 64" fill="none">
        <circle
          cx="22"
          cy="22"
          r="10"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <circle
          cx="42"
          cy="22"
          r="10"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <path
          d="M4 52c0-9.941 8.059-18 18-18s18 8.059 18 18"
          stroke={T.gray300}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M24 52c0-9.941 8.059-18 18-18s18 8.059 18 18"
          stroke={T.gray300}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="22" cy="22" r="6" fill={T.black} />
        <circle cx="42" cy="22" r="6" fill={T.gray400} />
        <path
          d="M10 50c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke={T.black}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M30 50c0-6.627 5.373-12 12-12s12 5.373 12 12"
          stroke={T.gray400}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );

  if (type === "projects")
    return (
      <svg {...s} viewBox="0 0 64 64" fill="none">
        <rect
          x="4"
          y="4"
          width="24"
          height="24"
          rx="5"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <rect x="36" y="4" width="24" height="24" rx="5" fill={T.black} />
        <rect x="4" y="36" width="24" height="24" rx="5" fill={T.gray300} />
        <rect
          x="36"
          y="36"
          width="24"
          height="24"
          rx="5"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <path
          d="M12 16h8M12 20h5"
          stroke={T.gray400}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M44 16h8M44 20h5"
          stroke={T.white}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M12 48h8M12 52h5"
          stroke={T.white}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M44 48h8M44 52h5"
          stroke={T.gray400}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );

  if (type === "meetings")
    return (
      <svg {...s} viewBox="0 0 64 64" fill="none">
        <rect
          x="4"
          y="12"
          width="56"
          height="40"
          rx="6"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <circle cx="32" cy="8" r="4" fill={T.gray300} />
        <rect x="12" y="24" width="40" height="3" rx="1.5" fill={T.gray300} />
        <rect x="12" y="32" width="28" height="3" rx="1.5" fill={T.gray300} />
        <rect x="12" y="40" width="34" height="3" rx="1.5" fill={T.gray300} />
        <circle cx="48" cy="44" r="10" fill={T.black} />
        <path
          d="M44 44l2.5 2.5L52 41"
          stroke={T.white}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  if (type === "rexa")
    return (
      <svg {...s} viewBox="0 0 64 64" fill="none">
        <circle
          cx="32"
          cy="20"
          r="12"
          fill={T.gray100}
          stroke={T.gray300}
          strokeWidth="1.5"
        />
        <path
          d="M12 52c0-11.046 8.954-20 20-20s20 8.954 20 20"
          stroke={T.gray300}
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="20" r="7" fill={T.black} />
        <path
          d="M18 50c0-7.732 6.268-14 14-14s14 6.268 14 14"
          stroke={T.black}
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle
          cx="50"
          cy="14"
          r="10"
          fill={T.white}
          stroke={T.gray200}
          strokeWidth="1"
        />
        <path
          d="M46 14h8M50 10v8"
          stroke={T.black}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    );

  if (type === "done")
    return (
      <svg {...s} viewBox="0 0 64 64" fill="none">
        <circle cx="32" cy="32" r="28" fill={T.black} />
        <path
          d="M20 32l8 8 16-16"
          stroke={T.white}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );

  return null;
}

/* --- CheckRow ------------------------------------------------------------- */
function CheckRow({ head, sub, delay, visible }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.35s ease ${delay}ms, transform 0.35s ease ${delay}ms`,
      }}
    >
      {/* check circle */}
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: "50%",
          background: T.black,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M2.5 5.5l2 2 4-4"
            stroke="#fff"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 500,
            color: T.black,
            lineHeight: "1.3",
          }}
        >
          {head}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 13,
            color: T.gray500,
            lineHeight: "1.4",
          }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

/* --- Main component ------------------------------------------------------- */
const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [itemsVisible, setItemsVisible] = useState(false);
  const [bodyVisible, setBodyVisible] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const containerRef = useRef(null);

  const sessionState = (() => {
    try {
      const raw = sessionStorage.getItem("onboarding_access");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const ownerName =
    location.state?.ownerName || sessionState?.ownerName || "there";
  const companyName =
    location.state?.companyName || sessionState?.companyName || "your company";
  const planName = location.state?.planName || sessionState?.planName || "Subscription";

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const total = STEPS.length;

  useEffect(() => {
    const canOpen =
      location.state?.fromSubscriptionPurchase === true ||
      sessionState?.fromSubscriptionPurchase === true;

    if (!canOpen) {
      navigate("/register", { replace: true });
      return;
    }

    setIsAuthorized(true);
  }, [location.state, navigate, sessionState?.fromSubscriptionPurchase]);

  // stagger items on every step change
  useEffect(() => {
    setItemsVisible(false);
    const t = setTimeout(() => setItemsVisible(true), 200);
    return () => clearTimeout(t);
  }, [step]);

  const goTo = (next) => {
    if (next < 0 || next >= total) return;
    setBodyVisible(false);
    setItemsVisible(false);
    setTimeout(() => {
      setStep(next);
      setBodyVisible(true);
    }, 180);
  };

  /* Google Font injection */
  useEffect(() => {
    if (!document.getElementById("dm-sans-link")) {
      const link = document.createElement("link");
      link.id = "dm-sans-link";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  /* -- styles -- */
  const wrap = {
    fontFamily: T.font,
    minHeight: "100vh",
    background: T.white,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "0 16px",
  };

  const card = {
    width: "100%",
    maxWidth: 480,
  };

  // top meta row
  const meta = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 32,
  };

  // progress bar track
  const track = {
    display: "flex",
    gap: 4,
    flex: 1,
  };

  // body fade
  const body = {
    opacity: bodyVisible ? 1 : 0,
    transform: bodyVisible ? "translateY(0)" : "translateY(6px)",
    transition: "opacity 0.2s ease, transform 0.2s ease",
  };

  const titleStyle = {
    fontSize: 32,
    fontWeight: 600,
    color: T.black,
    letterSpacing: "-0.8px",
    lineHeight: 1.15,
    margin: "16px 0 12px",
    whiteSpace: "pre-line",
  };

  const subtitleStyle = {
    fontSize: 15,
    color: T.gray500,
    lineHeight: 1.65,
    margin: "0 0 32px",
    fontWeight: 400,
  };

  const divider = {
    height: 1,
    background: T.gray100,
    margin: "28px 0",
  };

  const footerRow = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 36,
  };

  const dotsRow = {
    display: "flex",
    gap: 5,
    alignItems: "center",
  };

  const btnRow = {
    display: "flex",
    gap: 8,
  };

  const btnBase = {
    height: 42,
    padding: "0 20px",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    fontFamily: T.font,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: 6,
    border: `1px solid ${T.gray200}`,
    background: T.white,
    color: T.gray700,
    transition: "background 0.12s, border-color 0.12s, opacity 0.12s",
    outline: "none",
    userSelect: "none",
  };

  const btnPrimary = {
    ...btnBase,
    background: T.black,
    color: T.white,
    border: `1px solid ${T.black}`,
    minWidth: 126,
    justifyContent: "center",
  };

  return (
    isAuthorized && (
    <div style={wrap}>
      {/* Google Fonts inline fallback */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');
        * { box-sizing: border-box; }
        button:disabled { opacity: 0.32 !important; cursor: default !important; }
        button:not(:disabled):hover { opacity: 0.85; }
        .ob-back:not(:disabled):hover { background: #eaf0fb !important; }
        .ob-primary:not(:disabled):hover { background: #17365f !important; }
        .ob-dot-btn:hover { background: #bccbe0 !important; }
      `}</style>

      <div style={card} ref={containerRef}>
        {/* -- Top meta -- */}
        <div style={meta}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Simple wordmark */}
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img src="./Ryzent.png" alt="" />
            </div>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: T.black,
                letterSpacing: "-0.3px",
              }}
            >
              Ryzent
            </span>
          </div>

          {/* Plan badge */}
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: T.gray500,
              background: T.gray100,
              borderRadius: 6,
              padding: "4px 10px",
              letterSpacing: "0.1px",
            }}
          >
            {planName} plan
          </span>
        </div>

        {/* -- Progress bar -- */}
        <div style={track}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                height: 2,
                borderRadius: 99,
                background: i <= step ? T.black : T.gray200,
                transition: "background 0.4s ease",
                cursor: "pointer",
              }}
              onClick={() => goTo(i)}
            />
          ))}
        </div>

        {/* -- Body -- */}
        <div style={{ ...body, paddingTop: 36 }}>
          {/* Illustration */}
          <Illustration type={current.illustration} size={56} />

          {/* Label */}
          <p
            style={{
              margin: "20px 0 0",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.9px",
              textTransform: "uppercase",
              color: T.gray400,
            }}
          >
            {current.label} - {String(step + 1).padStart(2, "0")} of{" "}
            {String(total).padStart(2, "0")}
          </p>

          {/* Title */}
          <h1 style={titleStyle}>{current.title}</h1>

          {/* Subtitle */}
          <p style={subtitleStyle}>{current.body}</p>

          {/* Divider */}
          <div style={divider} />

          {/* Check items */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {current.items.map((item, i) => (
              <CheckRow
                key={item.head}
                head={item.head}
                sub={item.sub}
                delay={i * 75}
                visible={itemsVisible}
              />
            ))}
          </div>
        </div>

        {/* -- Footer -- */}
        <div style={footerRow}>
          {/* Dot nav */}
          <div style={dotsRow}>
            {STEPS.map((_, i) => (
              <button
                key={i}
                className="ob-dot-btn"
                onClick={() => goTo(i)}
                style={{
                  width: i === step ? 20 : 6,
                  height: 6,
                  borderRadius: 99,
                  border: "none",
                  padding: 0,
                  background: i === step ? T.black : T.gray300,
                  cursor: "pointer",
                  transition: "width 0.3s ease, background 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Buttons */}
          <div style={btnRow}>
            <button
              className="ob-back"
              disabled={step === 0}
              onClick={() => goTo(step - 1)}
              style={btnBase}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M9 11L5 7l4-4"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            {isLast ? (
              <button
                className="ob-primary"
                onClick={() => {
                  sessionStorage.removeItem("onboarding_access");
                  navigate("/signin");
                }}
                style={btnPrimary}
              >
                Sign in
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="#fff"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            ) : (
              <button
                className="ob-primary"
                onClick={() => goTo(step + 1)}
                style={btnPrimary}
              >
                Continue
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M5 3l4 4-4 4"
                    stroke="#fff"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    )
  );
};

export default Onboarding;

