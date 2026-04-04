import { useState, useEffect } from "react";
import { Spin } from "antd";
import {
  Calendar,
  Mail,
  Phone,
  Loader2,
  Search,
  Inbox,
  ScanSearch,
  Target,
  PartyPopper,
  Rocket,
  ClipboardList,
} from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";
import { useParams } from "react-router-dom";

/* ── Constants ───────────────────────────────────────────────────────────── */
const STAGES = [
  {
    key: "applied",
    label: "Applied",
    color: "#3b82f6",
    bg: "#eff6ff",
    border: "#bfdbfe",
  },
  {
    key: "screening",
    label: "Screening",
    color: "#6366f1",
    bg: "#eef2ff",
    border: "#c7d2fe",
  },
  {
    key: "interview",
    label: "Interview",
    color: "#f59e0b",
    bg: "#fffbeb",
    border: "#fde68a",
  },
  {
    key: "offer",
    label: "Offer Sent",
    color: "#8b5cf6",
    bg: "#f5f3ff",
    border: "#ddd6fe",
  },
  {
    key: "hired",
    label: "Hired",
    color: "#10b981",
    bg: "#ecfdf5",
    border: "#a7f3d0",
  },
  {
    key: "rejected",
    label: "Rejected",
    color: "#ef4444",
    bg: "#fef2f2",
    border: "#fecaca",
  },
];

const PROGRESS_STAGES = STAGES.filter((s) => s.key !== "rejected");

const DEFAULT_BRANDING = {
  company_name: "",
  tagline: "",
  logo_url: "",
  accent_color: "#3b82f6",
};

const mapJob = (r) => ({
  id: r.id,
  title: r.title,
  department: r.department,
  status: r.status,
  deadline: r.deadline,
  fields: r.fields || [],
  branding: r.branding || null,
});

const mapApplicant = (r) => ({
  id: r.id,
  jobId: r.job_id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  stage: r.stage,
  answers: r.answers || {},
  score: r.score,
  interviewDate: r.interview_date
    ? dayjs(r.interview_date).format("ddd, D MMM YYYY [at] h:mm A")
    : null,
  appliedAt: r.applied_at ? dayjs(r.applied_at).format("D MMMM YYYY") : "",
});

const stageInfo = (key) =>
  STAGES.find((s) => s.key === key) || {
    label: key,
    color: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };

/* ── Status copy with lucide icon components ─────────────────────────────── */
const STATUS_COPY = {
  applied: {
    title: "Application received",
    body: "We've got your application and our team will be reviewing it shortly. You'll hear from us soon.",
    Icon: Inbox,
  },
  screening: {
    title: "Under review",
    body: "Your application is being reviewed by our hiring team. We'll be in touch soon with an update.",
    Icon: ScanSearch,
  },
  interview: {
    title: "Moving to interview",
    body: "Congratulations — you've been selected for an interview! Check your email for details.",
    Icon: Target,
  },
  offer: {
    title: "Offer extended",
    body: "An offer has been sent to your email. Please review it carefully and reach out if you have questions.",
    Icon: PartyPopper,
  },
  hired: {
    title: "Welcome aboard!",
    body: "We're thrilled to have you join the team. Your onboarding details will arrive by email soon.",
    Icon: Rocket,
  },
  rejected: {
    title: "Application closed",
    body: "After careful consideration, we won't be moving forward with your application at this time. We appreciate the time and effort you put in, and we'll keep your profile on file for future opportunities.",
    Icon: ClipboardList,
  },
};

/* ── Spinner style ────────────────────────────────────────────────────────── */
const spinStyle = { animation: "spin 1s linear infinite" };
const spinKeyframes = `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;

/* ══════════════════════════════════════════════════════════════════════════
   STEPPER
══════════════════════════════════════════════════════════════════════════ */
const Stepper = ({ currentStage, isRejected }) => {
  const currentIdx = isRejected
    ? -1
    : PROGRESS_STAGES.findIndex((s) => s.key === currentStage);

  return (
    <div style={{ position: "relative", padding: "8px 0 24px" }}>
      <style>{spinKeyframes}</style>
      {/* Connecting line */}
      <div
        style={{
          position: "absolute",
          top: 19,
          left: "calc(100% / 10)",
          width: "calc(100% - (100% / 5))",
          height: 2,
          background: "#e2e8f0",
          zIndex: 0,
        }}
      />
      {/* Filled portion */}
      {currentIdx > 0 && !isRejected && (
        <div
          style={{
            position: "absolute",
            top: 19,
            left: "calc(100% / 10)",
            width: `calc((100% - (100% / 5)) * ${currentIdx / (PROGRESS_STAGES.length - 1)})`,
            height: 2,
            background: PROGRESS_STAGES[currentIdx]?.color || "#3b82f6",
            transition: "width 0.6s ease",
            zIndex: 0,
          }}
        />
      )}

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          position: "relative",
          zIndex: 1,
        }}
      >
        {PROGRESS_STAGES.map((stage, i) => {
          const done = !isRejected && i < currentIdx;
          const active = !isRejected && i === currentIdx;
          const future = isRejected || i > currentIdx;

          return (
            <div
              key={stage.key}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                flex: 1,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  background: done
                    ? stage.color
                    : active
                      ? stage.color
                      : "#f1f5f9",
                  border: active
                    ? `3px solid ${stage.color}`
                    : done
                      ? "none"
                      : "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: active ? `0 0 0 5px ${stage.color}20` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {done && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 7L5.5 10.5L12 3.5"
                      stroke="#fff"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
                {active && (
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      background: "#fff",
                    }}
                  />
                )}
                {future && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "#cbd5e1",
                    }}
                  />
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? stage.color : done ? "#64748b" : "#cbd5e1",
                  textAlign: "center",
                  lineHeight: 1.2,
                }}
              >
                {stage.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function ApplicationTrackingPage() {
  const { applicantId: accessToken } = useParams();
  const [applicant, setApplicant] = useState(null);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!accessToken) {
      setError("No application ID provided.");
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      try {
        const { data: appRow, error: appErr } = await supabase
          .rpc("get_public_recruitment_context", {
            p_access_token: accessToken,
          });
        if (appErr) throw appErr;
        const applicantRow = appRow?.applicant || null;
        const jobRow = appRow?.job || null;
        if (!applicantRow) throw new Error("Application not found.");

        setApplicant(mapApplicant(applicantRow));
        if (jobRow) setJob(mapJob(jobRow));
      } catch {
        setError(
          "We couldn't find your application. Please check your link and try again.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [accessToken]);

  /* Public polling updates */
  useEffect(() => {
    if (!accessToken) return undefined;

    const refresh = async () => {
      const { data, error } = await supabase.rpc("get_public_recruitment_context", {
        p_access_token: accessToken,
      });
      if (!error && data?.applicant) {
        setApplicant((prev) =>
          prev ? { ...prev, ...mapApplicant(data.applicant) } : mapApplicant(data.applicant),
        );
        if (data?.job) setJob(mapJob(data.job));
      }
    };

    const intervalId = window.setInterval(refresh, 15000);
    return () => window.clearInterval(intervalId);
  }, [accessToken]);

  /* ── Loading ── */
  if (loading)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <style>{spinKeyframes}</style>
        <Loader2 size={32} color="#3b82f6" style={spinStyle} />
      </div>
    );

  /* ── Error ── */
  if (error || !applicant)
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#fef2f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Search size={22} color="#ef4444" />
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color: "#0f172a",
              marginBottom: 8,
            }}
          >
            Application not found
          </div>
          <div style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6 }}>
            {error}
          </div>
        </div>
      </div>
    );

  const brand = job?.branding || DEFAULT_BRANDING;
  const accent = brand.accent_color || "#3b82f6";
  const stage = stageInfo(applicant.stage);
  const isRejected = applicant.stage === "rejected";
  const isHired = applicant.stage === "hired";
  const copy = STATUS_COPY[applicant.stage] || STATUS_COPY.applied;
  const { Icon: StatusIcon } = copy;
  const trackingId = applicant.id.slice(0, 8).toUpperCase();
  const screening = applicant.answers?.__aiScreening || null;
  const aiInterview = applicant.answers?.__aiInterview || null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <style>{spinKeyframes}</style>

      {/* ── Top accent bar ── */}
      <div
        style={{
          height: 4,
          background: isRejected ? "#ef4444" : isHired ? "#10b981" : accent,
        }}
      />

      {/* ── Header ── */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "16px 24px",
        }}
      >
        <div
          style={{
            maxWidth: 620,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Brand */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt=""
                style={{ height: 28, objectFit: "contain", borderRadius: 4 }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 9,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 14,
                  flexShrink: 0,
                }}
              >
                {(brand.company_name || "R").charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>
                {brand.company_name || "Recruitment"}
              </div>
              {brand.tagline && (
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  {brand.tagline}
                </div>
              )}
            </div>
          </div>

          {/* Tracking ID */}
          <div style={{ textAlign: "right" }}>
            <div
              style={{
                fontSize: 10,
                color: "#94a3b8",
                fontWeight: 600,
                letterSpacing: "0.06em",
              }}
            >
              TRACKING ID
            </div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#475569",
                letterSpacing: "0.04em",
              }}
            >
              {trackingId}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{ maxWidth: 620, margin: "0 auto", padding: "32px 24px 60px" }}
      >
        {/* ── Applicant + role ── */}
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 4,
            }}
          >
            {applicant.name}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {job && (
              <span style={{ fontSize: 13, fontWeight: 600, color: accent }}>
                {job.title}
              </span>
            )}
            {job?.department && (
              <>
                <span style={{ color: "#e2e8f0" }}>·</span>
                <span
                  style={{
                    fontSize: 12,
                    color: "#94a3b8",
                    background: "#f1f5f9",
                    padding: "2px 8px",
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  {job.department}
                </span>
              </>
            )}
            <span style={{ color: "#e2e8f0" }}>·</span>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Applied {applicant.appliedAt}
            </span>
          </div>
        </div>

        {/* ── Current status card ── */}
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
          }}
        >
          <div style={{ height: 3, background: stage.color }} />

          <div style={{ padding: "24px 24px 20px" }}>
            {/* Icon + status label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: stage.bg,
                  border: `1px solid ${stage.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <StatusIcon size={22} color={stage.color} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 2,
                  }}
                >
                  {copy.title}
                </div>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "3px 10px",
                    borderRadius: 6,
                    background: stage.bg,
                    border: `1px solid ${stage.border}`,
                  }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: stage.color,
                      display: "inline-block",
                    }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: stage.color,
                      letterSpacing: "0.02em",
                    }}
                  >
                    {stage.label}
                  </span>
                </div>
              </div>
            </div>

            <p
              style={{
                fontSize: 14,
                color: "#475569",
                lineHeight: 1.65,
                margin: "0 0 20px",
              }}
            >
              {copy.body}
            </p>

            {/* Interview date */}
            {applicant.interviewDate && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  background: "#fffbeb",
                  border: "1px solid #fde68a",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <Calendar size={16} color="#f59e0b" style={{ flexShrink: 0 }} />
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#92400e",
                      letterSpacing: "0.04em",
                    }}
                  >
                    INTERVIEW SCHEDULED
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#78350f",
                      marginTop: 2,
                    }}
                  >
                    {applicant.interviewDate}
                  </div>
                </div>
              </div>
            )}

            {aiInterview?.interviewLink && applicant.stage === "interview" && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 16px",
                  background: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  borderRadius: 10,
                  marginBottom: 16,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#1d4ed8",
                      letterSpacing: "0.04em",
                    }}
                  >
                    AI INTERVIEW LINK
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: "#1e3a8a",
                      marginTop: 2,
                    }}
                  >
                    Start your agentic AI interview when you're ready.
                  </div>
                </div>
                <a
                  href={aiInterview.interviewLink}
                  style={{
                    background: accent,
                    color: "#fff",
                    padding: "8px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  Start Interview
                </a>
              </div>
            )}

            {/* Progress stepper */}
            {!isRejected && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "#94a3b8",
                    letterSpacing: "0.08em",
                    marginBottom: 16,
                  }}
                >
                  YOUR PROGRESS
                </div>
                <Stepper
                  currentStage={applicant.stage}
                  isRejected={isRejected}
                />
              </div>
            )}

            {/* Rejected state */}
            {isRejected && (
              <div
                style={{
                  padding: "14px 16px",
                  background: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                }}
              >
                <div
                  style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}
                >
                  We appreciate the time and effort you put into your
                  application. We'll keep your details on file and may reach out
                  if a suitable role opens up in the future.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Contact info card ── */}
        {(applicant.email || applicant.phone) && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              YOUR CONTACT DETAILS
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {applicant.email && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Mail size={12} color="#64748b" />
                  </div>
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    {applicant.email}
                  </span>
                </div>
              )}
              {applicant.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Phone size={12} color="#64748b" />
                  </div>
                  <span style={{ fontSize: 13, color: "#475569" }}>
                    {applicant.phone}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── What happens next ── */}
        {screening && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              AI SCREENING SNAPSHOT
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6 }}>
                {screening.summary}
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                ATS score: {screening.atsScore}/100
              </div>
              <div style={{ fontSize: 12, color: "#64748b" }}>
                Confidence match: {Math.round((screening.confidenceScore || 0) * 100)}%
              </div>
              {screening.matchedSkills?.length > 0 && (
                <div style={{ fontSize: 12, color: "#64748b" }}>
                  Relevant skills: {screening.matchedSkills.join(", ")}
                </div>
              )}
            </div>
          </div>
        )}

        {!isRejected && !isHired && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 14,
              padding: "16px 20px",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.08em",
                marginBottom: 12,
              }}
            >
              WHAT HAPPENS NEXT
            </div>
            {[
              applicant.stage === "applied" &&
                "Our hiring team will review your application and reach out if your profile is a strong match.",
              applicant.stage === "screening" &&
                "A recruiter may contact you for a brief introductory call to learn more about your experience.",
              applicant.stage === "interview" &&
                "You'll receive an email with interview details. Prepare by reviewing the role and researching the company.",
              applicant.stage === "offer" &&
                "Review your offer letter carefully. Don't hesitate to reach out if you have any questions.",
            ]
              .filter(Boolean)
              .map((text, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10 }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: accent,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <p
                    style={{
                      fontSize: 13,
                      color: "#475569",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {text}
                  </p>
                </div>
              ))}
          </div>
        )}

        {/* ── Footer ── */}
        <div
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#94a3b8",
            marginTop: 8,
          }}
        >
          This page updates automatically when your application status changes.
          {job?.deadline && dayjs(job.deadline).isAfter(dayjs()) && (
            <div style={{ marginTop: 4 }}>
              Applications close {dayjs(job.deadline).format("D MMMM YYYY")}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
