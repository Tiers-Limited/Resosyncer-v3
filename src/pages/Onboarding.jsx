import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Lottie from "lottie-react";

/* ─────────────────────────── TOKENS ─────────────────────────── */
const T = {
  font: `'Instrument Sans', system-ui, sans-serif`,
  primary: "#1e3ea2",
  primaryDark: "#16317f",
  primaryLight: "#e8eef9",
  primaryMid: "#3255c4",
  ink: "#17223d",
  gray50: "#f8faff",
  gray100: "#eaf0ff",
  gray200: "#d5def4",
  gray300: "#bac8ea",
  gray400: "#8d9dc5",
  gray500: "#6278a8",
  white: "#ffffff",
  success: "#17a34a",
  successLight: "#dcfce7",
};

/* ─────────────────────────── STEPS ──────────────────────────── */
const STEPS = [
  {
    id: "team",
    illustration: "team",
    label: "Collaborate",
    tag: "Team setup",
    title: "Add your whole\nteam to Ryzent.",
    body: "The best work happens together. Invite everyone, set roles, and keep your workspace aligned from day one.",
    accent: "#3255c4",
    items: [
      {
        head: "Instant team invites",
        sub: "Send invites in seconds directly from your workspace",
        icon: "send",
      },
      {
        head: "Granular role control",
        sub: "Owner, admin, member, and viewer level permissions",
        icon: "shield",
      },
      {
        head: "Enterprise-ready auth",
        sub: "Supports SSO and secure identity integrations",
        icon: "lock",
      },
    ],
  },
  {
    id: "projects",
    illustration: "projects",
    label: "Organize",
    tag: "Project boards",
    title: "Create your projects\non Ryzent.",
    body: "Structure work around outcomes with boards, lists, and timelines that adapt to your workflow.",
    accent: "#0e7aa8",
    items: [
      {
        head: "Board, list & timeline views",
        sub: "Use the best format for each project phase",
        icon: "layout",
      },
      {
        head: "Custom status workflows",
        sub: "Model your process exactly the way your team works",
        icon: "flow",
      },
      {
        head: "Real-time collaboration",
        sub: "Everyone sees updates instantly without refresh",
        icon: "zap",
      },
    ],
  },
  {
    id: "meetings",
    illustration: "meetings",
    label: "AI-powered",
    tag: "Smart meetings",
    title: "Run meetings with\nAI summaries.",
    body: "Capture key decisions automatically and convert action items into tracked tasks without manual follow-ups.",
    accent: "#6b21a8",
    items: [
      {
        head: "Auto summaries",
        sub: "Clear recap shared right after each meeting",
        icon: "doc",
      },
      {
        head: "Task extraction",
        sub: "Action points become assignable tasks in one click",
        icon: "check",
      },
      {
        head: "Searchable history",
        sub: "Find discussions and decisions anytime",
        icon: "search",
      },
    ],
  },
  {
    id: "rexa",
    illustration: "rexa",
    label: "Rexa AI",
    tag: "AI hiring",
    title: "Reduce manual hiring\nwith Rexa AI.",
    body: "Rexa automates candidate screening, scheduling, and follow-up so your team can focus on final decisions.",
    accent: "#b45309",
    items: [
      {
        head: "Smart screening",
        sub: "Shortlists candidates against your role criteria",
        icon: "filter",
      },
      {
        head: "Calendar-aware scheduling",
        sub: "Books interviews with minimal coordination",
        icon: "cal",
      },
      {
        head: "Automated follow-up",
        sub: "Keeps candidates informed at every stage",
        icon: "mail",
      },
    ],
  },
  {
    id: "done",
    illustration: "done",
    label: "All set",
    tag: "Launch ready",
    title: "You are ready\nto go.",
    body: "Your workspace is configured and ready. Sign in and start running your team on Ryzent.",
    accent: "#17a34a",
    items: [
      {
        head: "Workspace provisioned",
        sub: "Your company space is configured and secure",
        icon: "home",
      },
      {
        head: "Invites dispatched",
        sub: "Your team will receive onboarding invites shortly",
        icon: "send",
      },
      {
        head: "Ready to launch",
        sub: "Everything is prepared for day-one execution",
        icon: "rocket",
      },
    ],
  },
];

/* ─────────────────────── ICON COMPONENTS ────────────────────── */
function Icon({ name, size = 14, color = "currentColor" }) {
  const s = { width: size, height: size, display: "block", flexShrink: 0 };
  const p = {
    stroke: color,
    strokeWidth: 1.7,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    fill: "none",
  };
  const icons = {
    send: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M14 2L2 6.5l5 2M14 2L9.5 14l-2.5-5.5M14 2L7 9" />
      </svg>
    ),
    shield: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M8 2L3 4v4c0 3 2.5 5 5 6 2.5-1 5-3 5-6V4L8 2z" />
      </svg>
    ),
    lock: (
      <svg {...s} viewBox="0 0 16 16">
        <rect {...p} x="3" y="7" width="10" height="7" rx="1.5" />
        <path {...p} d="M5 7V5a3 3 0 016 0v2" />
      </svg>
    ),
    layout: (
      <svg {...s} viewBox="0 0 16 16">
        <rect {...p} x="2" y="2" width="12" height="12" rx="2" />
        <path {...p} d="M2 6h12M7 6v8" />
      </svg>
    ),
    flow: (
      <svg {...s} viewBox="0 0 16 16">
        <circle {...p} cx="3" cy="3" r="1.5" />
        <circle {...p} cx="13" cy="3" r="1.5" />
        <circle {...p} cx="8" cy="13" r="1.5" />
        <path {...p} d="M4.5 3h7M13 4.5v5M3 4.5v5M4 9.5l4 3 4-3" />
      </svg>
    ),
    zap: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M9 2L4 9h5l-2 5 7-7H9l1-5" />
      </svg>
    ),
    doc: (
      <svg {...s} viewBox="0 0 16 16">
        <path
          {...p}
          d="M10 2H4a1 1 0 00-1 1v10a1 1 0 001 1h8a1 1 0 001-1V5L10 2z"
        />
        <path {...p} d="M10 2v3h3M5 8h6M5 11h4" />
      </svg>
    ),
    check: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M2.5 8l3.5 3.5 7-7" />
      </svg>
    ),
    search: (
      <svg {...s} viewBox="0 0 16 16">
        <circle {...p} cx="7" cy="7" r="4" />
        <path {...p} d="M10 10l3 3" />
      </svg>
    ),
    filter: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M2 4h12M5 8h6M7 12h2" />
      </svg>
    ),
    cal: (
      <svg {...s} viewBox="0 0 16 16">
        <rect {...p} x="2" y="3" width="12" height="11" rx="1.5" />
        <path {...p} d="M5 2v2M11 2v2M2 7h12" />
      </svg>
    ),
    mail: (
      <svg {...s} viewBox="0 0 16 16">
        <rect {...p} x="2" y="4" width="12" height="9" rx="1.5" />
        <path {...p} d="M2 5l6 4.5L14 5" />
      </svg>
    ),
    home: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M2 8L8 3l6 5M4 7v6h3v-3h2v3h3V7" />
      </svg>
    ),
    rocket: (
      <svg {...s} viewBox="0 0 16 16">
        <path {...p} d="M8 2c0 0 4 2 4 7H4c0-5 4-7 4-7z" />
        <path {...p} d="M5 9l-2 4h10l-2-4" />
        <circle fill={color} stroke="none" cx="8" cy="6" r="1" />
      </svg>
    ),
    arrow_right: (
      <svg {...s} viewBox="0 0 14 14">
        <path {...p} strokeWidth="1.8" d="M3 7h8M8 4l3 3-3 3" />
      </svg>
    ),
    arrow_left: (
      <svg {...s} viewBox="0 0 14 14">
        <path {...p} strokeWidth="1.8" d="M11 7H3M6 4L3 7l3 3" />
      </svg>
    ),
  };
  return icons[name] || null;
}

/* ──────────────────── RICH ILLUSTRATIONS ────────────────────── */
function IllustrationTeam() {
  return (
    <svg
      width="100%"
      viewBox="0 0 380 300"
      fill="none"
      style={{ maxWidth: 380 }}
    >
      {/* Background circles decoration */}
      <circle
        cx="190"
        cy="150"
        r="120"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <circle
        cx="190"
        cy="150"
        r="85"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />

      {/* Central hub */}
      <circle
        cx="190"
        cy="150"
        r="28"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1.5"
      />
      <text
        x="190"
        y="155"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontFamily="Instrument Sans, sans-serif"
        fontWeight="600"
      >
        TEAM
      </text>

      {/* Avatar: top */}
      <circle
        cx="190"
        cy="52"
        r="26"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="190" cy="48" r="9" fill="rgba(255,255,255,0.7)" />
      <path
        d="M174 68c0-8.8 7.2-14 16-14s16 5.2 16 14"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="190"
        y1="78"
        x2="190"
        y2="122"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Avatar: right */}
      <circle
        cx="302"
        cy="110"
        r="26"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="302" cy="106" r="9" fill="rgba(255,255,255,0.7)" />
      <path
        d="M286 126c0-8.8 7.2-14 16-14s16 5.2 16 14"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="280"
        y1="118"
        x2="218"
        y2="143"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Avatar: bottom-right */}
      <circle
        cx="274"
        cy="220"
        r="26"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="274" cy="216" r="9" fill="rgba(255,255,255,0.7)" />
      <path
        d="M258 236c0-8.8 7.2-14 16-14s16 5.2 16 14"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="257"
        y1="207"
        x2="211"
        y2="163"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Avatar: bottom-left */}
      <circle
        cx="106"
        cy="220"
        r="26"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="106" cy="216" r="9" fill="rgba(255,255,255,0.7)" />
      <path
        d="M90 236c0-8.8 7.2-14 16-14s16 5.2 16 14"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="124"
        y1="207"
        x2="168"
        y2="163"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Avatar: left */}
      <circle
        cx="78"
        cy="110"
        r="26"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.5"
      />
      <circle cx="78" cy="106" r="9" fill="rgba(255,255,255,0.7)" />
      <path
        d="M62 126c0-8.8 7.2-14 16-14s16 5.2 16 14"
        stroke="rgba(255,255,255,0.7)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <line
        x1="100"
        y1="118"
        x2="162"
        y2="143"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />

      {/* Invite badge */}
      <rect
        x="126"
        y="238"
        width="128"
        height="34"
        rx="10"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <circle cx="147" cy="255" r="8" fill="rgba(255,255,255,0.25)" />
      <path
        d="M143 255l2 2 4-4"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="160"
        y="249"
        width="50"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.4)"
      />
      <rect
        x="160"
        y="257"
        width="36"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="218"
        y="248"
        width="28"
        height="14"
        rx="5"
        fill="rgba(255,255,255,0.25)"
      />
      <text
        x="232"
        y="258"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontFamily="Instrument Sans, sans-serif"
      >
        Invite
      </text>
    </svg>
  );
}

function IllustrationProjects() {
  return (
    <svg
      width="100%"
      viewBox="0 0 380 300"
      fill="none"
      style={{ maxWidth: 380 }}
    >
      {/* Board background */}
      <rect
        x="20"
        y="20"
        width="340"
        height="260"
        rx="16"
        fill="rgba(255,255,255,0.07)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />

      {/* Column: To Do */}
      <rect
        x="36"
        y="46"
        width="96"
        height="16"
        rx="5"
        fill="rgba(255,255,255,0.12)"
      />
      <rect
        x="42"
        y="50"
        width="44"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="90"
        y="50"
        width="16"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.3)"
      />

      <rect
        x="36"
        y="70"
        width="96"
        height="52"
        rx="8"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <rect
        x="46"
        y="80"
        width="56"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.6)"
      />
      <rect
        x="46"
        y="89"
        width="72"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="46"
        y="97"
        width="60"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <circle cx="112" cy="108" r="7" fill="rgba(255,255,255,0.2)" />
      <circle cx="100" cy="108" r="7" fill="rgba(255,255,255,0.25)" />

      <rect
        x="36"
        y="130"
        width="96"
        height="48"
        rx="8"
        fill="rgba(255,255,255,0.09)"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
      />
      <rect
        x="46"
        y="140"
        width="42"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.45)"
      />
      <rect
        x="46"
        y="149"
        width="68"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="46"
        y="157"
        width="52"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.15)"
      />

      {/* Column: In Progress */}
      <rect
        x="142"
        y="46"
        width="96"
        height="16"
        rx="5"
        fill="rgba(255,255,255,0.12)"
      />
      <rect
        x="148"
        y="50"
        width="58"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.5)"
      />

      <rect
        x="142"
        y="70"
        width="96"
        height="64"
        rx="8"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.28)"
        strokeWidth="1"
      />
      <rect
        x="152"
        y="80"
        width="52"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.8)"
      />
      <rect
        x="152"
        y="89"
        width="74"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="152"
        y="97"
        width="58"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.28)"
      />
      {/* Progress bar */}
      <rect
        x="152"
        y="106"
        width="76"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.15)"
      />
      <rect
        x="152"
        y="106"
        width="50"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.55)"
      />
      <circle cx="218" cy="120" r="7" fill="rgba(255,255,255,0.3)" />
      <circle cx="206" cy="120" r="7" fill="rgba(255,255,255,0.35)" />

      <rect
        x="142"
        y="142"
        width="96"
        height="48"
        rx="8"
        fill="rgba(255,255,255,0.11)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <rect
        x="152"
        y="152"
        width="48"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="152"
        y="161"
        width="70"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.22)"
      />
      <rect
        x="152"
        y="169"
        width="55"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.17)"
      />

      {/* Column: Done */}
      <rect
        x="248"
        y="46"
        width="96"
        height="16"
        rx="5"
        fill="rgba(255,255,255,0.12)"
      />
      <rect
        x="254"
        y="50"
        width="32"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.5)"
      />

      <rect
        x="248"
        y="70"
        width="96"
        height="52"
        rx="8"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.13)"
        strokeWidth="1"
      />
      <circle
        cx="262"
        cy="94"
        r="7"
        fill="rgba(23,163,74,0.5)"
        stroke="rgba(23,163,74,0.7)"
        strokeWidth="1"
      />
      <path
        d="M258 94l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="274"
        y="82"
        width="52"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="274"
        y="91"
        width="60"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="274"
        y="99"
        width="44"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.15)"
      />

      <rect
        x="248"
        y="130"
        width="96"
        height="52"
        rx="8"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />
      <circle
        cx="262"
        cy="154"
        r="7"
        fill="rgba(23,163,74,0.5)"
        stroke="rgba(23,163,74,0.7)"
        strokeWidth="1"
      />
      <path
        d="M258 154l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="274"
        y="142"
        width="48"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.45)"
      />
      <rect
        x="274"
        y="151"
        width="60"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.18)"
      />
      <rect
        x="274"
        y="159"
        width="38"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.13)"
      />

      {/* Bottom label */}
      <rect
        x="100"
        y="208"
        width="180"
        height="50"
        rx="12"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      <rect
        x="116"
        y="220"
        width="60"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.55)"
      />
      <rect
        x="116"
        y="229"
        width="100"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="116"
        y="237"
        width="76"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.18)"
      />
      <rect
        x="236"
        y="218"
        width="28"
        height="22"
        rx="6"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M246 226l3 3 -3 3"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IllustrationMeetings() {
  return (
    <svg
      width="100%"
      viewBox="0 0 380 300"
      fill="none"
      style={{ maxWidth: 380 }}
    >
      {/* Meeting card */}
      <rect
        x="30"
        y="24"
        width="240"
        height="180"
        rx="16"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1"
      />
      {/* Header */}
      <rect
        x="30"
        y="24"
        width="240"
        height="50"
        rx="16"
        fill="rgba(255,255,255,0.12)"
      />
      <rect
        x="30"
        y="56"
        width="240"
        height="18"
        fill="rgba(255,255,255,0.12)"
      />
      <circle cx="54" cy="49" r="12" fill="rgba(255,255,255,0.2)" />
      <path
        d="M50 49l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="72"
        y="38"
        width="72"
        height="6"
        rx="3"
        fill="rgba(255,255,255,0.7)"
      />
      <rect
        x="72"
        y="48"
        width="50"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.3)"
      />
      {/* Lines */}
      <rect
        x="46"
        y="84"
        width="188"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.4)"
      />
      <rect
        x="46"
        y="94"
        width="160"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="46"
        y="103"
        width="172"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="46"
        y="120"
        width="155"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="46"
        y="129"
        width="130"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="46"
        y="138"
        width="148"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.15)"
      />
      {/* Action items indicator */}
      <rect
        x="46"
        y="155"
        width="115"
        height="28"
        rx="7"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <circle cx="60" cy="169" r="6" fill="rgba(23,163,74,0.5)" />
      <path
        d="M56.5 169l2 2 4-4"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="72"
        y="164"
        width="42"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="72"
        y="171"
        width="30"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.25)"
      />

      {/* AI sparkle badge */}
      <rect
        x="196"
        y="152"
        width="78"
        height="32"
        rx="10"
        fill="rgba(255,255,255,0.18)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <text
        x="210"
        y="171"
        fill="white"
        fontSize="10"
        fontFamily="Instrument Sans, sans-serif"
        fontWeight="600"
      >
        ✦ AI
      </text>
      <rect
        x="228"
        y="163"
        width="36"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.45)"
      />
      <rect
        x="228"
        y="170"
        width="26"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.25)"
      />

      {/* Floating transcript panel */}
      <rect
        x="210"
        y="52"
        width="150"
        height="140"
        rx="14"
        fill="rgba(22,49,127,0.9)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect
        x="225"
        y="68"
        width="80"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.55)"
      />
      <rect
        x="225"
        y="78"
        width="118"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="225"
        y="86"
        width="100"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="225"
        y="94"
        width="110"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.17)"
      />
      <rect
        x="225"
        y="108"
        width="60"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.55)"
      />
      <rect
        x="225"
        y="118"
        width="115"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="225"
        y="126"
        width="90"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />
      <rect
        x="225"
        y="134"
        width="105"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.17)"
      />
      {/* Summary badge */}
      <rect
        x="225"
        y="148"
        width="120"
        height="30"
        rx="8"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect
        x="233"
        y="157"
        width="60"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="233"
        y="164"
        width="44"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="307"
        y="152"
        width="30"
        height="20"
        rx="5"
        fill="rgba(255,255,255,0.18)"
      />
      <path
        d="M318 160l3 3-3 3"
        stroke="white"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Avatars row */}
      <circle
        cx="245"
        cy="232"
        r="18"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <circle cx="245" cy="228" r="6" fill="rgba(255,255,255,0.6)" />
      <path
        d="M234 244c0-6.1 5-10 11-10s11 3.9 11 10"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="280"
        cy="232"
        r="18"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <circle cx="280" cy="228" r="6" fill="rgba(255,255,255,0.6)" />
      <path
        d="M269 244c0-6.1 5-10 11-10s11 3.9 11 10"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle
        cx="315"
        cy="232"
        r="18"
        fill="rgba(255,255,255,0.15)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1"
      />
      <circle cx="315" cy="228" r="6" fill="rgba(255,255,255,0.6)" />
      <path
        d="M304 244c0-6.1 5-10 11-10s11 3.9 11 10"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IllustrationRexa() {
  return (
    <svg
      width="100%"
      viewBox="0 0 380 300"
      fill="none"
      style={{ maxWidth: 380 }}
    >
      {/* Pipeline */}
      <rect
        x="20"
        y="100"
        width="340"
        height="100"
        rx="16"
        fill="rgba(255,255,255,0.06)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="1"
      />

      {/* Stage 1: Applications */}
      <rect
        x="36"
        y="115"
        width="72"
        height="70"
        rx="10"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect
        x="46"
        y="125"
        width="40"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle
            cx="52"
            cy={141 + i * 13}
            r="6"
            fill="rgba(255,255,255,0.2)"
          />
          <rect
            x="63"
            y={138 + i * 13}
            width="32"
            height="3.5"
            rx="1.5"
            fill="rgba(255,255,255,0.3)"
          />
        </g>
      ))}

      {/* Arrow */}
      <path d="M115 150h20" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path
        d="M131 145l5 5-5 5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stage 2: Screening (highlighted) */}
      <rect
        x="142"
        y="110"
        width="82"
        height="80"
        rx="10"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(255,255,255,0.4)"
        strokeWidth="1.5"
      />
      {/* AI badge */}
      <rect
        x="152"
        y="120"
        width="40"
        height="15"
        rx="5"
        fill="rgba(255,255,255,0.25)"
      />
      <text
        x="172"
        y="131"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontFamily="Instrument Sans, sans-serif"
        fontWeight="700"
      >
        Rexa AI
      </text>
      <rect
        x="152"
        y="140"
        width="62"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.5)"
      />
      <rect
        x="152"
        y="148"
        width="50"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.3)"
      />
      <rect
        x="152"
        y="155"
        width="58"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.25)"
      />
      <circle cx="174" cy="170" r="9" fill="rgba(23,163,74,0.6)" />
      <path
        d="M169.5 170l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Arrow */}
      <path d="M231 150h20" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
      <path
        d="M247 145l5 5-5 5"
        stroke="rgba(255,255,255,0.35)"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Stage 3: Shortlisted */}
      <rect
        x="258"
        y="115"
        width="82"
        height="70"
        rx="10"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.16)"
        strokeWidth="1"
      />
      <rect
        x="268"
        y="125"
        width="44"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.45)"
      />
      {[0, 1].map((i) => (
        <g key={i}>
          <circle
            cx="272"
            cy={141 + i * 14}
            r="7"
            fill="rgba(23,163,74,0.4)"
            stroke="rgba(23,163,74,0.7)"
            strokeWidth="1"
          />
          <path
            d={`M268.5 ${141 + i * 14}l2 2 4-4`}
            stroke="white"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect
            x="284"
            y={138 + i * 14}
            width="36"
            height="3.5"
            rx="1.5"
            fill="rgba(255,255,255,0.35)"
          />
        </g>
      ))}

      {/* Calendar card floating above */}
      <rect
        x="58"
        y="30"
        width="100"
        height="60"
        rx="12"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <rect
        x="58"
        y="30"
        width="100"
        height="22"
        rx="12"
        fill="rgba(255,255,255,0.15)"
      />
      <rect
        x="58"
        y="42"
        width="100"
        height="10"
        fill="rgba(255,255,255,0.15)"
      />
      <rect
        x="68"
        y="35"
        width="48"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.6)"
      />
      <rect
        x="68"
        y="57"
        width="28"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="68"
        y="65"
        width="60"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.25)"
      />
      <rect
        x="68"
        y="73"
        width="44"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.2)"
      />

      {/* Candidate card floating */}
      <rect
        x="222"
        y="22"
        width="140"
        height="68"
        rx="12"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <circle cx="248" cy="56" r="18" fill="rgba(255,255,255,0.15)" />
      <circle cx="248" cy="52" r="7" fill="rgba(255,255,255,0.6)" />
      <path
        d="M237 68c0-6.1 5-10 11-10s11 3.9 11 10"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <rect
        x="272"
        y="32"
        width="68"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.6)"
      />
      <rect
        x="272"
        y="42"
        width="52"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.3)"
      />
      <rect
        x="272"
        y="56"
        width="40"
        height="14"
        rx="5"
        fill="rgba(23,163,74,0.4)"
        stroke="rgba(23,163,74,0.6)"
        strokeWidth="1"
      />
      <text
        x="292"
        y="66"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontFamily="Instrument Sans, sans-serif"
      >
        Match
      </text>

      {/* Percentage indicator */}
      <circle
        cx="190"
        cy="248"
        r="30"
        fill="rgba(255,255,255,0.08)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <circle
        cx="190"
        cy="248"
        r="24"
        fill="none"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth="4"
      />
      <circle
        cx="190"
        cy="248"
        r="24"
        fill="none"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="4"
        strokeDasharray="108 43"
        strokeLinecap="round"
        transform="rotate(-90 190 248)"
      />
      <text
        x="190"
        y="252"
        textAnchor="middle"
        fill="white"
        fontSize="11"
        fontFamily="Instrument Sans, sans-serif"
        fontWeight="700"
      >
        71%
      </text>
      <rect
        x="232"
        y="238"
        width="94"
        height="22"
        rx="7"
        fill="rgba(255,255,255,0.1)"
        stroke="rgba(255,255,255,0.15)"
        strokeWidth="1"
      />
      <rect
        x="242"
        y="243"
        width="50"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.4)"
      />
      <rect
        x="242"
        y="251"
        width="36"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.22)"
      />
    </svg>
  );
}

function IllustrationDone() {
  return (
    <svg
      width="100%"
      viewBox="0 0 380 300"
      fill="none"
      style={{ maxWidth: 380 }}
    >
      {/* Celebration circles */}
      <circle
        cx="190"
        cy="150"
        r="110"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="1"
      />
      <circle
        cx="190"
        cy="150"
        r="80"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
      />
      <circle
        cx="190"
        cy="150"
        r="52"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.25)"
        strokeWidth="1.5"
      />

      {/* Big checkmark */}
      <circle
        cx="190"
        cy="150"
        r="36"
        fill="rgba(23,163,74,0.25)"
        stroke="rgba(23,163,74,0.5)"
        strokeWidth="2"
      />
      <path
        d="M174 150l10 10 22-22"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Floating confetti-like items */}
      <rect
        x="60"
        y="70"
        width="36"
        height="36"
        rx="10"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <circle cx="78" cy="84" r="6" fill="rgba(255,255,255,0.4)" />
      <rect
        x="64"
        y="92"
        width="28"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="64"
        y="98"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.2)"
      />

      <rect
        x="284"
        y="70"
        width="36"
        height="36"
        rx="10"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <path
        d="M294 85l4 4 8-8"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="290"
        y="95"
        width="28"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="290"
        y="101"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.2)"
      />

      <rect
        x="60"
        y="194"
        width="36"
        height="36"
        rx="10"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <circle cx="72" cy="206" r="4" fill="rgba(255,255,255,0.4)" />
      <circle cx="84" cy="206" r="4" fill="rgba(255,255,255,0.25)" />
      <rect
        x="64"
        y="214"
        width="28"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="64"
        y="220"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.2)"
      />

      <rect
        x="284"
        y="194"
        width="36"
        height="36"
        rx="10"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1"
      />
      <path
        d="M296 212l2 2 10-10"
        stroke="rgba(23,163,74,0.8)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="290"
        y="220"
        width="28"
        height="3.5"
        rx="1.5"
        fill="rgba(255,255,255,0.35)"
      />
      <rect
        x="290"
        y="226"
        width="20"
        height="3"
        rx="1.5"
        fill="rgba(255,255,255,0.2)"
      />

      {/* Sparkle dots */}
      {[
        [130, 60],
        [250, 60],
        [100, 130],
        [280, 130],
        [100, 185],
        [280, 185],
        [130, 250],
        [250, 250],
      ].map(([cx, cy], i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={i % 2 === 0 ? 3 : 2}
          fill="rgba(255,255,255,0.25)"
        />
      ))}

      {/* Bottom banner */}
      <rect
        x="80"
        y="242"
        width="220"
        height="40"
        rx="12"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1"
      />
      <circle
        cx="102"
        cy="262"
        r="10"
        fill="rgba(23,163,74,0.3)"
        stroke="rgba(23,163,74,0.5)"
        strokeWidth="1"
      />
      <path
        d="M98 262l2.5 2.5 5-5"
        stroke="white"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x="120"
        y="255"
        width="70"
        height="5"
        rx="2.5"
        fill="rgba(255,255,255,0.6)"
      />
      <rect
        x="120"
        y="263"
        width="120"
        height="4"
        rx="2"
        fill="rgba(255,255,255,0.28)"
      />
      <rect
        x="258"
        y="254"
        width="32"
        height="16"
        rx="6"
        fill="rgba(255,255,255,0.2)"
        stroke="rgba(255,255,255,0.3)"
        strokeWidth="1"
      />
      <text
        x="274"
        y="265"
        textAnchor="middle"
        fill="white"
        fontSize="8"
        fontFamily="Instrument Sans, sans-serif"
        fontWeight="600"
      >
        Go!
      </text>
    </svg>
  );
}

function RightIllustration({
  stepId,
  teamLottie,
  pmLottie,
  aiMeetingsLottie,
  agenticAiLottie,
  visible,
}) {
  const content = (() => {
    if (stepId === "team" && teamLottie)
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={teamLottie}
            loop
            autoplay
            style={{ width: "80%", maxWidth: 520, minWidth: 260 }}
          />
        </div>
      );
    if (stepId === "projects" && pmLottie)
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={pmLottie}
            loop
            autoplay
            style={{ width: "80%", maxWidth: 520, minWidth: 260 }}
          />
        </div>
      );
    if (stepId === "meetings" && aiMeetingsLottie)
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={aiMeetingsLottie}
            loop
            autoplay
            style={{ width: "80%", maxWidth: 520, minWidth: 260 }}
          />
        </div>
      );
    if (stepId === "rexa" && agenticAiLottie)
      return (
        <div
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lottie
            animationData={agenticAiLottie}
            loop
            autoplay
            style={{ width: "80%", maxWidth: 520, minWidth: 260 }}
          />
        </div>
      );
    if (stepId === "team") return <IllustrationTeam />;
    if (stepId === "projects") return <IllustrationProjects />;
    if (stepId === "meetings") return <IllustrationMeetings />;
    if (stepId === "rexa") return <IllustrationRexa />;
    if (stepId === "done") return <IllustrationDone />;
    return null;
  })();

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "scale(1) translateY(0)"
          : "scale(0.97) translateY(8px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
      }}
    >
      {content}
    </div>
  );
}

/* ──────────────────── CHECK ROW ────────────────────── */
function CheckRow({ head, sub, icon, delay, visible }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(10px)",
        transition: `opacity 0.38s ease ${delay}ms, transform 0.38s ease ${delay}ms`,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: T.successLight,
          border: `1px solid rgba(23,163,74,0.2)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon name={icon} size={15} color={T.success} />
      </div>
      <div style={{ paddingTop: 2 }}>
        <p
          style={{
            margin: 0,
            fontSize: 15,
            fontWeight: 600,
            color: T.ink,
            lineHeight: 1.3,
          }}
        >
          {head}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 13.5,
            color: T.gray500,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </p>
      </div>
    </div>
  );
}

/* ──────────────────── MAIN COMPONENT ────────────────────── */
const Onboarding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(0);
  const [itemsVisible, setItemsVisible] = useState(false);
  const [bodyVisible, setBodyVisible] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [teamLottie, setTeamLottie] = useState(null);
  const [pmLottie, setPmLottie] = useState(null);
  const [aiMeetingsLottie, setAiMeetingsLottie] = useState(null);
  const [agenticAiLottie, setAgenticAiLottie] = useState(null);
  const [panelVisible, setPanelVisible] = useState(true);

  const sessionState = (() => {
    try {
      const raw = sessionStorage.getItem("onboarding_access");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  const planName =
    location.state?.planName || sessionState?.planName || "Subscription";
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

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

  useEffect(() => {
    setItemsVisible(false);
    const t = setTimeout(() => setItemsVisible(true), 230);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (!document.getElementById("instrument-sans-link")) {
      const link = document.createElement("link");
      link.id = "instrument-sans-link";
      link.rel = "stylesheet";
      link.href =
        "https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap";
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.any([
      fetch("/Inviteteam.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/inviteteam.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then((d) => {
        if (mounted && d) setTeamLottie(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.any([
      fetch("/AIMeetings.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/aimeetings.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then((d) => {
        if (mounted && d) setAiMeetingsLottie(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.any([
      fetch("/agenticAI.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/agenticai.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then((d) => {
        if (mounted && d) setAgenticAiLottie(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    Promise.any([
      fetch("/pm.json").then((r) => (r.ok ? r.json() : null)),
      fetch("/PM.json").then((r) => (r.ok ? r.json() : null)),
    ])
      .then((d) => {
        if (mounted && d) setPmLottie(d);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const goTo = (next) => {
    if (next < 0 || next >= STEPS.length) return;
    setBodyVisible(false);
    setItemsVisible(false);
    setPanelVisible(false);
    setTimeout(() => {
      setStep(next);
      setBodyVisible(true);
      setPanelVisible(true);
    }, 200);
  };

  if (!isAuthorized) return null;

  /* gradient per step */
  const gradients = [
    "linear-gradient(145deg, #1e3ea2 0%, #0f2266 100%)",
    "linear-gradient(145deg, #0e7aa8 0%, #0a5a7e 100%)",
    "linear-gradient(145deg, #5b21b6 0%, #3b1272 100%)",
    "linear-gradient(145deg, #92400e 0%, #6b2d0a 100%)",
    "linear-gradient(145deg, #166534 0%, #0e4423 100%)",
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        fontFamily: T.font,
        background: T.gray50,
        display: "flex",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Sans:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; }
        .ob-nav-btn { transition: all 0.18s ease; }
        .ob-nav-btn:hover { transform: scale(1.08); }
        .ob-primary-btn { transition: all 0.18s ease; }
        .ob-primary-btn:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(30,62,162,0.28); }
        .ob-primary-btn:active { transform: translateY(0); box-shadow: none; }
        .ob-back-btn { transition: all 0.18s ease; }
        .ob-back-btn:hover { background: ${T.gray100} !important; border-color: ${T.gray300} !important; }
        .ob-dot-btn { transition: all 0.28s cubic-bezier(.4,0,.2,1); }
        .ob-dot-btn:hover { opacity: 0.7; }
        .ob-step-click { transition: all 0.18s ease; cursor: pointer; }
        .ob-step-click:hover { opacity: 0.8; transform: translateY(-1px); }

        /* Left sidebar */
        .ob-sidebar {
          width: 320px;
          min-height: 100vh;
          flex-shrink: 0;
          background: ${T.white};
          border-right: 1px solid ${T.gray200};
          display: flex;
          flex-direction: column;
          padding: 32px 28px;
          position: relative;
          overflow: hidden;
        }
        .ob-main-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .ob-top-bar {
          height: 64px;
          background: ${T.white};
          border-bottom: 1px solid ${T.gray200};
          display: flex;
          align-items: center;
          padding: 0 40px;
          flex-shrink: 0;
        }
        .ob-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1.1fr;
          gap: 0;
          overflow: hidden;
        }
        .ob-left-content {
          padding: 44px 40px 40px;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
        }
        .ob-right-panel {
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          padding: 40px;
          min-height: 500px;
        }

        @media (max-width: 1100px) {
          .ob-sidebar { width: 260px; padding: 24px 20px; }
          .ob-content { grid-template-columns: 1fr; }
          .ob-right-panel { display: none; }
        }
        @media (max-width: 720px) {
          .ob-sidebar { display: none; }
          .ob-left-content { padding: 28px 24px; }
          .ob-top-bar { padding: 0 24px; }
        }
      `}</style>

      {/* ── SIDEBAR ── */}
      <aside className="ob-sidebar">
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 40,
          }}
        >
          <img
            src="./Ryzent.png"
            alt="Ryzent"
            style={{ width: 32, height: 32, borderRadius: 9 }}
          />
          <span
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: T.ink,
              letterSpacing: "-0.3px",
            }}
          >
            Ryzent
          </span>
        </div>

        {/* Step list */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}
        >
          <p
            style={{
              margin: "0 0 14px",
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.8px",
              color: T.gray400,
            }}
          >
            Setup progress
          </p>
          {STEPS.map((s, i) => {
            const isDone = i < step;
            const isCurrent = i === step;
            return (
              <button
                key={s.id}
                className="ob-step-click"
                onClick={() => goTo(i)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "none",
                  background: isCurrent ? T.primaryLight : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                  width: "100%",
                  fontFamily: T.font,
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: isDone
                      ? T.primary
                      : isCurrent
                        ? T.primary
                        : T.gray200,
                    color: T.white,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    flexShrink: 0,
                    transition: "all 0.2s ease",
                  }}
                >
                  {isDone ? (
                    <Icon name="check" size={12} color={T.white} />
                  ) : (
                    <span style={{ color: isCurrent ? T.white : T.gray500 }}>
                      {i + 1}
                    </span>
                  )}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13.5,
                      fontWeight: isCurrent ? 600 : 500,
                      color: isCurrent ? T.primary : isDone ? T.ink : T.gray500,
                      lineHeight: 1.2,
                    }}
                  >
                    {s.label}
                  </p>
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: 11.5,
                      color: T.gray400,
                    }}
                  >
                    {s.tag}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom plan badge */}
        <div
          style={{
            marginTop: 24,
            padding: "14px 16px",
            borderRadius: 12,
            background: T.gray100,
            border: `1px solid ${T.gray200}`,
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: T.primary,
            }}
          >
            {planName} plan
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: T.gray500 }}>
            Workspace setup in progress
          </p>
        </div>

        {/* Background decoration */}
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: -60,
            width: 180,
            height: 180,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${T.primaryLight} 0%, transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      </aside>

      {/* ── MAIN AREA ── */}
      <div className="ob-main-area">
        {/* Top bar */}
        <div className="ob-top-bar">
          {/* Progress bar */}
          <div
            style={{ flex: 1, display: "flex", alignItems: "center", gap: 10 }}
          >
            <div
              style={{
                flex: 1,
                height: 4,
                background: T.gray200,
                borderRadius: 99,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${((step + 1) / STEPS.length) * 100}%`,
                  background: `linear-gradient(90deg, ${T.primary}, ${T.primaryMid})`,
                  borderRadius: 99,
                  transition: "width 0.4s cubic-bezier(.4,0,.2,1)",
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: T.gray500,
                whiteSpace: "nowrap",
              }}
            >
              {step + 1} / {STEPS.length}
            </span>
          </div>
        </div>

        {/* Content grid */}
        <div className="ob-content">
          {/* ── LEFT: Text content ── */}
          <div className="ob-left-content">
            <div
              style={{
                opacity: bodyVisible ? 1 : 0,
                transform: bodyVisible ? "translateY(0)" : "translateY(8px)",
                transition: "opacity 0.22s ease, transform 0.22s ease",
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              {/* Tag */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
                  borderRadius: 99,
                  background: T.primaryLight,
                  border: `1px solid ${T.gray200}`,
                  alignSelf: "flex-start",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.primary,
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: T.primary,
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                  }}
                >
                  Step {step + 1} · {current.label}
                </span>
              </div>

              {/* Title */}
              <h1
                style={{
                  margin: "0 0 16px",
                  color: T.ink,
                  fontSize: 46,
                  lineHeight: 1.06,
                  letterSpacing: "-1.6px",
                  fontWeight: 700,
                  whiteSpace: "pre-line",
                }}
              >
                {current.title}
              </h1>

              {/* Body */}
              <p
                style={{
                  margin: "0 0 28px",
                  color: T.gray500,
                  fontSize: 17,
                  lineHeight: 1.6,
                  maxWidth: 440,
                }}
              >
                {current.body}
              </p>

              {/* Divider */}
              <div
                style={{ height: 1, background: T.gray200, marginBottom: 24 }}
              />

              {/* Feature items */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                  flex: 1,
                }}
              >
                {current.items.map((item, i) => (
                  <CheckRow
                    key={item.head}
                    head={item.head}
                    sub={item.sub}
                    icon={item.icon}
                    delay={i * 80}
                    visible={itemsVisible}
                  />
                ))}
              </div>

              {/* Footer navigation */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginTop: 36,
                  paddingTop: 24,
                  borderTop: `1px solid ${T.gray200}`,
                }}
              >
                {/* Dot indicators */}
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      className="ob-dot-btn"
                      onClick={() => goTo(i)}
                      style={{
                        width: i === step ? 24 : 7,
                        height: 7,
                        borderRadius: 99,
                        border: "none",
                        padding: 0,
                        background:
                          i === step
                            ? T.primary
                            : i < step
                              ? T.gray300
                              : T.gray200,
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>

                {/* Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="ob-back-btn"
                    disabled={step === 0}
                    onClick={() => goTo(step - 1)}
                    style={{
                      height: 44,
                      padding: "0 18px",
                      borderRadius: 11,
                      border: `1px solid ${T.gray200}`,
                      background: T.white,
                      color: T.gray500,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: T.font,
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      cursor: step === 0 ? "default" : "pointer",
                      opacity: step === 0 ? 0.3 : 1,
                    }}
                  >
                    <Icon name="arrow_left" size={14} color="currentColor" />
                    Back
                  </button>

                  <button
                    className="ob-primary-btn"
                    onClick={() => {
                      if (isLast) {
                        sessionStorage.removeItem("onboarding_access");
                        navigate("/dashboard", { replace: true });
                        return;
                      }
                      goTo(step + 1);
                    }}
                    style={{
                      height: 44,
                      minWidth: 148,
                      padding: "0 22px",
                      borderRadius: 11,
                      border: "none",
                      background: `linear-gradient(135deg, ${T.primaryMid} 0%, ${T.primary} 100%)`,
                      color: T.white,
                      fontSize: 14,
                      fontWeight: 600,
                      fontFamily: T.font,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {isLast ? "Go to Dashboard" : "Continue"}
                    <Icon name="arrow_right" size={14} color="white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: Illustration panel ── */}
          <div
            className="ob-right-panel"
            style={{
              background: gradients[step],
              transition: "background 0.5s ease",
            }}
          >
            {/* Decorative circles */}
            <div
              style={{
                position: "absolute",
                top: -80,
                right: -80,
                width: 300,
                height: 300,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.06)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -100,
                left: -60,
                width: 260,
                height: 260,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.04)",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                width: 320,
                height: 320,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.03)",
                pointerEvents: "none",
              }}
            />

            {/* Step label top */}
            <div
              style={{
                position: "absolute",
                top: 24,
                left: 24,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: 99,
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(8px)",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.8)",
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.9)",
                  letterSpacing: "0.3px",
                }}
              >
                {current.tag}
              </span>
            </div>

            {/* Illustration */}
            <RightIllustration
              stepId={current.id}
              teamLottie={teamLottie}
              pmLottie={pmLottie}
              aiMeetingsLottie={aiMeetingsLottie}
              agenticAiLottie={agenticAiLottie}
              visible={panelVisible}
            />

            {/* Nav arrows on panel */}
            <div
              style={{
                position: "absolute",
                bottom: 24,
                right: 24,
                display: "flex",
                gap: 8,
              }}
            >
              <button
                className="ob-nav-btn"
                onClick={() => goTo(step - 1)}
                disabled={step === 0}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  cursor: step === 0 ? "default" : "pointer",
                  opacity: step === 0 ? 0.3 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="arrow_left" size={14} color="white" />
              </button>
              <button
                className="ob-nav-btn"
                onClick={() => goTo(step + 1)}
                disabled={isLast}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: "1px solid rgba(255,255,255,0.28)",
                  background: "rgba(255,255,255,0.12)",
                  color: "white",
                  cursor: isLast ? "default" : "pointer",
                  opacity: isLast ? 0.3 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon name="arrow_right" size={14} color="white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
