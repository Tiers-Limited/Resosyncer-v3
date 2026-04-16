import { useEffect, useMemo, useState } from "react";
import { Alert, Card, Spin } from "antd";
import {
  Bot,
  Camera,
  FileVideo,
  ShieldAlert,
  User,
  CheckCircle2,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

const INTERVIEW_RECORDINGS_BUCKET =
  import.meta.env.VITE_INTERVIEW_RECORDINGS_BUCKET || "meeting-recordings";

export default function InterviewReviewPage() {
  const { applicantId } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [applicant, setApplicant] = useState(null);
  const [job, setJob] = useState(null);
  const [recordingSrc, setRecordingSrc] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const { data: applicantRow, error: applicantError } = await supabase
          .from("recruitment_applicants")
          .select("*")
          .eq("id", applicantId)
          .single();
        if (applicantError) throw applicantError;

        const { data: jobRow, error: jobError } = await supabase
          .from("recruitment_jobs")
          .select("*")
          .eq("id", applicantRow.job_id)
          .single();
        if (jobError) throw jobError;

        if (!active) return;
        setApplicant(applicantRow);
        setJob(jobRow);

        const interview = applicantRow.answers?.__aiInterview || {};
        if (interview.recordingPath) {
          const { data } = await supabase.storage
            .from(INTERVIEW_RECORDINGS_BUCKET)
            .createSignedUrl(interview.recordingPath, 3600);
          if (data?.signedUrl && active) setRecordingSrc(data.signedUrl);
        } else if (interview.recordingUrl && active) {
          setRecordingSrc(interview.recordingUrl);
        }
      } catch (err) {
        if (active) setError(err.message || "Unable to load interview review.");
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [applicantId]);

  const interview = applicant?.answers?.__aiInterview || null;
  const screening = applicant?.answers?.__aiScreening || null;
  const transcript = interview?.transcript || [];
  const report = interview?.report || null;
  const qaPairs = useMemo(() => {
    const pairs = [];
    let pendingQuestion = null;

    transcript.forEach((entry) => {
      if (entry.role === "assistant") {
        if (pendingQuestion) {
          pairs.push({ question: pendingQuestion, answer: null });
        }
        pendingQuestion = entry.content;
      } else if (entry.role === "user") {
        pairs.push({ question: pendingQuestion, answer: entry.content });
        pendingQuestion = null;
      }
    });

    if (pendingQuestion) {
      pairs.push({ question: pendingQuestion, answer: null });
    }

    return pairs;
  }, [transcript]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
        }}
      >
        <Spin />
      </div>
    );
  }

  if (error || !applicant || !job) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f8fafc",
          padding: 24,
        }}
      >
        <Alert type="error" message={error || "Interview review unavailable."} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(180deg, rgba(2,51,105,0.16) 0%, rgba(2,51,105,0.07) 10%, #f8fafc 24%, #f8fafc 100%)",
        padding: "20px 18px 34px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 12px",
              borderRadius: 999,
              background: "#e6fffb",
              color: "#0f766e",
              fontSize: 12,
              fontWeight: 700,
              marginBottom: 10,
            }}
          >
            <Bot size={14} />
            Resovex Interview Review
          </div>
          <h1 style={{ margin: 0, fontSize: 30, color: "#0f172a" }}>
            {applicant.name}
          </h1>
          <div style={{ color: "#64748b", marginTop: 6 }}>
            {job.title} -- {job.department || "Recruitment"} -- Applicant ID {applicant.id}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(320px, 0.85fr)",
            gap: 18,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card
              title="Interview Recording"
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(2,51,105,0.14)",
              }}
            >
              {recordingSrc ? (
                <video
                  controls
                  src={recordingSrc}
                  style={{
                    width: "100%",
                    maxHeight: 560,
                    borderRadius: 16,
                    background: "#000",
                  }}
                />
              ) : (
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    color: "#64748b",
                  }}
                >
                  No recording found for this interview.
                </div>
              )}
            </Card>

            <Card
              title="Question and Answer Review"
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(2,51,105,0.14)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {qaPairs.length === 0 && (
                  <div style={{ color: "#64748b" }}>No transcript saved yet.</div>
                )}
                {qaPairs.map((pair, index) => (
                  <div
                    key={index}
                    style={{
                      padding: 16,
                      borderRadius: 16,
                      border: "1px solid #e2e8f0",
                      background: "#fff",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f766e",
                        marginBottom: 8,
                      }}
                    >
                      <Bot size={14} />
                      Resovex Question {index + 1}
                    </div>
                    <div style={{ fontSize: 14, color: "#0f172a", lineHeight: 1.7 }}>
                      {pair.question || "No question captured."}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#475569",
                        marginTop: 14,
                        marginBottom: 8,
                      }}
                    >
                      <User size={14} />
                      Candidate Answer
                    </div>
                    <div style={{ fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
                      {pair.answer || "No answer captured."}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <Card
              title="Interview Summary"
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(2,51,105,0.14)",
              }}
            >
              {report ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {[
                      ["Score", `${report.overallScore}/100`],
                      ["Recommendation", report.recommendation],
                      ["Cheating Risk", report.cheatingRisk],
                      ["Status", interview?.status || "completed"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        style={{
                          padding: 12,
                          borderRadius: 14,
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{label}</div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 15,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 14,
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      color: "#334155",
                      lineHeight: 1.7,
                    }}
                  >
                    {report.summary}
                  </div>
                  {report.strengths?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f766e", marginBottom: 8 }}>
                        Strengths
                      </div>
                      {report.strengths.map((item) => (
                        <div key={item} style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                  {report.concerns?.length > 0 && (
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginBottom: 8 }}>
                        Concerns
                      </div>
                      {report.concerns.map((item) => (
                        <div key={item} style={{ fontSize: 13, color: "#475569", marginBottom: 6 }}>
                          {item}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ color: "#64748b" }}>No interview report saved yet.</div>
              )}
            </Card>

            <Card
              title="Integrity Signals"
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(2,51,105,0.14)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {interview?.suspiciousEvents?.length ? (
                  interview.suspiciousEvents.map((item, index) => (
                    <div
                      key={`${item.at}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        padding: "10px 12px",
                        borderRadius: 14,
                        background: "#fef2f2",
                        border: "1px solid #fecaca",
                        color: "#7f1d1d",
                      }}
                    >
                      <ShieldAlert size={15} style={{ marginTop: 2, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, lineHeight: 1.6 }}>{item.label}</div>
                        <div style={{ fontSize: 11, marginTop: 4, opacity: 0.8 }}>
                          {item.at}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#64748b" }}>No suspicious events were recorded.</div>
                )}
              </div>
            </Card>

            <Card
              title="Application Context"
              style={{
                borderRadius: 22,
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(2,51,105,0.14)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    color: "#0f766e",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <CheckCircle2 size={14} />
                  Resume Screening Snapshot
                </div>
                <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.7 }}>
                  {screening?.summary || "No screening summary stored."}
                </div>
                {screening && (
                  <>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Confidence: {Math.round((screening.confidenceScore || 0) * 100)}%
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      ATS Score: {screening.atsScore}/100
                    </div>
                    <div style={{ fontSize: 12, color: "#64748b" }}>
                      Matched skills: {(screening.matchedSkills || []).join(", ") || "None"}
                    </div>
                  </>
                )}
                {interview?.recordingPath && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 12,
                      color: "#64748b",
                      wordBreak: "break-all",
                    }}
                  >
                    <FileVideo size={14} />
                    {interview.recordingPath}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

