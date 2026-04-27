import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  MonitorOff,
  Circle,
  PhoneOff,
  Send,
  Users,
  ListChecks,
  MessageSquare,
  Link2,
  Clock,
  CheckCircle2,
  Copy,
  Hand,
  Sparkles,
  Video,
  VideoOff,
  Shield,
  LogIn,
  Eye,
  ChevronRight,
  Calendar,
  UserCheck,
  AlertCircle,
  Plus,
  X,
  Check,
  ArrowRight,
  Zap,
  MoreHorizontal,
  Bell,
  Settings,
  ChevronDown,
  Star,
  ImageIcon,
  Aperture,
  ChevronUp,
} from "lucide-react";

// - ICE Config -
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

// - Groq -
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

const groq = async (systemPrompt, userContent, options = {}) => {
  const { maxTokens = 1024 } = options;
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) throw new Error("Groq failed");
  const data = await res.json();
  return data.choices[0].message.content.trim();
};

const sendEmail = async ({ to, subject, body, companyName }) => {
  try {
    const res = await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, subject, html: body, companyName }),
    });
    return res.ok ? { success: true } : { success: false };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

// - Helpers -
const AVATAR_COLORS = [
  ["#e0e7ff", "#4338ca"],
  ["#dcfce7", "#15803d"],
  ["#fef9c3", "#a16207"],
  ["#f3e8ff", "#7e22ce"],
  ["#ffe4e6", "#be123c"],
  ["#ccfbf1", "#0f766e"],
  ["#fed7aa", "#c2410c"],
  ["#dbeafe", "#1d4ed8"],
];
const TILE_GRADIENTS = [
  ["#0f2a5a", "#1f4b8e"],
  ["#12324f", "#1f6a74"],
  ["#2b2255", "#5b3d91"],
  ["#3a203d", "#7a2e63"],
  ["#1f3d2b", "#2f7a55"],
  ["#3a2f1a", "#8a5c22"],
  ["#1f2d4d", "#3b6ecf"],
  ["#3a2530", "#6b3e56"],
];
function avatarColor(str = "") {
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
}
function profileGradient(str = "") {
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % TILE_GRADIENTS.length;
  const [from, to] = TILE_GRADIENTS[h];
  return `radial-gradient(120% 120% at 20% 10%, ${to} 0%, ${from} 58%, #0b1220 100%)`;
}
function initials(name = "") {
  return (
    name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "?"
  );
}
function fmtDur(secs) {
  const h = Math.floor(secs / 3600);
  const m = String(Math.floor((secs % 3600) / 60)).padStart(2, "0");
  const s = String(secs % 60).padStart(2, "0");
  return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
}
function fmtTime(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtMeetingDate(dt) {
  if (!dt) return "";
  return new Date(dt).toLocaleString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getIsDarkTheme() {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function createGuestProfile(roomId, name = "") {
  const storageKey = `meeting-guest-${roomId}`;
  let storedId = "";
  try {
    storedId = sessionStorage.getItem(storageKey) || "";
    if (!storedId) {
      storedId = `guest-${roomId}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem(storageKey, storedId);
    }
  } catch {
    storedId = `guest-${roomId}-${Math.random().toString(36).slice(2, 10)}`;
  }

  return {
    id: storedId,
    full_name: name,
    email: "",
    user_photo: null,
    isGuest: true,
  };
}

// - Styles -
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=DM+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #f8f8f6; --bg-2: #ffffff; --bg-3: #f2f2ef;
    --surface: rgba(0,0,0,0.03); --surface-2: rgba(0,0,0,0.055); --surface-3: rgba(0,0,0,0.08);
    --border: rgba(0,0,0,0.08); --border-strong: rgba(0,0,0,0.15);
    --text: #1a1a1a; --text-2: #555550; --text-3: #999990;
    --accent: #2d6ef5; --accent-2: #5589ff; --accent-glow: rgba(45,110,245,0.18); --accent-subtle: rgba(45,110,245,0.08);
    --green: #16a34a; --green-subtle: rgba(22,163,74,0.08);
    --red: #dc2626; --red-subtle: rgba(220,38,38,0.08);
    --amber: #d97706; --amber-subtle: rgba(217,119,6,0.08);
    --purple: #7c3aed; --purple-subtle: rgba(124,58,237,0.08);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.08),0 1px 2px rgba(0,0,0,0.06);
    --shadow: 0 4px 16px rgba(0,0,0,0.08),0 2px 4px rgba(0,0,0,0.06);
    --shadow-lg: 0 12px 40px rgba(0,0,0,0.12),0 4px 12px rgba(0,0,0,0.08);
    --shadow-xl: 0 24px 64px rgba(0,0,0,0.14),0 8px 24px rgba(0,0,0,0.08);
    --radius: 10px; --radius-lg: 14px; --radius-xl: 20px;
    --font: 'DM Sans', sans-serif; --font-mono: 'DM Mono', monospace;
    --transition: 0.15s cubic-bezier(0.4,0,0.2,1);
    --tile-label-bg: rgba(255,255,255,0.92);
    --tile-label-border: rgba(0,0,0,0.08);
  }
  .meet-root.dark {
    --bg: #0c0c0e; --bg-2: #141416; --bg-3: #1c1c1f;
    --surface: rgba(255,255,255,0.035); --surface-2: rgba(255,255,255,0.06); --surface-3: rgba(255,255,255,0.09);
    --border: #242428; --border-strong: #2f2f36;
    --text: #f2f2f5; --text-2: #b6b6c1; --text-3: #8a8a96;
    --accent: #5e6ad2; --accent-2: #7b86e8; --accent-glow: rgba(94,106,210,0.2); --accent-subtle: rgba(94,106,210,0.12);
    --green: #22c55e; --green-subtle: rgba(34,197,94,0.12);
    --red: #ef4444; --red-subtle: rgba(239,68,68,0.12);
    --amber: #f59e0b; --amber-subtle: rgba(245,158,11,0.12);
    --purple: #8b5cf6; --purple-subtle: rgba(139,92,246,0.12);
    --shadow-sm: 0 1px 3px rgba(0,0,0,0.35),0 1px 2px rgba(0,0,0,0.28);
    --shadow: 0 6px 18px rgba(0,0,0,0.35),0 2px 6px rgba(0,0,0,0.28);
    --shadow-lg: 0 14px 36px rgba(0,0,0,0.4),0 6px 14px rgba(0,0,0,0.28);
    --shadow-xl: 0 28px 72px rgba(0,0,0,0.48),0 10px 28px rgba(0,0,0,0.34);
    --tile-label-bg: rgba(20,20,22,0.9);
    --tile-label-border: rgba(255,255,255,0.08);
  }
  .meet-root { font-family: var(--font); color: var(--text); background: var(--bg); }
  .lobby-wrap {
    min-height: 100vh; background: var(--bg);
    background-image: radial-gradient(ellipse 70% 50% at 15% 5%, rgba(45,110,245,0.06) 0%, transparent 55%),
      radial-gradient(ellipse 50% 40% at 85% 95%, rgba(124,58,237,0.04) 0%, transparent 55%);
    display: flex; align-items: center; justify-content: center;
    padding: 32px 24px; position: relative; overflow: hidden;
  }
  .lobby-grid-bg {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(0,0,0,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.025) 1px, transparent 1px);
    background-size: 52px 52px; pointer-events: none;
  }
  .lobby-inner { width: 100%; max-width: 980px; display: grid; grid-template-columns: 1fr 340px; gap: 24px; align-items: start; position: relative; z-index: 1; }
  .lobby-preview { display: flex; flex-direction: column; gap: 16px; }
  .lobby-video-wrap { position: relative; border-radius: var(--radius-xl); overflow: hidden; background: var(--bg-3); aspect-ratio: 16/9; border: 1px solid var(--border); box-shadow: var(--shadow-lg); }
  .lobby-info { display: flex; flex-direction: column; gap: 14px; }
  .glass-card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-xl); box-shadow: var(--shadow); }
  .glass-card-inner { padding: 20px 22px; }
  .pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 10px; font-weight: 600; letter-spacing: 0.02em; white-space: nowrap; }
  .pill-indigo { background: var(--accent-subtle); color: var(--accent); border: 1px solid rgba(45,110,245,0.2); }
  .pill-green { background: var(--green-subtle); color: var(--green); border: 1px solid rgba(22,163,74,0.2); }
  .pill-amber { background: var(--amber-subtle); color: var(--amber); border: 1px solid rgba(217,119,6,0.2); }
  .pill-gray { background: var(--surface-2); color: var(--text-2); border: 1px solid var(--border); }
  .pill-red { background: var(--red-subtle); color: var(--red); border: 1px solid rgba(220,38,38,0.2); }
  .btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; border: none; font-family: var(--font); font-weight: 600; cursor: pointer; transition: all var(--transition); white-space: nowrap; position: relative; overflow: hidden; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .btn-primary { background: var(--accent); color: white; border-radius: var(--radius); box-shadow: 0 1px 0 rgba(255,255,255,0.15) inset,0 4px 12px var(--accent-glow); }
  .btn-primary:hover:not(:disabled) { background: #1f5de0; box-shadow: 0 6px 20px var(--accent-glow); transform: translateY(-1px); }
  .btn-green { background: var(--green); color: white; border-radius: var(--radius); font-weight: 700; box-shadow: 0 4px 12px rgba(22,163,74,0.2); }
  .btn-green:hover:not(:disabled) { background: #15803d; transform: translateY(-1px); }
  .btn-danger { background: var(--red); color: white; border-radius: var(--radius); box-shadow: 0 4px 12px rgba(220,38,38,0.2); }
  .btn-danger:hover:not(:disabled) { background: #b91c1c; transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--text-2); border-radius: var(--radius); border: 1px solid var(--border); }
  .btn-ghost:hover { background: var(--surface); color: var(--text); border-color: var(--border-strong); }
  .btn-sm { font-size: 12px; padding: 7px 14px; border-radius: 8px; }
  .btn-md { font-size: 13px; padding: 10px 20px; }
  .btn-lg { font-size: 14px; padding: 14px 24px; width: 100%; border-radius: 14px; }
  .media-toggle { display: flex; align-items: center; gap: 8px; padding: 9px 18px; border-radius: 999px; font-size: 12px; font-weight: 600; cursor: pointer; transition: all var(--transition); border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); font-family: var(--font); box-shadow: var(--shadow-sm); }
  .media-toggle:hover { background: var(--bg-3); color: var(--text); border-color: var(--border-strong); }
  .media-toggle.off { background: var(--red-subtle); border-color: rgba(220,38,38,0.3); color: var(--red); }
  .room-root { position: fixed; inset: 0; background: var(--bg); display: flex; flex-direction: column; font-family: var(--font); }
  .room-topbar { height: 58px; background: var(--bg-2); border-bottom: 1px solid var(--border); display: flex; align-items: center; padding: 0 20px; gap: 12px; flex-shrink: 0; box-shadow: var(--shadow-sm); z-index: 10; }
  .room-content { flex: 1; display: flex; overflow: hidden; position: relative; }
  .room-videos { flex: 1; display: flex; flex-direction: column; overflow: hidden; background: var(--bg-3); }
  .room-drawer {
    position: absolute; right: 0; top: 0; bottom: 0; width: 300px;
    background: var(--bg-2); border-left: 1px solid var(--border);
    display: flex; flex-direction: column; flex-shrink: 0;
    transform: translateX(100%); transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
    z-index: 20; box-shadow: var(--shadow-lg);
  }
  .room-drawer.open { transform: translateX(0); }
  .drawer-header { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--border); flex-shrink: 0; }
  .drawer-title { font-size: 14px; font-weight: 700; color: var(--text); display: flex; align-items: center; gap: 8px; }
  .room-controls {
    height: 80px; background: var(--bg-2); border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    gap: 6px; flex-shrink: 0; padding: 0 16px;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.04);
  }
  .ctrl-btn { display: flex; flex-direction: column; align-items: center; gap: 4px; cursor: pointer; }
  .ctrl-btn-inner { width: 46px; height: 46px; border-radius: 13px; display: flex; align-items: center; justify-content: center; transition: all var(--transition); border: 1px solid var(--border); background: var(--bg-2); color: var(--text-2); box-shadow: var(--shadow-sm); }
  .ctrl-btn-inner:hover { background: var(--surface-2); color: var(--text); border-color: var(--border-strong); transform: scale(1.04); }
  .ctrl-btn-inner.active-muted { background: var(--red-subtle); border-color: rgba(220,38,38,0.3); color: var(--red); }
  .ctrl-btn-inner.active-on { background: var(--accent-subtle); border-color: rgba(45,110,245,0.3); color: var(--accent); }
  .ctrl-btn-inner.active-yellow { background: var(--amber-subtle); border-color: rgba(217,119,6,0.3); color: var(--amber); }
  .ctrl-btn-inner.active-rec { background: var(--red-subtle); border-color: rgba(220,38,38,0.3); color: var(--red); }
  .ctrl-btn-label { font-size: 9px; color: var(--text-3); font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; }
  .more-menu-btn { display: none; }
  .ctrl-btn-danger .ctrl-btn-inner { background: var(--red); border-color: var(--red); color: white; width: 50px; height: 50px; border-radius: 14px; box-shadow: 0 4px 16px rgba(220,38,38,0.3); }
  .ctrl-btn-danger .ctrl-btn-inner:hover { background: #b91c1c; box-shadow: 0 8px 24px rgba(220,38,38,0.35); transform: scale(1.06); }
  .video-grid { flex: 1; padding: 14px; display: grid; gap: 10px; overflow-y: auto; align-content: stretch; grid-auto-rows: minmax(0, 1fr); }
  .video-tile { position: relative; border-radius: var(--radius-lg); overflow: hidden; background: #e8e8e4; border: 1.5px solid var(--border); transition: all 0.2s ease; width: 100%; aspect-ratio: 16/9; box-shadow: var(--shadow-sm); }
  @media (max-width: 767px) {
    .room-topbar { flex-wrap: wrap; align-items: center; justify-content: space-between; padding: 10px 12px; height: auto; gap: 10px; }
    .room-topbar > div { min-width: 0; }
    .room-topbar .pill { font-size: 10px; padding: 4px 8px; }
    .room-master-link { display: none; }
    .room-content { flex-direction: column; }
    .room-videos { min-height: 0; }
    .room-controls { flex-wrap: nowrap; justify-content: flex-start; gap: 8px; padding: 8px 10px; height: auto; overflow-x: auto; overflow-y: visible; position: relative; }
    .room-videos { min-height: 0; overflow: visible; }
    .room-controls::-webkit-scrollbar { height: 6px; }
    .room-controls::-webkit-scrollbar-thumb { background: rgba(148,163,184,0.6); border-radius: 999px; }
    .ctrl-btn { min-width: 42px; margin-right: 6px; }
    .ctrl-btn-inner { width: 40px; height: 40px; }
    .ctrl-btn-label { display: none; }
    .divider { display: none; }
    .more-action-btn { display: none; }
    .more-menu-btn { display: flex; }
    .more-popup {
      position: fixed;
      bottom: 96px;
      right: 12px;
      z-index: 9999;
      background: var(--bg-2);
      border: 1px solid var(--border);
      border-radius: 16px;
      box-shadow: var(--shadow-lg);
      padding: 12px;
      display: grid;
      gap: 10px;
      width: min(260px, calc(100vw - 24px));
    }
    .more-popup .btn { justify-content: flex-start; gap: 8px; }
    .room-drawer { width: 100%; bottom: 0; height: 70%; right: 0; left: 0; top: auto; transform: translateY(100%); border-left: none; border-top: 1px solid var(--border); }
    .room-drawer.open { transform: translateY(0); }
    .drawer-backdrop { background: rgba(0,0,0,0.55); }
    .drawer-header { padding: 14px 14px 12px; }
    .video-grid { padding: 10px; gap: 8px; }
    .video-tile { aspect-ratio: 4/3; }
    .video-overflow-tile { aspect-ratio: 4/3; }
    .chat-input-wrap { padding: 10px; }
    .chat-input { font-size: 12px; }
    .people-item { padding: 10px 12px; }
    .agenda-item { padding: 10px 12px; }
    .bg-panel { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .modal-box { width: 100%; max-width: 100%; margin: 0; border-radius: 16px; }
    .summary-card { max-width: 100%; margin: 0; }
    .guest-approval-panel { width: calc(100% - 24px); right: 12px; left: 12px; top: auto; bottom: 100px; }

  }
  .video-grid.single { grid-template-columns: minmax(0, 1fr) !important; }
  .video-grid.double { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .video-grid.triple { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .video-grid.quad { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
  .video-grid.overflow { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
  .video-grid.single .video-tile,
  .video-grid.double .video-tile,
  .video-grid.triple .video-tile,
  .video-grid.quad .video-tile,
  .video-grid.overflow .video-tile,
  .video-grid.single .video-overflow-tile,
  .video-grid.double .video-overflow-tile,
  .video-grid.triple .video-overflow-tile,
  .video-grid.quad .video-overflow-tile,
  .video-grid.overflow .video-overflow-tile {
    height: 100%;
    aspect-ratio: auto;
  }
  .video-overflow-tile {
    position: relative;
    border-radius: var(--radius-lg);
    border: 1.5px dashed var(--border-strong);
    background:
      linear-gradient(135deg, rgba(45,110,245,0.08) 0%, rgba(124,58,237,0.08) 100%);
    aspect-ratio: 16/9;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .video-overflow-count {
    font-size: 34px;
    font-weight: 800;
    color: var(--text);
    letter-spacing: -0.04em;
  }
  .video-overflow-label {
    font-size: 12px;
    color: var(--text-2);
    margin-top: 6px;
    text-align: center;
  }
  .video-tile:hover .tile-overlay { opacity: 1; }
  .video-tile.speaking { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow),var(--shadow); }
  .tile-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%); opacity: 0.6; transition: opacity 0.2s; pointer-events: none; }
  .video-tile-label { position: absolute; bottom: 10px; left: 10px; padding: 5px 11px; border-radius: 9px; background: var(--tile-label-bg); backdrop-filter: blur(12px); font-size: 11px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 5px; border: 1px solid var(--tile-label-border); box-shadow: var(--shadow-sm); }
  .chat-bubble-me { background: var(--accent); color: white; border-radius: 14px 14px 4px 14px; padding: 9px 13px; font-size: 13px; max-width: 210px; word-break: break-word; line-height: 1.55; box-shadow: 0 2px 8px var(--accent-glow); }
  .chat-bubble-other { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); border-radius: 14px 14px 14px 4px; padding: 9px 13px; font-size: 13px; max-width: 210px; word-break: break-word; line-height: 1.55; }
  .chat-input-wrap { padding: 12px; border-top: 1px solid var(--border); display: flex; gap: 8px; background: var(--bg-2); }
  .chat-input { flex: 1; border: 1px solid var(--border); border-radius: 10px; padding: 9px 13px; font-size: 13px; font-family: var(--font); color: var(--text); background: var(--bg-3); outline: none; transition: all var(--transition); }
  .chat-input:focus { border-color: var(--accent); background: var(--bg-2); box-shadow: 0 0 0 3px var(--accent-glow); }
  .chat-input::placeholder { color: var(--text-3); }
  .ended-root { min-height: 100vh; background: var(--bg); background-image: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(45,110,245,0.07) 0%, transparent 60%); display: flex; align-items: center; justify-content: center; padding: 24px; font-family: var(--font); }
  .summary-card { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-xl); max-width: 580px; width: 100%; overflow: hidden; box-shadow: var(--shadow-xl); }
  .summary-header { padding: 28px 28px 20px; border-bottom: 1px solid var(--border); background: linear-gradient(135deg, rgba(45,110,245,0.05) 0%, rgba(124,58,237,0.03) 100%); }
  .summary-body { padding: 24px 28px; max-height: 52vh; overflow-y: auto; }
  .summary-section { margin-bottom: 22px; }
  .summary-section:last-child { margin-bottom: 0; }
  .summary-label { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }
  .progress-bar-track { flex: 1; height: 5px; background: var(--surface-2); border-radius: 999px; overflow: hidden; }
  .people-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; border-radius: var(--radius); transition: background var(--transition); }
  .people-item:hover { background: var(--surface); }
  .agenda-item { display: flex; gap: 12px; padding: 12px 14px; border-radius: var(--radius); transition: background var(--transition); border: 1px solid transparent; }
  .agenda-item.current { background: var(--accent-subtle); border-color: rgba(45,110,245,0.2); }
  .agenda-item.upcoming { background: var(--surface); }
  @keyframes spin { to { transform: rotate(360deg); } }
  .spin { animation: spin 0.7s linear infinite; }
  @keyframes pulse-dot { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.85); } }
  .pulse-dot { animation: pulse-dot 1.8s ease-in-out infinite; }
  @keyframes bar-pulse { 0%,100% { transform: scaleY(0.35); } 50% { transform: scaleY(1); } }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fadeUp 0.3s ease forwards; }
  @keyframes slideUp { from { opacity:0; transform: translateY(20px); } to { opacity:1; transform: translateY(0); } }
  .slide-up { animation: slideUp 0.2s ease forwards; }
  .divider { width: 1px; height: 36px; background: var(--border); margin: 0 2px; }
  .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); -webkit-backdrop-filter: blur(6px); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 20px; }
  .modal-box { background: var(--bg-2); border: 1px solid var(--border); border-radius: var(--radius-xl); padding: 32px; width: 100%; max-width: 480px; box-shadow: var(--shadow-xl); }
  .link-box { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 10px; background: var(--bg-3); padding: 10px 14px; transition: border-color var(--transition); }
  .link-box:hover { border-color: var(--border-strong); }
  .meta-row { display: flex; align-items: center; gap: 10px; font-size: 12px; color: var(--text-2); }
  .meta-icon { width: 28px; height: 28px; border-radius: 8px; background: var(--surface); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--text-3); }
  input, textarea, select { font-family: var(--font); }
  .section-heading { font-size: 9px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-3); padding: 14px 16px 6px; display: flex; align-items: center; gap: 6px; }
  .bg-panel { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 4px 0; }
  .bg-option { aspect-ratio: 16/9; border-radius: 8px; cursor: pointer; border: 2px solid transparent; transition: all 0.15s ease; overflow: hidden; position: relative; }
  .bg-option:hover { transform: scale(1.04); }
  .bg-option.selected { border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-glow); }
  .bg-option-label { position: absolute; bottom: 0; left: 0; right: 0; padding: 3px; background: rgba(0,0,0,0.5); font-size: 8px; color: white; text-align: center; font-weight: 600; }
  .drawer-backdrop { position: absolute; inset: 0; background: rgba(0,0,0,0.15); z-index: 19; opacity: 0; pointer-events: none; transition: opacity 0.25s ease; }
  .drawer-backdrop.open { opacity: 1; pointer-events: all; }

  /* Mobile responsiveness */
  @media (max-width: 767px) {
    .lobby-wrap { padding: 16px 12px; }
    .lobby-inner { grid-template-columns: 1fr; gap: 16px; }
    .lobby-preview { gap: 12px; }
    .lobby-video-wrap { aspect-ratio: 4/3; }
    .glass-card-inner { padding: 16px 18px; }
    .room-topbar { height: 50px; padding: 0 12px; }
    .room-drawer { width: 280px; }
    .room-controls { height: 70px; padding: 0 12px; gap: 4px; }
    .ctrl-btn-inner { width: 42px; height: 42px; border-radius: 11px; }
    .ctrl-btn-danger .ctrl-btn-inner { width: 46px; height: 46px; border-radius: 12px; }
    .ctrl-btn-label { font-size: 8px; }
    .video-grid { padding: 8px; gap: 6px; }
    .video-tile { border-radius: 12px; }
    .video-overflow-tile { border-radius: 12px; }
    .video-overflow-count { font-size: 28px; }
    .video-overflow-label { font-size: 11px; margin-top: 4px; }
    .video-tile-label { bottom: 6px; left: 6px; padding: 4px 8px; font-size: 10px; }
    .chat-bubble-me, .chat-bubble-other { max-width: 180px; padding: 8px 11px; font-size: 12px; }
    .chat-input-wrap { padding: 10px; }
    .chat-input { padding: 8px 11px; font-size: 12px; }
    .ended-root { padding: 16px; }
    .summary-card { max-width: none; }
    .summary-header { padding: 20px 20px 16px; }
    .summary-body { padding: 16px 20px; max-height: 60vh; }
    .modal-box { padding: 24px 20px; max-width: none; margin: 0 12px; }
    .link-box { padding: 8px 12px; }
    .meta-row { font-size: 11px; gap: 8px; }
    .meta-icon { width: 24px; height: 24px; border-radius: 6px; }
    .section-heading { padding: 12px 14px 4px; font-size: 8px; }
    .bg-panel { grid-template-columns: repeat(3, 1fr); gap: 6px; padding: 2px 0; }
    .bg-option { border-radius: 6px; }
    .bg-option-label { font-size: 7px; padding: 2px; }
    .people-item { padding: 8px 12px; gap: 10px; }
    .agenda-item { padding: 10px 12px; gap: 10px; }
    .btn-sm { font-size: 11px; padding: 6px 12px; }
    .btn-md { font-size: 12px; padding: 8px 16px; }
    .btn-lg { font-size: 13px; padding: 12px 20px; border-radius: 12px; }
    .pill { font-size: 9px; padding: 2px 8px; }
  }
`;

// - Avatar -
function UserAvatar({ profile, size = 32, online = false }) {
  const [bg, fg] = avatarColor(profile?.full_name || profile?.email || "");
  const avatar = profile?.user_photo ? (
    <img
      src={profile.user_photo}
      alt=""
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: bg,
        color: fg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.37,
        flexShrink: 0,
        letterSpacing: "-0.01em",
        border: `1.5px solid rgba(0,0,0,0.06)`,
      }}
    >
      {initials(profile?.full_name || profile?.email)}
    </div>
  );
  if (!online) return avatar;
  return (
    <div
      style={{ position: "relative", display: "inline-flex", flexShrink: 0 }}
    >
      {avatar}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: "50%",
          background: "var(--green)",
          border: `2px solid var(--bg-2)`,
        }}
      />
    </div>
  );
}

// - RemoteAudio: dedicated component that attaches a remote audio stream -
// This is KEY - audio must be played via its own <audio> element, not piggy-backed on video
function RemoteAudio({ stream }) {
  const audioRef = useRef(null);
  useEffect(() => {
    if (!audioRef.current || !stream) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;
    // Create an audio-only stream to avoid double-playing
    const audioStream = new MediaStream(audioTracks);
    audioRef.current.srcObject = audioStream;
    audioRef.current.play().catch(() => {});
    return () => {
      if (audioRef.current) audioRef.current.srcObject = null;
    };
  }, [stream]);

  return (
    <audio ref={audioRef} autoPlay playsInline style={{ display: "none" }} />
  );
}

// - VideoTile -
function VideoTile({
  participant,
  isLocal,
  isMicOn,
  isCamOn,
  isScreenShare,
  isLarge,
  isSpeaking,
  profilesMap,
  handRaised,
  selectedBg = "none",
}) {
  const videoRef = useRef(null);
  const resolvedProfile =
    profilesMap?.[participant.peerId] || participant.profile;
  const fallbackBg = profileGradient(
    resolvedProfile?.id ||
      resolvedProfile?.email ||
      resolvedProfile?.full_name ||
      participant.peerId ||
      "guest",
  );

  // Determine if we should show video
  // For local: check isCamOn state. For remote: check participant.camOn flag AND that stream has live video tracks
  const remoteHasVideo =
    !isLocal &&
    participant.stream &&
    participant.stream
      .getVideoTracks()
      .some((t) => t.enabled && t.readyState === "live") &&
    participant.camOn !== false;

  const localHasVideo =
    isLocal &&
    isCamOn &&
    participant.stream &&
    participant.stream
      .getVideoTracks()
      .some((t) => t.enabled && t.readyState === "live");

  const showVideo = isScreenShare
    ? true
    : isLocal
      ? localHasVideo
      : remoteHasVideo;

  useEffect(() => {
    if (!videoRef.current) return;
    if (!participant.stream) {
      videoRef.current.srcObject = null;
      return;
    }
    if (showVideo || isScreenShare) {
      if (videoRef.current.srcObject !== participant.stream) {
        videoRef.current.srcObject = participant.stream;
        videoRef.current.play().catch(() => {});
      }
    } else {
      videoRef.current.srcObject = null;
    }
  }, [participant.stream, showVideo, isScreenShare]);

  return (
    <div
      className={`video-tile${isSpeaking ? " speaking" : ""}`}
      style={{ aspectRatio: "16/9" }}
    >
      {/* Video element - always rendered when there's video to show */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted // Always mute the video element - audio is handled by RemoteAudio
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 0,
          margin: 0,
          transform: isLocal && !isScreenShare ? "scaleX(-1)" : "none",
          display: showVideo || isScreenShare ? "block" : "none",
          position: "static",
          zIndex: "auto",
          boxShadow: "none",
        }}
      />

      {/* Avatar fallback when no video */}
      {!showVideo && !isScreenShare && (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: fallbackBg,
            flexDirection: "column",
            gap: 12,
            position: "absolute",
            top: 0,
            left: 0,
          }}
        >
          <div
            style={{
              padding: 3,
              borderRadius: "50%",
              background: "rgba(45,110,245,0.08)",
              border: "1.5px solid rgba(45,110,245,0.15)",
            }}
          >
            <UserAvatar profile={resolvedProfile} size={isLarge ? 72 : 52} />
          </div>
          <span
            style={{ fontSize: 11, color: "var(--text-3)", fontWeight: 500 }}
          >
            Camera off
          </span>
        </div>
      )}

      <div className="tile-overlay" />

      <div className="video-tile-label">
        {isLocal &&
          (isMicOn ? (
            <Mic size={9} style={{ color: "var(--green)" }} />
          ) : (
            <MicOff size={9} style={{ color: "var(--red)" }} />
          ))}
        {resolvedProfile?.full_name ||
          participant.profile?.full_name ||
          "Guest"}
        {isLocal ? " (You)" : ""}
        {participant.isHost && (
          <span style={{ color: "var(--amber)", marginLeft: 4 }}>- Host</span>
        )}
        {isScreenShare && (
          <span style={{ color: "var(--accent)", marginLeft: 4 }}>
            - Screen
          </span>
        )}
      </div>

      {isSpeaking && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            gap: 2,
            alignItems: "flex-end",
            height: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                background: "var(--accent)",
                borderRadius: 2,
                height: `${[55, 100, 70][i - 1]}%`,
                animation: `bar-pulse 0.8s ease-in-out ${i * 0.15}s infinite`,
                transformOrigin: "bottom",
              }}
            />
          ))}
        </div>
      )}

      {handRaised && (
        <div
          style={{
            position: "absolute",
            top: isSpeaking ? 35 : 10,
            right: 10,
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--amber)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--bg-2)",
            boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
          }}
        >
          <Hand size={16} style={{ color: "white" }} />
        </div>
      )}

      {isLocal && !isMicOn && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            width: 26,
            height: 26,
            borderRadius: "50%",
            background: "rgba(220,38,38,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MicOff size={11} style={{ color: "white" }} />
        </div>
      )}
    </div>
  );
}

// - Control Button -
function CtrlBtn({
  onClick,
  activeMuted,
  activeOn,
  activeYellow,
  activeRec,
  danger,
  label,
  children,
  badge,
  className,
}) {
  const cls = activeMuted
    ? "active-muted"
    : activeOn
      ? "active-on"
      : activeYellow
        ? "active-yellow"
        : activeRec
          ? "active-rec"
          : "";
  return (
    <div
      className={`ctrl-btn${danger ? " ctrl-btn-danger" : ""}${className ? ` ${className}` : ""}`}
      onClick={onClick}
      style={{ position: "relative" }}
    >
      <div className={`ctrl-btn-inner ${cls}`}>{children}</div>
      {badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 16,
            height: 16,
            borderRadius: "50%",
            background: "var(--red)",
            color: "white",
            fontSize: 9,
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "2px solid var(--bg-2)",
          }}
        >
          {badge}
        </span>
      )}
      {label && <span className="ctrl-btn-label">{label}</span>}
    </div>
  );
}

// - Background Options -

const BG_OPTIONS = [
  { id: "none", label: "None", style: { background: "#e6e5e0" } },
  {
    id: "blur",
    label: "Blur",
    style: { background: "linear-gradient(135deg,#a8d8ea,#aa96da,#fcbad3)" },
    isBlur: true,
  },
  {
    id: "office",
    label: "Office",
    style: { background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)" },
  },
  {
    id: "nature",
    label: "Nature",
    style: { background: "linear-gradient(135deg,#11998e,#38ef7d)" },
  },
  {
    id: "dark",
    label: "Dark",
    style: { background: "linear-gradient(135deg,#1a1a2e,#16213e,#0f3460)" },
  },
  {
    id: "sunset",
    label: "Sunset",
    style: { background: "linear-gradient(135deg,#f093fb,#f5576c)" },
  },
  {
    id: "ocean",
    label: "Ocean",
    style: { background: "linear-gradient(135deg,#0093E9,#80D0C7)" },
  },
  {
    id: "space",
    label: "Space",
    style: { background: "linear-gradient(135deg,#0d0d2b,#1a1a4e,#16213e)" },
  },
];

let selfieSegmentationScriptPromise = null;
function loadSelfieSegmentationScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.SelfieSegmentation) return Promise.resolve(window.SelfieSegmentation);
  if (selfieSegmentationScriptPromise) return selfieSegmentationScriptPromise;

  selfieSegmentationScriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById("mp-selfie-segmentation-script");
    if (existing) {
      existing.addEventListener("load", () => {
        if (window.SelfieSegmentation) resolve(window.SelfieSegmentation);
        else reject(new Error("SelfieSegmentation failed to load"));
      });
      existing.addEventListener("error", () =>
        reject(new Error("Failed to load SelfieSegmentation script")),
      );
      return;
    }

    const script = document.createElement("script");
    script.id = "mp-selfie-segmentation-script";
    script.src =
      "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/selfie_segmentation.js";
    script.async = true;
    script.onload = () => {
      if (window.SelfieSegmentation) resolve(window.SelfieSegmentation);
      else reject(new Error("SelfieSegmentation global missing"));
    };
    script.onerror = () =>
      reject(new Error("Failed to load SelfieSegmentation script"));
    document.head.appendChild(script);
  });

  return selfieSegmentationScriptPromise;
}

function drawVirtualBackground(ctx, w, h, bgId, sourceVideo, bgImage) {
  const drawFittedImage = (image) => {
    const iw = image?.naturalWidth || image?.videoWidth || w;
    const ih = image?.naturalHeight || image?.videoHeight || h;
    if (!iw || !ih) {
      ctx.drawImage(image, 0, 0, w, h);
      return;
    }

    // Keep the entire background image visible (no stretching/cropping).
    const scale = Math.min(w / iw, h / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (w - dw) / 2;
    const dy = (h - dh) / 2;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(image, dx, dy, dw, dh);
  };

  const grad = (a, b, c = null) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, a);
    g.addColorStop(c ? 0.55 : 1, b);
    if (c) g.addColorStop(1, c);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  };

  if (bgImage && bgImage.complete) {
    drawFittedImage(bgImage);
    return;
  }

  switch (bgId) {
    case "blur":
      ctx.save();
      ctx.filter = "blur(10px)";
      ctx.drawImage(sourceVideo, 0, 0, w, h);
      ctx.restore();
      break;
    case "office":
      grad("#667eea", "#764ba2");
      break;
    case "nature":
      grad("#11998e", "#38ef7d");
      break;
    case "dark":
      grad("#1a1a2e", "#16213e", "#0f3460");
      break;
    case "sunset":
      grad("#f093fb", "#f5576c");
      break;
    case "ocean":
      grad("#0093E9", "#80D0C7");
      break;
    case "space":
      grad("#0d0d2b", "#1a1a4e", "#16213e");
      break;
    default:
      ctx.fillStyle = "#e6e5e0";
      ctx.fillRect(0, 0, w, h);
      break;
  }
}

// - Meeting Created Modal -
function MeetingCreatedModal({ meeting, onJoin, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/meet/${meeting.room_id || meeting.id}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard?.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Clipboard operations can be pre-empted by another lock request.
      console.warn("Clipboard write failed:", err);
    }
  };
  return (
    <div className="modal-overlay">
      <div className="modal-box fade-up">
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 14,
            marginBottom: 22,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              flexShrink: 0,
              background: "var(--green-subtle)",
              border: "1px solid rgba(22,163,74,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Check size={20} style={{ color: "var(--green)" }} />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 17,
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.2,
              }}
            >
              Meeting Created
            </div>
            <div style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}>
              Ready to start when you are
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: 7, marginTop: -2 }}
          >
            <X size={15} />
          </button>
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 16,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--text)",
              marginBottom: 12,
            }}
          >
            {meeting.title}
          </div>
          {meeting.description && (
            <div
              style={{
                fontSize: 13,
                color: "var(--text-2)",
                marginBottom: 14,
                lineHeight: 1.55,
              }}
            >
              {meeting.description}
            </div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {meeting.meeting_date && (
              <div className="meta-row">
                <div className="meta-icon">
                  <Calendar size={12} style={{ color: "var(--text-3)" }} />
                </div>
                {fmtMeetingDate(meeting.meeting_date)}
              </div>
            )}
            {meeting.duration && (
              <div className="meta-row">
                <div className="meta-icon">
                  <Clock size={12} style={{ color: "var(--text-3)" }} />
                </div>
                {meeting.duration} minutes
              </div>
            )}
            {(meeting.attendee_emails || []).length > 0 && (
              <div className="meta-row">
                <div className="meta-icon">
                  <Users size={12} style={{ color: "var(--text-3)" }} />
                </div>
                {meeting.attendee_emails.length} participant
                {meeting.attendee_emails.length !== 1 ? "s" : ""} invited
              </div>
            )}
          </div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: "var(--text-3)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 8,
            }}
          >
            Invite Link
          </div>
          <div className="link-box">
            <span
              style={{
                flex: 1,
                fontSize: 11,
                fontFamily: "var(--font-mono)",
                color: "var(--text-2)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {link}
            </span>
            <button
              onClick={copyLink}
              className="btn btn-ghost btn-sm"
              style={{ flexShrink: 0, padding: "5px 10px" }}
            >
              {copied ? (
                <Check size={12} style={{ color: "var(--green)" }} />
              ) : (
                <Copy size={12} />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-md"
            style={{ flex: 1 }}
          >
            Close
          </button>
          <button
            onClick={() => onJoin(meeting)}
            className="btn btn-primary btn-md"
            style={{ flex: 2 }}
          >
            <Video size={14} /> Start Meeting
          </button>
        </div>
      </div>
    </div>
  );
}

// - Lobby Screen -
function LobbyScreen({
  meeting,
  currentUser,
  isHost,
  onJoin,
  onBack,
  onGuestNameChange,
  dark = false,
  guestJoinStatus = "idle",
}) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const isGuest = !!currentUser?.isGuest;

  useEffect(() => {
    let s;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
        setStream(s);
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({ audio: true });
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
          setStream(s);
        } catch {}
      }
    })();
    return () => s?.getTracks().forEach((t) => t.stop());
  }, []);

  // Ensure stream is attached to video element when it mounts
  useEffect(() => {
    if (videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const toggleLobbyMic = () => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((p) => !p);
  };
  const toggleLobbyCam = () => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn((p) => !p);
  };
  const handleJoin = async () => {
    if (isGuest && !currentUser?.full_name?.trim()) return;
    setJoining(true);
    stream?.getTracks().forEach((t) => t.stop());
    await onJoin({ micOn, camOn });
    setJoining(false);
  };

  const agendaItems = (() => {
    try {
      return Array.isArray(meeting?.agenda_items)
        ? meeting.agenda_items
        : JSON.parse(meeting?.agenda_items || "[]");
    } catch {
      return [];
    }
  })();
  const canJoin = isHost || meeting?.status === "live";

  return (
    <div className={`meet-root lobby-wrap${dark ? " dark" : ""}`}>
      <style>{styles}</style>
      <div className="lobby-grid-bg" />
      <div className="lobby-inner">
        <div className="lobby-preview">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 2,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 11,
                flexShrink: 0,
                background: "var(--accent-subtle)",
                border: "1px solid rgba(45,110,245,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={16} style={{ color: "var(--accent)" }} />
            </div>
            <div>
              <div
                style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}
              >
                Preview
              </div>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                Check your audio and video before joining
              </div>
            </div>
          </div>
          <div className="lobby-video-wrap">
            {stream && stream.getVideoTracks().length > 0 && camOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: dark
                    ? "linear-gradient(135deg, #1c1c1f 0%, #141416 100%)"
                    : "linear-gradient(135deg,#eeede8 0%,#e6e5e0 100%)",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    padding: 5,
                    borderRadius: "50%",
                    background: "rgba(45,110,245,0.08)",
                    border: "1.5px solid rgba(45,110,245,0.15)",
                  }}
                >
                  <UserAvatar profile={currentUser} size={76} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      fontWeight: 500,
                    }}
                  >
                    {currentUser?.full_name || "You"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-3)",
                      marginTop: 4,
                    }}
                  >
                    Camera is off
                  </div>
                </div>
              </div>
            )}
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                padding: "6px 13px",
                borderRadius: 10,
                background: dark
                  ? "rgba(20,20,22,0.92)"
                  : "rgba(255,255,255,0.92)",
                backdropFilter: "blur(12px)",
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text)",
                display: "flex",
                alignItems: "center",
                gap: 6,
                border: "1px solid rgba(0,0,0,0.08)",
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: micOn ? "var(--green)" : "var(--red)",
                }}
              />
              {currentUser?.full_name || "You"}
              {isHost && <span style={{ color: "var(--amber)" }}>- Host</span>}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={toggleLobbyMic}
              className={`media-toggle${!micOn ? " off" : ""}`}
            >
              {micOn ? <Mic size={13} /> : <MicOff size={13} />}
              {micOn ? "Mute microphone" : "Mic is muted"}
            </button>
            <button
              onClick={toggleLobbyCam}
              className={`media-toggle${!camOn ? " off" : ""}`}
            >
              {camOn ? <Camera size={13} /> : <CameraOff size={13} />}
              {camOn ? "Stop camera" : "Camera off"}
            </button>
          </div>
        </div>
        <div className="lobby-info">
          <div className="glass-card">
            <div className="glass-card-inner">
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  marginBottom: 16,
                  flexWrap: "wrap",
                }}
              >
                {isHost ? (
                  <span className="pill pill-amber">
                    <Shield size={9} /> Host
                  </span>
                ) : (
                  <span className="pill pill-indigo">
                    <UserCheck size={9} /> Participant
                  </span>
                )}
                <span
                  className={`pill ${meeting?.status === "live" ? "pill-green" : "pill-gray"}`}
                >
                  {meeting?.status === "live" ? (
                    <>
                      <span
                        className="pulse-dot"
                        style={{
                          display: "inline-block",
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--green)",
                        }}
                      />{" "}
                      Live
                    </>
                  ) : meeting?.status === "scheduled" ? (
                    "Scheduled"
                  ) : (
                    meeting?.status || "Scheduled"
                  )}
                </span>
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: 6,
                  lineHeight: 1.3,
                }}
              >
                {meeting?.title || "Meeting"}
              </div>
              {isGuest && (
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--text-3)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    Join As Guest
                  </div>
                  <input
                    value={currentUser?.full_name || ""}
                    onChange={(e) => onGuestNameChange?.(e.target.value)}
                    placeholder="Write your name"
                    style={{
                      width: "100%",
                      border: "1px solid var(--border)",
                      borderRadius: 12,
                      padding: "12px 14px",
                      fontSize: 14,
                      fontFamily: "var(--font)",
                      color: "var(--text)",
                      background: "var(--bg)",
                      outline: "none",
                    }}
                  />
                </div>
              )}
              {meeting?.description && (
                <div
                  style={{
                    fontSize: 13,
                    color: "var(--text-2)",
                    marginBottom: 16,
                    lineHeight: 1.6,
                  }}
                >
                  {meeting.description}
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {meeting?.meeting_date && (
                  <div className="meta-row">
                    <div className="meta-icon">
                      <Calendar size={12} style={{ color: "var(--text-3)" }} />
                    </div>
                    {fmtMeetingDate(meeting.meeting_date)}
                  </div>
                )}
                {meeting?.duration && (
                  <div className="meta-row">
                    <div className="meta-icon">
                      <Clock size={12} style={{ color: "var(--text-3)" }} />
                    </div>
                    {meeting.duration} minutes
                  </div>
                )}
                {(meeting?.attendee_emails || []).length > 0 && (
                  <div className="meta-row">
                    <div className="meta-icon">
                      <Users size={12} style={{ color: "var(--text-3)" }} />
                    </div>
                    {meeting.attendee_emails.length} participant
                    {meeting.attendee_emails.length !== 1 ? "s" : ""} invited
                  </div>
                )}
              </div>
            </div>
          </div>
          {agendaItems.length > 0 && (
            <div className="glass-card">
              <div className="glass-card-inner">
                <div
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    marginBottom: 14,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <ListChecks size={10} style={{ color: "var(--text-3)" }} />{" "}
                  Agenda
                </div>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 9 }}
                >
                  {agendaItems.slice(0, 3).map((a, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        fontSize: 12,
                        color: "var(--text-2)",
                      }}
                    >
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background:
                            i === 0 ? "var(--accent)" : "var(--surface-2)",
                          color: i === 0 ? "white" : "var(--text-3)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                          border: i === 0 ? "none" : "1px solid var(--border)",
                        }}
                      >
                        {i + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          color: i === 0 ? "var(--text)" : "var(--text-2)",
                          fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        {a.text}
                      </span>
                      {a.dur && (
                        <span
                          style={{
                            color: "var(--text-3)",
                            flexShrink: 0,
                            fontSize: 11,
                          }}
                        >
                          {a.dur}m
                        </span>
                      )}
                    </div>
                  ))}
                  {agendaItems.length > 3 && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        paddingLeft: 32,
                      }}
                    >
                      +{agendaItems.length - 3} more items
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          {canJoin ? (
            <button
              onClick={handleJoin}
              disabled={
                joining ||
                guestJoinStatus === "pending" ||
                (isGuest && !currentUser?.full_name?.trim())
              }
              className={`btn ${isHost ? "btn-primary" : "btn-green"} btn-lg`}
            >
              {joining ? (
                <div
                  className="spin"
                  style={{
                    width: 16,
                    height: 16,
                    border: "2px solid rgba(255,255,255,0.3)",
                    borderTopColor: "white",
                    borderRadius: "50%",
                  }}
                />
              ) : isHost ? (
                <Video size={15} />
              ) : (
                <LogIn size={15} />
              )}
              {joining
                ? "Connecting-"
                : guestJoinStatus === "pending"
                  ? "Waiting For Host Approval-"
                  : isHost
                    ? "Start Meeting"
                    : guestJoinStatus === "rejected"
                      ? "Request Access Again"
                      : "Join Meeting"}
            </button>
          ) : (
            <div>
              <div
                className="btn btn-ghost btn-lg"
                style={{
                  cursor: "not-allowed",
                  opacity: 0.5,
                  marginBottom: 10,
                }}
              >
                <Clock size={15} /> Meeting Not Started Yet
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  padding: "12px 14px",
                  background: "var(--amber-subtle)",
                  border: "1px solid rgba(217,119,6,0.2)",
                  borderRadius: 12,
                }}
              >
                <AlertCircle
                  size={13}
                  style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }}
                />
                <p
                  style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    margin: 0,
                    lineHeight: 1.55,
                  }}
                >
                  The host hasn't started yet. You'll be able to join once it's
                  live.
                </p>
              </div>
            </div>
          )}
          {isGuest && guestJoinStatus === "pending" && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--text-2)",
                textAlign: "center",
              }}
            >
              Your join request has been sent to the host.
            </div>
          )}
          {isGuest && guestJoinStatus === "rejected" && (
            <div
              style={{
                marginTop: 10,
                fontSize: 12,
                color: "var(--red)",
                textAlign: "center",
              }}
            >
              The host declined your request.
            </div>
          )}
          <button
            onClick={onBack}
            style={{
              fontSize: 12,
              color: "var(--text-3)",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "center",
              padding: "4px 0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              fontFamily: "var(--font)",
              transition: "color var(--transition)",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.color = "var(--text-2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            - Back to meetings
          </button>
        </div>
      </div>
    </div>
  );
}

// - Main Room -
export default function MeetingRoom() {
  const { roomId } = useParams();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1440,
  );
  const [meetingDbId, setMeetingDbId] = useState(null);

  const [phase, setPhase] = useState("lobby");
  const [currentUser, setCurrentUser] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [meeting, setMeeting] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [profilesMap, setProfilesMap] = useState({});
  const [participantRecord, setParticipantRecord] = useState(null);
  const [createdMeeting, setCreatedMeeting] = useState(null);

  const [participants, setParticipants] = useState([]);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [screenOn, setScreenOn] = useState(false);
  const [recOn, setRecOn] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [openDrawer, setOpenDrawer] = useState(null);
  const [openMoreMenu, setOpenMoreMenu] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [speakingId, setSpeakingId] = useState(null);
  const [pinnedId, setPinnedId] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [roomSec, setRoomSec] = useState(0);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [unreadChat, setUnreadChat] = useState(0);
  const [selectedBg, setSelectedBg] = useState("none");
  const [bgApplying, setBgApplying] = useState(false);
  const [guestJoinRequests, setGuestJoinRequests] = useState([]);
  const [guestJoinStatus, setGuestJoinStatus] = useState("idle");

  const recordingChunksRef = useRef([]);
  const mediaRecorderRef = useRef(null);
  const localStreamRef = useRef(null);
  const cameraStreamRef = useRef(null);
  // screenStreamRef holds the screen capture stream (separate from localStreamRef)
  const screenStreamRef = useRef(null);
  const peerConnectionsRef = useRef({});
  const signalingRef = useRef(null);
  const timerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const rafRef = useRef(null);
  const chatEndRef = useRef(null);
  const chatLogRef = useRef([]);
  const roomSecRef = useRef(0);
  const meetingStartedAtRef = useRef(null);
  const currentUserRef = useRef(null);
  const isHostRef = useRef(false);
  const micOnRef = useRef(true);
  const camOnRef = useRef(true);
  const screenOnRef = useRef(false);
  const participantRecordRef = useRef(null);
  const speakingEntriesRef = useRef([]);
  const speakingTimelineRef = useRef([]);
  const activeSpeakerSegmentRef = useRef(null);
  const speakingIdRef = useRef(null);
  const approvalChannelRef = useRef(null);
  const pendingJoinPrefsRef = useRef(null);
  const meetingMixCtxRef = useRef(null);
  const meetingMixDestRef = useRef(null);
  const meetingMixNodesRef = useRef([]);
  const meetingAudioRecorderRef = useRef(null);
  const meetingAudioChunksRef = useRef([]);
  const meetingAudioBlobRef = useRef(null);
  const approvalSoundCtxRef = useRef(null);
  const selectedBgRef = useRef("none");
  const bgApplySeqRef = useRef(0);
  const bgImageCacheRef = useRef({});
  const virtualBgRef = useRef({
    active: false,
    sourceVideo: null,
    processingCanvas: null,
    processingCtx: null,
    selfieSegmentation: null,
    rafId: null,
    processing: false,
    lastProcessAt: 0,
    outputStream: null,
    outputTrack: null,
  });

  const applyOutgoingVideoTrack = useCallback(async (track) => {
    for (const pc of Object.values(peerConnectionsRef.current)) {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        try {
          await sender.replaceTrack(track || null);
        } catch (e) {
          console.warn("replaceTrack failed:", e);
        }
      }
    }
  }, []);

  const ensureBackgroundAsset = useCallback(async (bgId) => {
    const bg = BG_OPTIONS.find((b) => b.id === bgId);
    if (!bg?.isImage) return null;
    const src = bg.imageSrc;
    if (!src) return null;
    const cached = bgImageCacheRef.current[bgId];
    if (cached?.img?.complete) return cached.img;
    if (cached?.promise) return cached.promise;

    const promise = new Promise((resolve, reject) => {
      const img = new window.Image();
      img.onload = () => {
        bgImageCacheRef.current[bgId] = { img };
        resolve(img);
      };
      img.onerror = () => reject(new Error(`Failed to load background image: ${bgId}`));
      img.src = src;
    });
    bgImageCacheRef.current[bgId] = { promise };
    return promise;
  }, []);

  const stopVirtualBackground = useCallback(() => {
    const vb = virtualBgRef.current;
    vb.active = false;
    if (vb.rafId) cancelAnimationFrame(vb.rafId);
    vb.rafId = null;
    vb.processing = false;
    vb.lastProcessAt = 0;
    try {
      vb.outputTrack?.stop();
    } catch {}
    vb.outputTrack = null;
    vb.outputStream = null;
    if (vb.sourceVideo) {
      try {
        vb.sourceVideo.pause?.();
      } catch {}
      vb.sourceVideo.srcObject = null;
    }
    vb.sourceVideo = null;
    vb.processingCanvas = null;
    vb.processingCtx = null;
    vb.selfieSegmentation = null;
  }, []);

  const syncLocalDisplayStream = useCallback(
    (videoTrack) => {
      const cameraStream = cameraStreamRef.current;
      if (!cameraStream) return;
      const audioTracks = cameraStream.getAudioTracks() || [];
      const displayStream = new MediaStream([
        ...(videoTrack ? [videoTrack] : []),
        ...audioTracks,
      ]);
      localStreamRef.current = displayStream;
      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal
            ? {
                ...p,
                stream: displayStream,
                camOn: camOnRef.current,
              }
            : p,
        ),
      );
    },
    [setParticipants],
  );

  const startVirtualBackground = useCallback(
    async (bgId) => {
      const cameraStream = cameraStreamRef.current;
      const camTrack = cameraStream?.getVideoTracks?.()[0];
      if (!cameraStream || !camTrack || !camOnRef.current || screenOnRef.current) {
        return;
      }
      const SelfieSegmentation = await loadSelfieSegmentationScript();

      const bgImage = await ensureBackgroundAsset(bgId);
      const settings = camTrack.getSettings?.() || {};

      const sourceVideo = document.createElement("video");
      sourceVideo.autoplay = true;
      sourceVideo.muted = true;
      sourceVideo.playsInline = true;
      sourceVideo.srcObject = new MediaStream([camTrack]);
      await sourceVideo.play();

      const baseWidth = Math.max(settings.width || 0, sourceVideo.videoWidth || 0, 640);
      const baseHeight = Math.max(settings.height || 0, sourceVideo.videoHeight || 0, 360);
      const targetMaxWidth = 720;
      const scale = Math.min(1, targetMaxWidth / baseWidth);
      const width = Math.max(640, Math.round((baseWidth * scale) / 2) * 2);
      const height = Math.max(360, Math.round((baseHeight * scale) / 2) * 2);

      const processingCanvas = document.createElement("canvas");
      processingCanvas.width = width;
      processingCanvas.height = height;
      const processingCtx = processingCanvas.getContext("2d");
      if (!processingCtx) return;
      processingCtx.imageSmoothingEnabled = true;
      processingCtx.imageSmoothingQuality = "high";

      const selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`,
      });
      // modelSelection: 0 is lighter/faster and improves stability on lower-end devices.
      selfieSegmentation.setOptions({ modelSelection: 0 });

      const vb = virtualBgRef.current;
      vb.active = true;
      vb.sourceVideo = sourceVideo;
      vb.processingCanvas = processingCanvas;
      vb.processingCtx = processingCtx;
      vb.selfieSegmentation = selfieSegmentation;
      vb.lastProcessAt = 0;

      let firstFrameResolved = false;
      let resolveFirstFrame = null;
      const firstFramePromise = new Promise((resolve) => {
        resolveFirstFrame = resolve;
      });

      selfieSegmentation.onResults((results) => {
        if (!vb.active || !vb.processingCtx || !vb.processingCanvas) return;
        const ctx = vb.processingCtx;
        const w = vb.processingCanvas.width;
        const h = vb.processingCanvas.height;
        ctx.save();
        ctx.clearRect(0, 0, w, h);

        // Keep foreground person.
        ctx.drawImage(results.segmentationMask, 0, 0, w, h);
        ctx.globalCompositeOperation = "source-in";
        ctx.drawImage(results.image, 0, 0, w, h);

        // Draw selected background behind foreground.
        ctx.globalCompositeOperation = "destination-over";
        drawVirtualBackground(
          ctx,
          w,
          h,
          selectedBgRef.current,
          results.image,
          (selectedBgRef.current === bgId ? bgImage : null) ||
            bgImageCacheRef.current[selectedBgRef.current]?.img ||
            null,
        );
        ctx.globalCompositeOperation = "source-over";
        ctx.restore();
        if (!firstFrameResolved && resolveFirstFrame) {
          firstFrameResolved = true;
          resolveFirstFrame(true);
        }
      });

      const outputStream = processingCanvas.captureStream(15);
      const outputTrack = outputStream.getVideoTracks()[0];
      vb.outputStream = outputStream;
      vb.outputTrack = outputTrack;

      syncLocalDisplayStream(outputTrack);
      await applyOutgoingVideoTrack(camOnRef.current ? outputTrack : null);

      const renderLoop = async () => {
        if (!vb.active || !vb.sourceVideo || !vb.selfieSegmentation) return;
        if (!camOnRef.current || screenOnRef.current || selectedBgRef.current === "none") {
          return;
        }
        const now = performance.now();
        if (now - (vb.lastProcessAt || 0) < 1000 / 15) {
          vb.rafId = requestAnimationFrame(renderLoop);
          return;
        }
        vb.lastProcessAt = now;
        if (!vb.processing && vb.sourceVideo.readyState >= 2) {
          vb.processing = true;
          try {
            await vb.selfieSegmentation.send({ image: vb.sourceVideo });
          } catch (err) {
            console.warn("Virtual background frame failed:", err);
          } finally {
            vb.processing = false;
          }
        }
        vb.rafId = requestAnimationFrame(renderLoop);
      };
      vb.rafId = requestAnimationFrame(renderLoop);

      await Promise.race([
        firstFramePromise,
        new Promise((resolve) => setTimeout(resolve, 900)),
      ]);
    },
    [applyOutgoingVideoTrack, ensureBackgroundAsset, syncLocalDisplayStream],
  );

  useEffect(() => {
    loadInitialData();
  }, []);
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

  useEffect(() => {
    selectedBgRef.current = selectedBg;
    let cancelled = false;
    const seq = ++bgApplySeqRef.current;

    const applyBgSelection = async () => {
      const vb = virtualBgRef.current;
      if (screenOnRef.current) {
        setBgApplying(false);
        return;
      }
      const cameraTrack = cameraStreamRef.current?.getVideoTracks?.()[0] || null;

      if (!selectedBg || selectedBg === "none") {
        setBgApplying(true);
        stopVirtualBackground();
        if (!cancelled) {
          syncLocalDisplayStream(cameraTrack);
          await applyOutgoingVideoTrack(camOnRef.current ? cameraTrack : null);
        }
        return;
      }

      // Preload image background once to avoid stutters on first frame.
      try {
        await ensureBackgroundAsset(selectedBg);
      } catch (err) {
        console.warn("Background asset preload failed:", err);
      }

      if (!camOnRef.current || !cameraTrack) {
        setBgApplying(false);
        return;
      }

      // Fast-path: VB pipeline already active; just switch selectedBgRef and keep running.
      if (vb.active && vb.outputTrack) {
        if (!cancelled) {
          syncLocalDisplayStream(vb.outputTrack);
          await applyOutgoingVideoTrack(camOnRef.current ? vb.outputTrack : null);
        }
        setBgApplying(false);
        return;
      }

      setBgApplying(true);
      stopVirtualBackground();
      if (!cancelled) {
        try {
          await startVirtualBackground(selectedBg);
        } catch (err) {
          console.warn("Virtual background init failed:", err);
        }
      }
    };

    applyBgSelection().finally(() => {
      if (!cancelled && bgApplySeqRef.current === seq) {
        setBgApplying(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    selectedBg,
    ensureBackgroundAsset,
    startVirtualBackground,
    stopVirtualBackground,
    applyOutgoingVideoTrack,
    syncLocalDisplayStream,
  ]);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);
  useEffect(() => {
    if (openDrawer === "chat") setUnreadChat(0);
  }, [openDrawer]);
  useEffect(() => {
    micOnRef.current = micOn;
  }, [micOn]);
  useEffect(() => {
    camOnRef.current = camOn;
  }, [camOn]);
  useEffect(() => {
    screenOnRef.current = screenOn;
  }, [screenOn]);
  useEffect(() => {
    participantRecordRef.current = participantRecord;
  }, [participantRecord]);

  const updateGuestName = useCallback(
    (name) => {
      setCurrentUser((prev) => {
        const next = {
          ...(prev || createGuestProfile(roomId)),
          full_name: name,
          isGuest: true,
        };
        currentUserRef.current = next;
        setProfilesMap((current) => ({ ...current, [next.id]: next }));
        return next;
      });
    },
    [roomId],
  );

  const loadInitialData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let profile = null;
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      profile = data || null;
    } else {
      profile = createGuestProfile(roomId);
    }

    setCurrentUser(profile);
    currentUserRef.current = profile;

    let mtg = null;
    const meetingByRoom = await supabase
      .from("meetings")
      .select("*")
      .eq("meeting_room_id", roomId)
      .maybeSingle();
    mtg = meetingByRoom.data || null;
    if (!mtg) {
      const meetingById = await supabase
        .from("meetings")
        .select("*")
        .eq("id", roomId)
        .maybeSingle();
      mtg = meetingById.data || null;
    }

    if (mtg) {
      setMeeting(mtg);
      setMeetingDbId(mtg.id);
      const hostId = mtg.created_by || mtg.user_id;
      const host = !!user && hostId === user.id;
      setIsHost(host);
      isHostRef.current = host;
      if (mtg.tenant_id) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name,email,job_title,user_photo")
          .eq("tenant_id", mtg.tenant_id);
        setProfiles(profs || []);
        const map = {};
        (profs || []).forEach((p) => {
          map[p.id] = p;
        });
        if (profile?.id) map[profile.id] = profile;
        setProfilesMap(map);
      } else if (profile) {
        setProfilesMap({ [profile.id]: profile });
      }
    } else {
      setIsHost(true);
      isHostRef.current = true;
      if (profile) setProfilesMap({ [profile.id]: profile });
    }
  };

  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    try {
      audioCtxRef.current?.close();
    } catch {}
    try {
      meetingMixCtxRef.current?.close();
    } catch {}
    try {
      approvalSoundCtxRef.current?.close();
    } catch {}
    speakingEntriesRef.current.forEach(({ source, analyser }) => {
      try {
        source.disconnect();
      } catch {}
      try {
        analyser.disconnect();
      } catch {}
    });
    meetingMixNodesRef.current.forEach(({ source, gain }) => {
      try {
        source.disconnect();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
    });
    if (
      meetingAudioRecorderRef.current &&
      meetingAudioRecorderRef.current.state !== "inactive"
    ) {
      try {
        meetingAudioRecorderRef.current.stop();
      } catch {}
    }
    speakingEntriesRef.current = [];
    meetingMixNodesRef.current = [];
    meetingMixCtxRef.current = null;
    meetingMixDestRef.current = null;
    meetingAudioRecorderRef.current = null;
    approvalSoundCtxRef.current = null;
    stopVirtualBackground();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peerConnectionsRef.current = {};
    if (signalingRef.current) supabase.removeChannel(signalingRef.current);
    if (approvalChannelRef.current) supabase.removeChannel(approvalChannelRef.current);
    clearInterval(timerRef.current);
  }, [stopVirtualBackground]);

  const playApprovalRequestSound = useCallback(() => {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;

      let ctx = approvalSoundCtxRef.current;
      if (!ctx || ctx.state === "closed") {
        ctx = new Ctx();
        approvalSoundCtxRef.current = ctx;
      }
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      const notes = [
        { freq: 880, at: 0 },
        { freq: 1174, at: 0.2 },
      ];
      notes.forEach(({ freq, at }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + at);
        gain.gain.setValueAtTime(0.0001, now + at);
        gain.gain.exponentialRampToValueAtTime(0.08, now + at + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + at + 0.16);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + at);
        osc.stop(now + at + 0.18);
      });
    } catch (e) {
      console.warn("Approval sound failed:", e);
    }
  }, []);

  useEffect(() => {
    const unlockAudio = async () => {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        if (!approvalSoundCtxRef.current || approvalSoundCtxRef.current.state === "closed") {
          approvalSoundCtxRef.current = new Ctx();
        }
        if (approvalSoundCtxRef.current.state === "suspended") {
          await approvalSoundCtxRef.current.resume();
        }
      } catch {}
    };
    window.addEventListener("pointerdown", unlockAudio, { passive: true });
    window.addEventListener("keydown", unlockAudio);
    return () => {
      window.removeEventListener("pointerdown", unlockAudio);
      window.removeEventListener("keydown", unlockAudio);
    };
  }, []);

  useEffect(() => {
    if (!roomId) return;
    let active = true;

    const setupApprovalChannel = async () => {
      if (approvalChannelRef.current) {
        await supabase.removeChannel(approvalChannelRef.current);
        approvalChannelRef.current = null;
      }
      const ch = supabase.channel(`room-approval-${roomId}`, {
        config: { broadcast: { self: false } },
      });
      approvalChannelRef.current = ch;

      ch.on("broadcast", { event: "guest-join-request" }, ({ payload }) => {
        if (!isHostRef.current || phase !== "room") return;
        if (!payload?.userId) return;
        setGuestJoinRequests((prev) => {
          if (prev.find((r) => r.userId === payload.userId)) return prev;
          setTimeout(() => {
            playApprovalRequestSound();
          }, 0);
          return [
            ...prev,
            {
              userId: payload.userId,
              name: payload.name || "Guest",
              requestedAt: payload.requestedAt || new Date().toISOString(),
            },
          ];
        });
      });

      ch.on("broadcast", { event: "guest-join-response" }, async ({ payload }) => {
        if (payload?.to !== currentUserRef.current?.id) return;
        if (payload?.approved) {
          setGuestJoinStatus("approved");
          const prefs = pendingJoinPrefsRef.current || { micOn: true, camOn: true };
          pendingJoinPrefsRef.current = null;
          await handleJoinInternal(prefs);
        } else {
          setGuestJoinStatus("rejected");
        }
      });

      ch.subscribe((status) => {
        if (status === "SUBSCRIBED" && active) {
          // channel ready for use
        }
      });
    };

    setupApprovalChannel();
    return () => {
      active = false;
      if (approvalChannelRef.current) {
        supabase.removeChannel(approvalChannelRef.current);
        approvalChannelRef.current = null;
      }
    };
  }, [roomId, phase]);

  // - createPC: clean peer connection setup -
  const createPC = useCallback((peerId, userId) => {
    // Close existing connection for this peer
    if (peerConnectionsRef.current[peerId]) {
      try {
        peerConnectionsRef.current[peerId].close();
      } catch {}
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current[peerId] = pc;

    // Add all local tracks to this peer connection
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, stream);
        } catch (e) {
          console.warn(
            `Failed to add ${track.kind} track to peer ${peerId}:`,
            e,
          );
        }
      });
    }

    // Per-peer remote stream accumulator - critical for combining tracks correctly
    const remoteStream = new MediaStream();

    pc.ontrack = (e) => {
      const track = e.track;
      console.log(
        `[ontrack] ${track.kind} track from peer ${peerId}, state: ${track.readyState}`,
      );

      // Ensure track is enabled
      track.enabled = true;

      // Add track to this peer's dedicated remote stream
      // Remove old tracks of same kind first to avoid duplicates
      remoteStream
        .getTracks()
        .filter((t) => t.kind === track.kind)
        .forEach((t) => {
          remoteStream.removeTrack(t);
        });
      remoteStream.addTrack(track);

      // Update participant state with the combined stream
      setParticipants((prev) =>
        prev.map((p) =>
          p.peerId === peerId ? { ...p, stream: remoteStream } : p,
        ),
      );

      // Handle track mute/unmute to update camOn state
      track.onmute = () => {
        if (track.kind === "video") {
          setParticipants((prev) =>
            prev.map((p) => (p.peerId === peerId ? { ...p, camOn: false } : p)),
          );
        }
      };
      track.onunmute = () => {
        if (track.kind === "video") {
          setParticipants((prev) =>
            prev.map((p) => (p.peerId === peerId ? { ...p, camOn: true } : p)),
          );
        }
      };
      track.onended = () => {
        if (track.kind === "video") {
          setParticipants((prev) =>
            prev.map((p) => (p.peerId === peerId ? { ...p, camOn: false } : p)),
          );
        }
      };
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && signalingRef.current) {
        signalingRef.current.send({
          type: "broadcast",
          event: "ice-candidate",
          payload: { candidate: e.candidate, to: peerId, from: userId },
        });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log(`[PC ${peerId}] state: ${pc.connectionState}`);
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setParticipants((prev) => prev.filter((p) => p.peerId !== peerId));
        delete peerConnectionsRef.current[peerId];
      }
    };

    pc.onnegotiationneeded = async () => {
      // Only the side that created the offer should re-negotiate
      // We handle this manually via sendOffer, so skip auto-negotiation
      // to avoid conflicts with our manual signaling flow
    };

    return pc;
  }, []);

  // - setupSignaling -
  const setupSignaling = useCallback(
    async (roomId, userId, profile) => {
      if (signalingRef.current)
        await supabase.removeChannel(signalingRef.current);

      const ch = supabase.channel(`room-${roomId}`, {
        config: { broadcast: { self: false } },
      });

      const sendOffer = async (pc, targetId) => {
        try {
          const offer = await pc.createOffer({
            offerToReceiveAudio: true,
            offerToReceiveVideo: true,
          });
          await pc.setLocalDescription(offer);
          ch.send({
            type: "broadcast",
            event: "offer",
            payload: {
              offer: pc.localDescription,
              to: targetId,
              from: userId,
              name: profile?.full_name,
              email: profile?.email,
              user_photo: profile?.user_photo,
              isHost: isHostRef.current,
            },
          });
        } catch (e) {
          console.error("sendOffer error:", e);
        }
      };

      // Helper to ensure we have a profile for a userId
      const ensureProfile = async (userId, payloadFallback) => {
        // Check current map
        const existing = profilesMap[userId];
        if (existing && existing.full_name) return existing;

        // Try DB
        try {
          const { data: dbProfile } = await supabase
            .from("profiles")
            .select("id,full_name,email,job_title,user_photo")
            .eq("id", userId)
            .single();
          if (dbProfile) {
            setProfilesMap((prev) => ({ ...prev, [userId]: dbProfile }));
            return dbProfile;
          }
        } catch {}

        // Fall back to payload data - CRITICAL: use payload name/photo
        const fallback = {
          id: userId,
          full_name:
            payloadFallback?.name || payloadFallback?.full_name || "Guest",
          email: payloadFallback?.email || "",
          user_photo: payloadFallback?.user_photo || null,
        };
        setProfilesMap((prev) => ({ ...prev, [userId]: fallback }));
        return fallback;
      };

      ch.on("broadcast", { event: "user-joined" }, async ({ payload }) => {
        if (payload.userId === userId) return;

        const userProfile = await ensureProfile(payload.userId, payload);

        setParticipants((prev) => {
          if (prev.find((p) => p.peerId === payload.userId)) return prev;
          return [
            ...prev,
            {
              peerId: payload.userId,
              profile: userProfile,
              isHost: payload.isHost || false,
              stream: null,
              micOn: payload.micOn !== false,
              camOn: payload.camOn !== false,
              handRaised: false,
            },
          ];
        });

        addSysMsg(`${userProfile.full_name || "Guest"} joined the meeting`);
        const pc = createPC(payload.userId, userId);
        await sendOffer(pc, payload.userId);
      })

        .on("broadcast", { event: "offer" }, async ({ payload }) => {
          if (payload.to !== userId) return;

          const userProfile = await ensureProfile(payload.from, payload);

          let pc = peerConnectionsRef.current[payload.from];
          if (!pc) {
            pc = createPC(payload.from, userId);
            setParticipants((prev) => {
              if (prev.find((p) => p.peerId === payload.from)) return prev;
              return [
                ...prev,
                {
                  peerId: payload.from,
                  profile: userProfile,
                  isHost: payload.isHost || false,
                  stream: null,
                  micOn: true,
                  camOn: true,
                  handRaised: false,
                },
              ];
            });
          }

          try {
            // Handle offer collision (glare)
            if (pc.signalingState === "have-local-offer") {
              await pc.setLocalDescription({ type: "rollback" });
            }
            if (
              pc.signalingState !== "stable" &&
              pc.signalingState !== "have-remote-offer"
            ) {
              console.warn(
                `[offer] unexpected signalingState: ${pc.signalingState}, skipping`,
              );
              return;
            }
            await pc.setRemoteDescription(
              new RTCSessionDescription(payload.offer),
            );
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ch.send({
              type: "broadcast",
              event: "answer",
              payload: {
                answer: pc.localDescription,
                to: payload.from,
                from: userId,
              },
            });
          } catch (e) {
            console.error("answer error:", e);
          }
        })

        .on("broadcast", { event: "answer" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const pc = peerConnectionsRef.current[payload.from];
          if (pc && pc.signalingState === "have-local-offer") {
            try {
              await pc.setRemoteDescription(
                new RTCSessionDescription(payload.answer),
              );
            } catch (e) {
              console.error("set answer error:", e);
            }
          }
        })

        .on("broadcast", { event: "ice-candidate" }, async ({ payload }) => {
          if (payload.to !== userId) return;
          const pc = peerConnectionsRef.current[payload.from];
          if (pc) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch {}
          }
        })

        .on("broadcast", { event: "chat" }, ({ payload }) => {
          if (payload.senderId === userId) return;
          const msg = {
            id: Date.now(),
            sender: payload.senderName || "Guest",
            text: payload.text,
            time: new Date(),
            isMe: false,
          };
          setChatMessages((prev) => [...prev, msg]);
          chatLogRef.current.push(msg);
          setUnreadChat((n) => n + 1);
        })

        .on("broadcast", { event: "user-left" }, ({ payload }) => {
          if (payload.userId === userId) return;
          addSysMsg(`${payload.name || "Guest"} left the meeting`);
          setParticipants((prev) =>
            prev.filter((p) => p.peerId !== payload.userId),
          );
          const pc = peerConnectionsRef.current[payload.userId];
          if (pc) {
            try {
              pc.close();
            } catch {}
            delete peerConnectionsRef.current[payload.userId];
          }
        })

        .on("broadcast", { event: "media-state" }, ({ payload }) => {
          if (payload.userId === userId) return;
          setParticipants((prev) =>
            prev.map((p) =>
              p.peerId === payload.userId
                ? { ...p, micOn: payload.micOn, camOn: payload.camOn }
                : p,
            ),
          );
        })

        .on("broadcast", { event: "screen-share-started" }, ({ payload }) => {
          if (payload.from === userId) return;
          setParticipants((prev) =>
            prev.map((p) =>
              p.peerId === payload.from ? { ...p, isScreenShare: true } : p,
            ),
          );
        })

        .on("broadcast", { event: "screen-share-stopped" }, ({ payload }) => {
          if (payload.from === userId) return;
          setParticipants((prev) =>
            prev.map((p) =>
              p.peerId === payload.from ? { ...p, isScreenShare: false } : p,
            ),
          );
        })

        .on("broadcast", { event: "hand-raised" }, ({ payload }) => {
          if (payload.userId === userId) return;
          addSysMsg(`- ${payload.name || "Guest"} raised their hand`);
          setParticipants((prev) =>
            prev.map((p) =>
              p.peerId === payload.userId ? { ...p, handRaised: true } : p,
            ),
          );
          setTimeout(() => {
            setParticipants((prev) =>
              prev.map((p) =>
                p.peerId === payload.userId ? { ...p, handRaised: false } : p,
              ),
            );
          }, 10000);
        })

        .on("broadcast", { event: "hand-lowered" }, ({ payload }) => {
          if (payload.userId === userId) return;
          setParticipants((prev) =>
            prev.map((p) =>
              p.peerId === payload.userId ? { ...p, handRaised: false } : p,
            ),
          );
        })

        .on("broadcast", { event: "meeting-ended" }, () => {
          addSysMsg("The host has ended the meeting");
          setTimeout(() => handleLeaveInternal(false), 2000);
        })

        .subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            ch.send({
              type: "broadcast",
              event: "user-joined",
              payload: {
                userId,
                name: profile?.full_name || "Guest",
                email: profile?.email,
                user_photo: profile?.user_photo,
                isHost: isHostRef.current,
                micOn: micOnRef.current,
                camOn: camOnRef.current,
              },
            });
          }
        });

      signalingRef.current = ch;
    },
    [createPC, profilesMap],
  );

  const handleJoinInternal = useCallback(
    async ({ micOn: initMic, camOn: initCam }) => {
      try {
        setMicOn(initMic);
        setCamOn(initCam);
        micOnRef.current = initMic;
        camOnRef.current = initCam;
        const currentProfile = currentUserRef.current || createGuestProfile(roomId);
        const userId = currentProfile.id;

        // Get audio and video together for proper device negotiation
        let stream = new MediaStream();
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: initCam
              ? {
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                  facingMode: "user",
                }
              : false,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              channelCount: 1,
            },
          });
        } catch {
          // Fallback: try audio only
          try {
            stream = await navigator.mediaDevices.getUserMedia({
              audio: {
                echoCancellation: true,
                noiseSuppression: true,
                autoGainControl: true,
              },
            });
          } catch {
            stream = new MediaStream();
          }
        }

        // Apply initial state to tracks
        stream.getAudioTracks().forEach((t) => {
          t.enabled = initMic;
        });
        stream.getVideoTracks().forEach((t) => {
          t.enabled = initCam;
        });
        cameraStreamRef.current = stream;
        localStreamRef.current = stream;

        currentUserRef.current = currentProfile;
        setCurrentUser(currentProfile);
        setParticipants([
          {
            peerId: userId,
            profile: currentProfile,
            stream,
            isLocal: true,
            isHost: isHostRef.current,
            micOn: initMic,
            camOn: initCam,
            handRaised: false,
          },
        ]);

        await setupSignaling(roomId, userId, currentProfile);
        addSysMsg("You joined the meeting");
        meetingStartedAtRef.current = Date.now();
        speakingTimelineRef.current = [];
        activeSpeakerSegmentRef.current = null;
        speakingIdRef.current = null;
        meetingAudioBlobRef.current = null;

        if (meetingDbId) {
          if (!currentProfile.isGuest) {
            const { data: rec } = await supabase
              .from("meeting_participants")
              .insert({
                meeting_id: meetingDbId,
                user_id: userId,
                joined_at: new Date().toISOString(),
                is_active: true,
                video_enabled: initCam,
                audio_enabled: initMic,
                screen_sharing: false,
              })
              .select()
              .single();
            setParticipantRecord(rec);
          } else {
            setParticipantRecord(null);
          }
          if (isHostRef.current) {
            await supabase
              .from("meetings")
              .update({ status: "live" })
              .eq("id", meetingDbId);
            setMeeting((m) => ({ ...m, status: "live" }));
          }
        }

        timerRef.current = setInterval(() => {
          setRoomSec((s) => {
            roomSecRef.current = s + 1;
            return s + 1;
          });
        }, 1000);

        setPhase("room");
      } catch (e) {
        console.error("handleJoin:", e);
      }
    },
    [meetingDbId, roomId, setupSignaling],
  );

  const sendGuestJoinRequest = useCallback(() => {
    const currentProfile = currentUserRef.current || createGuestProfile(roomId);
    if (!approvalChannelRef.current) return false;
    approvalChannelRef.current.send({
      type: "broadcast",
      event: "guest-join-request",
      payload: {
        userId: currentProfile.id,
        name: currentProfile.full_name || "Guest",
        requestedAt: new Date().toISOString(),
      },
    });
    return true;
  }, [roomId]);

  const handleJoin = useCallback(
    async ({ micOn: initMic, camOn: initCam }) => {
      const currentProfile = currentUserRef.current || createGuestProfile(roomId);
      if (currentProfile.isGuest && !isHostRef.current) {
        pendingJoinPrefsRef.current = { micOn: initMic, camOn: initCam };
        const sent = sendGuestJoinRequest();
        if (sent) setGuestJoinStatus("pending");
        return;
      }
      await handleJoinInternal({ micOn: initMic, camOn: initCam });
    },
    [handleJoinInternal, roomId, sendGuestJoinRequest],
  );

  const respondToGuestJoin = useCallback((req, approved) => {
    if (!approvalChannelRef.current || !req?.userId) return;
    approvalChannelRef.current.send({
      type: "broadcast",
      event: "guest-join-response",
      payload: {
        to: req.userId,
        approved,
      },
    });
    setGuestJoinRequests((prev) => prev.filter((r) => r.userId !== req.userId));
  }, []);

  const resolveSpeakerName = useCallback(
    (speakerId) => {
      if (!speakerId) return "Unknown";
      if (speakerId === currentUserRef.current?.id) {
        return currentUserRef.current?.full_name || "You";
      }
      return (
        profilesMap[speakerId]?.full_name ||
        participants.find((p) => p.peerId === speakerId)?.profile?.full_name ||
        "Guest"
      );
    },
    [participants, profilesMap],
  );

  const finalizeSpeakerSegment = useCallback((endedAt = Date.now()) => {
    const segment = activeSpeakerSegmentRef.current;
    if (!segment) return;
    const durationMs = endedAt - segment.startedAt;
    if (durationMs >= 1200) {
      speakingTimelineRef.current.push({
        speakerId: segment.speakerId,
        speakerName: segment.speakerName,
        startSec: Math.max(
          0,
          (segment.startedAt - (meetingStartedAtRef.current || segment.startedAt)) /
            1000,
        ),
        endSec: Math.max(
          0,
          (endedAt - (meetingStartedAtRef.current || endedAt)) / 1000,
        ),
        durationSec: +(durationMs / 1000).toFixed(1),
      });
    }
    activeSpeakerSegmentRef.current = null;
  }, []);

  const rebuildAudioAnalysis = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    speakingEntriesRef.current.forEach(({ source, analyser }) => {
      try {
        source.disconnect();
      } catch {}
      try {
        analyser.disconnect();
      } catch {}
    });
    speakingEntriesRef.current = [];

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    try {
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      const entries = [];
      const localAudioStream = cameraStreamRef.current || localStreamRef.current;
      const localTracks = localAudioStream?.getAudioTracks() || [];
      if (localTracks.length) {
        const source = ctx.createMediaStreamSource(new MediaStream(localTracks));
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        entries.push({
          source,
          analyser,
          speakerId: currentUserRef.current?.id,
          threshold: micOnRef.current ? 15 : Number.POSITIVE_INFINITY,
        });
      }

      participants
        .filter((p) => !p.isLocal && p.stream?.getAudioTracks?.().length)
        .forEach((participant) => {
          const source = ctx.createMediaStreamSource(
            new MediaStream(participant.stream.getAudioTracks()),
          );
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 512;
          source.connect(analyser);
          entries.push({
            source,
            analyser,
            speakerId: participant.peerId,
            threshold: participant.micOn === false ? Number.POSITIVE_INFINITY : 18,
          });
        });

      speakingEntriesRef.current = entries;

      const tick = () => {
        let loudestSpeaker = null;
        let loudestLevel = 0;

        entries.forEach((entry) => {
          const data = new Uint8Array(entry.analyser.frequencyBinCount);
          entry.analyser.getByteFrequencyData(data);
          const avg = data.reduce((sum, value) => sum + value, 0) / data.length;
          if (avg > entry.threshold && avg > loudestLevel) {
            loudestLevel = avg;
            loudestSpeaker = entry.speakerId;
          }
        });

        setSpeakingId((prev) => (prev === loudestSpeaker ? prev : loudestSpeaker));
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (error) {
      console.warn("Audio analysis unavailable:", error);
    }
  }, [participants]);

  const rebuildMeetingAudioMix = useCallback(async () => {
    if (!isHostRef.current) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = meetingMixCtxRef.current || new AudioCtx();
    meetingMixCtxRef.current = ctx;
    if (!meetingMixDestRef.current) {
      meetingMixDestRef.current = ctx.createMediaStreamDestination();
    }

    meetingMixNodesRef.current.forEach(({ source, gain }) => {
      try {
        source.disconnect();
      } catch {}
      try {
        gain.disconnect();
      } catch {}
    });
    meetingMixNodesRef.current = [];

    const streams = [];
    const localAudioStream = cameraStreamRef.current || localStreamRef.current;
    if (localAudioStream?.getAudioTracks?.().length) {
      streams.push(localAudioStream);
    }
    participants
      .filter((p) => !p.isLocal && p.stream?.getAudioTracks?.().length)
      .forEach((participant) => {
        streams.push(participant.stream);
      });

    streams.forEach((stream) => {
      const source = ctx.createMediaStreamSource(
        new MediaStream(stream.getAudioTracks()),
      );
      const gain = ctx.createGain();
      gain.gain.value = 1;
      source.connect(gain);
      gain.connect(meetingMixDestRef.current);
      meetingMixNodesRef.current.push({ source, gain });
    });

    try {
      await ctx.resume();
    } catch {}
  }, [participants]);

  const ensureMeetingAudioRecording = useCallback(async () => {
    if (!isHostRef.current || meetingAudioRecorderRef.current) return;
    const mixedStream = meetingMixDestRef.current?.stream;
    if (!mixedStream?.getAudioTracks?.().length) return;

    const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";

    const recorder = new MediaRecorder(mixedStream, { mimeType });
    meetingAudioChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data?.size) {
        meetingAudioChunksRef.current.push(event.data);
      }
    };
    recorder.onstop = () => {
      meetingAudioBlobRef.current = meetingAudioChunksRef.current.length
        ? new Blob(meetingAudioChunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          })
        : null;
      meetingAudioRecorderRef.current = null;
    };
    recorder.start(1000);
    meetingAudioRecorderRef.current = recorder;
  }, []);

  const stopMeetingAudioRecording = useCallback(async () => {
    const recorder = meetingAudioRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      return meetingAudioBlobRef.current;
    }

    return await new Promise((resolve) => {
      const handleStop = () => {
        recorder.removeEventListener("stop", handleStop);
        resolve(meetingAudioBlobRef.current);
      };
      recorder.addEventListener("stop", handleStop);
      recorder.stop();
    });
  }, []);

  const transcribeMeetingAudio = useCallback(async (audioBlob) => {
    if (!audioBlob || !GROQ_API_KEY) return null;

    const formData = new FormData();
    formData.append(
      "file",
      new File([audioBlob], "meeting-audio.webm", {
        type: audioBlob.type || "audio/webm",
      }),
    );
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("response_format", "verbose_json");
    formData.append("language", "en");
    formData.append("temperature", "0");
    formData.append("timestamp_granularities[]", "segment");

    const response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Meeting transcription failed");
    }

    return await response.json();
  }, []);

  const buildAttributedTranscript = useCallback(
    (transcription) => {
      const segments = Array.isArray(transcription?.segments)
        ? transcription.segments
        : [];
      if (!segments.length) {
        return transcription?.text?.trim() || "";
      }

      const speakerTimeline = speakingTimelineRef.current;
      const findSpeakerForSegment = (startSec, endSec) => {
        let bestSpeaker = null;
        let bestOverlap = 0;

        speakerTimeline.forEach((segment) => {
          const overlap =
            Math.min(segment.endSec, endSec) - Math.max(segment.startSec, startSec);
          if (overlap > bestOverlap) {
            bestOverlap = overlap;
            bestSpeaker = segment.speakerName;
          }
        });

        return bestSpeaker || "Unknown Speaker";
      };

      return segments
        .map((segment) => {
          const text = segment.text?.trim();
          if (!text) return null;
          const speaker = findSpeakerForSegment(
            Number(segment.start || 0),
            Number(segment.end || segment.start || 0),
          );
          return `[${speaker}] ${text}`;
        })
        .filter(Boolean)
        .join("\n");
    },
    [],
  );

  useEffect(() => {
    if (phase !== "room") return;
    rebuildAudioAnalysis();
  }, [phase, participants, micOn, rebuildAudioAnalysis]);

  useEffect(() => {
    if (phase !== "room" || !isHost) return;
    rebuildMeetingAudioMix().then(() => {
      ensureMeetingAudioRecording();
    });
  }, [
    phase,
    isHost,
    participants,
    micOn,
    rebuildMeetingAudioMix,
    ensureMeetingAudioRecording,
  ]);

  useEffect(() => {
    const now = Date.now();
    if (speakingIdRef.current === speakingId) return;

    if (speakingIdRef.current) {
      finalizeSpeakerSegment(now);
    }

    speakingIdRef.current = speakingId;

    if (speakingId) {
      activeSpeakerSegmentRef.current = {
        speakerId: speakingId,
        speakerName: resolveSpeakerName(speakingId),
        startedAt: now,
      };
    }
  }, [speakingId, finalizeSpeakerSegment, resolveSpeakerName]);

  // - Viewport tracking -
  useEffect(() => {
    const syncViewport = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  const isMobile = viewportWidth < 768;

  const addSysMsg = (text) => {
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), isSystem: true, text, time: new Date() },
    ]);
  };

  // - Toggle Mic -
  const toggleMic = useCallback(async () => {
    const activeStream = localStreamRef.current;
    const cameraStream = cameraStreamRef.current;
    if (!activeStream || !cameraStream) return;
    const newState = !micOnRef.current;

    // Enable/disable audio tracks for both active and underlying camera streams
    activeStream.getAudioTracks().forEach((t) => {
      t.enabled = newState;
    });
    cameraStream.getAudioTracks().forEach((t) => {
      t.enabled = newState;
    });

    setMicOn(newState);
    micOnRef.current = newState;
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal
          ? {
              ...p,
              micOn: newState,
              stream: screenOnRef.current ? activeStream : cameraStream,
            }
          : p,
      ),
    );

    if (participantRecordRef.current) {
      await supabase
        .from("meeting_participants")
        .update({
          audio_enabled: newState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participantRecordRef.current.id);
    }

    signalingRef.current?.send({
      type: "broadcast",
      event: "media-state",
      payload: {
        userId: currentUserRef.current?.id,
        micOn: newState,
        camOn: camOnRef.current,
      },
    });
  }, []);

  // - Toggle Cam -
  // Strategy: keep a camera stream reference and swap video output as needed.
  // Avoid mutating the live screen-sharing stream. Use cameraStreamRef for camera management.
  const toggleCam = useCallback(async () => {
    const cameraStream = cameraStreamRef.current;
    if (!cameraStream) return;

    const newState = !camOnRef.current;
    const videoTracks = cameraStream.getVideoTracks();

    if (newState && videoTracks.length === 0) {
      try {
        const vs = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
        });
        const vt = vs.getVideoTracks()[0];
        vt.enabled = true;
        cameraStream.addTrack(vt);

        if (!screenOnRef.current) {
          localStreamRef.current = cameraStream;
        }

        for (const [peerId, pc] of Object.entries(peerConnectionsRef.current)) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            await sender.replaceTrack(vt);
          } else {
            pc.addTrack(vt, localStreamRef.current || cameraStream);
          }
          if (pc.signalingState === "stable") {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            signalingRef.current?.send({
              type: "broadcast",
              event: "offer",
              payload: {
                offer: pc.localDescription,
                to: peerId,
                from: currentUserRef.current?.id,
              },
            });
          }
        }
      } catch (e) {
        console.warn("Could not enable camera:", e);
        return;
      }
    } else {
      // Toggle existing camera track state
      videoTracks.forEach((t) => {
        t.enabled = newState;
      });
    }

    setCamOn(newState);
    camOnRef.current = newState;

    if (!screenOnRef.current) {
      if (!newState) {
        stopVirtualBackground();
        await applyOutgoingVideoTrack(null);
        syncLocalDisplayStream(null);
      } else if (selectedBgRef.current && selectedBgRef.current !== "none") {
        try {
          await startVirtualBackground(selectedBgRef.current);
        } catch (err) {
          console.warn("Virtual background init failed:", err);
        }
      } else {
        const camTrackNow = cameraStreamRef.current?.getVideoTracks?.()[0] || null;
        await applyOutgoingVideoTrack(camTrackNow);
        syncLocalDisplayStream(camTrackNow);
      }
    }

    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal
          ? {
              ...p,
              camOn: newState,
              stream: localStreamRef.current || cameraStreamRef.current,
            }
          : p,
      ),
    );

    if (participantRecordRef.current) {
      await supabase
        .from("meeting_participants")
        .update({
          video_enabled: newState,
          updated_at: new Date().toISOString(),
        })
        .eq("id", participantRecordRef.current.id);
    }

    signalingRef.current?.send({
      type: "broadcast",
      event: "media-state",
      payload: {
        userId: currentUserRef.current?.id,
        micOn: micOnRef.current,
        camOn: newState,
      },
    });

    for (const [peerId, pc] of Object.entries(peerConnectionsRef.current)) {
      if (pc.signalingState === "stable") {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          signalingRef.current?.send({
            type: "broadcast",
            event: "offer",
            payload: {
              offer: pc.localDescription,
              to: peerId,
              from: currentUserRef.current?.id,
            },
          });
        } catch (e) {
          console.warn("Could not renegotiate after cam toggle:", e);
        }
      }
    }
  }, [
    applyOutgoingVideoTrack,
    startVirtualBackground,
    stopVirtualBackground,
    syncLocalDisplayStream,
  ]);

  // - Screen Share -
  // Strategy: use a SEPARATE screen stream. Replace only the video sender track.
  // Never mutate localStreamRef tracks - keep camera track intact for restoration.
  const toggleScreen = useCallback(async () => {
    const userId = currentUserRef.current?.id;

    if (screenOnRef.current) {
      // - Stop screen sharing -
      const screenTracks = screenStreamRef.current?.getTracks() || [];
      screenTracks.forEach((t) => t.stop());
      screenStreamRef.current = null;

      const camTrack = cameraStreamRef.current?.getVideoTracks()[0] || null;
      if (camOnRef.current && selectedBgRef.current !== "none") {
        try {
          await startVirtualBackground(selectedBgRef.current);
        } catch (err) {
          console.warn("Virtual background init failed:", err);
        }
      } else {
        stopVirtualBackground();
        await applyOutgoingVideoTrack(camOnRef.current ? camTrack : null);
        syncLocalDisplayStream(camOnRef.current ? camTrack : null);
      }

      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal
            ? {
                ...p,
                stream: localStreamRef.current || cameraStreamRef.current,
                isScreenShare: false,
              }
            : p,
        ),
      );

      signalingRef.current?.send({
        type: "broadcast",
        event: "screen-share-stopped",
        payload: { from: userId },
      });

      if (participantRecordRef.current) {
        await supabase
          .from("meeting_participants")
          .update({
            screen_sharing: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", participantRecordRef.current.id);
      }
      setScreenOn(false);
      screenOnRef.current = false;
    } else {
      // - Start screen sharing -
      try {
        stopVirtualBackground();
        const ss = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: "always" },
          audio: false,
        });
        screenStreamRef.current = ss;
        const screenTrack = ss.getVideoTracks()[0];

        // Replace video track in all senders - no need to renegotiate for replaceTrack
        for (const [peerId, pc] of Object.entries(peerConnectionsRef.current)) {
          const sender = pc.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            try {
              await sender.replaceTrack(screenTrack);
            } catch (e) {
              // No video sender exists yet - add the track and renegotiate
              try {
                pc.addTrack(screenTrack, ss);
                if (pc.signalingState === "stable") {
                  const offer = await pc.createOffer();
                  await pc.setLocalDescription(offer);
                  signalingRef.current?.send({
                    type: "broadcast",
                    event: "offer",
                    payload: {
                      offer: pc.localDescription,
                      to: peerId,
                      from: userId,
                    },
                  });
                }
              } catch (e2) {
                console.warn("Failed to add screen track:", e2);
              }
            }
          } else {
            // No video sender - add track and renegotiate
            try {
              pc.addTrack(screenTrack, ss);
              if (pc.signalingState === "stable") {
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                signalingRef.current?.send({
                  type: "broadcast",
                  event: "offer",
                  payload: {
                    offer: pc.localDescription,
                    to: peerId,
                    from: userId,
                  },
                });
              }
            } catch (e) {
              console.warn("Failed to add screen track to peer:", e);
            }
          }
        }

        // When user stops via browser's built-in stop button
        screenTrack.onended = async () => {
          if (screenOnRef.current) {
            setScreenOn(false);
            screenOnRef.current = false;
            screenStreamRef.current = null;
            const camTrack = cameraStreamRef.current?.getVideoTracks?.()[0] || null;
            if (camOnRef.current && selectedBgRef.current !== "none") {
              try {
                await startVirtualBackground(selectedBgRef.current);
              } catch (err) {
                console.warn("Virtual background init failed:", err);
              }
            } else {
              stopVirtualBackground();
              await applyOutgoingVideoTrack(camOnRef.current ? camTrack : null);
              syncLocalDisplayStream(camOnRef.current ? camTrack : null);
            }
            setParticipants((prev) =>
              prev.map((p) =>
                p.isLocal
                  ? {
                      ...p,
                      stream: localStreamRef.current || cameraStreamRef.current,
                      isScreenShare: false,
                    }
                  : p,
              ),
            );
            signalingRef.current?.send({
              type: "broadcast",
              event: "screen-share-stopped",
              payload: { from: userId },
            });
          }
        };

        // Build a display stream for the local tile (screen video + local audio)
        const displayStream = new MediaStream([
          screenTrack,
          ...(cameraStreamRef.current?.getAudioTracks() || []),
        ]);

        localStreamRef.current = displayStream;

        setParticipants((prev) =>
          prev.map((p) =>
            p.isLocal
              ? { ...p, stream: displayStream, isScreenShare: true }
              : p,
          ),
        );

        signalingRef.current?.send({
          type: "broadcast",
          event: "screen-share-started",
          payload: { from: userId },
        });

        if (participantRecordRef.current) {
          await supabase
            .from("meeting_participants")
            .update({
              screen_sharing: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", participantRecordRef.current.id);
        }

        setScreenOn(true);
        screenOnRef.current = true;
      } catch (e) {
        if (e.name !== "NotAllowedError") {
          console.error("Screen share error:", e);
          addSysMsg("- Screen sharing failed");
        }
      }
    }
  }, [
    applyOutgoingVideoTrack,
    startVirtualBackground,
    stopVirtualBackground,
    syncLocalDisplayStream,
  ]);

  // - Recording -
  const toggleRec = useCallback(() => {
    if (!recOn) {
      try {
        const stream = localStreamRef.current;
        if (!stream) return;
        recordingChunksRef.current = [];
        const recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) recordingChunksRef.current.push(e.data);
        };
        recorder.onstop = () => {
          const blob = new Blob(recordingChunksRef.current, {
            type: "video/webm",
          });
          downloadRecording(blob);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        addSysMsg("- Recording started");
      } catch (e) {
        console.error("Recording failed:", e);
      }
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      addSysMsg("- Recording stopped, saving-");
    }
    setRecOn((p) => !p);
  }, [recOn]);

  const downloadRecording = (blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `meeting-${meeting?.title || roomId}-${Date.now()}.webm`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const raiseHand = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    setParticipants((prev) =>
      prev.map((p) => (p.isLocal ? { ...p, handRaised: newState } : p)),
    );
    if (newState) {
      signalingRef.current?.send({
        type: "broadcast",
        event: "hand-raised",
        payload: {
          userId: currentUserRef.current?.id,
          name: currentUserRef.current?.full_name,
        },
      });
      addSysMsg("- You raised your hand");
      setTimeout(() => {
        setHandRaised(false);
        setParticipants((prev) =>
          prev.map((p) => (p.isLocal ? { ...p, handRaised: false } : p)),
        );
        signalingRef.current?.send({
          type: "broadcast",
          event: "hand-lowered",
          payload: {
            userId: currentUserRef.current?.id,
            name: currentUserRef.current?.full_name,
          },
        });
      }, 10000);
    } else {
      signalingRef.current?.send({
        type: "broadcast",
        event: "hand-lowered",
        payload: {
          userId: currentUserRef.current?.id,
          name: currentUserRef.current?.full_name,
        },
      });
      addSysMsg("- You lowered your hand");
    }
  };

  const sendChat = () => {
    if (!chatInput.trim()) return;
    const u = currentUserRef.current;
    const msg = {
      id: Date.now(),
      sender: u?.full_name || "You",
      text: chatInput.trim(),
      time: new Date(),
      isMe: true,
    };
    setChatMessages((prev) => [...prev, msg]);
    chatLogRef.current.push(msg);
    signalingRef.current?.send({
      type: "broadcast",
      event: "chat",
      payload: {
        senderId: u?.id,
        senderName: u?.full_name || "Guest",
        text: chatInput.trim(),
      },
    });
    setChatInput("");
  };

  const copyLink = async () => {
    const link = `${window.location.origin}/meet/${roomId}`;
    try {
      await navigator.clipboard?.writeText(link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Avoid uncaught AbortError from overlapping clipboard lock requests.
      console.warn("Clipboard write failed:", err);
    }
  };

  const handleLeaveInternal = useCallback(
    async (asHost = false) => {
      const u = currentUserRef.current;
      signalingRef.current?.send({
        type: "broadcast",
        event: asHost ? "meeting-ended" : "user-left",
        payload: { userId: u?.id, name: u?.full_name },
      });
      if (mediaRecorderRef.current && recOn) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      const rec = participantRecordRef.current;
      if (rec) {
        await supabase
          .from("meeting_participants")
          .update({
            left_at: new Date().toISOString(),
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq("id", rec.id);
      }
      if (asHost) {
        finalizeSpeakerSegment(Date.now());
      }
      const meetingAudioBlob = asHost ? await stopMeetingAudioRecording() : null;
      cleanup();
      const dur = Math.floor(roomSecRef.current / 60);
      if (meetingDbId && asHost) {
        await supabase
          .from("meetings")
          .update({ status: "ended", duration: dur })
          .eq("id", meetingDbId);
      }
      setPhase("ended");
      if (asHost) {
        setSummaryLoading(true);
        await generateAISummary(dur, meetingAudioBlob);
      }
    },
    [
      meetingDbId,
      cleanup,
      recOn,
      finalizeSpeakerSegment,
      stopMeetingAudioRecording,
    ],
  );

  const handleLeave = useCallback(
    async (asHost = false) => {
      await handleLeaveInternal(asHost);
    },
    [handleLeaveInternal],
  );

  const endMeeting = () => handleLeave(true);
  const leaveMeeting = () => handleLeave(false);

  const generateAISummary = async (dur, meetingAudioBlob) => {
    try {
      const mtg = meeting || {};
      const agendaItems = (() => {
        try {
          return Array.isArray(mtg.agenda_items)
            ? mtg.agenda_items
            : JSON.parse(mtg.agenda_items || "[]");
        } catch {
          return [];
        }
      })();
      const attendeeEmails = mtg.attendee_emails || [];
      const attendeeNameList = attendeeEmails.map(
        (email) => profiles.find((p) => p.email === email)?.full_name || email,
      );
      const joinedParticipantNames = (participants || [])
        .map((p) => p?.profile?.full_name || p?.name || "")
        .filter(Boolean);
      const knownParticipantNames = Array.from(
        new Set(
          [...attendeeNameList, ...joinedParticipantNames, currentUserRef.current?.full_name]
            .map((n) => String(n || "").trim())
            .filter(Boolean),
        ),
      );
      const attendeeNames = knownParticipantNames.join(", ");
      const participantNameMap = new Map(
        knownParticipantNames.map((n) => [n.toLowerCase(), n]),
      );
      const resolveAssignee = (value) => {
        const raw = String(value || "").trim();
        if (!raw) return "Unassigned";
        if (
          /^(unassigned|unknown|n\/a|na|tbd|none|no owner|team)$/i.test(raw)
        ) {
          return "Unassigned";
        }
        const normalized = raw.replace(/^@/, "").trim().toLowerCase();
        if (participantNameMap.has(normalized)) {
          return participantNameMap.get(normalized);
        }
        // Loose match (e.g. "Smith J." -> "Smith")
        const fuzzy = knownParticipantNames.find((pName) => {
          const p = pName.toLowerCase();
          return p.includes(normalized) || normalized.includes(p);
        });
        return fuzzy || "Unassigned";
      };
      const chatLog = chatLogRef.current.filter((m) => !m.isSystem);
      let transcription = null;
      try {
        transcription = await transcribeMeetingAudio(meetingAudioBlob);
      } catch (error) {
        console.warn("Meeting transcription unavailable:", error);
      }
      const attributedTranscript = buildAttributedTranscript(transcription);
      const speakerTimeline = speakingTimelineRef.current
        .map(
          (segment) =>
            `${segment.speakerName}: ${segment.startSec.toFixed(1)}s-${segment.endSec.toFixed(1)}s (${segment.durationSec}s)`,
        )
        .join("\n");
      const contextBlock =
        `Meeting Title: ${mtg.title || "Team Meeting"}\nDuration: ${dur || "?"} minutes\nParticipants: ${attendeeNames || "Unknown"}\nAgenda: ${agendaItems.map((a, i) => `${i + 1}. ${a.text} (${a.dur} min)`).join("; ") || "None set"}\nSpeaker Timeline:\n${speakerTimeline || "No speaker timeline captured"}\nSpoken Transcript:\n${attributedTranscript || transcription?.text || "No spoken transcript captured"}\nChat Log:\n${chatLog.length ? chatLog.map((m) => `[${m.sender}]: ${m.text}`).join("\n") : "No chat messages recorded"}`.trim();
      const systemPrompt = `You are an expert meeting analyst and note-taker. Analyze spoken transcript first, speaker timeline second, and chat log last.
Generate an in-depth, practical meeting summary similar to professional meeting tools.
Rules:
- Include what happened in the meeting, not generic filler.
- Keep facts grounded in the provided meeting data.
- Attribute actions/decisions to specific people when clear; otherwise use "Unassigned".
- NEVER invent participant names. Allowed assignees must be from the provided Participants list. If unsure, use "Unassigned".
- Extract explicit task assignments (who owns what) from transcript/chat and include them in actionItems/assignedTasks.
- If dates are unclear, set due to "TBD".
- Return ONLY valid JSON (no markdown, no backticks) with this exact shape:
{
  "summary": "1-2 short paragraphs (at least 120 words) covering context, discussion flow, outcomes, blockers, and status",
  "meetingNotes": ["chronological note 1", "chronological note 2", "chronological note 3"],
  "actionItems": [{"text": "...", "assignee": "...", "due": "...", "priority": "High|Medium|Low"}],
  "assignedTasks": [{"task": "...", "assignee": "...", "due": "...", "priority": "High|Medium|Low"}],
  "decisions": ["confirmed decision 1", "confirmed decision 2"],
  "futureDecisions": ["decision still pending 1", "decision still pending 2"],
  "nextSteps": ["next step 1", "next step 2"],
  "keyTopics": ["topic 1", "topic 2", "topic 3"],
  "sentiment": {"engagement": 75, "positivity": 70, "resolution": 80}
}`;
      const raw = await groq(systemPrompt, contextBlock, { maxTokens: 2200 });
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsedRaw = JSON.parse(clean);
      const parsed = {
        summary:
          typeof parsedRaw.summary === "string" && parsedRaw.summary.trim()
            ? parsedRaw.summary.trim()
            : "Detailed summary was unavailable.",
        meetingNotes: Array.isArray(parsedRaw.meetingNotes)
          ? parsedRaw.meetingNotes.filter(Boolean).slice(0, 18)
          : [],
        actionItems: Array.isArray(parsedRaw.actionItems)
          ? parsedRaw.actionItems
              .filter((a) => a && a.text)
              .map((a) => ({
                text: String(a.text || "").trim(),
                assignee: resolveAssignee(a.assignee),
                due: String(a.due || "TBD").trim(),
                priority: String(a.priority || "Medium").trim(),
              }))
          : [],
        assignedTasks: Array.isArray(parsedRaw.assignedTasks)
          ? parsedRaw.assignedTasks
              .filter((a) => a && (a.task || a.text))
              .map((a) => ({
                task: String(a.task || a.text || "").trim(),
                assignee: resolveAssignee(a.assignee),
                due: String(a.due || "TBD").trim(),
                priority: String(a.priority || "Medium").trim(),
              }))
              .filter((a) => a.task)
          : [],
        decisions: Array.isArray(parsedRaw.decisions)
          ? parsedRaw.decisions.filter(Boolean).slice(0, 12)
          : [],
        futureDecisions: Array.isArray(parsedRaw.futureDecisions)
          ? parsedRaw.futureDecisions.filter(Boolean).slice(0, 12)
          : [],
        nextSteps: Array.isArray(parsedRaw.nextSteps)
          ? parsedRaw.nextSteps.filter(Boolean).slice(0, 12)
          : [],
        keyTopics: Array.isArray(parsedRaw.keyTopics)
          ? parsedRaw.keyTopics.filter(Boolean).slice(0, 10)
          : [],
        sentiment: {
          engagement: Math.max(
            0,
            Math.min(100, Number(parsedRaw?.sentiment?.engagement || 0)),
          ),
          positivity: Math.max(
            0,
            Math.min(100, Number(parsedRaw?.sentiment?.positivity || 0)),
          ),
          resolution: Math.max(
            0,
            Math.min(100, Number(parsedRaw?.sentiment?.resolution || 0)),
          ),
        },
      };
      if (!parsed.assignedTasks.length) {
        parsed.assignedTasks = parsed.actionItems
          .filter((a) => a.assignee && a.assignee !== "Unassigned")
          .map((a) => ({
            task: a.text,
            assignee: a.assignee,
            due: a.due,
            priority: a.priority,
          }));
      }
      if (meetingDbId) {
        await supabase
          .from("meetings")
          .update({
            ai_summary: parsed.summary,
            ai_action_items: parsed.actionItems,
            ai_decisions: parsed.decisions,
            ai_sentiment: parsed.sentiment,
            transcript: JSON.stringify({
              ...parsed,
              _chatLog: chatLog,
              _speakerTimeline: speakingTimelineRef.current,
              _transcription: transcription?.text || "",
              _attributedTranscript: attributedTranscript || "",
              _knownParticipants: knownParticipantNames,
            }),
          })
          .eq("id", meetingDbId);
      }
      setSummaryData(parsed);
      if (attendeeEmails.length)
        await emailSummary(mtg, parsed, attendeeNames, attendeeEmails);
    } catch (e) {
      console.error("AI Summary error:", e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const emailSummary = async (mtg, summary, attendeeNames, emails) => {
    const escapeHtml = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const actionHtml = (summary.actionItems || [])
      .map(
        (a) =>
          `<tr>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.text)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.assignee)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.due)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.priority || "Medium")}</td>
          </tr>`,
      )
      .join("");
    const assignedTaskHtml = (summary.assignedTasks || [])
      .map(
        (a) =>
          `<tr>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.task)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.assignee)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.due)}</td>
            <td style="padding:8px;border:1px solid #d1d5db;">${escapeHtml(a.priority || "Medium")}</td>
          </tr>`,
      )
      .join("");
    const decisionsHtml = (summary.decisions || [])
      .map((d) => `<li style="margin:0 0 6px 0;">${escapeHtml(d)}</li>`)
      .join("");
    const meetingNotesHtml = (summary.meetingNotes || [])
      .map((n) => `<li style="margin:0 0 6px 0;">${escapeHtml(n)}</li>`)
      .join("");
    const futureDecisionsHtml = (summary.futureDecisions || [])
      .map((d) => `<li style="margin:0 0 6px 0;">${escapeHtml(d)}</li>`)
      .join("");
    const nextStepsHtml = (summary.nextSteps || [])
      .map((s) => `<li style="margin:0 0 6px 0;">${escapeHtml(s)}</li>`)
      .join("");
    const topicsHtml = (summary.keyTopics || [])
      .map((t) => `<li style="margin:0 0 6px 0;">${escapeHtml(t)}</li>`)
      .join("");

    const body = `<!DOCTYPE html>
<html>
  <body style="font-family:Arial,sans-serif;color:#111827;margin:0;padding:20px;background:#ffffff;">
    <div style="max-width:760px;margin:0 auto;">
      <h2 style="margin:0 0 8px 0;">Meeting Summary</h2>
      <p style="margin:0 0 4px 0;"><strong>Title:</strong> ${escapeHtml(mtg.title || "Team Meeting")}</p>
      <p style="margin:0 0 4px 0;"><strong>Duration:</strong> ${escapeHtml(mtg.duration || "-")} minutes</p>
      <p style="margin:0 0 16px 0;"><strong>Participants:</strong> ${escapeHtml(attendeeNames || "-")}</p>

      <h3 style="margin:16px 0 8px 0;">Overview</h3>
      <p style="margin:0 0 16px 0;line-height:1.6;">${escapeHtml(summary.summary || "Summary unavailable.")}</p>

      ${topicsHtml ? `<h3 style="margin:16px 0 8px 0;">Key Topics</h3><ul style="margin:0 0 16px 18px;padding:0;">${topicsHtml}</ul>` : ""}
      ${meetingNotesHtml ? `<h3 style="margin:16px 0 8px 0;">Meeting Notes</h3><ul style="margin:0 0 16px 18px;padding:0;">${meetingNotesHtml}</ul>` : ""}

      ${
        assignedTaskHtml
          ? `<h3 style="margin:16px 0 8px 0;">Assigned Tasks</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Task</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Owner</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Due</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Priority</th>
          </tr>
        </thead>
        <tbody>${assignedTaskHtml}</tbody>
      </table>`
          : ""
      }

      ${
        actionHtml
          ? `<h3 style="margin:16px 0 8px 0;">Action Items</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:16px;">
        <thead>
          <tr>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Task</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Owner</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Due</th>
            <th style="text-align:left;padding:8px;border:1px solid #d1d5db;background:#f9fafb;">Priority</th>
          </tr>
        </thead>
        <tbody>${actionHtml}</tbody>
      </table>`
          : ""
      }

      ${decisionsHtml ? `<h3 style="margin:16px 0 8px 0;">Decisions</h3><ul style="margin:0 0 16px 18px;padding:0;">${decisionsHtml}</ul>` : ""}
      ${futureDecisionsHtml ? `<h3 style="margin:16px 0 8px 0;">Pending Decisions</h3><ul style="margin:0 0 16px 18px;padding:0;">${futureDecisionsHtml}</ul>` : ""}
      ${nextStepsHtml ? `<h3 style="margin:16px 0 8px 0;">Next Steps</h3><ul style="margin:0 0 16px 18px;padding:0;">${nextStepsHtml}</ul>` : ""}

      <p style="margin-top:20px;color:#6b7280;font-size:12px;">AI-generated summary.</p>
    </div>
  </body>
</html>`;

    await Promise.allSettled(
      emails.map((email) =>
        sendEmail({
          to: email,
          subject: `Meeting Summary: ${mtg.title || "Team Meeting"}`,
          body,
          companyName: currentUserRef.current?.company_name || "Your Company",
        }),
      ),
    );
  };

  const getVisibleParticipants = useCallback((list) => {
    if (list.length <= 4) {
      return { visible: list, hiddenCount: 0 };
    }
    return { visible: list.slice(0, 4), hiddenCount: list.length - 4 };
  }, []);

  const visibleGridState = useMemo(() => {
    const { visible, hiddenCount } = getVisibleParticipants(participants);
    const visibleCount = visible.length + (hiddenCount > 0 ? 1 : 0);
    const gridClass =
      visibleCount <= 1
        ? "video-grid single"
        : visibleCount === 2
          ? "video-grid double"
          : visibleCount === 3
            ? "video-grid triple"
            : visibleCount === 4
              ? "video-grid quad"
              : "video-grid overflow";

    return { visible, hiddenCount, gridClass };
  }, [participants, getVisibleParticipants]);

  const screenSharer = participants.find((p) => p.isScreenShare);
  const toggleDrawer = (name) => {
    setOpenMoreMenu(false);
    setOpenDrawer((prev) => (prev === name ? null : name));
  };

  const toggleMoreMenu = () => {
    setOpenDrawer(null);
    setOpenMoreMenu((prev) => !prev);
  };

  // - PHASE: LOBBY -
  if (phase === "lobby") {
    if (!currentUser || !meeting) {
      return (
        <div
          className={`meet-root${dark ? " dark" : ""}`}
          style={{
            minHeight: "100vh",
            background: "var(--bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <style>{styles}</style>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              className="spin"
              style={{
                width: 36,
                height: 36,
                border: "2.5px solid var(--border)",
                borderTopColor: "var(--accent)",
                borderRadius: "50%",
              }}
            />
            <span
              style={{ fontSize: 13, color: "var(--text-3)", fontWeight: 500 }}
            >
              Loading meeting-
            </span>
          </div>
        </div>
      );
    }
    return (
      <LobbyScreen
        meeting={meeting}
        currentUser={currentUser}
        isHost={isHost}
        onJoin={handleJoin}
        onGuestNameChange={updateGuestName}
        onBack={() => window.history.back()}
        dark={dark}
        guestJoinStatus={guestJoinStatus}
      />
    );
  }

  // - PHASE: ENDED -
  if (phase === "ended") {
    return (
      <div className={`meet-root ended-root${dark ? " dark" : ""}`}>
        <style>{styles}</style>
        <div style={{ width: "100%", maxWidth: 580, textAlign: "center" }}>
          {summaryLoading ? (
            <div
              className="summary-card"
              style={{ padding: 48, textAlign: "center" }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  margin: "0 auto 24px",
                  background: "var(--accent-subtle)",
                  border: "1px solid rgba(45,110,245,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  className="spin"
                  style={{
                    width: 28,
                    height: 28,
                    border: "2.5px solid rgba(45,110,245,0.2)",
                    borderTopColor: "var(--accent)",
                    borderRadius: "50%",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                Generating AI Summary
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                }}
              >
                Analyzing your meeting and emailing participants-
              </div>
            </div>
          ) : summaryData ? (
            <div className="summary-card">
              <div className="summary-header">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    marginBottom: 4,
                  }}
                >
                  <div
                    style={{
                      width: 50,
                      height: 50,
                      borderRadius: 15,
                      background: "var(--purple-subtle)",
                      border: "1px solid rgba(124,58,237,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Sparkles size={22} style={{ color: "var(--purple)" }} />
                  </div>
                  <div style={{ textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: "var(--text)",
                      }}
                    >
                      Meeting Summary
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--text-2)",
                        marginTop: 4,
                      }}
                    >
                      Summary emailed to all participants
                    </div>
                  </div>
                </div>
              </div>
              <div className="summary-body">
                <div className="summary-section">
                  <div className="summary-label">
                    <MessageSquare size={9} /> Overview
                  </div>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      lineHeight: 1.7,
                      margin: 0,
                      background: "var(--surface)",
                      padding: "14px 16px",
                      borderRadius: 12,
                      border: "1px solid var(--border)",
                    }}
                  >
                    {summaryData.summary}
                  </p>
                </div>
                {(summaryData.keyTopics || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <Zap size={9} /> Key Topics
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                      {summaryData.keyTopics.map((t, i) => (
                        <span
                          key={i}
                          className="pill pill-indigo"
                          style={{ fontSize: 11 }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(summaryData.meetingNotes || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <ListChecks size={9} /> Meeting Notes
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {summaryData.meetingNotes.map((note, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 13px",
                            background: "var(--surface)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-2)",
                            lineHeight: 1.6,
                          }}
                        >
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(summaryData.actionItems || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <CheckCircle2 size={9} /> Action Items
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {summaryData.actionItems.map((a, i) => (
                        <div
                          key={i}
                          style={{
                            display: "flex",
                            gap: 11,
                            padding: "11px 14px",
                            background: "var(--surface)",
                            borderRadius: 11,
                            border: "1px solid var(--border)",
                          }}
                        >
                          <div
                            style={{
                              width: 18,
                              height: 18,
                              borderRadius: 5,
                              border: "1.5px solid rgba(45,110,245,0.4)",
                              flexShrink: 0,
                              marginTop: 2,
                            }}
                          />
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text)",
                                fontWeight: 500,
                              }}
                            >
                              {a.text}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--accent)",
                                marginTop: 4,
                                fontWeight: 600,
                              }}
                            >
                              {a.assignee} | {a.due}
                              {a.priority ? ` | ${a.priority}` : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(summaryData.decisions || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <Check size={9} /> Decisions Made
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {summaryData.decisions.map((decision, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 13px",
                            background: "var(--surface)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-2)",
                            lineHeight: 1.6,
                          }}
                        >
                          {decision}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(summaryData.futureDecisions || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <AlertCircle size={9} /> Pending Decisions
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {summaryData.futureDecisions.map((decision, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 13px",
                            background: "var(--surface)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-2)",
                            lineHeight: 1.6,
                          }}
                        >
                          {decision}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {(summaryData.nextSteps || []).length > 0 && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <ArrowRight size={9} /> Next Steps
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                      }}
                    >
                      {summaryData.nextSteps.map((step, i) => (
                        <div
                          key={i}
                          style={{
                            padding: "10px 13px",
                            background: "var(--surface)",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                            fontSize: 12,
                            color: "var(--text-2)",
                            lineHeight: 1.6,
                          }}
                        >
                          {step}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {summaryData.sentiment && (
                  <div className="summary-section">
                    <div className="summary-label">
                      <Star size={9} /> Meeting Sentiment
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 11,
                      }}
                    >
                      {[
                        [
                          "Engagement",
                          summaryData.sentiment.engagement,
                          "var(--accent)",
                        ],
                        [
                          "Positivity",
                          summaryData.sentiment.positivity,
                          "var(--green)",
                        ],
                        [
                          "Resolution",
                          summaryData.sentiment.resolution,
                          "var(--amber)",
                        ],
                      ].map(([label, val, color]) => (
                        <div
                          key={label}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-2)",
                              width: 84,
                              fontWeight: 500,
                            }}
                          >
                            {label}
                          </span>
                          <div className="progress-bar-track">
                            <div
                              style={{
                                height: "100%",
                                background: color,
                                borderRadius: 999,
                                width: `${val}%`,
                                transition: "width 1s ease",
                              }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: 12,
                              color: "var(--text-2)",
                              width: 34,
                              textAlign: "right",
                              fontWeight: 700,
                              fontFamily: "var(--font-mono)",
                            }}
                          >
                            {val}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div
                style={{
                  padding: "16px 24px",
                  borderTop: "1px solid var(--border)",
                }}
              >
                <button
                  onClick={() => window.history.back()}
                  className="btn btn-ghost btn-md"
                  style={{ width: "100%", borderRadius: 12 }}
                >
                  Back to Meetings
                </button>
              </div>
            </div>
          ) : (
            <div
              className="summary-card"
              style={{ padding: 48, textAlign: "center" }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  margin: "0 auto 24px",
                  background: "var(--surface-2)",
                  border: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PhoneOff size={26} style={{ color: "var(--text-3)" }} />
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 800,
                  color: "var(--text)",
                  marginBottom: 10,
                }}
              >
                You've left the meeting
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  marginBottom: 28,
                  lineHeight: 1.6,
                }}
              >
                The meeting is still ongoing.
              </div>
              <button
                onClick={() => window.history.back()}
                className="btn btn-ghost btn-md"
                style={{ borderRadius: 12 }}
              >
                Back to Meetings
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // - PHASE: ROOM -
  return (
    <div className={`meet-root room-root${dark ? " dark" : ""}`}>
      <style>{styles}</style>

      {/* Hidden audio elements for all remote participants */}
      {participants
        .filter((p) => !p.isLocal && p.stream)
        .map((p) => (
          <RemoteAudio key={p.peerId} stream={p.stream} />
        ))}

      {createdMeeting && (
        <MeetingCreatedModal
          meeting={createdMeeting}
          onJoin={(mtg) => {
            setCreatedMeeting(null);
            window.location.href = `/meet/${mtg.room_id || mtg.id}`;
          }}
          onClose={() => setCreatedMeeting(null)}
        />
      )}

      {/* - Top bar - */}
      <div className="room-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 6 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              flexShrink: 0,
              background: "var(--accent-subtle)",
              border: "1px solid rgba(45,110,245,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Video size={15} style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text)",
                lineHeight: 1.1,
              }}
            >
              {meeting?.title || "Meeting Room"}
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--text-3)",
                fontFamily: "var(--font-mono)",
                marginTop: 2,
              }}
            >
              {fmtDur(roomSec)}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span className="pill pill-green">
            <span
              className="pulse-dot"
              style={{
                display: "inline-block",
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--green)",
              }}
            />{" "}
            Live
          </span>
          {isHost && (
            <span className="pill pill-amber">
              <Shield size={9} /> Host
            </span>
          )}
        </div>
      </div>

      {isHost && guestJoinRequests.length > 0 && (
        <div
          className="guest-approval-panel"
          style={{
            position: "fixed",
            top: 66,
            right: 16,
            zIndex: 35,
            width: 320,
            background: "var(--bg-2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            boxShadow: "var(--shadow-lg)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid var(--border)",
              fontSize: 12,
              fontWeight: 700,
              color: "var(--text)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <AlertCircle size={13} style={{ color: "var(--amber)" }} />
            Guest waiting for approval
          </div>
          <div style={{ padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {guestJoinRequests.slice(0, 3).map((req) => (
              <div
                key={req.userId}
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: 10,
                  padding: "10px 10px 8px",
                  background: "var(--surface)",
                }}
              >
                <div
                  style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 8,
                  }}
                >
                  {req.name || "Guest"}
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-green btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => respondToGuestJoin(req, true)}
                  >
                    <Check size={11} /> Approve
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ flex: 1 }}
                    onClick={() => respondToGuestJoin(req, false)}
                  >
                    <X size={11} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* - Content - */}
      <div className="room-content">
        <div className="room-videos">
          {screenSharer ? (
            <div
              style={{
                flex: 1,
                padding: 14,
                display: "flex",
                gap: 12,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1.5px solid var(--border)",
                  boxShadow: "var(--shadow)",
                }}
              >
                <VideoTile
                  participant={screenSharer}
                  isLocal={screenSharer.isLocal}
                  isMicOn={micOn}
                  isCamOn={camOn}
                  isScreenShare
                  isLarge
                  isSpeaking={
                    speakingId === currentUser?.id && screenSharer.isLocal
                  }
                  profilesMap={profilesMap}
                  handRaised={screenSharer.handRaised || false}
                  selectedBg={selectedBg}
                />
              </div>
              <div
                style={{
                  width: 160,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  overflowY: "auto",
                }}
              >
                {participants
                  .filter((p) => !p.isScreenShare)
                  .map((p, i) => (
                    <div
                      key={p.peerId || i}
                      style={{
                        flexShrink: 0,
                        borderRadius: 12,
                        overflow: "hidden",
                      }}
                    >
                      <VideoTile
                        participant={p}
                        isLocal={p.isLocal}
                        isMicOn={p.isLocal ? micOn : p.micOn !== false}
                        isCamOn={p.isLocal ? camOn : p.camOn !== false}
                        isScreenShare={false}
                        isLarge={false}
                        isSpeaking={speakingId === p.peerId}
                        profilesMap={profilesMap}
                        handRaised={p.handRaised || false}
                        selectedBg={selectedBg}
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div
              className={visibleGridState.gridClass}
              style={{ minHeight: 0 }}
            >
              {visibleGridState.visible.map((p, i) => {
                const isPinned = pinnedId === p.peerId;
                return (
                  <div
                    key={p.peerId || i}
                    style={{
                      gridColumn: isPinned ? "span 2" : undefined,
                      gridRow: isPinned ? "span 2" : undefined,
                    }}
                    onDoubleClick={() =>
                      setPinnedId(isPinned ? null : p.peerId)
                    }
                  >
                    <VideoTile
                      participant={p}
                      isLocal={p.isLocal}
                      isMicOn={p.isLocal ? micOn : p.micOn !== false}
                      isCamOn={p.isLocal ? camOn : p.camOn !== false}
                      isScreenShare={false}
                      isLarge={isPinned}
                      isSpeaking={
                        speakingId === (p.isLocal ? currentUser?.id : p.peerId)
                      }
                      profilesMap={profilesMap}
                      handRaised={p.handRaised || false}
                      selectedBg={selectedBg}
                    />
                  </div>
                );
              })}
              {visibleGridState.hiddenCount > 0 && (
                <div className="video-overflow-tile">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: 20,
                    }}
                  >
                    <div className="video-overflow-count">
                      +{visibleGridState.hiddenCount}
                    </div>
                    <div className="video-overflow-label">
                      more participant
                      {visibleGridState.hiddenCount > 1 ? "s" : ""}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* - Bottom Controls - */}
          <div className="room-controls">
            <CtrlBtn
              onClick={toggleMic}
              activeMuted={!micOn}
              label={micOn ? "Mute" : "Unmute"}
            >
              {micOn ? <Mic size={17} /> : <MicOff size={17} />}
            </CtrlBtn>
            <CtrlBtn onClick={toggleCam} activeMuted={!camOn} label="Camera">
              {camOn ? <Camera size={17} /> : <CameraOff size={17} />}
            </CtrlBtn>
            <CtrlBtn
              onClick={toggleScreen}
              activeOn={screenOn}
              label={screenOn ? "Sharing" : "Share"}
            >
              {screenOn ? <MonitorOff size={17} /> : <MonitorUp size={17} />}
            </CtrlBtn>
            {isHost && (
              <CtrlBtn
                onClick={toggleRec}
                activeRec={recOn}
                label={recOn ? "- REC" : "Record"}
              >
                <Circle
                  size={17}
                  style={
                    recOn ? { fill: "var(--red)", color: "var(--red)" } : {}
                  }
                />
              </CtrlBtn>
            )}
            <CtrlBtn onClick={raiseHand} activeYellow={handRaised} label="Hand">
              <Hand size={17} />
            </CtrlBtn>

            <div className="divider" />

            <CtrlBtn
              onClick={() => toggleDrawer("chat")}
              activeOn={openDrawer === "chat"}
              label="Chat"
              className="more-action-btn"
              badge={openDrawer !== "chat" ? unreadChat : 0}
            >
              <MessageSquare size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={() => toggleDrawer("people")}
              activeOn={openDrawer === "people"}
              label="People"
              className="more-action-btn"
            >
              <Users size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={() => toggleDrawer("agenda")}
              activeOn={openDrawer === "agenda"}
              label="Agenda"
              className="more-action-btn"
            >
              <ListChecks size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={() => toggleDrawer("bg")}
              activeOn={openDrawer === "bg"}
              label="Background"
              className="more-action-btn"
            >
              <ImageIcon size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={toggleMoreMenu}
              label="More"
              className="more-menu-btn"
            >
              <MoreHorizontal size={17} />
            </CtrlBtn>

            {openMoreMenu && (
              <div className="more-popup">
                <button
                  onClick={() => toggleDrawer("chat")}
                  className="btn btn-ghost btn-sm"
                >
                  <MessageSquare size={14} /> Chat
                </button>
                <button
                  onClick={() => toggleDrawer("people")}
                  className="btn btn-ghost btn-sm"
                >
                  <Users size={14} /> People
                </button>
                <button
                  onClick={() => toggleDrawer("agenda")}
                  className="btn btn-ghost btn-sm"
                >
                  <ListChecks size={14} /> Agenda
                </button>
                <button
                  onClick={() => toggleDrawer("bg")}
                  className="btn btn-ghost btn-sm"
                >
                  <ImageIcon size={14} /> Background
                </button>
              </div>
            )}

            <div className="divider" />

            <CtrlBtn
              onClick={isHost ? endMeeting : leaveMeeting}
              danger
              label={isHost ? "End" : "Leave"}
            >
              <PhoneOff size={18} style={{ color: "white" }} />
            </CtrlBtn>
          </div>
        </div>

        {/* - Drawer backdrop - */}
        <div
          className={`drawer-backdrop${openDrawer ? " open" : ""}`}
          onClick={() => setOpenDrawer(null)}
        />

        {/* - Drawer - */}
        <div className={`room-drawer${openDrawer ? " open" : ""}`}>
          <div className="drawer-header">
            <div className="drawer-title">
              {openDrawer === "chat" && (
                <>
                  <MessageSquare size={15} style={{ color: "var(--accent)" }} />{" "}
                  Chat
                </>
              )}
              {openDrawer === "people" && (
                <>
                  <Users size={15} style={{ color: "var(--accent)" }} />{" "}
                  Participants ({participants.length})
                </>
              )}
              {openDrawer === "agenda" && (
                <>
                  <ListChecks size={15} style={{ color: "var(--accent)" }} />{" "}
                  Agenda
                </>
              )}
              {openDrawer === "bg" && (
                <>
                  <ImageIcon size={15} style={{ color: "var(--accent)" }} />{" "}
                  Background
                </>
              )}
            </div>
            <button
              onClick={() => setOpenDrawer(null)}
              className="btn btn-ghost btn-sm"
              style={{ padding: 6 }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Chat */}
          {openDrawer === "chat" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: 1,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "14px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {chatMessages.map((msg) => (
                  <div key={msg.id}>
                    {msg.isSystem ? (
                      <div
                        style={{
                          textAlign: "center",
                          fontSize: 11,
                          color: "var(--text-3)",
                          padding: "4px 12px",
                          background: "var(--surface)",
                          borderRadius: 999,
                          margin: "0 auto",
                          width: "fit-content",
                          border: "1px solid var(--border)",
                        }}
                      >
                        {msg.text}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          flexDirection: msg.isMe ? "row-reverse" : "row",
                        }}
                      >
                        <UserAvatar
                          profile={{ full_name: msg.sender }}
                          size={26}
                        />
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: msg.isMe ? "flex-end" : "flex-start",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-3)",
                              marginBottom: 4,
                              fontWeight: 600,
                              letterSpacing: "0.02em",
                            }}
                          >
                            {msg.isMe ? "You" : msg.sender}
                          </span>
                          <div
                            className={
                              msg.isMe ? "chat-bubble-me" : "chat-bubble-other"
                            }
                          >
                            {msg.text}
                          </div>
                          <span
                            style={{
                              fontSize: 10,
                              color: "var(--text-3)",
                              marginTop: 4,
                            }}
                          >
                            {fmtTime(msg.time)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="chat-input-wrap">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendChat()
                  }
                  placeholder="Message everyone-"
                  className="chat-input"
                />
                <button
                  onClick={sendChat}
                  className="btn btn-primary btn-sm"
                  style={{
                    width: 38,
                    height: 38,
                    padding: 0,
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  <Send size={13} />
                </button>
              </div>
            </div>
          )}

          {/* People */}
          {openDrawer === "people" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              <div className="section-heading">
                <Users size={9} /> In this call
              </div>
              {participants.map((p, i) => (
                <div key={p.peerId || i} className="people-item">
                  <UserAvatar
                    profile={profilesMap[p.peerId] || p.profile}
                    size={36}
                    online
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "var(--text)",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {(profilesMap[p.peerId] || p.profile)?.full_name ||
                        "Guest"}
                      {p.isLocal && (
                        <span
                          style={{
                            color: "var(--text-3)",
                            fontWeight: 400,
                            fontSize: 11,
                          }}
                        >
                          (You)
                        </span>
                      )}
                      {p.isHost && (
                        <Shield
                          size={10}
                          style={{ color: "var(--amber)", flexShrink: 0 }}
                        />
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-3)",
                        marginTop: 2,
                      }}
                    >
                      {p.isHost
                        ? "Host"
                        : (profilesMap[p.peerId] || p.profile)?.job_title ||
                          "Participant"}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 5 }}>
                    {[
                      {
                        on: p.isLocal ? micOn : p.micOn !== false,
                        onIcon: <Mic size={10} />,
                        offIcon: <MicOff size={10} />,
                      },
                      {
                        on: p.isLocal ? camOn : p.camOn !== false,
                        onIcon: <Camera size={10} />,
                        offIcon: <CameraOff size={10} />,
                      },
                    ].map(({ on, onIcon, offIcon }, idx) => (
                      <div
                        key={idx}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: on
                            ? "var(--green-subtle)"
                            : "var(--surface-2)",
                          border: `1px solid ${on ? "rgba(22,163,74,0.25)" : "var(--border)"}`,
                        }}
                      >
                        <span
                          style={{
                            color: on ? "var(--green)" : "var(--text-3)",
                          }}
                        >
                          {on ? onIcon : offIcon}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {participants.length === 1 && (
                <div
                  style={{
                    margin: "12px 6px",
                    padding: "16px",
                    background: "var(--surface)",
                    borderRadius: 14,
                    border: "1px solid var(--border)",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-2)",
                      marginBottom: 12,
                      lineHeight: 1.5,
                    }}
                  >
                    Share the link to invite others
                  </div>
                  <button
                    onClick={copyLink}
                    className="btn btn-ghost btn-sm"
                    style={{ margin: "0 auto", display: "flex", gap: 6 }}
                  >
                    <Link2 size={11} /> {copiedLink ? "Copied!" : "Copy Link"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Agenda */}
          {openDrawer === "agenda" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
              {(() => {
                let items = [];
                try {
                  items = Array.isArray(meeting?.agenda_items)
                    ? meeting.agenda_items
                    : JSON.parse(meeting?.agenda_items || "[]");
                } catch {}
                return items.length ? (
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 7 }}
                  >
                    {items.map((a, i) => (
                      <div
                        key={i}
                        className={`agenda-item ${i === 0 ? "current" : "upcoming"}`}
                      >
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            flexShrink: 0,
                            background:
                              i === 0 ? "var(--accent)" : "var(--surface-3)",
                            color: i === 0 ? "white" : "var(--text-3)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: 12,
                              color: i === 0 ? "var(--text)" : "var(--text-2)",
                              fontWeight: i === 0 ? 600 : 400,
                            }}
                          >
                            {a.text}
                          </div>
                          {a.dur && (
                            <div
                              style={{
                                fontSize: 10,
                                color: "var(--text-3)",
                                marginTop: 4,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <Clock size={9} /> {a.dur} min
                            </div>
                          )}
                        </div>
                        {i === 0 && (
                          <span
                            className="pill pill-indigo"
                            style={{ fontSize: 9, flexShrink: 0 }}
                          >
                            NOW
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 16px",
                      color: "var(--text-3)",
                      fontSize: 13,
                    }}
                  >
                    No agenda set for this meeting
                  </div>
                );
              })()}
            </div>
          )}

          {/* Background */}
          {openDrawer === "bg" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {bgApplying && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: "var(--accent-subtle)",
                    border: "1px solid rgba(45,110,245,0.25)",
                    color: "var(--accent)",
                    fontSize: 11,
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      border: "2px solid rgba(45,110,245,0.25)",
                      borderTopColor: "var(--accent)",
                      animation: "spin 0.8s linear infinite",
                    }}
                  />
                  Applying background...
                </div>
              )}
              <p
                style={{
                  fontSize: 12,
                  color: "var(--text-2)",
                  marginBottom: 16,
                  lineHeight: 1.55,
                }}
              >
                Choose a virtual background. Full background replacement
                requires a segmentation model (e.g. MediaPipe) in production.
              </p>
              <div className="section-heading" style={{ paddingLeft: 0 }}>
                Select Background
              </div>
              <div className="bg-panel">
                {BG_OPTIONS.map((bg) => (
                  <div
                    key={bg.id}
                    className={`bg-option${selectedBg === bg.id ? " selected" : ""}`}
                    style={bg.style}
                    onClick={() => {
                      if (bgApplying) return;
                      setSelectedBg(bg.id);
                    }}
                  >
                    {bgApplying && selectedBg === bg.id && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          background: "rgba(0,0,0,0.25)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          zIndex: 2,
                        }}
                      >
                        <span
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.45)",
                            borderTopColor: "white",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                      </div>
                    )}
                    {bg.isBlur && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Aperture
                          size={20}
                          style={{
                            color: "white",
                            filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.4))",
                          }}
                        />
                      </div>
                    )}
                    {bg.id === "none" && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <X size={18} style={{ color: "var(--text-3)" }} />
                      </div>
                    )}
                    <div className="bg-option-label">{bg.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="section-heading" style={{ paddingLeft: 0 }}>
                  Your Preview
                </div>
                <div
                  style={{
                    borderRadius: 12,
                    overflow: "hidden",
                    aspectRatio: "16/9",
                    position: "relative",
                    background:
                      selectedBg !== "none"
                        ? BG_OPTIONS.find((b) => b.id === selectedBg)?.style
                            ?.background || "#e6e5e0"
                        : "#e6e5e0",
                  }}
                >
                  {selectedBg !== "none" && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        ...BG_OPTIONS.find((b) => b.id === selectedBg)?.style,
                        zIndex: 0,
                      }}
                    />
                  )}
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      zIndex: 1,
                    }}
                  >
                    <UserAvatar profile={currentUser} size={52} />
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 8,
                      left: 8,
                      padding: "4px 10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.9)",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "var(--text)",
                    }}
                  >
                    {currentUser?.full_name || "You"} -{" "}
                    {selectedBg === "none"
                      ? "No background"
                      : BG_OPTIONS.find((b) => b.id === selectedBg)?.label}
                  </div>
                </div>
              </div>
            </div>
          )}
          {openDrawer === "more" && (
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              <div className="section-heading" style={{ paddingLeft: 0 }}>
                More actions
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  padding: "4px 0 0",
                }}
              >
                <button
                  onClick={() => toggleDrawer("chat")}
                  className="btn btn-ghost btn-md"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <MessageSquare size={14} /> Chat
                </button>
                <button
                  onClick={() => toggleDrawer("people")}
                  className="btn btn-ghost btn-md"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <Users size={14} /> People
                </button>
                <button
                  onClick={() => toggleDrawer("agenda")}
                  className="btn btn-ghost btn-md"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <ListChecks size={14} /> Agenda
                </button>
                <button
                  onClick={() => toggleDrawer("bg")}
                  className="btn btn-ghost btn-md"
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  <ImageIcon size={14} /> Background
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}




