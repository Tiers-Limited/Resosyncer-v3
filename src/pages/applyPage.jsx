import { Component, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Spin, Result, Input, Select, DatePicker, message } from "antd";
import { Upload, CheckCircle, Loader2, Clock } from "lucide-react";
import {
  analyzeResumeAgainstJob,
  buildScreeningNote,
  createApplicationTrackingLink,
  createAiInterviewLink,
  extractTextFromUploadedFile,
} from "../lib/recruitmentAi";

const { Option } = Select;
const { TextArea } = Input;

const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL || "http://localhost:3001";
const EMAIL_KEY = import.meta.env.VITE_EMAIL_API_KEY || "";
const PUBLIC_DOMAIN =
  import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;

// ─── Confirmation email (with optional tracking link) ────────────────────────
const sendApplicationReceivedEmail = async ({
  to,
  applicantName,
  jobTitle,
  companyName,
  logoUrl,
  trackingUrl,
}) => {
  try {
    await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_KEY}`,
      },
      body: JSON.stringify({
        to,
        templateType: "application_received",
        applicantName,
        jobTitle,
        companyName: companyName || "Resosyncer",
        logoUrl: logoUrl || null,
        ...(trackingUrl ? { trackingUrl } : {}),
        applyDate: new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      }),
    });
  } catch (err) {
    console.warn("[ApplyPage] Confirmation email failed:", err.message);
  }
};

const sendAiInterviewInvite = async ({
  to,
  applicantName,
  jobTitle,
  companyName,
  logoUrl,
  interviewLink,
}) => {
  try {
    await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_KEY}`,
      },
      body: JSON.stringify({
        to,
        templateType: "interview_scheduled",
        applicantName,
        jobTitle,
        companyName: companyName || "Resosyncer",
        logoUrl: logoUrl || null,
        interviewDate: "Complete within 48 hours",
        interviewTime: "Self-paced",
        interviewFormat: "Agentic AI interview",
        interviewerName: `${companyName || "Resosyncer"} AI Interviewer`,
        meetingLink: interviewLink,
      }),
    });
  } catch (err) {
    console.warn("[ApplyPage] Interview invite failed:", err.message);
  }
};

// ─── Error Boundary ───────────────────────────────────────────────────────────
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(e) {
    return { error: e };
  }
  render() {
    if (this.state.error)
      return (
        <div
          style={{
            padding: 40,
            fontFamily: "monospace",
            maxWidth: 640,
            margin: "40px auto",
          }}
        >
          <h2 style={{ color: "#ef4444" }}>Page crashed</h2>
          <pre
            style={{
              background: "#f3f4f6",
              padding: 16,
              borderRadius: 8,
              fontSize: 12,
              overflowX: "auto",
              whiteSpace: "pre-wrap",
            }}
          >
            {this.state.error.message}
            {"\n\n"}
            {this.state.error.stack}
          </pre>
        </div>
      );
    return this.props.children;
  }
}

// ─── Field renderer ───────────────────────────────────────────────────────────
function FieldInput({ field, value, onChange }) {
  switch (field.type) {
    case "textarea":
      return (
        <TextArea
          rows={4}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          style={{ borderRadius: 8 }}
        />
      );
    case "select":
      return (
        <Select
          placeholder="Select…"
          value={value}
          onChange={onChange}
          style={{ width: "100%" }}
        >
          {(field.options || []).map((o) => (
            <Option key={o} value={o}>
              {o}
            </Option>
          ))}
        </Select>
      );
    case "date":
      return (
        <DatePicker
          style={{ width: "100%", borderRadius: 8 }}
          onChange={(_, s) => onChange(s)}
        />
      );
    case "number":
      return (
        <Input
          type="number"
          style={{ borderRadius: 8 }}
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return (
        <Input
          style={{ borderRadius: 8 }}
          type={
            field.type === "email"
              ? "email"
              : field.type === "phone"
                ? "tel"
                : "text"
          }
          placeholder={`Enter ${field.label.toLowerCase()}`}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
  }
}

// ─── File drop zone ───────────────────────────────────────────────────────────
function FileZone({ file, onFile, onRemove }) {
  return (
    <div
      style={{
        border: `2px dashed ${file ? "#10b981" : "#d1d5db"}`,
        borderRadius: 10,
        padding: "20px 16px",
        background: file ? "#f0fdf4" : "#fafafa",
        transition: "all 0.2s",
        cursor: "pointer",
      }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) onFile(f);
      }}
    >
      {file ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span
            style={{
              fontSize: 14,
              color: "#10b981",
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle size={15} /> {file.name}
          </span>
          <button
            onClick={onRemove}
            style={{
              background: "none",
              border: "none",
              color: "#9ca3af",
              fontSize: 12,
              cursor: "pointer",
              textDecoration: "underline",
            }}
          >
            Remove
          </button>
        </div>
      ) : (
        <div style={{ textAlign: "center" }}>
          <Upload
            size={24}
            color="#9ca3af"
            style={{ display: "block", margin: "0 auto 8px" }}
          />
          <div style={{ fontSize: 13, color: "#6b7280" }}>
            Drag & drop or{" "}
            <label
              style={{ color: "#3b82f6", cursor: "pointer", fontWeight: 600 }}
            >
              browse
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files[0];
                  if (f) onFile(f);
                }}
              />
            </label>
          </div>
          <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 4 }}>
            PDF, DOC, DOCX — max 5 MB
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main form ────────────────────────────────────────────────────────────────
function ApplyForm() {
  const { jobId } = useParams();

  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionOutcome, setSubmissionOutcome] = useState("submitted");
  const [notFound, setNotFound] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const [answers, setAnswers] = useState({});
  const [files, setFiles] = useState({});
  const aiSelectionEnabled = job?.branding?.aiSelection !== false;
  const aiDesiredSkills = Array.isArray(job?.branding?.aiDesiredSkills)
    ? job.branding.aiDesiredSkills
    : [];
  const aiCustomQuestions = Array.isArray(job?.branding?.aiCustomQuestions)
    ? job.branding.aiCustomQuestions
    : [];

  useEffect(() => {
    if (!jobId) {
      setFetchError("No job ID in URL");
      setLoading(false);
      return;
    }
    const run = async () => {
      try {
        const { data: jobData, error: jobErr } = await supabase
          .from("recruitment_jobs")
          .select("id,title,department,deadline,fields,status,branding")
          .eq("id", jobId)
          .single();

        if (jobErr) {
          jobErr.code === "PGRST116"
            ? setNotFound(true)
            : setFetchError(jobErr.message);
          setLoading(false);
          return;
        }
        if (!jobData || jobData.status !== "active") {
          setNotFound(true);
          setLoading(false);
          return;
        }
        setJob(jobData);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [jobId]);

  const setAnswer = (id, val) => setAnswers((p) => ({ ...p, [id]: val }));

  const handleSubmit = async () => {
    const missing = (job.fields || []).filter(
      (f) =>
        f.required && f.type !== "file" && !answers[f.id]?.toString().trim(),
    );
    const missingFiles = (job.fields || []).filter(
      (f) => f.required && f.type === "file" && !files[f.id],
    );
    if (missing.length || missingFiles.length) {
      message.warning(
        `Required: ${[...missing, ...missingFiles].map((f) => f.label).join(", ")}`,
      );
      return;
    }

    setSubmitting(true);
    try {
      let cvUrl = null;
      const answersWithFiles = { ...answers };
      let resumeText = "";
      let screening = null;

      for (const field of job.fields || []) {
        if (field.type === "file" && files[field.id]) {
          const file = files[field.id];
          if (aiSelectionEnabled && !resumeText) {
            resumeText = await extractTextFromUploadedFile(file);
          }
          const ext = file.name.split(".").pop().toLowerCase();
          const safeName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
          const path = `${jobId}/${safeName}`;

          const { error: upErr } = await supabase.storage
            .from("recruitment-cvs")
            .upload(path, file, { cacheControl: "3600", upsert: false });
          if (upErr)
            throw new Error(
              upErr.message.includes("Bucket not found")
                ? 'Storage bucket "recruitment-cvs" not found. Create it in Supabase Dashboard → Storage.'
                : upErr.message.includes("policy")
                  ? "Storage upload blocked by RLS policy. Run the storage policy SQL."
                  : `File upload failed: ${upErr.message}`,
            );

          const { data: urlData } = supabase.storage
            .from("recruitment-cvs")
            .getPublicUrl(path);
          const fileUrl = urlData?.publicUrl || path;
          answersWithFiles[field.id] = fileUrl;
          if (!cvUrl) cvUrl = fileUrl;
        }
      }

      const nameField = job.fields.find(
        (f) => f.label.toLowerCase().includes("name") && f.type !== "file",
      );
      const emailField = job.fields.find(
        (f) => f.type === "email" || f.label.toLowerCase().includes("email"),
      );
      const phoneField = job.fields.find(
        (f) => f.type === "phone" || f.label.toLowerCase().includes("phone"),
      );

      const applicantName = answers[nameField?.id] || "Unknown";
      const applicantEmail = answers[emailField?.id] || "unknown@email.com";
      const companyName = job.branding?.company_name || "Resosyncer";

      if (aiSelectionEnabled) {
        try {
          screening = await analyzeResumeAgainstJob({
            job: {
              ...job,
              aiDesiredSkills,
              aiCustomQuestions,
            },
            answers: answersWithFiles,
            resumeText,
          });
          answersWithFiles.__aiScreening = screening;
        } catch (screeningError) {
          console.warn("[ApplyPage] Resume analysis failed:", screeningError.message);
        }
      }

      const isShortlisted =
        aiSelectionEnabled && (screening?.confidenceScore || 0) > 0.7;
      const screeningNote = buildScreeningNote(screening);

      // ── Insert applicant and get back the new row's id ────────────────────
      const { data: inserted, error } = await supabase
        .from("recruitment_applicants")
        .insert([
          {
            job_id: job.id,
            name: applicantName,
            email: applicantEmail,
            phone: answers[phoneField?.id] || null,
            stage: aiSelectionEnabled
              ? isShortlisted
                ? "interview"
                : "screening"
              : "applied",
            answers: answersWithFiles,
            cv_url: cvUrl,
            score: null,
            notes: aiSelectionEnabled ? screeningNote || null : null,
          },
        ])
        .select("id, public_access_token")
        .single();

      if (error) throw error;

      const sendTracking = job.branding?.sendTrackingLink !== false;
      const applicantId = inserted?.id;
      const publicAccessToken = inserted?.public_access_token;
      const interviewLink = publicAccessToken
        ? createAiInterviewLink(publicAccessToken)
        : "";

      if (aiSelectionEnabled && isShortlisted && applicantId) {
        const updatedAnswers = {
          ...answersWithFiles,
          __aiInterview: {
            status: "invited",
            interviewLink,
            invitedAt: new Date().toISOString(),
            generatedQuestions: [
              ...aiCustomQuestions,
              ...(screening?.screeningQuestions || []),
            ].slice(0, 10),
          },
        };

        const { error: interviewUpdateError } = await supabase
          .from("recruitment_applicants")
          .update({ answers: updatedAnswers })
          .eq("id", applicantId);

        if (interviewUpdateError) throw interviewUpdateError;

        await sendAiInterviewInvite({
          to: applicantEmail,
          applicantName,
          jobTitle: job.title,
          companyName,
          logoUrl: job.branding?.logo_url || null,
          interviewLink,
        });
        setSubmissionOutcome("shortlisted");
      } else {
        sendApplicationReceivedEmail({
          to: applicantEmail,
          applicantName,
          jobTitle: job.title,
          companyName,
          logoUrl: job.branding?.logo_url || null,
          trackingUrl:
            sendTracking && publicAccessToken
              ? createApplicationTrackingLink(publicAccessToken)
              : undefined,
        });
        setSubmissionOutcome("submitted");
      }

      setSubmitted(true);
    } catch (err) {
      console.error("[ApplyPage] Submit error:", err);
      message.error(err.message, 6);
    } finally {
      setSubmitting(false);
    }
  };

  const accent = job?.branding?.accent_color || "#3b82f6";
  const companyName = job?.branding?.company_name || "Resosyncer";
  const logoUrl = job?.branding?.logo_url || null;
  const tagline = job?.branding?.tagline || null;

  if (loading)
    return (
      <div style={s.centered}>
        <Loader2
          size={32}
          color="#3b82f6"
          style={{ animation: "spin 1s linear infinite" }}
        />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  if (fetchError)
    return (
      <div style={s.centered}>
        <Result
          status="error"
          title="Could not load form"
          subTitle={fetchError}
        />
      </div>
    );
  if (notFound)
    return (
      <div style={s.centered}>
        <Result
          status="404"
          title="Position Closed"
          subTitle="This job opening may have closed or the link is invalid."
        />
      </div>
    );

  if (submitted)
    return (
      <div style={s.centered}>
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <CheckCircle size={56} color="#10b981" />
          </div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 8px",
            }}
          >
            Application Submitted!
          </h2>

          <p style={{ color: "#6b7280", fontSize: 15 }}>
            Thank you for applying for <strong>{job.title}</strong>.<br />
            {submissionOutcome === "shortlisted"
              ? "Your resume matched strongly, so we've sent an AI interview link to your email."
              : aiSelectionEnabled
                ? "We'll be in touch soon. A confirmation has been sent to your email."
                : "Your application was submitted for manual review. We will contact you soon."}
          </p>
        </div>
      </div>
    );

  return (
    <div style={s.page}>
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={s.topBar}>
        {logoUrl ? (
          <img
            src={logoUrl}
            alt={companyName}
            style={{ height: 32, objectFit: "contain", borderRadius: 4 }}
            onError={(e) => {
              e.target.style.display = "none";
            }}
          />
        ) : (
          <div style={{ ...s.logoBadge, background: accent }}>
            {companyName.charAt(0).toUpperCase()}
          </div>
        )}
        <span style={s.companyName}>{companyName}</span>
        {tagline && <span style={s.tagline}>— {tagline}</span>}
      </div>

      <div style={s.card}>
        <div style={{ marginBottom: 24 }}>
          <span
            style={{ ...s.deptTag, background: `${accent}18`, color: accent }}
          >
            {job.department}
          </span>
          <h1 style={s.jobTitle}>{job.title}</h1>
          {job.deadline && (
            <p style={s.deadline}>
              <span
                style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
              >
                <Clock size={13} /> Apply before {job.deadline}
              </span>
            </p>
          )}
        </div>

        <div style={s.divider} />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            marginBottom: 28,
          }}
        >
          {(job.fields || []).map((field) => (
            <div key={field.id}>
              <label style={s.label}>
                {field.label}
                {field.required && <span style={{ color: "#ef4444" }}> *</span>}
              </label>
              <div style={{ marginTop: 6 }}>
                {field.type === "file" ? (
                  <FileZone
                    file={files[field.id]}
                    onFile={(f) => setFiles((p) => ({ ...p, [field.id]: f }))}
                    onRemove={() =>
                      setFiles((p) => {
                        const n = { ...p };
                        delete n[field.id];
                        return n;
                      })
                    }
                  />
                ) : (
                  <FieldInput
                    field={field}
                    value={answers[field.id]}
                    onChange={(v) => setAnswer(field.id, v)}
                  />
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{
            width: "100%",
            height: 48,
            background: submitting ? "#9ca3af" : accent,
            color: "#fff",
            border: "none",
            borderRadius: 10,
            fontSize: 15,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {submitting ? (
            <>
              <Loader2
                size={16}
                style={{ animation: "spin 1s linear infinite" }}
              />{" "}
              Submitting…
            </>
          ) : (
            "Submit Application"
          )}
        </button>

        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#9ca3af",
            marginTop: 14,
            marginBottom: 0,
          }}
        >
          Your information is kept private and only shared with the hiring team.
        </p>
      </div>

      <p style={{ fontSize: 12, color: "#d1d5db", marginTop: 24 }}>
        Powered by Resosyncer
      </p>
    </div>
  );
}

export default function ApplyPage() {
  return (
    <ErrorBoundary>
      <ApplyForm />
    </ErrorBoundary>
  );
}

const s = {
  page: {
    minHeight: "100vh",
    background: "#f3f4f6",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "0 16px 48px",
    fontFamily: "'DM Sans', sans-serif",
  },
  centered: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'DM Sans', sans-serif",
    flexDirection: "column",
  },
  topBar: {
    width: "100%",
    maxWidth: 600,
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "24px 0 20px",
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontWeight: 700,
    fontSize: 16,
    flexShrink: 0,
  },
  companyName: {
    fontSize: 17,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.3px",
  },
  tagline: { fontSize: 13, color: "#9ca3af" },
  card: {
    width: "100%",
    maxWidth: 600,
    background: "#ffffff",
    borderRadius: 16,
    padding: "36px 40px",
    boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
    border: "1px solid #e5e7eb",
  },
  deptTag: {
    display: "inline-block",
    borderRadius: 6,
    padding: "3px 10px",
    fontSize: 12,
    fontWeight: 600,
    marginBottom: 10,
  },
  jobTitle: {
    margin: 0,
    fontSize: 26,
    fontWeight: 700,
    color: "#111827",
    letterSpacing: "-0.5px",
    lineHeight: 1.2,
  },
  deadline: {
    margin: "8px 0 0",
    fontSize: 13,
    color: "#f59e0b",
    fontWeight: 500,
  },
  divider: { borderTop: "1px solid #f3f4f6", marginBottom: 28 },
  label: {
    display: "block",
    fontSize: 14,
    fontWeight: 600,
    color: "#374151",
    marginBottom: 0,
  },
};
