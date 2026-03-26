import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "react-router-dom";
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

// ─── ICE Config ───────────────────────────────────────────────────────────────
const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

// ─── Groq ─────────────────────────────────────────────────────────────────────
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;

const groq = async (systemPrompt, userContent) => {
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
      max_tokens: 1024,
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function avatarColor(str = "") {
  let h = 0;
  for (let c of str) h = (h * 31 + c.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h];
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

// ─── Styles ───────────────────────────────────────────────────────────────────
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
  .ctrl-btn-danger .ctrl-btn-inner { background: var(--red); border-color: var(--red); color: white; width: 50px; height: 50px; border-radius: 14px; box-shadow: 0 4px 16px rgba(220,38,38,0.3); }
  .ctrl-btn-danger .ctrl-btn-inner:hover { background: #b91c1c; box-shadow: 0 8px 24px rgba(220,38,38,0.35); transform: scale(1.06); }
  .video-grid { flex: 1; padding: 14px; display: grid; gap: 10px; overflow-y: auto; align-content: start; }
  .video-tile { position: relative; border-radius: var(--radius-lg); overflow: hidden; background: #e8e8e4; border: 1.5px solid var(--border); transition: all 0.2s ease; width: 100%; aspect-ratio: 16/9; box-shadow: var(--shadow-sm); }
  .video-tile:hover .tile-overlay { opacity: 1; }
  .video-tile.speaking { border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow),var(--shadow); }
  .tile-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 50%); opacity: 0.6; transition: opacity 0.2s; pointer-events: none; }
  .video-tile-label { position: absolute; bottom: 10px; left: 10px; padding: 5px 11px; border-radius: 9px; background: rgba(255,255,255,0.92); backdrop-filter: blur(12px); font-size: 11px; font-weight: 600; color: var(--text); display: flex; align-items: center; gap: 5px; border: 1px solid rgba(0,0,0,0.08); box-shadow: var(--shadow-sm); }
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
`;

// ─── Avatar ───────────────────────────────────────────────────────────────────
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

// ─── RemoteAudio: dedicated component that attaches a remote audio stream ─────
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

// ─── VideoTile ────────────────────────────────────────────────────────────────
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
}) {
  const videoRef = useRef(null);
  const resolvedProfile =
    profilesMap?.[participant.peerId] || participant.profile;

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
          transform: isLocal && !isScreenShare ? "scaleX(-1)" : "none",
          display: showVideo || isScreenShare ? "block" : "none",
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
            background: "linear-gradient(135deg,#eeede8 0%,#e6e5e0 100%)",
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
          <span style={{ color: "var(--amber)", marginLeft: 4 }}>· Host</span>
        )}
        {isScreenShare && (
          <span style={{ color: "var(--accent)", marginLeft: 4 }}>
            · Screen
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

// ─── Control Button ───────────────────────────────────────────────────────────
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
      className={`ctrl-btn${danger ? " ctrl-btn-danger" : ""}`}
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

// ─── Background Options ───────────────────────────────────────────────────────
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

// ─── Meeting Created Modal ────────────────────────────────────────────────────
function MeetingCreatedModal({ meeting, onJoin, onClose }) {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/meet/${meeting.room_id || meeting.id}?meetingId=${meeting.id}`;
  const copyLink = () => {
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

// ─── Lobby Screen ─────────────────────────────────────────────────────────────
function LobbyScreen({ meeting, currentUser, isHost, onJoin, onBack }) {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [joining, setJoining] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    let s;
    (async () => {
      try {
        s = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setStream(s);
        if (videoRef.current) videoRef.current.srcObject = s;
      } catch {
        try {
          s = await navigator.mediaDevices.getUserMedia({ audio: true });
          setStream(s);
        } catch {}
      }
    })();
    return () => s?.getTracks().forEach((t) => t.stop());
  }, []);

  const toggleLobbyMic = () => {
    stream?.getAudioTracks().forEach((t) => (t.enabled = !micOn));
    setMicOn((p) => !p);
  };
  const toggleLobbyCam = () => {
    stream?.getVideoTracks().forEach((t) => (t.enabled = !camOn));
    setCamOn((p) => !p);
  };
  const handleJoin = async () => {
    setJoining(true);
    stream?.getTracks().forEach((t) => t.stop());
    await onJoin({ micOn, camOn });
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
    <div className="meet-root lobby-wrap">
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
                  background: "linear-gradient(135deg,#eeede8 0%,#e6e5e0 100%)",
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
                background: "rgba(255,255,255,0.92)",
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
              {isHost && <span style={{ color: "var(--amber)" }}>· Host</span>}
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
              disabled={joining}
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
                ? "Connecting…"
                : isHost
                  ? "Start Meeting"
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
            ← Back to meetings
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Room ────────────────────────────────────────────────────────────────
export default function MeetingRoom() {
  const { roomId } = useParams();
  const [searchParams] = useSearchParams();
  const meetingId = searchParams.get("meetingId");

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
  const currentUserRef = useRef(null);
  const isHostRef = useRef(false);
  const micOnRef = useRef(true);
  const camOnRef = useRef(true);
  const screenOnRef = useRef(false);
  const participantRecordRef = useRef(null);

  useEffect(() => {
    loadInitialData();
  }, []);
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

  const loadInitialData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();
    setCurrentUser(profile);
    currentUserRef.current = profile;
    if (meetingId) {
      const { data: mtg } = await supabase
        .from("meetings")
        .select("*")
        .eq("id", meetingId)
        .single();
      setMeeting(mtg);
      const hostId = mtg?.created_by || mtg?.user_id;
      const host = hostId === user.id;
      setIsHost(host);
      isHostRef.current = host;
      if (mtg?.tenant_id) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id,full_name,email,job_title,user_photo")
          .eq("tenant_id", mtg.tenant_id);
        setProfiles(profs || []);
        const map = {};
        (profs || []).forEach((p) => {
          map[p.id] = p;
        });
        if (profile) map[user.id] = profile;
        setProfilesMap(map);
      } else {
        if (profile) setProfilesMap({ [profile.id]: profile });
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
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    Object.values(peerConnectionsRef.current).forEach((pc) => {
      try {
        pc.close();
      } catch {}
    });
    peerConnectionsRef.current = {};
    if (signalingRef.current) supabase.removeChannel(signalingRef.current);
    clearInterval(timerRef.current);
  }, []);

  // ─── createPC: clean peer connection setup ────────────────────────────────
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

  // ─── setupSignaling ───────────────────────────────────────────────────────
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
          addSysMsg(`✋ ${payload.name || "Guest"} raised their hand`);
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

  const handleJoin = useCallback(
    async ({ micOn: initMic, camOn: initCam }) => {
      try {
        setMicOn(initMic);
        setCamOn(initCam);
        micOnRef.current = initMic;
        camOnRef.current = initCam;
        const {
          data: { user },
        } = await supabase.auth.getUser();

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

        const profile = currentUserRef.current;
        setParticipants([
          {
            peerId: user.id,
            profile,
            stream,
            isLocal: true,
            isHost: isHostRef.current,
            micOn: initMic,
            camOn: initCam,
            handRaised: false,
          },
        ]);

        startAudioAnalysis(stream, user.id);
        await setupSignaling(roomId, user.id, profile);
        addSysMsg("You joined the meeting");

        if (meetingId) {
          const { data: rec } = await supabase
            .from("meeting_participants")
            .insert({
              meeting_id: meetingId,
              user_id: user.id,
              joined_at: new Date().toISOString(),
              is_active: true,
              video_enabled: initCam,
              audio_enabled: initMic,
              screen_sharing: false,
            })
            .select()
            .single();
          setParticipantRecord(rec);
          if (isHostRef.current) {
            await supabase
              .from("meetings")
              .update({ status: "live" })
              .eq("id", meetingId);
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
    [meetingId, roomId, setupSignaling],
  );

  const startAudioAnalysis = (stream, userId) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      src.connect(analyser);
      audioCtxRef.current = ctx;
      const tick = () => {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setSpeakingId(avg > 15 ? userId : null);
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {}
  };

  const addSysMsg = (text) => {
    setChatMessages((prev) => [
      ...prev,
      { id: Date.now(), isSystem: true, text, time: new Date() },
    ]);
  };

  // ─── Toggle Mic ───────────────────────────────────────────────────────────
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

  // ─── Toggle Cam ───────────────────────────────────────────────────────────
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
    setParticipants((prev) =>
      prev.map((p) =>
        p.isLocal
          ? {
              ...p,
              camOn: newState,
              stream: screenOnRef.current
                ? localStreamRef.current
                : cameraStreamRef.current,
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
  }, []);

  // ─── Screen Share ─────────────────────────────────────────────────────────
  // Strategy: use a SEPARATE screen stream. Replace only the video sender track.
  // Never mutate localStreamRef tracks - keep camera track intact for restoration.
  const toggleScreen = useCallback(async () => {
    const userId = currentUserRef.current?.id;

    if (screenOnRef.current) {
      // ── Stop screen sharing ──
      const screenTracks = screenStreamRef.current?.getTracks() || [];
      screenTracks.forEach((t) => t.stop());
      screenStreamRef.current = null;

      // Restore camera stream and camera track in all senders
      localStreamRef.current = cameraStreamRef.current;
      const camTrack = cameraStreamRef.current?.getVideoTracks()[0] || null;
      for (const [peerId, pc] of Object.entries(peerConnectionsRef.current)) {
        const sender = pc.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          try {
            await sender.replaceTrack(camOnRef.current ? camTrack : null);
          } catch (e) {
            console.warn("Failed to restore camera track:", e);
          }
        }
      }

      // Update local participant stream ref
      setParticipants((prev) =>
        prev.map((p) =>
          p.isLocal
            ? {
                ...p,
                stream: cameraStreamRef.current,
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
      // ── Start screen sharing ──
      try {
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
        screenTrack.onended = () => {
          if (screenOnRef.current) {
            setScreenOn(false);
            screenOnRef.current = false;
            screenStreamRef.current = null;
            // Restore camera
            const camTrack = localStreamRef.current?.getVideoTracks()[0];
            Object.entries(peerConnectionsRef.current).forEach(
              async ([peerId, pc]) => {
                const sender = pc
                  .getSenders()
                  .find((s) => s.track?.kind === "video");
                if (sender && camTrack) {
                  try {
                    await sender.replaceTrack(
                      camOnRef.current ? camTrack : null,
                    );
                  } catch {}
                }
              },
            );
            setParticipants((prev) =>
              prev.map((p) =>
                p.isLocal
                  ? {
                      ...p,
                      stream: localStreamRef.current,
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
          addSysMsg("❌ Screen sharing failed");
        }
      }
    }
  }, []);

  // ─── Recording ────────────────────────────────────────────────────────────
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
        addSysMsg("🔴 Recording started");
      } catch (e) {
        console.error("Recording failed:", e);
      }
    } else {
      mediaRecorderRef.current?.stop();
      mediaRecorderRef.current = null;
      addSysMsg("⏹ Recording stopped, saving…");
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
      addSysMsg("✋ You raised your hand");
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
      addSysMsg("👇 You lowered your hand");
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

  const copyLink = () => {
    const link = `${window.location.origin}/meet/${roomId}${meetingId ? `?meetingId=${meetingId}` : ""}`;
    navigator.clipboard?.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
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
      cleanup();
      const dur = Math.floor(roomSecRef.current / 60);
      if (meetingId && asHost) {
        await supabase
          .from("meetings")
          .update({ status: "ended", duration: dur })
          .eq("id", meetingId);
      }
      setPhase("ended");
      if (asHost) {
        setSummaryLoading(true);
        await generateAISummary(dur);
      }
    },
    [meetingId, cleanup, recOn],
  );

  const handleLeave = useCallback(
    async (asHost = false) => {
      await handleLeaveInternal(asHost);
    },
    [handleLeaveInternal],
  );

  const endMeeting = () => handleLeave(true);
  const leaveMeeting = () => handleLeave(false);

  const generateAISummary = async (dur) => {
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
      const attendeeNames = attendeeEmails
        .map(
          (email) =>
            profiles.find((p) => p.email === email)?.full_name || email,
        )
        .join(", ");
      const chatLog = chatLogRef.current.filter((m) => !m.isSystem);
      const contextBlock =
        `Meeting Title: ${mtg.title || "Team Meeting"}\nDuration: ${dur || "?"} minutes\nParticipants: ${attendeeNames || "Unknown"}\nAgenda: ${agendaItems.map((a, i) => `${i + 1}. ${a.text} (${a.dur} min)`).join("; ") || "None set"}\nChat Log:\n${chatLog.length ? chatLog.map((m) => `[${m.sender}]: ${m.text}`).join("\n") : "No chat messages recorded"}`.trim();
      const systemPrompt = `You are an expert meeting analyst. Given meeting metadata and a chat log, return ONLY valid JSON (no markdown, no backticks) with this exact shape:\n{\n  "summary": "2-3 sentence summary of what was discussed and accomplished",\n  "actionItems": [{"text": "...", "assignee": "...", "due": "..."}],\n  "decisions": ["decision 1", "decision 2"],\n  "keyTopics": ["topic 1", "topic 2", "topic 3"],\n  "sentiment": {"engagement": 75, "positivity": 70, "resolution": 80}\n}`;
      const raw = await groq(systemPrompt, contextBlock);
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      if (meetingId) {
        await supabase
          .from("meetings")
          .update({
            ai_summary: parsed.summary,
            ai_action_items: parsed.actionItems,
            ai_decisions: parsed.decisions,
            ai_sentiment: parsed.sentiment,
            transcript: JSON.stringify({ ...parsed, _chatLog: chatLog }),
          })
          .eq("id", meetingId);
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
    const actionHtml = (summary.actionItems || [])
      .map(
        (a) =>
          `<tr><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${a.text}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#2563eb;font-weight:600;">${a.assignee}</td><td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;color:#6b7280;">${a.due}</td></tr>`,
      )
      .join("");
    const decisionsHtml = (summary.decisions || [])
      .map((d) => `<li style="padding:4px 0;color:#374151;">${d}</li>`)
      .join("");
    const topicsHtml = (summary.keyTopics || [])
      .map(
        (t) =>
          `<span style="display:inline-block;padding:4px 12px;background:#ede9fe;color:#7c3aed;border-radius:999px;font-size:12px;margin:3px;">${t}</span>`,
      )
      .join("");
    const body = `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;margin:0;padding:24px;"><div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);"><div style="background:linear-gradient(135deg,#2d6ef5,#7c3aed);padding:32px 32px 24px;"><h1 style="color:#fff;font-size:22px;font-weight:700;margin:0 0 8px;">${mtg.title || "Team Meeting"}</h1><div style="color:rgba(255,255,255,0.75);font-size:13px;">🕐 ${mtg.duration || "—"} minutes &nbsp;|&nbsp; 👥 ${emails.length} participants</div></div><div style="padding:28px 32px 0;"><h2 style="font-size:13px;font-weight:700;color:#2d6ef5;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 10px;">Summary</h2><p style="color:#374151;line-height:1.7;background:#f9fafb;border-radius:12px;padding:16px;margin:0;font-size:14px;">${summary.summary}</p></div>${topicsHtml ? `<div style="padding:24px 32px 0;">${topicsHtml}</div>` : ""}${actionHtml ? `<div style="padding:24px 32px 0;"><table style="width:100%;border-collapse:collapse;">${actionHtml}</table></div>` : ""}${decisionsHtml ? `<div style="padding:24px 32px 0;"><ul>${decisionsHtml}</ul></div>` : ""}<div style="padding:24px 32px 32px;margin-top:24px;border-top:1px solid #f0f0f0;"><p style="color:#9ca3af;font-size:12px;margin:0;">AI-generated summary · Participants: ${attendeeNames}</p></div></div></body></html>`;
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

  const getGridCols = (n) => {
    if (n === 1) return "1fr";
    if (n <= 2) return "1fr 1fr";
    if (n <= 4) return "1fr 1fr";
    if (n <= 6) return "1fr 1fr 1fr";
    return "1fr 1fr 1fr 1fr";
  };

  const screenSharer = participants.find((p) => p.isScreenShare);
  const toggleDrawer = (name) => {
    setOpenDrawer((prev) => (prev === name ? null : name));
  };

  // ─── PHASE: LOBBY ──────────────────────────────────────────────────────────
  if (phase === "lobby") {
    if (!currentUser || !meeting) {
      return (
        <div
          className="meet-root"
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
              Loading meeting…
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
        onBack={() => window.history.back()}
      />
    );
  }

  // ─── PHASE: ENDED ──────────────────────────────────────────────────────────
  if (phase === "ended") {
    return (
      <div className="meet-root ended-root">
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
                Analyzing your meeting and emailing participants…
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
                              {a.assignee} · {a.due}
                            </div>
                          </div>
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

  // ─── PHASE: ROOM ────────────────────────────────────────────────────────────
  return (
    <div className="meet-root room-root">
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
            window.location.href = `/meet/${mtg.room_id || mtg.id}?meetingId=${mtg.id}`;
          }}
          onClose={() => setCreatedMeeting(null)}
        />
      )}

      {/* ── Top bar ── */}
      <div className="room-topbar">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
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
          <span className="pill pill-gray">
            <Users size={9} /> {participants.length}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 9,
            padding: "6px 12px",
            marginLeft: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "var(--text-3)",
              fontFamily: "var(--font-mono)",
              maxWidth: 180,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {window.location.origin}/meet/{roomId}
          </span>
          <button
            onClick={copyLink}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--text-3)",
              display: "flex",
              padding: 0,
              transition: "color var(--transition)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) =>
              (e.currentTarget.style.color = "var(--text-3)")
            }
          >
            {copiedLink ? (
              <Check size={12} style={{ color: "var(--green)" }} />
            ) : (
              <Copy size={12} />
            )}
          </button>
        </div>
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            onClick={copyLink}
            className="btn btn-ghost btn-sm"
            style={{ gap: 6 }}
          >
            <Link2 size={12} /> Share
          </button>
          {isHost ? (
            <button
              onClick={endMeeting}
              className="btn btn-danger btn-sm"
              style={{ gap: 6 }}
            >
              <PhoneOff size={12} /> End for Everyone
            </button>
          ) : (
            <button
              onClick={leaveMeeting}
              className="btn btn-danger btn-sm"
              style={{ gap: 6 }}
            >
              <PhoneOff size={12} /> Leave
            </button>
          )}
        </div>
      </div>

      {/* ── Content ── */}
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
                      />
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            <div
              className="video-grid"
              style={{ gridTemplateColumns: getGridCols(participants.length) }}
            >
              {participants.map((p, i) => {
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
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Bottom Controls ── */}
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
                label={recOn ? "● REC" : "Record"}
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
              badge={openDrawer !== "chat" ? unreadChat : 0}
            >
              <MessageSquare size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={() => toggleDrawer("people")}
              activeOn={openDrawer === "people"}
              label="People"
            >
              <Users size={17} />
            </CtrlBtn>
            <CtrlBtn
              onClick={() => toggleDrawer("agenda")}
              activeOn={openDrawer === "agenda"}
              label="Agenda"
            >
              <ListChecks size={17} />
            </CtrlBtn>
            {/* <CtrlBtn
              onClick={() => toggleDrawer("bg")}
              activeOn={openDrawer === "bg"}
              label="Background"
            >
              <ImageIcon size={17} />
            </CtrlBtn> */}

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

        {/* ── Drawer backdrop ── */}
        <div
          className={`drawer-backdrop${openDrawer ? " open" : ""}`}
          onClick={() => setOpenDrawer(null)}
        />

        {/* ── Drawer ── */}
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
                  placeholder="Message everyone…"
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
                    onClick={() => setSelectedBg(bg.id)}
                  >
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
                    {currentUser?.full_name || "You"} ·{" "}
                    {selectedBg === "none"
                      ? "No background"
                      : BG_OPTIONS.find((b) => b.id === selectedBg)?.label}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
