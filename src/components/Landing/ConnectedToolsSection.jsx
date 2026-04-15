import { useEffect, useRef, useState } from "react";

/* ── Google Fonts loaded via style tag ── */

const LEFT_TOOLS = [
  {
    id: "docs",
    label: "Documents",
    sublabel: "Workflows",
    color: "#10b981",
    glow: "#10b98140",
  },
  {
    id: "standups",
    label: "Standups",
    sublabel: "Updates",
    color: "#06b6d4",
    glow: "#06b6d440",
  },
  {
    id: "contracts",
    label: "Contracts",
    sublabel: "Approvals",
    color: "#f59e0b",
    glow: "#f59e0b40",
  },
  {
    id: "recruitment",
    label: "Hiring",
    sublabel: "AI Interviews",
    color: "#a78bfa",
    glow: "#a78bfa40",
  },
];

const RIGHT_TOOLS = [
  {
    id: "projects",
    label: "Projects",
    sublabel: "Management",
    color: "#60a5fa",
    glow: "#60a5fa40",
  },
  {
    id: "payroll",
    label: "Payroll",
    sublabel: "Finance",
    color: "#fb923c",
    glow: "#fb923c40",
  },
  {
    id: "attendance",
    label: "Attendance",
    sublabel: "Teams",
    color: "#f472b6",
    glow: "#f47_2b640",
  },
  {
    id: "monitor",
    label: "Activity",
    sublabel: "Tracking",
    color: "#34d399",
    glow: "#34d39940",
  },
];

function NodeIcon({ id, size = 20 }) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.75",
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };
  const map = {
    docs: (
      <svg {...p}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </svg>
    ),
    standups: (
      <svg {...p}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    contracts: (
      <svg {...p}>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
    recruitment: (
      <svg {...p}>
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
        <line x1="11" y1="8" x2="11" y2="14" />
        <line x1="8" y1="11" x2="14" y2="11" />
      </svg>
    ),
    projects: (
      <svg {...p}>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    payroll: (
      <svg {...p}>
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    attendance: (
      <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="14" x2="8.01" y2="14" />
        <line x1="12" y1="14" x2="12.01" y2="14" />
      </svg>
    ),
    monitor: (
      <svg {...p}>
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    user: (
      <svg {...p}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };
  return map[id] ?? null;
}

/* animated light dot travelling along an SVG path */
function LightBeam({ pathId, color, duration, delay }) {
  return (
    <circle r="3" fill={color} filter={`url(#glow-${pathId})`} opacity="0.9">
      <animateMotion
        dur={`${duration}s`}
        begin={`${delay}s`}
        repeatCount="indefinite"
        calcMode="spline"
        keySplines="0.4 0 0.6 1"
      >
        <mpath href={`#path-${pathId}`} />
      </animateMotion>
    </circle>
  );
}

export default function ConnectedToolsSection() {
  const [hovered, setHovered] = useState(null);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  /* layout */
  const W = 1000,
    H = 380;
  const CX = W / 2,
    CY = H / 2;
  const HUB_R = 44;
  const NODE_R = 33;
  const USER_X = 52,
    USER_Y = CY;
  const LEFT_X = 220;
  const RIGHT_X = W - 220;
  const SPREAD = 84;

  const leftYs = LEFT_TOOLS.map(
    (_, i) => CY + (i - (LEFT_TOOLS.length - 1) / 2) * SPREAD,
  );
  const rightYs = RIGHT_TOOLS.map(
    (_, i) => CY + (i - (RIGHT_TOOLS.length - 1) / 2) * SPREAD,
  );

  function edgePt(cx, cy, r, tx, ty) {
    const a = Math.atan2(ty - cy, tx - cx);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function curvePath(x1, y1, x2, y2) {
    const dx = x2 - x1;
    return `M${x1},${y1} C${x1 + dx * 0.5},${y1} ${x2 - dx * 0.5},${y2} ${x2},${y2}`;
  }

  /* build all paths info */
  const leftPaths = LEFT_TOOLS.map((tool, i) => {
    const ty = leftYs[i];
    const [nx, ny] = edgePt(LEFT_X, ty, NODE_R, CX, CY);
    const [hx, hy] = edgePt(CX, CY, HUB_R, LEFT_X, ty);
    return { id: `L${i}`, tool, d: curvePath(nx, ny, hx, hy), nx, ny, hx, hy };
  });

  const rightPaths = RIGHT_TOOLS.map((tool, i) => {
    const ty = rightYs[i];
    const [hx, hy] = edgePt(CX, CY, HUB_R, RIGHT_X, ty);
    const [nx, ny] = edgePt(RIGHT_X, ty, NODE_R, CX, CY);
    return { id: `R${i}`, tool, d: curvePath(hx, hy, nx, ny), hx, hy, nx, ny };
  });

  const [ux, uy] = edgePt(USER_X, USER_Y, NODE_R, CX, CY);
  const [uhx, uhy] = edgePt(CX, CY, HUB_R, USER_X, USER_Y);
  const userLineD = `M${ux},${uy} L${uhx},${uhy}`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        .lp-connected {
          background: #fff;
          padding: 80px 32px 88px;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }

        .lp-connected-head {
          text-align: center;
          margin-bottom: 56px;
        }

        .lp-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #7c3aed;
          margin-bottom: 14px;
        }
        .lp-eyebrow-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: #7c3aed;
        }

        .lp-connected-title {
          font-size: clamp(22px, 3vw, 38px);
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.03em;
          color: #0f0f1a;
          margin: 0;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .lp-connected-title span {
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #6366f1 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .lp-diagram-wrap {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
          position: relative;
        }
        .lp-diagram-wrap svg {
          width: 100%;
          height: auto;
          overflow: visible;
          display: block;
        }

        /* node circles - pure CSS hover via SVG pointer events */
        .lp-node-circle {
          transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        /* label text */
        .lp-label-main {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 12.5px;
          font-weight: 600;
          fill: #1a1a2e;
          pointer-events: none;
        }
        .lp-label-sub {
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 10.5px;
          font-weight: 400;
          fill: #9090b0;
          pointer-events: none;
        }

        @keyframes hubPulse {
          0%, 100% { opacity: 0.15; r: 58; }
          50%       { opacity: 0.35; r: 66; }
        }
        @keyframes hubPulse2 {
          0%, 100% { opacity: 0.08; r: 72; }
          50%       { opacity: 0.2;  r: 82; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .lp-section-visible .lp-diagram-wrap {
          animation: fadeUp 0.7s ease forwards;
        }
      `}</style>

      <section
        className={`lp-connected ${visible ? "lp-section-visible" : ""}`}
        ref={ref}
      >
        <div className="lp-solutions-head">
          <div>
            <p className="lp-solutions-eyebrow">Integrations</p>
            <h2 className="lp-solutions-title">
              Don’t Let Spreadsheets and Disconnected Tools{" "}
              <span>Slow you down</span>
            </h2>
          </div>
        </div>

        <div className="lp-diagram-wrap">
          <svg viewBox={`0 0 ${W} ${H}`} xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* glow filters per tool color */}
              {[...LEFT_TOOLS, ...RIGHT_TOOLS].map((t) => (
                <filter
                  key={t.id}
                  id={`gf-${t.id}`}
                  x="-100%"
                  y="-100%"
                  width="300%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                  </feMerge>
                </filter>
              ))}

              {/* per-path glow for beam dots */}
              {[...leftPaths, ...rightPaths].map((p) => (
                <filter
                  key={p.id}
                  id={`glow-${p.id}`}
                  x="-200%"
                  y="-200%"
                  width="500%"
                  height="500%"
                >
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              ))}
              <filter
                id="glow-user"
                x="-200%"
                y="-200%"
                width="500%"
                height="500%"
              >
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* hub glow */}
              <filter id="hubGlow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur stdDeviation="18" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="nodeGlow"
                x="-60%"
                y="-60%"
                width="220%"
                height="220%"
              >
                <feGaussianBlur stdDeviation="8" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
              <filter
                id="nodeShadow"
                x="-40%"
                y="-40%"
                width="180%"
                height="180%"
              >
                <feDropShadow
                  dx="0"
                  dy="3"
                  stdDeviation="6"
                  floodColor="#00000012"
                />
              </filter>

              {/* hub radial gradient */}
              <radialGradient id="hubGrad" cx="38%" cy="32%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#ede9ff" />
              </radialGradient>

              {/* user line gradient */}
              <linearGradient id="userLineG" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e2e2f0" />
                <stop offset="50%" stopColor="#c4b5fd" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>

              {/* path defs for animateMotion */}
              {leftPaths.map((p) => (
                <path key={p.id} id={`path-${p.id}`} d={p.d} fill="none" />
              ))}
              {rightPaths.map((p) => (
                <path key={p.id} id={`path-${p.id}`} d={p.d} fill="none" />
              ))}
              <path id="path-user" d={userLineD} fill="none" />

              {/* node gradient per tool */}
              {[...LEFT_TOOLS, ...RIGHT_TOOLS].map((t) => (
                <radialGradient
                  key={t.id}
                  id={`ng-${t.id}`}
                  cx="35%"
                  cy="30%"
                  r="70%"
                >
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor={t.color + "18"} />
                </radialGradient>
              ))}
              <radialGradient id="ng-user" cx="35%" cy="30%" r="70%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#7c3aed18" />
              </radialGradient>
            </defs>

            {/* ── subtle bg radial glow under hub ── */}
            <ellipse
              cx={CX}
              cy={CY}
              rx="200"
              ry="140"
              fill="#7c3aed"
              opacity="0.04"
            />

            {/* ── hub pulse rings ── */}
            {visible && (
              <>
                <circle
                  cx={CX}
                  cy={CY}
                  fill="#7c3aed"
                  style={{ animation: "hubPulse 3s ease-in-out infinite" }}
                />
                <circle
                  cx={CX}
                  cy={CY}
                  fill="#7c3aed"
                  style={{
                    animation: "hubPulse2 3s ease-in-out infinite 0.5s",
                  }}
                />
              </>
            )}

            {/* ── connection lines (base - subtle) ── */}
            {/* user line */}
            <path
              d={userLineD}
              fill="none"
              stroke="url(#userLineG)"
              strokeWidth="1.5"
              opacity={visible ? 0.6 : 0}
              style={{ transition: "opacity 0.6s ease 0.1s" }}
            />

            {leftPaths.map((p, i) => {
              const isHov = hovered === p.tool.id;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  stroke={isHov ? p.tool.color : "#e0e0f0"}
                  strokeWidth={isHov ? 2 : 1.4}
                  opacity={visible ? (isHov ? 0.9 : 0.7) : 0}
                  style={{
                    transition: `opacity 0.5s ease ${0.1 + i * 0.06}s, stroke 0.25s, stroke-width 0.25s`,
                  }}
                />
              );
            })}
            {rightPaths.map((p, i) => {
              const isHov = hovered === p.tool.id;
              return (
                <path
                  key={p.id}
                  d={p.d}
                  fill="none"
                  stroke={isHov ? p.tool.color : "#e0e0f0"}
                  strokeWidth={isHov ? 2 : 1.4}
                  opacity={visible ? (isHov ? 0.9 : 0.7) : 0}
                  style={{
                    transition: `opacity 0.5s ease ${0.1 + i * 0.06}s, stroke 0.25s, stroke-width 0.25s`,
                  }}
                />
              );
            })}

            {/* ── animated light beams ── */}
            {visible && (
              <>
                {/* user beam */}
                <circle
                  r="2.5"
                  fill="#a78bfa"
                  filter="url(#glow-user)"
                  opacity="0.85"
                >
                  <animateMotion dur="2.4s" begin="0s" repeatCount="indefinite">
                    <mpath href="#path-user" />
                  </animateMotion>
                </circle>

                {/* left beams */}
                {leftPaths.map((p, i) => (
                  <circle
                    key={p.id}
                    r="2.5"
                    fill={p.tool.color}
                    filter={`url(#glow-${p.id})`}
                    opacity="0.8"
                  >
                    <animateMotion
                      dur={`${2.0 + i * 0.3}s`}
                      begin={`${i * 0.5}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#path-${p.id}`} />
                    </animateMotion>
                  </circle>
                ))}

                {/* right beams */}
                {rightPaths.map((p, i) => (
                  <circle
                    key={p.id}
                    r="2.5"
                    fill={p.tool.color}
                    filter={`url(#glow-${p.id})`}
                    opacity="0.8"
                  >
                    <animateMotion
                      dur={`${2.0 + i * 0.3}s`}
                      begin={`${i * 0.5 + 0.25}s`}
                      repeatCount="indefinite"
                    >
                      <mpath href={`#path-${p.id}`} />
                    </animateMotion>
                  </circle>
                ))}
              </>
            )}

            <g
              opacity={visible ? 1 : 0}
              style={{ transition: "opacity 0.7s ease 0.1s" }}
              filter="url(#hubGlow)"
            >
              <circle
                cx={CX}
                cy={CY}
                r={HUB_R}
                fill="url(#hubGrad)"
                stroke="#ddd6fe"
                strokeWidth="1.5"
              />
              {/* Replace this image src with your actual logo */}
              <image
                href="/Ryzent.png"
                x={CX - 28}
                y={CY - 28}
                width="56"
                height="56"
                preserveAspectRatio="xMidYMid meet"
                style={{ pointerEvents: "none" }}
              />
            </g>

            {/* ── left nodes ── */}
            {leftPaths.map((p, i) => {
              const ty = leftYs[i];
              const isHov = hovered === p.tool.id;
              return (
                <g
                  key={p.tool.id}
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.5s ease ${0.18 + i * 0.07}s`,
                  }}
                >
                  {/* labels */}
                  <text
                    x={LEFT_X - NODE_R - 14}
                    y={ty - 6}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="lp-label-main"
                    fill={isHov ? "#0f0f1a" : "#4a4a6a"}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {p.tool.label}
                  </text>
                  <text
                    x={LEFT_X - NODE_R - 14}
                    y={ty + 10}
                    textAnchor="end"
                    dominantBaseline="middle"
                    className="lp-label-sub"
                    fill={isHov ? p.tool.color : "#b0b0cc"}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {p.tool.sublabel}
                  </text>

                  {/* glow ring on hover */}
                  {isHov && (
                    <circle
                      cx={LEFT_X}
                      cy={ty}
                      r={NODE_R + 7}
                      fill={p.tool.color}
                      opacity="0.12"
                    />
                  )}
                  {/* circle */}
                  <circle
                    cx={LEFT_X}
                    cy={ty}
                    r={NODE_R}
                    fill={isHov ? `url(#ng-${p.tool.id})` : "#f9f9fc"}
                    stroke={isHov ? p.tool.color : "#ebebf5"}
                    strokeWidth="1.5"
                    filter="url(#nodeShadow)"
                    style={{
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      cursor: "default",
                    }}
                    onMouseEnter={() => setHovered(p.tool.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  {/* icon */}
                  <foreignObject
                    x={LEFT_X - 11}
                    y={ty - 11}
                    width="22"
                    height="22"
                    style={{ pointerEvents: "none" }}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        color: isHov ? p.tool.color : "#a0a0c0",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s",
                      }}
                    >
                      <NodeIcon id={p.tool.id} size={19} />
                    </div>
                  </foreignObject>
                </g>
              );
            })}

            {/* ── right nodes ── */}
            {rightPaths.map((p, i) => {
              const ty = rightYs[i];
              const isHov = hovered === p.tool.id;
              return (
                <g
                  key={p.tool.id}
                  opacity={visible ? 1 : 0}
                  style={{
                    transition: `opacity 0.5s ease ${0.18 + i * 0.07}s`,
                  }}
                >
                  {isHov && (
                    <circle
                      cx={RIGHT_X}
                      cy={ty}
                      r={NODE_R + 7}
                      fill={p.tool.color}
                      opacity="0.12"
                    />
                  )}
                  <circle
                    cx={RIGHT_X}
                    cy={ty}
                    r={NODE_R}
                    fill={isHov ? `url(#ng-${p.tool.id})` : "#f9f9fc"}
                    stroke={isHov ? p.tool.color : "#ebebf5"}
                    strokeWidth="1.5"
                    filter="url(#nodeShadow)"
                    style={{
                      transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      cursor: "default",
                    }}
                    onMouseEnter={() => setHovered(p.tool.id)}
                    onMouseLeave={() => setHovered(null)}
                  />
                  <foreignObject
                    x={RIGHT_X - 11}
                    y={ty - 11}
                    width="22"
                    height="22"
                    style={{ pointerEvents: "none" }}
                  >
                    <div
                      xmlns="http://www.w3.org/1999/xhtml"
                      style={{
                        color: isHov ? p.tool.color : "#a0a0c0",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "color 0.2s",
                      }}
                    >
                      <NodeIcon id={p.tool.id} size={19} />
                    </div>
                  </foreignObject>
                  {/* labels */}
                  <text
                    x={RIGHT_X + NODE_R + 14}
                    y={ty - 6}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="lp-label-main"
                    fill={isHov ? "#0f0f1a" : "#4a4a6a"}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {p.tool.label}
                  </text>
                  <text
                    x={RIGHT_X + NODE_R + 14}
                    y={ty + 10}
                    textAnchor="start"
                    dominantBaseline="middle"
                    className="lp-label-sub"
                    fill={isHov ? p.tool.color : "#b0b0cc"}
                    style={{ transition: "fill 0.2s" }}
                  >
                    {p.tool.sublabel}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </section>
    </>
  );
}
