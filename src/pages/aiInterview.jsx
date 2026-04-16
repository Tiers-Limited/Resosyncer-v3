import { useEffect, useMemo, useRef, useState, useCallback, useId } from "react";
import { message } from "antd";
import {
  Bot,
  Camera,
  CameraOff,
  CheckCircle2,
  Mic,
  PhoneOff,
  PlayCircle,
  ShieldAlert,
  User,
  Volume2,
  Activity,
  Shield,
  ChevronRight,
  RotateCcw,
  Clock,
  AlertTriangle,
  Check,
  Loader,
  Wifi,
  WifiOff,
  Settings,
  ChevronDown,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  createAiInterviewLink,
  evaluateInterview,
  generateInterviewTurn,
} from "../lib/recruitmentAi";

const AGENT_NAME = "Rexa";
const INTERVIEW_SECTIONS = [
  "Introduction Questions",
  "Background / Experience Questions",
  "Technical / Skill-Based Questions",
  "Problem-Solving Questions",
  "Behavioral Questions",
  "Situational Questions",
  "Role-Specific / Case Study Questions",
];

const MIN_QUESTIONS = INTERVIEW_SECTIONS.length;
const MAX_QUESTIONS = 10;
const MAX_TURN_CAPTURE_MS = 45000;
const VOICE_RMS_THRESHOLD = 0.0045;
const NO_VOICE_TIMEOUT_MS = 15000;
const INTEGRITY_SCAN_INTERVAL_MS = 380;
const ENABLE_ADVANCED_INTEGRITY = false;
const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const GROQ_TRANSCRIBE_URL = "https://api.groq.com/openai/v1/audio/transcriptions";
const BUCKET = import.meta.env.VITE_INTERVIEW_RECORDINGS_BUCKET;
const WARMUP_QUESTION = (name) =>
  `Hi ${name || "there"}, hello. It's great to meet you today. How are you doing?`;
const MOBILE_DEVICE_REGEX =
  /Android|iPhone|iPad|iPod|Mobile|Tablet|IEMobile|Opera Mini/i;
function getSR() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}
function fmtTime(idx) {
  const s = 20 + idx * 25;
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function normalizeQuestionText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// GLOBAL STYLES
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function injectStyles() {
  if (document.getElementById("_rxa")) return;
  const s = document.createElement("style");
  s.id = "_rxa";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #06091a; font-family: 'DM Sans', sans-serif; }

    :root {
      --navy: #06091a;
      --navy-2: #0b1030;
      --navy-3: #0f163d;
      --blue: #2040c8;
      --blue-mid: #2d52e8;
      --blue-light: #4f72ff;
      --blue-glow: rgba(45,82,232,0.35);
      --blue-faint: rgba(45,82,232,0.08);
      --accent: #5b8aff;
      --accent-soft: rgba(91,138,255,0.15);
      --green: #22c55e;
      --green-soft: rgba(34,197,94,0.12);
      --red: #ef4444;
      --amber: #f59e0b;
      --text-1: rgba(255,255,255,0.95);
      --text-2: rgba(255,255,255,0.6);
      --text-3: rgba(255,255,255,0.3);
      --border: rgba(255,255,255,0.08);
      --border-blue: rgba(45,82,232,0.35);
    }

    @keyframes spin      { to { transform: rotate(360deg); } }
    @keyframes fadeUp    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.35} }
    @keyframes ripple    { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.6);opacity:0} }
    @keyframes bar       { 0%,100%{transform:scaleY(.2)} 50%{transform:scaleY(1)} }
    @keyframes recDot    { 0%,100%{opacity:1} 50%{opacity:.2} }
    @keyframes orbRotate { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
    @keyframes orbRotateReverse { 0%{transform:rotate(360deg)} 100%{transform:rotate(0deg)} }
    @keyframes orbPulse  { 0%,100%{opacity:.7;transform:scale(1)} 50%{opacity:1;transform:scale(1.04)} }
    @keyframes orbTilt   { 0%,100%{transform:rotate(14deg) scale(1)} 50%{transform:rotate(-14deg) scale(1.03)} }
    @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes shimmer   { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes breathe   { 0%,100%{box-shadow:0 0 0 0 var(--blue-glow)} 60%{box-shadow:0 0 0 14px transparent} }
    @keyframes countUp   { from{opacity:0;transform:scale(.7)} to{opacity:1;transform:scale(1)} }
    @keyframes rxaPulse  { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.88; transform: scale(1.03); } }
    @keyframes rxaGlow   { 0%,100% { opacity: 0.7; transform: scale(1); } 50% { opacity: 1; transform: scale(1.06); } }

    .rxa-fade    { animation: fadeUp .32s cubic-bezier(.2,0,.2,1) both; }
    .rxa-spin    { animation: spin 1s linear infinite; }
    .rxa-pulse   { animation: pulse 1.6s ease infinite; }
    .rxa-float   { animation: float 3.6s ease-in-out infinite; }

    .rxa-btn {
      all: unset; cursor: pointer; user-select: none;
      display: inline-flex; align-items: center; justify-content: center; gap: 7px;
      font-family: 'DM Sans', sans-serif; font-weight: 600; font-size: 13px;
      border-radius: 10px;
      transition: all .18s cubic-bezier(.2,0,.2,1);
      white-space: nowrap;
    }
    .rxa-btn:hover  { filter: brightness(1.12); transform: translateY(-1px); }
    .rxa-btn:active { transform: scale(.97); }
    .rxa-btn[disabled] { opacity:.35; pointer-events:none; }

    .rxa-btn-primary {
      padding: 13px 28px;
      background: var(--green);
      color: #fff;
      font-size: 15px; font-weight: 700;
      border-radius: 12px;
      letter-spacing: -.01em;
      box-shadow: 0 4px 24px rgba(34,197,94,.35);
      width: 100%;
    }
    .rxa-btn-primary:hover { box-shadow: 0 8px 36px rgba(34,197,94,.5); }

    .rxa-btn-blue {
      padding: 10px 20px;
      background: var(--blue-mid);
      color: #fff;
      border-radius: 10px;
      box-shadow: 0 4px 16px var(--blue-glow);
    }
    .rxa-btn-blue:hover { box-shadow: 0 6px 24px var(--blue-glow); }

    .rxa-btn-ghost {
      padding: 9px 15px;
      background: rgba(255,255,255,.055);
      border: 1px solid var(--border);
      color: var(--text-2);
      border-radius: 9px;
    }
    .rxa-btn-ghost:hover { background: rgba(255,255,255,.09); color: var(--text-1); }

    .rxa-btn-danger {
      padding: 9px 15px;
      background: rgba(239,68,68,.09);
      border: 1px solid rgba(239,68,68,.25);
      color: #f87171;
      border-radius: 9px;
    }
    .rxa-btn-danger:hover { background: rgba(239,68,68,.16); }

    .rxa-btn-mic-active {
      padding: 9px 15px;
      background: var(--accent-soft);
      border: 1px solid rgba(91,138,255,.4);
      color: var(--accent);
      border-radius: 9px;
      animation: breathe 2.2s ease infinite;
    }

    .rxa-btn-leave {
      padding: 8px 20px;
      background: var(--red);
      color: #fff;
      border-radius: 9px;
      font-weight: 700;
      font-size: 13px;
      box-shadow: 0 4px 16px rgba(239,68,68,.35);
    }

    .rxa-textarea {
      all: unset;
      display: block;
      width: 100%;
      background: rgba(255,255,255,.035);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 12px 15px;
      font-family: 'DM Sans', sans-serif;
      font-size: 14px;
      line-height: 1.65;
      color: var(--text-1);
      resize: none;
      transition: border-color .18s, box-shadow .18s;
      box-sizing: border-box;
    }
    .rxa-textarea::placeholder { color: var(--text-3); }
    .rxa-textarea:focus {
      border-color: var(--border-blue);
      box-shadow: 0 0 0 3px rgba(45,82,232,.12);
    }

    .rxa-scroll::-webkit-scrollbar         { width: 3px; }
    .rxa-scroll::-webkit-scrollbar-track   { background: transparent; }
    .rxa-scroll::-webkit-scrollbar-thumb   { background: rgba(255,255,255,.1); border-radius: 3px; }

    /* device selector pill */
    .device-pill {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 14px;
      background: rgba(255,255,255,.06);
      border: 1px solid var(--border);
      border-radius: 8px;
      cursor: pointer;
      transition: background .15s;
      color: var(--text-2);
      font-size: 13px;
      font-weight: 500;
      font-family: 'DM Sans', sans-serif;
      max-width: 220px;
    }
    .device-pill:hover { background: rgba(255,255,255,.1); color: var(--text-1); }
    .device-pill span { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }

    /* Orb */
    .orb-ring {
      position: absolute;
      border-radius: 50%;
      border: 1.5px solid;
      animation: orbRotate linear infinite;
    }
    .orb-inner-pulse { animation: orbPulse 2.2s ease-in-out infinite; }
  `;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ANIMATED REXA ORB  (like the Uma orb in image 2)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function RexaOrb({ speaking, processing, size = 200 }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -size * 0.18,
          borderRadius: "50%",
          background: speaking
            ? "radial-gradient(circle, rgba(80,150,255,.28) 0%, rgba(30,70,200,.12) 50%, transparent 72%)"
            : processing
              ? "radial-gradient(circle, rgba(60,120,255,.20) 0%, rgba(20,55,180,.08) 50%, transparent 72%)"
              : "radial-gradient(circle, rgba(40,90,220,.14) 0%, rgba(15,40,160,.06) 50%, transparent 72%)",
          transition: "background 1s ease",
          pointerEvents: "none",
          filter: "blur(20px)",
          animation: speaking
            ? "rxaGlow 1.6s ease-in-out infinite"
            : "rxaGlow 3s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          animation: speaking
            ? "rxaPulse 1.7s ease-in-out infinite"
            : processing
              ? "rxaPulse 2.2s ease-in-out infinite"
              : "rxaPulse 3s ease-in-out infinite",
        }}
      >
        <RexaGlyph
          size={size}
          animated
          speaking={speaking}
          processing={processing}
        />
      </div>
    </div>
  );
}

function RexaGlyph({
  size = 48,
  animated = false,
  speaking = false,
  processing = false,
}) {
  const uid = useId().replace(/:/g, "");
  const bright = speaking ? "#e8f6ff" : processing ? "#cce4ff" : "#b8d8ff";
  const mid1 = speaking ? "#6ab0ff" : processing ? "#5098f0" : "#4080e0";
  const mid2 = speaking ? "#90c8ff" : processing ? "#70aaff" : "#5890f0";
  const dark1 = speaking ? "#1a40a0" : processing ? "#143288" : "#0f2870";
  const dark2 = speaking ? "#2050b8" : processing ? "#183898" : "#122080";

  const gA = `${uid}-ga`;
  const gB = `${uid}-gb`;
  const gC = `${uid}-gc`;
  const gD = `${uid}-gd`;
  const gBg = `${uid}-gbg`;

  const CX = 200;
  const CY = 200;
  const RX = 150;
  const RY = 52;
  const RY2 = 46;

  const speedMul = speaking ? 0.5 : processing ? 0.68 : 1;
  function scaleDur(seconds) {
    return `${(seconds * speedMul).toFixed(1)}s`;
  }

  const layer1 = Array.from({ length: 18 }, (_, i) => ({
    angle: i * 10,
    grad: [gA, gB, gC][i % 3],
    w: 1.25,
    op: 0.9,
    dur: 18 + (i % 3) * 1.5,
    rev: i % 2 === 1,
    rx: RX,
    ry: RY,
  }));

  const layer2 = Array.from({ length: 18 }, (_, i) => ({
    angle: i * 10 + 5,
    grad: [gC, gD, gB][i % 3],
    w: 0.95,
    op: 0.65,
    dur: 22 + (i % 4) * 2,
    rev: i % 2 === 0,
    rx: RX,
    ry: RY2,
  }));

  const layer3 = Array.from({ length: 9 }, (_, i) => ({
    angle: i * 20,
    grad: [gA, gD][i % 2],
    w: 0.7,
    op: 0.38,
    dur: 28 + (i % 3) * 3,
    rev: i % 2 === 1,
    rx: RX,
    ry: RY + 6,
  }));

  return (
    <svg
      viewBox="0 0 400 400"
      width={size}
      height={size}
      aria-hidden="true"
      style={{ display: "block", overflow: "visible" }}
    >
        <defs>
          <radialGradient id={gBg} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0b1535" />
            <stop offset="55%" stopColor="#060d22" />
            <stop offset="100%" stopColor="#030810" />
          </radialGradient>
          <linearGradient id={gA} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={dark1} stopOpacity="0" />
            <stop offset="20%" stopColor={mid1} stopOpacity="1" />
            <stop offset="50%" stopColor={bright} stopOpacity="1" />
            <stop offset="80%" stopColor={mid2} stopOpacity="1" />
            <stop offset="100%" stopColor={dark2} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gB} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={dark2} stopOpacity="0" />
            <stop offset="22%" stopColor={mid2} stopOpacity="1" />
            <stop offset="50%" stopColor={bright} stopOpacity="1" />
            <stop offset="78%" stopColor={mid1} stopOpacity="1" />
            <stop offset="100%" stopColor={dark1} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gC} x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor={dark1} stopOpacity="0" />
            <stop offset="18%" stopColor={mid1} stopOpacity="1" />
            <stop offset="50%" stopColor={bright} stopOpacity="1" />
            <stop offset="82%" stopColor={mid2} stopOpacity="1" />
            <stop offset="100%" stopColor={dark2} stopOpacity="0" />
          </linearGradient>
          <linearGradient id={gD} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor={dark2} stopOpacity="0" />
            <stop offset="20%" stopColor={mid2} stopOpacity="1" />
            <stop offset="50%" stopColor={bright} stopOpacity="1" />
            <stop offset="80%" stopColor={mid1} stopOpacity="1" />
            <stop offset="100%" stopColor={dark1} stopOpacity="0" />
          </linearGradient>
        </defs>

        <circle cx={CX} cy={CY} r="199" fill={`url(#${gBg})`} />

        <g transform={`translate(${CX},${CY})`}>
          {layer3.map((ring, index) => (
            <ellipse
              key={`l3-${index}`}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke={`url(#${ring.grad})`}
              strokeWidth={ring.w}
              strokeOpacity={ring.op}
              strokeLinecap="round"
              transform={`rotate(${ring.angle})`}
            >
              {animated && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${ring.angle}`}
                  to={`${ring.angle + (ring.rev ? -360 : 360)}`}
                  dur={scaleDur(ring.dur)}
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
          ))}

          {layer1.map((ring, index) => (
            <ellipse
              key={`l1-${index}`}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke={`url(#${ring.grad})`}
              strokeWidth={ring.w}
              strokeOpacity={ring.op}
              strokeLinecap="round"
              transform={`rotate(${ring.angle})`}
            >
              {animated && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${ring.angle}`}
                  to={`${ring.angle + (ring.rev ? -360 : 360)}`}
                  dur={scaleDur(ring.dur)}
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
          ))}

          {layer2.map((ring, index) => (
            <ellipse
              key={`l2-${index}`}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke={`url(#${ring.grad})`}
              strokeWidth={ring.w}
              strokeOpacity={ring.op}
              strokeLinecap="round"
              transform={`rotate(${ring.angle})`}
            >
              {animated && (
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`${ring.angle}`}
                  to={`${ring.angle + (ring.rev ? -360 : 360)}`}
                  dur={scaleDur(ring.dur)}
                  repeatCount="indefinite"
                />
              )}
            </ellipse>
          ))}
        </g>
    </svg>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// WAVEFORM
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function WaveformBars({ active, color = "#5b8aff", count = 5 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, height: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          style={{
            width: 3,
            height: "100%",
            borderRadius: 3,
            background: color,
            transformOrigin: "center",
            transform: active ? undefined : "scaleY(.18)",
            animation: active
              ? `bar ${0.48 + i * 0.09}s ease-in-out ${i * 0.07}s infinite`
              : "none",
            transition: "transform .3s",
          }}
        />
      ))}
    </div>
  );
}

function LiveDot({ color = "#ef4444", blink = true }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 7,
        height: 7,
        borderRadius: "50%",
        background: color,
        flexShrink: 0,
        animation: blink ? "recDot 1.4s ease infinite" : "none",
      }}
    />
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// CHECK ROW
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function CheckRow({ icon, label, ok }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span
        style={{
          color: ok ? "var(--green)" : "#f87171",
          flexShrink: 0,
          display: "flex",
        }}
      >
        {ok ? <Check size={14} /> : <WifiOff size={14} />}
      </span>
      <span style={{ fontSize: 14, color: "var(--text-2)", flex: 1 }}>
        {label}
      </span>
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          padding: "2px 8px",
          borderRadius: 6,
          background: ok ? "var(--green-soft)" : "rgba(239,68,68,.1)",
          color: ok ? "var(--green)" : "#f87171",
        }}
      >
        {ok ? "Ready" : "Check"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// PRE-JOIN SCREEN  (like image 1: left = camera, right = info + start)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function PreJoinScreen({
  job,
  micSupported,
  videoRef,
  cameraReady,
  cameraInitializing,
  cameraPermissionDenied,
  onBegin,
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        display: "grid",
        gridTemplateColumns: "1fr 440px",
        overflowX: "hidden",
      }}
    >
      {/* LEFT --- camera preview */}
      <div
        style={{
          position: "relative",
          background: "#04060f",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* subtle grid */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage: `linear-gradient(rgba(45,82,232,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,82,232,.04) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        />
        {/* glow corners */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 300,
            height: 300,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 0% 0%, rgba(45,82,232,.12) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 300,
            height: 300,
            pointerEvents: "none",
            background:
              "radial-gradient(circle at 100% 100%, rgba(45,82,232,.08) 0%, transparent 70%)",
          }}
        />

        {/* video */}
        <div
          style={{
            position: "relative",
            width: "min(640px, 88%)",
            aspectRatio: "4/3",
            borderRadius: 18,
            overflow: "hidden",
            border: "1.5px solid rgba(45,82,232,.3)",
            background: "#08101e",
            boxShadow:
              "0 24px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(255,255,255,.04)",
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: cameraReady ? "block" : "none",
              transform: "scaleX(-1)",
            }}
          />
          {!cameraReady && (
            <div
              style={{
                width: "100%",
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
              }}
            >
              {cameraPermissionDenied ? (
                <>
                  <CameraOff size={36} color="rgba(255,255,255,.18)" />
                  <span style={{ fontSize: 14, color: "var(--text-3)" }}>
                    Camera blocked
                  </span>
                </>
              ) : (
                <>
                  {cameraInitializing && (
                    <div
                      className="rxa-spin"
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: "50%",
                        border: "2px solid var(--blue-light)",
                        borderTopColor: "transparent",
                      }}
                    />
                  )}
                  <span style={{ fontSize: 14, color: "var(--text-3)" }}>
                    {cameraInitializing
                      ? "Starting camera---"
                      : "Camera preview will appear here"}
                  </span>
                </>
              )}
            </div>
          )}

          {/* name badge overlay */}
          {cameraReady && (
            <div
              style={{
                position: "absolute",
                bottom: 14,
                left: 14,
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 12px",
                borderRadius: 8,
                background: "rgba(6,9,26,.78)",
                backdropFilter: "blur(12px)",
                border: "1px solid var(--border)",
              }}
            >
              <LiveDot color="var(--green)" blink />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: "var(--text-1)",
                }}
              >
                You
              </span>
            </div>
          )}
        </div>

        {/* device selectors */}
        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 18,
            width: "min(640px, 88%)",
            alignItems: "center",
          }}
        >
          {/* branding */}
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              flexShrink: 0,
              background: "linear-gradient(135deg, #0f163d, #06091a)",
              border: "1px solid var(--border-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 16px var(--blue-glow)",
              overflow: "hidden",
            }}
          >
            <RexaGlyph
              size={40}
              animated={false}
              speaking={false}
              processing={false}
            />
          </div>
          <div className="device-pill" style={{ flex: 1 }}>
            <Mic size={13} color="var(--accent)" />
            <span>Microphone Array</span>
            <ChevronDown
              size={13}
              style={{ flexShrink: 0, marginLeft: "auto" }}
            />
          </div>
          <div className="device-pill" style={{ flex: 1 }}>
            <Camera size={13} color="var(--accent)" />
            <span>HD Camera</span>
            <ChevronDown
              size={13}
              style={{ flexShrink: 0, marginLeft: "auto" }}
            />
          </div>
          <button
            className="rxa-btn rxa-btn-ghost"
            style={{ padding: "9px 12px", borderRadius: 9 }}
          >
            <Settings size={14} />
          </button>
        </div>
      </div>

      {/* RIGHT --- info panel */}
      <div
        style={{
          background: "var(--navy-2)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "48px 36px",
          gap: 0,
        }}
      >
        {/* label */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 14,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--accent)",
              background: "var(--accent-soft)",
              padding: "3px 10px",
              borderRadius: 6,
              letterSpacing: ".02em",
            }}
          >
            Instant interview
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-3)",
              background: "rgba(255,255,255,.06)",
              padding: "2px 8px",
              borderRadius: 6,
              border: "1px solid var(--border)",
              letterSpacing: ".04em",
            }}
          >
            BETA
          </span>
        </div>

        <h1
          style={{
            margin: "0 0 28px",
            fontSize: 26,
            fontWeight: 700,
            color: "var(--text-1)",
            letterSpacing: "-.02em",
            lineHeight: 1.25,
          }}
        >
          {job?.title || "AI Interview"}
        </h1>

        {/* what to expect */}
        <div
          style={{
            background: "rgba(255,255,255,.03)",
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: "18px 20px",
            marginBottom: 24,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-1)",
              marginBottom: 14,
              letterSpacing: "-.01em",
            }}
          >
            What to expect
          </div>
          {[
            "You'll speak with an AI interviewer who will ask the questions",
            "~4-10 questions -- length adapts to your answers",
            "Answers must be in English",
            "Hiring Team will get a recording and clips of your exact answers",
            "For a great interview, keep answers relevant and concise",
          ].map((item, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "7px 0",
                borderTop: i > 0 ? "1px solid rgba(255,255,255,.04)" : "none",
              }}
            >
              <div
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "var(--blue-light)",
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.6,
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>

        {/* checks */}
        <div style={{ marginBottom: 24 }}>
          <CheckRow
            icon={<Mic size={13} />}
            label="Microphone"
            ok={micSupported}
          />
          <CheckRow icon={<Camera size={13} />} label="Camera" ok={true} />
          <CheckRow icon={<Wifi size={13} />} label="Connection" ok={true} />
          <CheckRow
            icon={<Shield size={13} />}
            label="Secure session"
            ok={true}
          />
        </div>

        {/* privacy notice */}
        <div
          style={{
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            padding: "10px 13px",
            background: "rgba(245,158,11,.06)",
            border: "1px solid rgba(245,158,11,.18)",
            borderRadius: 10,
            marginBottom: 24,
          }}
        >
          <ShieldAlert
            size={13}
            style={{ color: "var(--amber)", flexShrink: 0, marginTop: 1 }}
          />
          <span
            style={{ fontSize: 12, color: "var(--text-3)", lineHeight: 1.6 }}
          >
            Stay in this window throughout. Tab switches and fullscreen exits
            are automatically flagged.
          </span>
        </div>

        <button
          className="rxa-btn rxa-btn-primary"
          onClick={onBegin}
          style={{ width: "88%", justifyContent: "center" }}
        >
          Start interview
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// ACTIVE SESSION  (like image 2: fullscreen orb, candidate pip, caption)
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function ActiveSession({
  job,
  applicant,
  speaking,
  listening,
  processing,
  recording,
  cameraReady,
  videoRef,
  pipVideoRef,
  currentQuestion,
  questionCount,
  entries,
  currentAnswer,
  setCurrentAnswer,
  interimText,
  draftStatus,
  warningNotice,
  focusWarnings,
  onToggleMic,
  onSendAnswer,
  onReplay,
  onEnd,
  bottomRef,
  STEPS,
  stepIdx,
}) {
  const [showTranscript, setShowTranscript] = useState(true);

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at 50% 36%, rgba(98,146,255,.2) 0%, rgba(24,34,78,.18) 24%, rgba(7,11,27,.98) 66%), linear-gradient(90deg, #01040d 0%, #071026 18%, #0a1430 50%, #071026 82%, #01040d 100%)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      {/* subtle mesh bg */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
          backgroundImage: `
          radial-gradient(ellipse 840px 420px at 50% 32%, rgba(130,186,255,.24) 0%, rgba(88,132,255,.12) 28%, transparent 60%),
          linear-gradient(90deg, rgba(0,0,0,.7) 0%, rgba(0,0,0,.26) 16%, transparent 34%, transparent 66%, rgba(0,0,0,.26) 84%, rgba(0,0,0,.72) 100%),
          radial-gradient(ellipse 700px 520px at 50% 100%, rgba(0,0,0,.35) 0%, transparent 64%)
        `,
        }}
      />

      {/* ------ TOP BAR ------ */}
      <header
        style={{
          position: "relative",
          zIndex: 20,
          height: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          borderBottom: "1px solid var(--border)",
          background: "rgba(6,9,26,.9)",
          backdropFilter: "blur(20px)",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              flexShrink: 0,
              background: "linear-gradient(135deg, #0f163d, #06091a)",
              border: "1px solid var(--border-blue)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <RexaGlyph
              size={30}
              animated={false}
              speaking={false}
              processing={false}
            />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "var(--text-1)",
                lineHeight: 1.2,
              }}
            >
              {AGENT_NAME}
            </div>
            <div
              style={{ fontSize: 10, color: "var(--text-3)", lineHeight: 1.2 }}
            >
              {job?.title}
            </div>
          </div>
        </div>

        {/* center status */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "5px 14px 5px 10px",
            borderRadius: 999,
            background: "rgba(255,255,255,.05)",
            border: "1px solid var(--border)",
          }}
        >
          <LiveDot
            color={
              speaking
                ? "var(--accent)"
                : listening
                  ? "var(--green)"
                  : processing
                    ? "var(--amber)"
                    : "rgba(255,255,255,.2)"
            }
            blink
          />
          <span
            style={{ fontSize: 12, fontWeight: 500, color: "var(--text-2)" }}
          >
            {speaking
              ? `${AGENT_NAME} speaking`
              : listening
                ? "Listening"
                : processing
                  ? "Thinking---"
                  : "Ready"}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {recording && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 11px",
                borderRadius: 999,
                background: "rgba(239,68,68,.09)",
                border: "1px solid rgba(239,68,68,.22)",
              }}
            >
              <LiveDot color="#ef4444" blink />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#f87171",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                REC
              </span>
            </div>
          )}
          {/* Q counter */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "5px 12px",
              borderRadius: 8,
              background: "rgba(255,255,255,.04)",
              border: "1px solid var(--border)",
            }}
          >
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "var(--text-1)",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              {Math.min(questionCount, MAX_QUESTIONS)}/{MAX_QUESTIONS}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>Q</span>
          </div>
          <button
            className="rxa-btn rxa-btn-ghost"
            style={{ padding: "6px 12px", fontSize: 12 }}
            onClick={() => setShowTranscript((v) => !v)}
          >
            Transcript
          </button>
        </div>
      </header>

      {/* ------ MAIN AREA ------ */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px 16px",
          gap: 0,
        }}
      >
        {/* ORB */}
        <div className="rxa-float" style={{ marginBottom: 28 }}>
          <RexaOrb speaking={speaking} processing={processing} size={220} />
        </div>

        {/* agent name */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "var(--text-1)",
              letterSpacing: "-.02em",
              marginBottom: 4,
            }}
          >
            {AGENT_NAME}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <WaveformBars active={speaking} color="var(--accent)" count={5} />
            {listening && (
              <WaveformBars active color="var(--green)" count={3} />
            )}
            <span style={{ fontSize: 12, color: "var(--text-3)" }}>
              {speaking
                ? "Speaking"
                : listening
                  ? "Listening to you"
                  : processing
                    ? "Thinking---"
                    : "AI Interviewer -- Adaptive mode"}
            </span>
          </div>
        </div>

        {/* current question caption */}
        <div
          style={{
            maxWidth: 620,
            width: "100%",
            padding: "16px 20px",
            borderRadius: 14,
            background: "rgba(11,16,48,.7)",
            backdropFilter: "blur(16px)",
            border: "1px solid var(--border-blue)",
            marginBottom: 20,
            minHeight: 68,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {processing ? (
            <Loader
              size={15}
              style={{
                color: "var(--amber)",
                flexShrink: 0,
                animation: "spin 1s linear infinite",
              }}
            />
          ) : (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--accent)",
                flexShrink: 0,
                animation: speaking ? "recDot 1.5s ease infinite" : "none",
              }}
            />
          )}
          <span
            style={{
              fontSize: 15,
              lineHeight: 1.65,
              color: processing ? "var(--text-3)" : "var(--text-1)",
              animation: processing ? "pulse 1.5s ease infinite" : "none",
              fontStyle: processing ? "italic" : "normal",
            }}
          >
            {processing
              ? `${AGENT_NAME} is preparing the next question---`
              : currentQuestion || "Waiting---"}
          </span>
        </div>

        {/* warning */}
        {warningNotice && (
          <div
            className="rxa-fade"
            style={{
              maxWidth: 620,
              width: "100%",
              padding: "9px 14px",
              borderRadius: 10,
              marginBottom: 14,
              background:
                focusWarnings >= 3
                  ? "rgba(239,68,68,.09)"
                  : "rgba(245,158,11,.07)",
              border: `1px solid ${focusWarnings >= 3 ? "rgba(239,68,68,.26)" : "rgba(245,158,11,.2)"}`,
              display: "flex",
              gap: 9,
              alignItems: "center",
            }}
          >
            <AlertTriangle
              size={13}
              style={{
                color: focusWarnings >= 3 ? "#f87171" : "var(--amber)",
                flexShrink: 0,
              }}
            />
            <span
              style={{
                fontSize: 12,
                color: focusWarnings >= 3 ? "#f87171" : "var(--amber)",
                lineHeight: 1.5,
              }}
            >
              {warningNotice}
            </span>
          </div>
        )}

        {false && (
          <div
            style={{
              maxWidth: 620,
              width: "100%",
              padding: "9px 14px",
              borderRadius: 10,
              marginBottom: 14,
              background: integrityStatus.includes("failed")
                ? "rgba(239,68,68,.08)"
                : "rgba(91,138,255,.07)",
              border: integrityStatus.includes("failed")
                ? "1px solid rgba(239,68,68,.24)"
                : "1px solid rgba(91,138,255,.18)",
              display: "flex",
              gap: 9,
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontSize: 12,
                color: integrityStatus.includes("failed")
                  ? "#fca5a5"
                  : "var(--text-3)",
                lineHeight: 1.5,
              }}
            >
              {integrityStatus}
            </span>
          </div>
        )}

        {/* answer input */}
        <div style={{ maxWidth: 620, width: "100%" }}>
          <textarea
            className="rxa-textarea"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            rows={3}
            placeholder={
              listening
                ? "Speak naturally, then click Send Answer."
                : "Wait for Rexa to finish, then answer naturally."
            }
          />
          {interimText && (
            <div
              style={{
                marginTop: 6,
                padding: "6px 11px",
                borderRadius: 8,
                background: "rgba(91,138,255,.07)",
                border: "1px dashed rgba(91,138,255,.25)",
                display: "flex",
                gap: 7,
                alignItems: "center",
              }}
            >
              <Activity
                size={11}
                style={{ color: "var(--accent)", flexShrink: 0 }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: "rgba(91,138,255,.8)",
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {interimText}
              </span>
            </div>
          )}
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              color: "var(--text-3)",
            }}
          >
            {draftStatus}
          </div>
          <div
            style={{
              textAlign: "left",
              fontSize: 11,
              color: "var(--text-3)",
              marginTop: 4,
            }}
          >
            Click Send Answer when your response is ready.
          </div>
        </div>
      </div>

      {/* ------ BOTTOM BAR ------ */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          flexShrink: 0,
          padding: "12px 24px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          borderTop: "1px solid var(--border)",
          background: "rgba(6,9,26,.9)",
          backdropFilter: "blur(20px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            minWidth: 250,
            padding: "10px 14px",
            borderRadius: 12,
            background: "rgba(255,255,255,.04)",
            border: "1px solid var(--border)",
          }}
        >
          <Mic size={14} color={listening ? "#22c55e" : "rgba(255,255,255,.45)"} />
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-1)" }}>
              Manual voice reply
            </span>
            <span style={{ fontSize: 11, color: "var(--text-3)" }}>
              {listening
                ? "Listening now. Click Send Answer when done."
                : speaking
                  ? "Waiting for Rexa to finish speaking"
                  : processing
                    ? "Preparing the next question"
                    : "Use Open Mic to start voice capture"}
            </span>
          </div>
        </div>

        <button
          className={`rxa-btn ${listening ? "rxa-btn-mic-active" : "rxa-btn-ghost"}`}
          onClick={onToggleMic}
          style={{ minWidth: 110 }}
        >
          <Mic size={14} />
          {listening ? "Stop Mic" : "Open Mic"}
        </button>

        <button
          className="rxa-btn rxa-btn-blue"
          onClick={onSendAnswer}
          disabled={processing}
          style={{ minWidth: 122 }}
        >
          <ChevronRight size={14} />
          Send Answer
        </button>

        <button
          className="rxa-btn rxa-btn-ghost"
          onClick={onReplay}
          disabled={!currentQuestion || processing}
          style={{ minWidth: 90 }}
        >
          <RotateCcw size={14} />
          Replay
        </button>

        <button
          className="rxa-btn rxa-btn-leave"
          onClick={onEnd}
          disabled={processing}
        >
          Leave
        </button>
      </div>

      <div
        style={{
          position: "fixed",
          left: 24,
          bottom: 96,
          zIndex: 30,
          width: 212,
          borderRadius: 18,
          overflow: "hidden",
          border: cameraReady
            ? "1px solid rgba(111,168,255,.34)"
            : "1px solid rgba(255,255,255,.08)",
          background:
            "linear-gradient(180deg, rgba(12,16,38,.96), rgba(8,10,25,.98))",
          boxShadow:
            "0 24px 50px rgba(0,0,0,.42), 0 0 0 1px rgba(255,255,255,.04)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 12px 8px",
            borderBottom: "1px solid rgba(255,255,255,.06)",
            background: "rgba(255,255,255,.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <LiveDot
              color={cameraReady ? "#22c55e" : "#ef4444"}
              blink={cameraReady}
            />
            <span
              style={{ fontSize: 11, fontWeight: 700, color: "var(--text-1)" }}
            >
              {applicant?.name || "Candidate"}
            </span>
          </div>
          <span style={{ fontSize: 10, color: "var(--text-3)" }}>
            {cameraReady ? "Camera live" : "Camera unavailable"}
          </span>
        </div>

        <div
          style={{
            position: "relative",
            aspectRatio: "4 / 3",
            background:
              "radial-gradient(circle at 50% 35%, rgba(70,104,221,.18), transparent 62%), #090d1f",
          }}
        >
          <video
            ref={pipVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: cameraReady ? "block" : "none",
              transform: "scaleX(-1)",
            }}
          />
          {!cameraReady && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                color: "var(--text-3)",
              }}
            >
              <CameraOff size={24} />
              <span style={{ fontSize: 12 }}>Waiting for camera feed</span>
            </div>
          )}
        </div>
      </div>

      {/* slide-over transcript */}
      {showTranscript && (
        <div
          className="rxa-fade"
          style={{
            position: "fixed",
            top: 52,
            right: 0,
            bottom: 0,
            zIndex: 40,
            width: 340,
            background: "rgba(11,16,48,.97)",
            borderLeft: "1px solid var(--border)",
            backdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{ fontSize: 13, fontWeight: 700, color: "var(--text-1)" }}
            >
              Transcript
            </span>
            <button
              className="rxa-btn rxa-btn-ghost"
              style={{ padding: "4px 10px", fontSize: 11 }}
              onClick={() => setShowTranscript(false)}
            >
              Close
            </button>
          </div>
          <div
            className="rxa-scroll"
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px 14px",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {entries.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "var(--text-3)",
                  fontSize: 13,
                }}
              >
                No messages yet.
              </div>
            ) : (
              entries.map((e, i) => {
                const agent = e.role === "assistant";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 3,
                      alignItems: agent ? "flex-start" : "flex-end",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: agent ? "var(--accent)" : "var(--text-3)",
                        marginLeft: agent ? 4 : 0,
                        marginRight: agent ? 0 : 4,
                      }}
                    >
                      {agent ? AGENT_NAME : applicant?.name || "You"}
                    </span>
                    <div
                      style={{
                        maxWidth: "85%",
                        padding: "9px 13px",
                        borderRadius: agent
                          ? "3px 12px 12px 12px"
                          : "12px 3px 12px 12px",
                        background: agent
                          ? "rgba(45,82,232,.12)"
                          : "rgba(255,255,255,.05)",
                        border: `1px solid ${agent ? "rgba(45,82,232,.22)" : "var(--border)"}`,
                        fontSize: 13,
                        color: "var(--text-1)",
                        lineHeight: 1.6,
                      }}
                    >
                      {e.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// COMPLETED OVERLAY
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function CompletedScreen({ report }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: "50%",
          marginBottom: 24,
          background: "var(--green-soft)",
          border: "1.5px solid rgba(34,197,94,.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 36px rgba(34,197,94,.2)",
          animation: "countUp .45s cubic-bezier(.2,0,.2,1) both",
        }}
      >
        <CheckCircle2 size={32} color="var(--green)" />
      </div>
      <h2
        style={{
          margin: "0 0 10px",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--text-1)",
          letterSpacing: "-.02em",
        }}
      >
        Interview Complete
      </h2>
      <p
        style={{
          margin: "0 0 32px",
          fontSize: 14,
          color: "var(--text-2)",
          lineHeight: 1.7,
          maxWidth: 300,
        }}
      >
        {AGENT_NAME} has submitted your session for review. Expect to hear back
        from the hiring team shortly.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// LOADING
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--navy)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 20,
      }}
    >
      <div className="rxa-float">
        <RexaOrb size={80} speaking processing />
      </div>
      <div
        className="rxa-pulse"
        style={{
          fontSize: 11,
          color: "rgba(91,138,255,.6)",
          letterSpacing: ".1em",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        INITIALIZING SESSION
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
// MAIN PAGE
// ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default function AiInterviewPage() {
  const { applicantId: accessToken } = useParams();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicant, setApplicant] = useState(null);
  const [job, setJob] = useState(null);
  const [started, setStarted] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [interimText, setInterimText] = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [finalReport, setFinalReport] = useState(null);
  const [suspiciousEvents, setSuspiciousEvents] = useState([]);
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [warningNotice, setWarningNotice] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraInitializing, setCameraInitializing] = useState(false);
  const [cameraPermissionDenied, setCameraPermissionDenied] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState(
    "Loading camera integrity checks...",
  );
  const [recording, setRecording] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState("Standby");
  const [recordingUrl, setRecordingUrl] = useState("");
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [tick, setTick] = useState(0);
  const [warmupPending, setWarmupPending] = useState(true);
  const [draftStatus, setDraftStatus] = useState("Waiting for your answer");

  const recognitionRef = useRef(null);
  const srFinalTextRef = useRef("");
  const srInterimTextRef = useRef("");
  const transcriptRef = useRef([]);
  const videoRef = useRef(null);
  const pipVideoRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const previewRequestedRef = useRef(false);
  const keepRef = useRef(false);
  const manualRef = useRef(false);
  const autoSubmitTimeoutRef = useRef(null);
  const processingRef = useRef(false);
  const currentAnswerRef = useRef("");
  const interimTextRef = useRef("");
  const turnRecorderRef = useRef(null);
  const turnChunksRef = useRef([]);
  const turnAnalyserRef = useRef(null);
  const turnAudioCtxRef = useRef(null);
  const turnSourceRef = useRef(null);
  const turnStreamRef = useRef(null);
  const turnLoopRef = useRef(null);
  const turnCaptureStartedAtRef = useRef(0);
  const turnLastVoiceAtRef = useRef(0);
  const turnDetectedVoiceRef = useRef(false);
  const turnStoppingRef = useRef(false);
  const speakingRef = useRef(false);
  const speechTurnIdRef = useRef(0);
  const speechWatchdogRef = useRef(null);
  const bottomRef = useRef(null);
  const integrityCooldownsRef = useRef({});
  const frameCanvasRef = useRef(null);
  const integrityLoopRef = useRef(null);
  const integrityModelPromiseRef = useRef(null);
  const faceMeshRef = useRef(null);
  const faceMeshBusyRef = useRef(false);
  const faceLandmarksRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const objectDetectorBusyRef = useRef(false);
  const integrityFrameCountRef = useRef(0);
  const faceMissingStreakRef = useRef(0);
  const offCenterStreakRef = useRef(0);
  const lowLightStreakRef = useRef(0);
  const blankFrameStreakRef = useRef(0);
  const micSupported = !!getSR();

  const STEPS = [
    "Introduction",
    "Background",
    "Technical",
    "Problem Solving",
    "Behavioral",
    "Situational",
    "Case Study",
  ];
  const stepIdx = Math.min(
    STEPS.length - 1,
    Math.max(0, questionCount ? questionCount - 1 : 0),
  );
  const entries = transcriptRef.current;
  const clearAutoSubmit = useCallback(() => {
    if (autoSubmitTimeoutRef.current) {
      clearTimeout(autoSubmitTimeoutRef.current);
      autoSubmitTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    injectStyles();
  }, []);
  useEffect(() => {
    processingRef.current = processing;
  }, [processing]);
  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);
  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);
  useEffect(() => {
    interimTextRef.current = interimText;
  }, [interimText]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [tick]);

  // ------ DATA FETCH ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const { data: context, error: ae } = await supabase
          .rpc("get_public_recruitment_context", {
            p_access_token: accessToken,
          });
        if (ae) throw ae;
        const ar = context?.applicant || null;
        const jr = context?.job || null;
        if (!ar || !jr) throw new Error("Interview not available.");
        if (!live) return;
        setApplicant(ar);
        setJob(jr);
        const iv = ar.answers?.__aiInterview || null;
        if (iv?.recordingUrl) setRecordingUrl(iv.recordingUrl);
        if (iv?.report) {
          setFinalReport(iv.report);
          setCompleted(true);
        }
      } catch (e) {
        setError(e.message || "Unable to load interview.");
      } finally {
        if (live) setLoading(false);
      }
    })();
    return () => {
      live = false;
      window.speechSynthesis?.cancel();
      if (autoSubmitTimeoutRef.current) clearTimeout(autoSubmitTimeoutRef.current);
      if (speechWatchdogRef.current) clearTimeout(speechWatchdogRef.current);
      recognitionRef.current?.stop?.();
      if (turnLoopRef.current) cancelAnimationFrame(turnLoopRef.current);
      turnLoopRef.current = null;
      try {
        turnRecorderRef.current?.stop?.();
      } catch {}
      turnRecorderRef.current = null;
      turnSourceRef.current?.disconnect?.();
      turnSourceRef.current = null;
      turnAnalyserRef.current = null;
      turnStreamRef.current?.getTracks?.().forEach((track) => track.stop());
      turnStreamRef.current = null;
      turnAudioCtxRef.current?.close?.();
      turnAudioCtxRef.current = null;
      recorderRef.current?.stop?.();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [accessToken]);

  useEffect(() => {
    if (
      loading ||
      !applicant ||
      completed ||
      started ||
      cameraReady ||
      cameraPermissionDenied ||
      previewRequestedRef.current
    ) {
      return;
    }
    previewRequestedRef.current = true;
    setupCamera().catch(() => {
      setCameraPermissionDenied(true);
      setRecordingStatus("Camera blocked");
    });
  }, [loading, applicant, completed, started, cameraReady, cameraPermissionDenied]);

  // ------ ANTI-CHEAT ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!started || completed) return;
    const flag = (label, cooldownMs = 12000) => {
      const now = Date.now();
      const lastAt = integrityCooldownsRef.current[label] || 0;
      if (now - lastAt < cooldownMs) return;
      integrityCooldownsRef.current[label] = now;
      setSuspiciousEvents((p) => [
        ...p,
        { label, at: new Date().toISOString() },
      ]);
      setFocusWarnings((p) => {
        const n = p + 1;
        setWarningNotice(
          n >= 3
            ? `Multiple integrity violations detected. Latest issue: ${label}`
            : label,
        );
        return n;
      });
    };
    const onVis = () => {
      if (document.hidden) flag("Tab switch detected.");
    };
    const onBlur = () => flag("Window lost focus.");
    const onFs = () => {
      if (!document.fullscreenElement) flag("Exited fullscreen.");
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    document.addEventListener("fullscreenchange", onFs);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("fullscreenchange", onFs);
    };
  }, [started, completed]);

  const ensureIntegrityModels = useCallback(async () => {
    if (!ENABLE_ADVANCED_INTEGRITY) {
      setIntegrityStatus("Light integrity mode active.");
      return null;
    }
    if (integrityModelPromiseRef.current) {
      return integrityModelPromiseRef.current;
    }

    integrityModelPromiseRef.current = (async () => {
      setIntegrityStatus("Loading face and mobile detection...");
      const [{ FaceMesh }, cocoSsd, tf] = await Promise.all([
        import("@mediapipe/face_mesh"),
        import("@tensorflow-models/coco-ssd"),
        import("@tensorflow/tfjs"),
      ]);

      await tf.ready();

      const faceMesh = new FaceMesh({
        locateFile: (file) => `/mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results) => {
        faceLandmarksRef.current = results?.multiFaceLandmarks?.[0] || null;
      });
      faceMeshRef.current = faceMesh;

      objectDetectorRef.current = await cocoSsd.load({
        base: "lite_mobilenet_v2",
      });

      setIntegrityStatus("Face and mobile detection active.");
    })();

    try {
      await integrityModelPromiseRef.current;
    } catch (error) {
      console.warn("Integrity models failed to load:", error);
      setIntegrityStatus(
        "Face and mobile detection failed to load. Check local model assets.",
      );
      setWarningNotice(
        "Advanced camera integrity checks could not start. Low-light detection still continues.",
      );
      integrityModelPromiseRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (
      !started ||
      completed ||
      !cameraReady ||
      (!videoRef.current && !pipVideoRef.current)
    ) {
      return;
    }

    const flag = (label, cooldownMs = 12000) => {
      const now = Date.now();
      const lastAt = integrityCooldownsRef.current[label] || 0;
      if (now - lastAt < cooldownMs) return;
      integrityCooldownsRef.current[label] = now;
      setSuspiciousEvents((p) => [
        ...p,
        { label, at: new Date().toISOString() },
      ]);
      setFocusWarnings((p) => {
        const n = p + 1;
        setWarningNotice(
          n >= 3
            ? `Multiple integrity violations detected. Latest issue: ${label}`
            : label,
        );
        return n;
      });
    };

    if (MOBILE_DEVICE_REGEX.test(navigator.userAgent || "")) {
      flag("Interview opened from a mobile device.", 60000);
    }

    const canvas =
      frameCanvasRef.current || document.createElement("canvas");
    frameCanvasRef.current = canvas;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    let cancelled = false;

    const inspectFrame = async () => {
      const activeVideo = pipVideoRef.current || videoRef.current;
      if (
        cancelled ||
        !activeVideo ||
        activeVideo.readyState < 2 ||
        !ctx
      ) {
        integrityLoopRef.current = setTimeout(inspectFrame, INTEGRITY_SCAN_INTERVAL_MS);
        return;
      }

      const width = 160;
      const height = 120;
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(activeVideo, 0, 0, width, height);

      const frame = ctx.getImageData(0, 0, width, height).data;
      let brightnessTotal = 0;
      let brightnessSquares = 0;
      let darkPixels = 0;
      for (let i = 0; i < frame.length; i += 4) {
        const brightness =
          frame[i] * 0.299 + frame[i + 1] * 0.587 + frame[i + 2] * 0.114;
        brightnessTotal += brightness;
        brightnessSquares += brightness * brightness;
        if (brightness < 45) darkPixels += 1;
      }
      const pixelCount = frame.length / 4;
      const avgBrightness = brightnessTotal / pixelCount;
      const variance =
        brightnessSquares / pixelCount - avgBrightness * avgBrightness;
      const contrast = Math.sqrt(Math.max(variance, 0));
      const darkRatio = darkPixels / pixelCount;

      integrityFrameCountRef.current += 1;

      if (faceMeshRef.current && !faceMeshBusyRef.current) {
        faceMeshBusyRef.current = true;
        faceMeshRef.current
          .send({ image: canvas })
          .catch(() => {})
          .finally(() => {
            faceMeshBusyRef.current = false;
          });
      }

      if (
        objectDetectorRef.current &&
        !objectDetectorBusyRef.current &&
        integrityFrameCountRef.current % 24 === 0
      ) {
        objectDetectorBusyRef.current = true;
        objectDetectorRef.current
          .detect(canvas)
          .then((predictions) => {
            const phoneDetected = predictions?.some(
              (prediction) =>
                prediction.class === "cell phone" && prediction.score >= 0.35,
            );
            if (phoneDetected) {
              flag("Cell phone detected in camera view.", 10000);
            }
          })
          .catch(() => {})
          .finally(() => {
            objectDetectorBusyRef.current = false;
          });
      }

      if (
        avgBrightness < 95 ||
        darkRatio > 0.68 ||
        (avgBrightness < 110 && contrast < 42)
      )
        lowLightStreakRef.current += 1;
      else lowLightStreakRef.current = 0;

      if (
        (darkRatio > 0.88 && contrast < 26) ||
        (avgBrightness < 70 && contrast < 24) ||
        (avgBrightness < 90 && darkRatio > 0.8)
      ) {
        blankFrameStreakRef.current += 1;
      } else {
        blankFrameStreakRef.current = 0;
      }

      if (lowLightStreakRef.current >= 2) {
        flag("Very low lighting detected on camera.", 12000);
      }

      if (blankFrameStreakRef.current >= 2) {
        flag("Camera feed appears too dark or no face is clearly visible.", 10000);
      }

      const landmarks = faceLandmarksRef.current;
      if (landmarks?.length) {
        faceMissingStreakRef.current = 0;

        const xs = landmarks.map((point) => point.x);
        const ys = landmarks.map((point) => point.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        const faceWidth = Math.max(maxX - minX, 0.001);
        const faceHeight = Math.max(maxY - minY, 0.001);
        const faceCenterX = minX + faceWidth / 2;
        const faceCenterY = minY + faceHeight / 2;
        const nose = landmarks[1];

        const turnedAway =
          Math.abs(faceCenterX - 0.5) > 0.17 ||
          Math.abs(faceCenterY - 0.5) > 0.2 ||
          Math.abs((nose?.x || faceCenterX) - faceCenterX) > faceWidth * 0.16;

        if (turnedAway) {
          offCenterStreakRef.current += 1;
        } else {
          offCenterStreakRef.current = 0;
        }

        if (offCenterStreakRef.current >= 6) {
          flag(
            "Candidate appears to be looking away from the screen repeatedly.",
            10000,
          );
          offCenterStreakRef.current = 0;
        }
      } else if (blankFrameStreakRef.current >= 2) {
        faceMissingStreakRef.current += 1;
        if (faceMissingStreakRef.current >= 2) {
          flag("No clearly visible face detected on camera.", 10000);
          faceMissingStreakRef.current = 0;
        }
      } else {
        faceMissingStreakRef.current = 0;
        offCenterStreakRef.current = 0;
      }

      integrityLoopRef.current = setTimeout(inspectFrame, INTEGRITY_SCAN_INTERVAL_MS);
    };

    if (ENABLE_ADVANCED_INTEGRITY) {
      setTimeout(() => {
        if (!cancelled) ensureIntegrityModels();
      }, 15000);
    }
    integrityLoopRef.current = setTimeout(inspectFrame, INTEGRITY_SCAN_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(integrityLoopRef.current);
      integrityLoopRef.current = null;
      faceMissingStreakRef.current = 0;
      offCenterStreakRef.current = 0;
      lowLightStreakRef.current = 0;
      blankFrameStreakRef.current = 0;
    };
  }, [started, completed, cameraReady, ensureIntegrityModels]);

  const aiInterviewLink = useMemo(
    () => createAiInterviewLink(accessToken),
    [accessToken],
  );
  const screening = applicant?.answers?.__aiScreening || null;
  const recruiterDesiredSkills = useMemo(
    () =>
      Array.isArray(job?.branding?.aiDesiredSkills)
        ? job.branding.aiDesiredSkills
        : [],
    [job],
  );
  const recruiterCustomQuestions = useMemo(
    () =>
      Array.isArray(job?.branding?.aiCustomQuestions)
        ? job.branding.aiCustomQuestions
        : [],
    [job],
  );

  // ------ CAMERA ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const stopCamera = () => {
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    if (pipVideoRef.current) pipVideoRef.current.srcObject = null;
    setCameraReady(false);
    setCameraInitializing(false);
  };

  const attachStreamToVideo = useCallback(async () => {
    if (!streamRef.current) return;
    const attachToNode = async (node) => {
      if (!node) return;
      if (node.srcObject !== streamRef.current) {
        node.srcObject = streamRef.current;
      }
      await node.play().catch(() => {});
    };
    await Promise.all([
      attachToNode(videoRef.current),
      attachToNode(pipVideoRef.current),
    ]);
  }, []);

  useEffect(() => {
    if (cameraReady && streamRef.current) {
      attachStreamToVideo();
    }
  }, [started, cameraReady, attachStreamToVideo]);

  const setupCamera = async () => {
    setCameraInitializing(true);
    setCameraPermissionDenied(false);
    try {
      const stream =
        streamRef.current ||
        (await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        }));
      streamRef.current = stream;
      await attachStreamToVideo();
      setCameraReady(true);
      setRecordingStatus("Live");
      if (typeof MediaRecorder === "undefined") {
        setRecordingStatus("Unsupported");
        return;
      }
      if (recorderRef.current?.state === "recording") return;
      const hasVideoTrack = stream
        .getVideoTracks()
        .some((track) => track.readyState === "live");
      if (!hasVideoTrack) {
        setRecordingStatus("Camera unavailable");
        return;
      }
      const mime = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")
        ? "video/webm;codecs=vp9,opus"
        : "video/webm";
      chunksRef.current = [];
      const rec = new MediaRecorder(stream, { mimeType: mime });
      rec.ondataavailable = (e) => {
        if (e.data?.size) chunksRef.current.push(e.data);
      };
      rec.onstart = () => {
        setRecording(true);
        setRecordingStatus("Recording");
      };
      rec.onstop = () => {
        setRecording(false);
        setRecordingStatus("Saved");
      };
      recorderRef.current = rec;
      rec.start(1000);
    } finally {
      setCameraInitializing(false);
    }
  };

  const uploadRecording = async () => {
    if (!chunksRef.current.length) return null;
    if (!BUCKET) {
      setRecordingStatus("Storage not configured");
      return null;
    }
    setUploadingRecording(true);
    setRecordingStatus("Uploading---");
    try {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const prefix = applicant?.id || "public";
      const paths = [
        `${prefix}/${Date.now()}-interview.webm`,
        `${prefix}/${Date.now()}-interview-fallback.webm`,
      ];

      let lastError = null;
      for (const path of paths) {
        const { error: ue } = await supabase.storage
          .from(BUCKET)
          .upload(path, blob, { contentType: "video/webm", upsert: true });
        if (ue) {
          lastError = ue;
          continue;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        const url = data?.publicUrl || path;
        setRecordingUrl(url);
        setRecordingStatus("Uploaded");
        return { filePath: path, url };
      }

      throw lastError || new Error("Unknown storage upload error");
    } catch (error) {
      setRecordingStatus("Upload failed");
      const reason = String(error?.message || "").trim();
      message.warning(
        reason ? `Recording upload failed: ${reason}` : "Recording upload failed.",
      );
      return null;
    } finally {
      setUploadingRecording(false);
    }
  };

  // ------ SPEECH ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const speakText = (text) => {
    if (!text || !window.speechSynthesis) return;
    clearAutoSubmit();
    speechTurnIdRef.current += 1;
    const speechTurnId = speechTurnIdRef.current;
    if (speechWatchdogRef.current) {
      clearTimeout(speechWatchdogRef.current);
      speechWatchdogRef.current = null;
    }
    setDraftStatus("Agent is speaking");
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 1;
    u.pitch = 1;
    const handoffToListening = () => {
      if (speechTurnId !== speechTurnIdRef.current) return;
      setSpeaking(false);
      if (started && !completed && !processingRef.current) {
        setDraftStatus("Starting microphone...");
        startListening();
      }
    };
    u.onstart = () => setSpeaking(true);
    u.onend = handoffToListening;
    u.onerror = handoffToListening;
    window.speechSynthesis.speak(u);
    const fallbackDelay = Math.min(14000, Math.max(2500, text.length * 70));
    speechWatchdogRef.current = setTimeout(() => {
      if (speechTurnId !== speechTurnIdRef.current) return;
      if (speakingRef.current) {
        handoffToListening();
      } else if (started && !completed && !processingRef.current && !listening) {
        setDraftStatus("Starting microphone...");
        startListening();
      }
    }, fallbackDelay);
  };

  const stopTurnCapture = useCallback(() => {
    if (turnLoopRef.current) {
      cancelAnimationFrame(turnLoopRef.current);
      turnLoopRef.current = null;
    }
    if (turnRecorderRef.current && turnRecorderRef.current.state !== "inactive") {
      try {
        turnRecorderRef.current.stop();
      } catch {}
    }
    turnSourceRef.current?.disconnect?.();
    turnSourceRef.current = null;
    turnAnalyserRef.current = null;
    turnAudioCtxRef.current?.close?.();
    turnAudioCtxRef.current = null;
    turnStreamRef.current?.getTracks?.().forEach((track) => track.stop());
    turnStreamRef.current = null;
  }, []);

  const transcribeTurnAudio = useCallback(async (audioBlob) => {
    if (!audioBlob || !GROQ_API_KEY) return "";
    const formData = new FormData();
    formData.append(
      "file",
      new File([audioBlob], "interview-turn.webm", {
        type: audioBlob.type || "audio/webm",
      }),
    );
    formData.append("model", "whisper-large-v3-turbo");
    formData.append("language", "en");
    formData.append("response_format", "verbose_json");

    const response = await fetch(GROQ_TRANSCRIBE_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
      body: formData,
    });
    if (!response.ok) return "";
    const payload = await response.json().catch(() => null);
    return String(payload?.text || "").trim();
  }, []);

  const stopListening = useCallback(() => {
    clearAutoSubmit();
    keepRef.current = false;
    manualRef.current = true;
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    stopTurnCapture();
    setListening(false);
    setDraftStatus("Microphone paused");
  }, [clearAutoSubmit, stopTurnCapture]);

  const startListening = useCallback((options = {}) => {
    const force = Boolean(options.force);
    if ((processingRef.current && !force) || completed) return;
    keepRef.current = true;
    manualRef.current = false;
    clearAutoSubmit();
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    recognitionRef.current = null;
    stopTurnCapture();
    setListening(true);
    setDraftStatus("Starting microphone...");
    srFinalTextRef.current = "";
    srInterimTextRef.current = "";

    (async () => {
      try {
        let sourceStream = null;
        try {
          sourceStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
            video: false,
          });
        } catch {
          sourceStream = streamRef.current?.getAudioTracks?.()?.length
            ? streamRef.current
            : null;
        }
        if (!sourceStream) {
          throw new Error("no-audio-stream");
        }
        const audioTracks = sourceStream.getAudioTracks();
        if (!audioTracks.length) {
          setListening(false);
          setDraftStatus("No microphone audio detected.");
          return;
        }

        const turnStream = new MediaStream(
          audioTracks.map((track) => (track.clone ? track.clone() : track)),
        );
        turnStreamRef.current = turnStream;
        turnChunksRef.current = [];
        turnDetectedVoiceRef.current = false;
        turnCaptureStartedAtRef.current = Date.now();
        turnLastVoiceAtRef.current = Date.now();
        setListening(true);
        setDraftStatus("Listening...");

        const SR = getSR();
        if (SR) {
          try {
            const rec = new SR();
            rec.lang = "en-US";
            rec.continuous = true;
            rec.interimResults = true;
            rec.onresult = (event) => {
              let interim = "";
              for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const text = String(event.results[i]?.[0]?.transcript || "").trim();
                if (!text) continue;
                if (event.results[i].isFinal) {
                  srFinalTextRef.current = `${srFinalTextRef.current} ${text}`.trim();
                } else {
                  interim = `${interim} ${text}`.trim();
                }
              }
              srInterimTextRef.current = interim;
              const combined = `${srFinalTextRef.current} ${srInterimTextRef.current}`.trim();
              if (combined) setInterimText(combined);
            };
            rec.onerror = () => {};
            rec.onend = () => {
              if (!keepRef.current || manualRef.current || processingRef.current) return;
              try {
                rec.start();
              } catch {}
            };
            recognitionRef.current = rec;
            rec.start();
          } catch {}
        }

        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : MediaRecorder.isTypeSupported("audio/webm")
            ? "audio/webm"
            : "";
        const recorder = mime
          ? new MediaRecorder(turnStream, { mimeType: mime })
          : new MediaRecorder(turnStream);
        turnRecorderRef.current = recorder;

        recorder.ondataavailable = (event) => {
          if (event.data?.size) turnChunksRef.current.push(event.data);
        };

        recorder.onstop = async () => {
          setListening(false);
          try {
            recognitionRef.current?.stop?.();
          } catch {}
          recognitionRef.current = null;
          if (turnLoopRef.current) cancelAnimationFrame(turnLoopRef.current);
          turnLoopRef.current = null;
          turnSourceRef.current?.disconnect?.();
          turnSourceRef.current = null;
          turnAnalyserRef.current = null;
          turnAudioCtxRef.current?.close?.();
          turnAudioCtxRef.current = null;
          turnStreamRef.current?.getTracks?.().forEach((track) => track.stop());
          turnStreamRef.current = null;

          if (!keepRef.current || manualRef.current) return;

          if (!turnChunksRef.current.length) {
            setDraftStatus("No audio captured. Listening again...");
            if (!processingRef.current) {
              setTimeout(() => {
                if (keepRef.current && !manualRef.current) startListening();
              }, 350);
            }
            return;
          }

          const speechRecognitionText = `${srFinalTextRef.current} ${srInterimTextRef.current}`.trim();
          let text = speechRecognitionText;
          if (text) {
            setDraftStatus("Submitting your answer...");
          } else {
            setDraftStatus("Transcribing your answer...");
          }
          const blob = new Blob(turnChunksRef.current, {
            type: mime || "audio/webm",
          });
          if (!text) {
            text = await transcribeTurnAudio(blob);
          }
          srFinalTextRef.current = "";
          srInterimTextRef.current = "";
          if (!text) {
            setDraftStatus("Could not transcribe. Please answer again.");
            if (!processingRef.current) {
              setTimeout(() => {
                if (keepRef.current && !manualRef.current) startListening();
              }, 350);
            }
            return;
          }

          currentAnswerRef.current = text;
          interimTextRef.current = "";
          setCurrentAnswer(text);
          setInterimText("");
          setDraftStatus("Submitting your answer...");
          await submitAnswer({ silent: true, prefilled: text });
        };

        recorder.start(250);

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          turnAudioCtxRef.current = ctx;
          const source = ctx.createMediaStreamSource(turnStream);
          turnSourceRef.current = source;
          const analyser = ctx.createAnalyser();
          analyser.fftSize = 2048;
          analyser.smoothingTimeConstant = 0.12;
          source.connect(analyser);
          turnAnalyserRef.current = analyser;

          const samples = new Float32Array(analyser.fftSize);
          const monitor = () => {
            if (!turnRecorderRef.current || turnRecorderRef.current.state !== "recording") {
              return;
            }

            analyser.getFloatTimeDomainData(samples);
            let sum = 0;
            for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
            const rms = Math.sqrt(sum / samples.length);
            const now = Date.now();
            const speakingNow = rms > VOICE_RMS_THRESHOLD;

            if (speakingNow) {
              turnDetectedVoiceRef.current = true;
              turnLastVoiceAtRef.current = now;
            }

            const maxTurnReached =
              now - turnCaptureStartedAtRef.current >= MAX_TURN_CAPTURE_MS;

            if (maxTurnReached) {
              try {
                if (turnRecorderRef.current?.state === "recording") {
                  turnRecorderRef.current.stop();
                }
              } catch {}
              return;
            }

            turnLoopRef.current = requestAnimationFrame(monitor);
          };

          turnLoopRef.current = requestAnimationFrame(monitor);
        } else {
          setTimeout(() => {
            try {
              if (turnRecorderRef.current?.state === "recording") {
                turnRecorderRef.current.stop();
              }
            } catch {}
          }, NO_VOICE_TIMEOUT_MS);
        }
      } catch {
        setListening(false);
        setDraftStatus("Microphone access failed. Please allow mic permission.");
        if (!processingRef.current) {
          setTimeout(() => {
            if (keepRef.current && !manualRef.current) startListening();
          }, 800);
        }
      }
    })();
  }, [clearAutoSubmit, completed, stopTurnCapture, transcribeTurnAudio]);

  // ------ INTERVIEW FLOW ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const askNextQuestion = async (lastAnswer = "") => {
    if (!job || !applicant) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      if (questionCount >= MAX_QUESTIONS) {
        await finishInterview();
        return;
      }

      const nextSectionIndex = Math.min(
        questionCount,
        INTERVIEW_SECTIONS.length - 1,
      );
      const requiredSection = INTERVIEW_SECTIONS[nextSectionIndex];

      const assistantQuestionHistory = transcriptRef.current
        .filter((entry) => entry.role === "assistant")
        .map((entry) => normalizeQuestionText(entry.content));
      const pendingCustomQuestion = recruiterCustomQuestions.find((question) => {
        const normalized = normalizeQuestionText(question);
        if (!normalized) return false;
        return !assistantQuestionHistory.some(
          (asked) => asked === normalized || asked.includes(normalized),
        );
      });

      if (pendingCustomQuestion) {
        setCurrentQuestion(pendingCustomQuestion);
        transcriptRef.current = [
          ...transcriptRef.current,
          {
            role: "assistant",
            content: pendingCustomQuestion,
            speaker: AGENT_NAME,
            section: requiredSection,
            focusAreas: ["recruiter_custom_question"],
            evaluationNote: "Recruiter custom question asked explicitly.",
            provisionalScore: 0,
          },
        ];
        setQuestionCount((p) => p + 1);
        setTick((t) => t + 1);
        speakText(pendingCustomQuestion);
        return;
      }

      const turn = await generateInterviewTurn({
        job,
        candidate: applicant,
        screening,
        desiredSkills: recruiterDesiredSkills,
        customQuestions: recruiterCustomQuestions,
        transcript: transcriptRef.current,
        lastAnswer,
        requiredSection,
        coveredSections: transcriptRef.current
          .filter((entry) => entry.role === "assistant" && entry.section)
          .map((entry) => entry.section),
      });
      if (turn.shouldEnd && questionCount >= MIN_QUESTIONS) {
        await finishInterview();
        return;
      }
      setCurrentQuestion(turn.nextQuestion);
      transcriptRef.current = [
        ...transcriptRef.current,
        {
          role: "assistant",
          content: turn.nextQuestion,
          speaker: AGENT_NAME,
          section: turn.section || requiredSection,
          focusAreas: turn.focusAreas,
          evaluationNote: turn.evaluationNote,
          provisionalScore: turn.provisionalScore,
        },
      ];
      setQuestionCount((p) => p + 1);
      setTick((t) => t + 1);
      speakText(turn.nextQuestion);
    } catch (e) {
      message.error(e.message || "Could not generate question.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const submitAnswer = async (options = {}) => {
    if (processingRef.current) return;
    const ans = [
      options.prefilled,
      currentAnswer,
      interimText,
      currentAnswerRef.current,
      interimTextRef.current,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    if (!ans) {
      if (!options.silent) {
        message.warning("Please answer before continuing.");
      }
      return;
    }
    clearAutoSubmit();
    stopListening();
    processingRef.current = true;
    setDraftStatus("Sending your answer...");
    transcriptRef.current = [
      ...transcriptRef.current,
      { role: "user", content: ans, speaker: applicant?.name || "Candidate" },
    ];
    currentAnswerRef.current = "";
    interimTextRef.current = "";
    setCurrentAnswer("");
    setInterimText("");
    setTick((t) => t + 1);

    if (warmupPending) {
      setWarmupPending(false);
      await askNextQuestion(ans);
      return;
    }

    await askNextQuestion(ans);
  };

  const finishInterview = async () => {
    if (!job || !applicant) return;
    processingRef.current = true;
    setProcessing(true);
    try {
      clearAutoSubmit();
      stopListening();
      if (recorderRef.current?.state === "recording") {
        recorderRef.current.stop();
        await new Promise((r) => setTimeout(r, 400));
      }
      const meta = await uploadRecording();
      const report = await evaluateInterview({
        job,
        candidate: applicant,
        screening,
        transcript: transcriptRef.current,
        suspiciousEvents,
      });
      const prev = applicant.answers?.__aiInterview || {};
      const nextAnswers = {
        ...(applicant.answers || {}),
        __aiInterview: {
          ...prev,
          status: "completed",
          completedAt: new Date().toISOString(),
          suspiciousEvents,
          transcript: transcriptRef.current,
          report,
          interviewLink: aiInterviewLink,
          recordingUrl: meta?.url || recordingUrl || null,
          recordingPath: meta?.filePath || null,
        },
      };
      const nextNotes = `${applicant.notes ? applicant.notes + "\n\n" : ""}AI Interview\nScore:${report.overallScore}/100\nRecommendation:${report.recommendation}`;
      const { error: completeError } = await supabase.rpc(
        "complete_public_ai_interview",
        {
          p_access_token: accessToken,
          p_answers: nextAnswers,
          p_notes: nextNotes,
          p_score: report.overallScore,
        },
      );
      if (completeError) throw completeError;
      setFinalReport(report);
      setCompleted(true);
      setCurrentQuestion("");
      setDraftStatus("Interview completed");
      window.speechSynthesis?.cancel();
      stopCamera();
    } catch (e) {
      message.error(e.message || "Could not finish interview.");
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const beginInterview = async () => {
    setStarted(true);
    try {
      await document.documentElement.requestFullscreen?.();
    } catch {}
    try {
      if (!cameraReady) {
        await setupCamera();
      } else {
        await attachStreamToVideo();
      }
    } catch {
      setCameraPermissionDenied(true);
      setRecordingStatus("Camera blocked");
      message.warning("Camera blocked. Session continues without video.");
    }
    const greeting = WARMUP_QUESTION(applicant?.name);
    setCurrentQuestion(greeting);
    transcriptRef.current = [
      ...transcriptRef.current,
      {
        role: "assistant",
        content: greeting,
        speaker: AGENT_NAME,
        focusAreas: ["rapport"],
        evaluationNote: "Warm greeting and comfort check before interview.",
        provisionalScore: 0,
      },
    ];
    setTick((t) => t + 1);
    setDraftStatus("Agent is speaking");
    speakText(greeting);
    if (!window.speechSynthesis) startListening();
  };

  // ------ RENDER GATES ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  if (loading) return <LoadingScreen />;
  if (error || !applicant || !job)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--navy)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            padding: 28,
            borderRadius: 16,
            maxWidth: 380,
            textAlign: "center",
            background: "rgba(239,68,68,.08)",
            border: "1px solid rgba(239,68,68,.22)",
            fontSize: 14,
            color: "#f87171",
          }}
        >
          {error || "Interview not available."}
        </div>
      </div>
    );

  if (completed) return <CompletedScreen report={finalReport} />;

  if (!started)
    return (
      <PreJoinScreen
        job={job}
        micSupported={micSupported}
        videoRef={videoRef}
        cameraReady={cameraReady}
        cameraInitializing={cameraInitializing}
        cameraPermissionDenied={cameraPermissionDenied}
        onBegin={beginInterview}
      />
    );

  return (
    <ActiveSession
      job={job}
      applicant={applicant}
      speaking={speaking}
      listening={listening}
      processing={processing}
      recording={recording}
      cameraReady={cameraReady}
      videoRef={videoRef}
      pipVideoRef={pipVideoRef}
      currentQuestion={currentQuestion}
      questionCount={questionCount}
      entries={entries}
      currentAnswer={currentAnswer}
      setCurrentAnswer={setCurrentAnswer}
      interimText={interimText}
      draftStatus={draftStatus}
      warningNotice={warningNotice}
      focusWarnings={focusWarnings}
      onToggleMic={() => {
        if (listening) stopListening();
        else startListening({ force: true });
      }}
      onSendAnswer={() => submitAnswer({ silent: false })}
      onReplay={() => speakText(currentQuestion)}
      onEnd={finishInterview}
      bottomRef={bottomRef}
      STEPS={STEPS}
      stepIdx={stepIdx}
    />
  );
}

