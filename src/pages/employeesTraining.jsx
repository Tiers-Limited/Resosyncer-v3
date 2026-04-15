import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";
import {
  BookOpen,
  FileText,
  Image,
  Video,
  File,
  FileSpreadsheet,
  Presentation,
  Archive,
  ChevronLeft,
  ChevronRight,
  Check,
  Trophy,
  Target,
  Download,
  X,
  ExternalLink,
  Search,
  GraduationCap,
  Package,
  Calendar,
  Play,
  ClipboardList,
  Medal,
  RefreshCcw,
  AlertCircle,
  Eye,
  ArrowRight,
  LayoutGrid,
  Shield,
  Users,
  DollarSign,
  Paintbrush,
  Briefcase,
  ShoppingCart,
  Cpu,
  Lock,
} from "lucide-react";

const PASS_THRESHOLD = 0.7; // 70%

const CATEGORIES = [
  "Onboarding",
  "Technical",
  "HR & Compliance",
  "Design",
  "Management",
  "Security",
  "Sales",
  "Finance",
  "General",
];

const CATEGORY_HEX = {
  Onboarding: "#10b981",
  Technical: "#3b82f6",
  "HR & Compliance": "#8b5cf6",
  Design: "#ec4899",
  Management: "#f59e0b",
  Security: "#ef4444",
  Sales: "#06b6d4",
  Finance: "#14b8a6",
  General: "#94a3b8",
};

const CATEGORY_ICONS = {
  Onboarding: Users,
  Technical: Cpu,
  "HR & Compliance": Shield,
  Design: Paintbrush,
  Management: Briefcase,
  Security: Shield,
  Sales: ShoppingCart,
  Finance: DollarSign,
  General: LayoutGrid,
};

const NAVY = "#1e3a5f";
const NAVY_HOVER = "#162d4a";
const NAVY_LIGHT = "#e8eef5";

const FILE_META = {
  "application/pdf": { label: "PDF", Icon: FileText },
  "image/png": { label: "Image", Icon: Image },
  "image/jpeg": { label: "Image", Icon: Image },
  "image/gif": { label: "Image", Icon: Image },
  "image/webp": { label: "Image", Icon: Image },
  "video/mp4": { label: "Video", Icon: Video },
  "video/webm": { label: "Video", Icon: Video },
  "application/msword": { label: "Doc", Icon: FileText },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    label: "Doc",
    Icon: FileText,
  },
  "application/vnd.ms-excel": { label: "Sheet", Icon: FileSpreadsheet },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    label: "Sheet",
    Icon: FileSpreadsheet,
  },
  "application/vnd.ms-powerpoint": { label: "Slides", Icon: Presentation },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    label: "Slides",
    Icon: Presentation,
  },
  "application/zip": { label: "Zip", Icon: Archive },
};
const getFileMeta = (mime) => FILE_META[mime] || { label: "File", Icon: File };
const formatSize = (b) =>
  !b
    ? ""
    : b < 1048576
      ? `${(b / 1024).toFixed(0)} KB`
      : `${(b / 1048576).toFixed(1)} MB`;

const DIFF = {
  Beginner: { bg: "#f0fdf4", color: "#16a34a", border: "#bbf7d0" },
  Intermediate: { bg: "#fffbeb", color: "#d97706", border: "#fde68a" },
  Advanced: { bg: "#fef2f2", color: "#dc2626", border: "#fecaca" },
};

function getIsDarkTheme() {
  const mode = localStorage.getItem("themeMode") || "system";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

async function loadQuizResult(userId, quizId, courseId) {
  const { data } = await supabase
    .from("quiz_results")
    .select("*")
    .eq("tenant_id", TENANT_ID)
    .eq("user_id", userId)
    .eq("quiz_id", quizId)
    .eq("course_id", courseId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data || null;
}

async function saveQuizResult({
  userId,
  quizId,
  courseId,
  score,
  total,
  passed,
  answers,
  TENANT_ID
}) {
  const { data, error } = await supabase
    .from("quiz_results")
    .upsert(
      {
        tenant_id: TENANT_ID,
        user_id: userId,
        quiz_id: quizId,
        course_id: courseId,
        score,
        total,
        passed,
        answers, // JSONB column
        updated_at: new Date().toISOString(),
      },
      { onConflict: "tenant_id,user_id,quiz_id,course_id" },
    )
    .select()
    .single();
  if (error) console.error("saveQuizResult error:", error);
  return data;
}

function CertificateModal({ userName, courseName, TENANT_NAME, onClose }) {
  const canvasRef = useRef(null);
  const date = dayjs().format("MMMM D, YYYY");

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1100,
      H = 780;
    canvas.width = W;
    canvas.height = H;

    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, "#0f172a");
    grad.addColorStop(0.5, "#1e293b");
    grad.addColorStop(1, "#0f172a");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);
    ctx.strokeStyle = "rgba(245,158,11,0.3)";
    ctx.lineWidth = 1;
    ctx.strokeRect(36, 36, W - 72, H - 72);

    [
      [50, 50],
      [W - 50, 50],
      [50, H - 50],
      [W - 50, H - 50],
    ].forEach(([cx, cy]) => {
      ctx.beginPath();
      ctx.arc(cx, cy, 8, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
    });

    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(W / 2 - 120, 70, 240, 2);

    ctx.fillStyle = "rgba(245,158,11,0.1)";
    ctx.beginPath();
    ctx.roundRect(W / 2 - 36, 88, 72, 72, 16);
    ctx.fill();
    ctx.strokeStyle = "rgba(245,158,11,0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 32px Georgia,serif";
    ctx.textAlign = "center";
    ctx.fillText(TENANT_NAME[0], W / 2, 136);

    ctx.fillStyle = "rgba(245,158,11,0.6)";
    ctx.font = "600 11px Arial,sans-serif";
    ctx.fillText("CERTIFICATE OF COMPLETION", W / 2, 192);

    const dg = ctx.createLinearGradient(W / 2 - 200, 0, W / 2 + 200, 0);
    dg.addColorStop(0, "transparent");
    dg.addColorStop(0.5, "#f59e0b");
    dg.addColorStop(1, "transparent");
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 200, 206);
    ctx.lineTo(W / 2 + 200, 206);
    ctx.stroke();

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "italic 18px Georgia,serif";
    ctx.fillText("This is to certify that", W / 2, 256);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 52px Georgia,serif";
    ctx.fillText(userName || "Learner", W / 2, 326);

    const nameW = ctx.measureText(userName || "Learner").width;
    const ug = ctx.createLinearGradient(
      W / 2 - nameW / 2,
      0,
      W / 2 + nameW / 2,
      0,
    );
    ug.addColorStop(0, "transparent");
    ug.addColorStop(0.5, "#f59e0b");
    ug.addColorStop(1, "transparent");
    ctx.strokeStyle = ug;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(W / 2 - nameW / 2, 338);
    ctx.lineTo(W / 2 + nameW / 2, 338);
    ctx.stroke();

    ctx.fillStyle = "rgba(148,163,184,0.8)";
    ctx.font = "italic 18px Georgia,serif";
    ctx.fillText("has successfully completed the course", W / 2, 380);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 30px Georgia,serif";
    const maxW = W - 200;
    const words = courseName.split(" ");
    let line = "",
      lines = [];
    for (const w of words) {
      const t = line + w + " ";
      if (ctx.measureText(t).width > maxW && line) {
        lines.push(line.trim());
        line = w + " ";
      } else line = t;
    }
    if (line) lines.push(line.trim());
    lines.forEach((l, i) => ctx.fillText(l, W / 2, 428 + i * 38));

    const afterCourse = 428 + (lines.length - 1) * 38;
    ctx.strokeStyle = dg;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 300, afterCourse + 50);
    ctx.lineTo(W / 2 + 300, afterCourse + 50);
    ctx.stroke();

    const colL = W / 2 - 220,
      colR = W / 2 + 220,
      rowY = afterCourse + 90;
    ctx.fillStyle = "rgba(148,163,184,0.7)";
    ctx.font = "11px Arial,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("DATE ISSUED", colL, rowY - 18);
    ctx.fillText("ISSUED BY", colR, rowY - 18);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 15px Georgia,serif";
    ctx.fillText(date, colL, rowY + 2);
    ctx.fillText(TENANT_NAME, colR, rowY + 2);

    ctx.strokeStyle = "rgba(148,163,184,0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(colL - 80, rowY + 14);
    ctx.lineTo(colL + 80, rowY + 14);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(colR - 80, rowY + 14);
    ctx.lineTo(colR + 80, rowY + 14);
    ctx.stroke();

    ctx.fillStyle = "rgba(245,158,11,0.4)";
    ctx.font = "600 10px Arial,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      TENANT_NAME.toUpperCase() + " · LEARNING & DEVELOPMENT",
      W / 2,
      H - 50,
    );
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(W / 2 - 120, H - 60, 240, 1);
  }, [userName, courseName]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    const link = document.createElement("a");
    link.download = `certificate-${courseName.replace(/\s+/g, "-").toLowerCase()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "rgba(0,0,0,0.8)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#0f172a",
          borderRadius: 20,
          border: "1px solid rgba(245,158,11,0.3)",
          padding: 32,
          maxWidth: 760,
          width: "100%",
          animation: "scaleIn 0.25s ease",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <Trophy size={16} color="#f59e0b" />
            <p
              style={{
                color: "#f59e0b",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                margin: 0,
              }}
            >
              Course Complete!
            </p>
          </div>
          <p style={{ color: "#94a3b8", fontSize: 14, margin: 0 }}>
            Your certificate is ready to download
          </p>
        </div>
        <canvas
          ref={canvasRef}
          style={{
            width: "100%",
            borderRadius: 12,
            display: "block",
            border: "1px solid rgba(245,158,11,0.2)",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 20,
            justifyContent: "center",
          }}
        >
          <button
            onClick={handleDownload}
            style={{
              padding: "12px 32px",
              background: "#f59e0b",
              color: "#0f172a",
              border: "none",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#fbbf24")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#f59e0b")}
          >
            <Download size={16} /> Download Certificate
          </button>
          <button
            onClick={onClose}
            style={{
              padding: "12px 24px",
              background: "rgba(255,255,255,0.05)",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              fontSize: 14,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <X size={14} /> Close
          </button>
        </div>
      </div>
    </div>
  );
}

function SavedResultBanner({ result, quiz, onRetake, onContinue, dark = false }) {
  const { score, total, passed, answers } = result;
  const pct = Math.round((score / total) * 100);
  const questions = quiz?.questions || [];

  return (
    <div style={{ padding: "32px 0", animation: "fadeIn 0.3s ease" }}>
      <div
        style={{
          textAlign: "center",
          padding: "32px 24px",
          background: passed
            ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
            : "linear-gradient(135deg,#fef2f2,#fee2e2)",
          borderRadius: 16,
          marginBottom: 24,
          border: passed ? "1px solid #bbf7d0" : "1px solid #fecaca",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 12,
          }}
        >
          {passed ? (
            <Trophy size={48} color="#15803d" />
          ) : (
            <AlertCircle size={48} color="#dc2626" />
          )}
        </div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: passed ? "#15803d" : "#dc2626",
            marginBottom: 4,
          }}
        >
          {score}/{total}{" "}
          <span style={{ fontSize: 16, fontWeight: 600 }}>({pct}%)</span>
        </p>
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: passed ? "#16a34a" : "#ef4444",
            marginBottom: 4,
          }}
        >
          {passed
            ? "Previously Passed ✓"
            : "Previously Attempted — Below Pass Mark"}
        </p>
        <p style={{ fontSize: 13, color: "#64748b" }}>
          {passed
            ? "You already passed this quiz. You can continue to the next step."
            : `Pass mark is ${Math.round(PASS_THRESHOLD * 100)}%. Retake to try again.`}
        </p>
      </div>

      {/* Answer review */}
      {questions.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {questions.map((q, i) => {
            const correct = answers?.[i] === q.correct_index;
            return (
              <div
                key={i}
                style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: correct ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${correct ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  {correct ? (
                    <Check
                      size={16}
                      color="#16a34a"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                  ) : (
                    <X
                      size={16}
                      color="#dc2626"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: 6,
                      }}
                    >
                      {q.question}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: correct ? "#16a34a" : "#dc2626",
                      }}
                    >
                      Your answer:{" "}
                      <strong>{q.options?.[answers?.[i]] ?? "—"}</strong>
                    </p>
                    {!correct && (
                      <p
                        style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}
                      >
                        Correct: <strong>{q.options?.[q.correct_index]}</strong>
                      </p>
                    )}
                    {q.explanation && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
        {!passed && (
          <button
            onClick={onRetake}
            style={{
              padding: "10px 20px",
              background: dark ? "#1f2937" : "white",
              color: dark ? "#e5e7eb" : "#1e293b",
              border: dark ? "1.5px solid #374151" : "1.5px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <RefreshCcw size={13} /> Retake Quiz
          </button>
        )}
        <button
          onClick={onContinue}
          disabled={!passed}
          style={{
            padding: "10px 24px",
            background: passed
              ? "linear-gradient(135deg,#10b981,#059669)"
              : "#e2e8f0",
            color: passed ? "white" : "#94a3b8",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            cursor: passed ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            boxShadow: passed ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ArrowRight size={14} /> Continue
        </button>
      </div>
    </div>
  );
}

function QuizView({
  quiz,
  onComplete,
  userId,
  courseId,
  savedResult,
  TENANT_ID,
  onResultSaved,
  dark = false,
}) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(!!savedResult);

  const questions = quiz?.questions || [];
  const q = questions[current];
  const total = questions.length;
  const answered = answers[current] !== undefined;

  const handleSelect = (oi) => {
    if (!submitted) setAnswers((a) => ({ ...a, [current]: oi }));
  };
  const handleNext = () => {
    if (current < total - 1) setCurrent((c) => c + 1);
  };

  const handleSubmit = async () => {
    let s = 0;
    questions.forEach((q, i) => {
      if (answers[i] === q.correct_index) s++;
    });
    setScore(s);
    setSubmitted(true);

    // Persist to DB
    if (userId && quiz?.id) {
      setSaving(true);
      const row = await saveQuizResult({
        userId,
        quizId: quiz.id,
        courseId,
        score: s,
        total,
        passed: s / total >= PASS_THRESHOLD,
        answers,
        TENANT_ID,
      });
      setSaving(false);
      if (onResultSaved) onResultSaved(row);
    }
  };

  const pass = score / total >= PASS_THRESHOLD;

  // ── No questions ──
  if (!questions.length)
    return (
      <div style={{ textAlign: "center", padding: "48px 24px" }}>
        <AlertCircle
          size={32}
          color="#94a3b8"
          style={{ margin: "0 auto 12px" }}
        />
        <p style={{ color: "#64748b", fontSize: 14 }}>
          No quiz questions available.
        </p>
        <button
          onClick={() => onComplete(true)}
          style={{
            marginTop: 20,
            padding: "10px 24px",
            background: NAVY,
            color: "#f8fafc",
            border: "none",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          Continue <ArrowRight size={14} />
        </button>
      </div>
    );

  // ── Show saved result banner ──
  if (showSaved && savedResult) {
    return (
      <SavedResultBanner
        result={savedResult}
        quiz={quiz}
        onRetake={() => setShowSaved(false)}
        onContinue={() => onComplete(savedResult.passed)}
        dark={dark}
      />
    );
  }

  // ── Post-submit result ──
  if (submitted) {
    return (
      <div style={{ padding: "32px 0", animation: "fadeIn 0.3s ease" }}>
        <div
          style={{
            textAlign: "center",
            padding: "32px 24px",
            background: pass
              ? "linear-gradient(135deg,#f0fdf4,#dcfce7)"
              : "linear-gradient(135deg,#fef2f2,#fee2e2)",
            borderRadius: 16,
            marginBottom: 24,
            border: pass ? "1px solid #bbf7d0" : "1px solid #fecaca",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            {pass ? (
              <Trophy size={48} color="#15803d" />
            ) : (
              <AlertCircle size={48} color="#dc2626" />
            )}
          </div>
          <p
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: pass ? "#15803d" : "#dc2626",
              marginBottom: 6,
            }}
          >
            {score}/{total}{" "}
            <span style={{ fontSize: 16, fontWeight: 600 }}>
              ({Math.round((score / total) * 100)}%)
            </span>
          </p>
          <p
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: pass ? "#16a34a" : "#ef4444",
              marginBottom: 4,
            }}
          >
            {pass ? "Passed!" : "Not quite…"}
          </p>
          <p style={{ fontSize: 13, color: "#64748b" }}>
            {pass
              ? "Great work! You've completed this quiz."
              : `You need ${Math.round(PASS_THRESHOLD * 100)}% to pass. Try again!`}
          </p>
          {saving && (
            <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 8 }}>
              Saving result…
            </p>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {questions.map((q, i) => {
            const correct = answers[i] === q.correct_index;
            return (
              <div
                key={i}
                style={{
                  padding: "16px 18px",
                  borderRadius: 12,
                  background: correct ? "#f0fdf4" : "#fef2f2",
                  border: `1px solid ${correct ? "#bbf7d0" : "#fecaca"}`,
                }}
              >
                <div
                  style={{ display: "flex", gap: 10, alignItems: "flex-start" }}
                >
                  {correct ? (
                    <Check
                      size={16}
                      color="#16a34a"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                  ) : (
                    <X
                      size={16}
                      color="#dc2626"
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                  )}
                  <div>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#1e293b",
                        marginBottom: 6,
                      }}
                    >
                      {q.question}
                    </p>
                    <p
                      style={{
                        fontSize: 12,
                        color: correct ? "#16a34a" : "#dc2626",
                      }}
                    >
                      Your answer:{" "}
                      <strong>{q.options?.[answers[i]] ?? "—"}</strong>
                    </p>
                    {!correct && (
                      <p
                        style={{ fontSize: 12, color: "#16a34a", marginTop: 2 }}
                      >
                        Correct: <strong>{q.options?.[q.correct_index]}</strong>
                      </p>
                    )}
                    {q.explanation && (
                      <p
                        style={{
                          fontSize: 11,
                          color: "#64748b",
                          marginTop: 6,
                          fontStyle: "italic",
                        }}
                      >
                        {q.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          {!pass && (
            <button
              onClick={() => {
                setAnswers({});
                setSubmitted(false);
                setCurrent(0);
              }}
              style={{
                padding: "10px 20px",
                background: "white",
                color: "#1e293b",
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <RefreshCcw size={13} /> Try Again
            </button>
          )}
          <button
            onClick={() => onComplete(pass)}
            style={{
              padding: "10px 24px",
              background: pass
                ? "linear-gradient(135deg,#10b981,#059669)"
                : "#94a3b8",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              boxShadow: pass ? "0 4px 12px rgba(16,185,129,0.3)" : "none",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {pass ? (
              <>
                <ArrowRight size={14} /> Continue
              </>
            ) : (
              "Skip for now"
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── Active quiz ──
  return (
    <div style={{ padding: "24px 0", animation: "fadeIn 0.2s ease" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: 1,
            height: 4,
            background: "#f1f5f9",
            borderRadius: 99,
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 99,
              background: `linear-gradient(90deg,${NAVY},#3b82f6)`,
              width: `${((current + 1) / total) * 100}%`,
              transition: "width 0.4s ease",
            }}
          />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: "#94a3b8",
            flexShrink: 0,
          }}
        >
          {current + 1} / {total}
        </span>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "inline-block",
            padding: "4px 12px",
            background: "#f1f5f9",
            borderRadius: 99,
            fontSize: 11,
            fontWeight: 700,
            color: "#64748b",
            marginBottom: 12,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Question {current + 1}
        </div>
        <p
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "#0f172a",
            lineHeight: 1.5,
          }}
        >
          {q.question}
        </p>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginBottom: 28,
        }}
      >
        {(q.options || []).map((opt, oi) => {
          const sel = answers[current] === oi;
          return (
            <button
              key={oi}
              onClick={() => handleSelect(oi)}
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                textAlign: "left",
                background: sel ? NAVY_LIGHT : "#f8fafc",
                border: sel ? `2px solid ${NAVY}` : "1.5px solid #e2e8f0",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: sel ? 600 : 500,
                color: sel ? NAVY : "#374151",
                fontFamily: "inherit",
                transition: "all 0.15s",
                display: "flex",
                alignItems: "center",
                gap: 12,
                boxShadow: sel ? `0 4px 12px ${NAVY}20` : "none",
                transform: sel ? "translateX(4px)" : "none",
              }}
            >
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  background: sel ? NAVY : "white",
                  border: sel ? "none" : "1.5px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: sel ? "white" : "#94a3b8",
                }}
              >
                {String.fromCharCode(65 + oi)}
              </span>
              {opt}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => setCurrent((c) => Math.max(0, c - 1))}
          disabled={current === 0}
          style={{
            padding: "10px 20px",
            background: "white",
            color: "#475569",
            border: "1.5px solid #e2e8f0",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 600,
            cursor: current === 0 ? "not-allowed" : "pointer",
            opacity: current === 0 ? 0.4 : 1,
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        {current < total - 1 ? (
          <button
            onClick={handleNext}
            disabled={!answered}
            style={{
              padding: "10px 24px",
              background: answered ? NAVY : "#e2e8f0",
              color: answered ? "white" : "#94a3b8",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: answered ? "pointer" : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Next <ChevronRight size={14} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length < total}
            style={{
              padding: "10px 24px",
              background:
                Object.keys(answers).length >= total
                  ? `linear-gradient(135deg,${NAVY},#2563eb)`
                  : "#e2e8f0",
              color: Object.keys(answers).length >= total ? "white" : "#94a3b8",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor:
                Object.keys(answers).length >= total
                  ? "pointer"
                  : "not-allowed",
              fontFamily: "inherit",
              transition: "all 0.2s",
              boxShadow:
                Object.keys(answers).length >= total
                  ? `0 4px 16px ${NAVY}40`
                  : "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Check size={14} /> Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL VIEWER
// ─────────────────────────────────────────────────────────────────────────────
function MaterialViewer({ item, onClose }) {
  const mime = item?.file_type || "";
  const url = item?.file_url;
  const { label, Icon } = getFileMeta(mime);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", fn);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", fn);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        background: "rgba(15,23,42,0.7)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        animation: "fadeIn 0.15s ease",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white",
          borderRadius: 16,
          width: "100%",
          maxWidth: 860,
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
          animation: "scaleIn 0.2s ease",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginBottom: 4,
              }}
            >
              <Icon size={12} /> {label}
            </span>
            <h3
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 700,
                color: "#0f172a",
                letterSpacing: "-0.02em",
              }}
            >
              {item.title}
            </h3>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              style={{
                padding: "7px 16px",
                background: "#f1f5f9",
                color: "#1e293b",
                textDecoration: "none",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              Open <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: "1.5px solid #e2e8f0",
                background: "white",
                cursor: "pointer",
                color: "#94a3b8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X size={14} />
            </button>
          </div>
        </div>
        <div style={{ flex: 1, overflow: "auto" }}>
          {mime.startsWith("image/") && (
            <img
              src={url}
              alt={item.title}
              style={{
                width: "100%",
                maxHeight: 520,
                objectFit: "contain",
                display: "block",
                background: "#f8fafc",
              }}
            />
          )}
          {mime.startsWith("video/") && (
            <video
              src={url}
              controls
              autoPlay
              style={{
                width: "100%",
                maxHeight: 520,
                display: "block",
                background: "#000",
              }}
            />
          )}
          {mime === "application/pdf" && (
            <iframe
              src={`${url}#toolbar=0`}
              width="100%"
              height="540"
              style={{ border: "none", display: "block" }}
              title={item.title}
            />
          )}
          {!mime.startsWith("image/") &&
            !mime.startsWith("video/") &&
            mime !== "application/pdf" && (
              <div style={{ textAlign: "center", padding: "64px 24px" }}>
                <Icon
                  size={48}
                  color="#94a3b8"
                  style={{ margin: "0 auto 16px" }}
                />
                <p
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#1e293b",
                    marginBottom: 4,
                  }}
                >
                  {item.title}
                </p>
                <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 24 }}>
                  {label}
                  {item.file_size ? ` · ${formatSize(item.file_size)}` : ""}
                </p>
                <a
                  href={url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 24px",
                    borderRadius: 10,
                    background: NAVY,
                    color: "white",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  <Download size={14} /> Download File
                </a>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE DETAIL
// ─────────────────────────────────────────────────────────────────────────────
function CourseDetailView({
  course,
  quizzes,
  allMaterials,
  onBack,
  onCertificate,
  TENANT_ID,
  userName,
  userId,
  dark = false,
}) {
  const modules = course.modules || [];
  const [activeModIdx, setActiveModIdx] = useState(0);
  const [phase, setPhase] = useState("content");
  const [completedMods, setCompletedMods] = useState({});
  const [quizPassed, setQuizPassed] = useState({});
  const [previewMat, setPreviewMat] = useState(null);
  const [viewedMats, setViewedMats] = useState({});

  // savedResults keyed by quiz.id — loaded from DB on mount
  const [savedResults, setSavedResults] = useState({});
  const [resultsLoaded, setResultsLoaded] = useState(false);

  const catHex = CATEGORY_HEX[course.category] || "#94a3b8";
  const CatIcon = CATEGORY_ICONS[course.category] || GraduationCap;

  const getModQuiz = (idx) => {
    const mod = modules[idx];
    return quizzes.find((q) => q.title === `${mod?.title} Quiz`);
  };
  const finalQuiz = quizzes.find((q) => q.title?.includes("Final Quiz"));
  const isFinalStep = activeModIdx === modules.length;
  const allModsDone = modules.every((_, i) => completedMods[i]);
  const courseComplete =
    allModsDone && (finalQuiz ? quizPassed["final"] : true);

  // ── Load all saved results for this course on mount ──
  useEffect(() => {
    if (!userId) {
      setResultsLoaded(true);
      return;
    }
    (async () => {
      const allQuizIds = quizzes.map((q) => q.id).filter(Boolean);
      if (!allQuizIds.length) {
        setResultsLoaded(true);
        return;
      }

      console.log("tenantId", userId);

      const { data } = await supabase
        .from("quiz_results")
        .select("*")
        .eq("tenant_id", TENANT_ID)
        .eq("user_id", userId)
        .eq("course_id", course.id)
        .in("quiz_id", allQuizIds);

      console.log(data);

      const map = {};
      (data || []).forEach((row) => {
        map[row.quiz_id] = row;
      });
      setSavedResults(map);

      // Pre-populate completedMods / quizPassed from saved results
      const newCompleted = {},
        newPassed = {};
      quizzes.forEach((quiz) => {
        const row = map[quiz.id];
        if (!row) return;
        if (quiz.title?.includes("Final Quiz")) {
          if (row.passed) newPassed["final"] = true;
          // final quiz doesn't gate a specific module index
        } else {
          modules.forEach((mod, i) => {
            if (quiz.title === `${mod.title} Quiz`) {
              newCompleted[i] = true;
              if (row.passed) newPassed[i] = true;
            }
          });
        }
      });
      setCompletedMods(newCompleted);
      setQuizPassed(newPassed);

      // Advance to first incomplete module
      const firstIncomplete = modules.findIndex((_, i) => !newCompleted[i]);
      if (firstIncomplete === -1 && modules.length > 0) {
        // all done — go to final step
        setActiveModIdx(modules.length);
        setPhase(newPassed["final"] ? "done" : "quiz");
      } else if (firstIncomplete > 0) {
        setActiveModIdx(firstIncomplete);
      }

      setResultsLoaded(true);
    })();
  }, [userId, course.id, quizzes.length, TENANT_ID]);

  const handleModQuizComplete = (passed, idx) => {
    if (passed) setQuizPassed((p) => ({ ...p, [idx]: true }));
    setCompletedMods((c) => ({ ...c, [idx]: true }));
    if (idx < modules.length - 1) {
      setActiveModIdx(idx + 1);
      setPhase("content");
    } else {
      setActiveModIdx(modules.length);
      setPhase(finalQuiz ? "quiz" : "done");
    }
  };

  const handleFinalQuizComplete = (passed) => {
    if (passed) setQuizPassed((p) => ({ ...p, final: true }));
    setPhase("done");
  };

  const handleResultSaved = (quizId, row) => {
    if (!row) return;
    setSavedResults((r) => ({ ...r, [quizId]: row }));
  };

  const activeMod = modules[activeModIdx];
  const attachedMats = activeMod
    ? (activeMod.material_ids || [])
        .map((id) => allMaterials.find((m) => m.id === id))
        .filter(Boolean)
    : [];

  if (!resultsLoaded) {
    return (
      <div
        className={`training-portal${dark ? " dark" : ""}`}
        style={{
          minHeight: "100vh",
          background: dark ? "#111318" : "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p style={{ color: "#94a3b8", fontSize: 14 }}>Loading your progress…</p>
      </div>
    );
  }

  return (
    <div
      className={`training-portal${dark ? " dark" : ""}`}
      style={{
        minHeight: "100vh",
        background: dark ? "#111318" : "#f8fafc",
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
      }}
    >
      <style>{`
        .training-portal.dark [style*="background: white"],
        .training-portal.dark [style*="background:white"] { background: #171a21 !important; }
        .training-portal.dark [style*="background: #f8fafc"],
        .training-portal.dark [style*="background:#f8fafc"],
        .training-portal.dark [style*="background: #fafbfc"],
        .training-portal.dark [style*="background: #f1f5f9"] { background: #111318 !important; }
        .training-portal.dark [style*="border: 1px solid #f1f5f9"],
        .training-portal.dark [style*="border-bottom: 1px solid #f1f5f9"],
        .training-portal.dark [style*="borderTop: \"1px solid #f8fafc\""],
        .training-portal.dark [style*="border: 1.5px solid #f1f5f9"],
        .training-portal.dark [style*="border: 1.5px solid #e2e8f0"] { border-color: transparent !important; }
        .training-portal.dark [style*="color: #0f172a"],
        .training-portal.dark [style*="color:#0f172a"],
        .training-portal.dark [style*="color: #1e293b"],
        .training-portal.dark [style*="color: #374151"],
        .training-portal.dark [style*="color: #475569"] { color: #e5e7eb !important; }
        .training-portal.dark [style*="color: #64748b"],
        .training-portal.dark [style*="color: #94a3b8"],
        .training-portal.dark [style*="color: #78716c"] { color: #94a3b8 !important; }
        .training-portal.dark button[style*="background: #f8fafc"] {
          background: #141821 !important;
          border-color: #2a2f3a !important;
        }
      `}</style>

      {previewMat && (
        <MaterialViewer item={previewMat} onClose={() => setPreviewMat(null)} />
      )}

      {/* Top bar */}
      <header
        style={{
          background: dark ? "#171a21" : "white",
          borderBottom: `1px solid ${dark ? "transparent" : "#f1f5f9"}`,
          position: "sticky",
          top: 0,
          zIndex: 40,
          padding: "0 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 60,
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: dark ? "#1a2230" : "#f8fafc",
              border: dark ? "1.5px solid transparent" : "1.5px solid #e2e8f0",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: dark ? "#cbd5e1" : "#475569",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            <ChevronLeft size={14} /> All Courses
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: catHex,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <GraduationCap size={14} color="white" />
            </div>
            <div>
              <p
                style={{
                  margin: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: dark ? "#e5e7eb" : "#0f172a",
                  letterSpacing: "-0.02em",
                }}
              >
                {course.title}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                {course.category} · {course.difficulty}
              </p>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            {modules.map((_, i) => (
              <div
                key={i}
                style={{
                  width: 28,
                  height: 5,
                  borderRadius: 99,
                  background: completedMods[i]
                    ? catHex
                    : activeModIdx === i
                      ? (dark ? "#243043" : "#e2e8f0")
                      : (dark ? "#1a2230" : "#f1f5f9"),
                  border:
                    activeModIdx === i && !completedMods[i]
                      ? `2px solid ${catHex}`
                      : "none",
                  transition: "all 0.3s",
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8" }}>
            {Object.keys(completedMods).length}/{modules.length}
          </span>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          maxWidth: 1200,
          margin: "0 auto",
          padding: "28px 32px",
          gap: 28,
        }}
      >
        {/* Sidebar */}
        <aside style={{ width: 260, flexShrink: 0 }}>
          <div
            style={{
              background: "white",
              borderRadius: 16,
              border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
              overflow: "hidden",
              boxShadow: dark
                ? "0 12px 28px rgba(0,0,0,0.35)"
                : "0 1px 6px rgba(0,0,0,0.04)",
              position: "sticky",
              top: 88,
            }}
          >
            <div
              style={{
                padding: "16px 18px",
                borderBottom: dark ? "1px solid transparent" : "1px solid #f8fafc",
                background: dark ? "#1b2230" : "#fafbfc",
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontSize: 10,
                  fontWeight: 800,
                  color: "#94a3b8",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Course Progress
              </p>
            </div>
            {modules.map((mod, i) => {
              const done = completedMods[i];
              const active = activeModIdx === i;
              const mq = getModQuiz(i);
              const qP = quizPassed[i];
              return (
                <button
                  key={i}
                  onClick={() => {
                    setActiveModIdx(i);
                    setPhase("content");
                  }}
                  style={{
                    width: "100%",
                    textAlign: "left",
                    padding: "12px 18px",
                    background: active
                      ? (dark ? `${catHex}1f` : `${catHex}0d`)
                      : "transparent",
                    border: "none",
                    borderLeft: active
                      ? `3px solid ${catHex}`
                      : "3px solid transparent",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    fontFamily: "inherit",
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      flexShrink: 0,
                      background: done
                        ? catHex
                        : active
                          ? `${catHex}20`
                          : dark
                            ? "#1a2230"
                            : "#f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                      color: done ? "white" : active ? catHex : "#94a3b8",
                      border: done
                        ? "none"
                        : active
                          ? `1.5px solid ${catHex}`
                          : "none",
                    }}
                  >
                    {done ? <Check size={12} color="white" /> : i + 1}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: active ? 700 : 600,
                        color: active
                          ? dark
                            ? "#e5e7eb"
                            : "#0f172a"
                          : done
                            ? dark
                              ? "#94a3b8"
                              : "#64748b"
                            : dark
                              ? "#cbd5e1"
                              : "#374151",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {mod.title || `Module ${i + 1}`}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        color: "#94a3b8",
                        marginTop: 1,
                      }}
                    >
                      {done
                        ? mq && qP
                          ? "Quiz passed"
                          : "Complete"
                        : active
                          ? "In progress"
                          : "Pending"}
                    </p>
                  </div>
                </button>
              );
            })}

            {finalQuiz && (
              <button
                onClick={() => {
                  setActiveModIdx(modules.length);
                  setPhase("quiz");
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 18px",
                  background: isFinalStep
                    ? dark
                      ? "rgba(245,158,11,0.18)"
                      : "rgba(245,158,11,0.06)"
                    : "transparent",
                  border: "none",
                  borderLeft: isFinalStep
                    ? "3px solid #f59e0b"
                    : "3px solid transparent",
                  cursor: allModsDone ? "pointer" : "not-allowed",
                  opacity: allModsDone ? 1 : 0.4,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontFamily: "inherit",
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 8,
                    flexShrink: 0,
                    background: quizPassed.final
                      ? "#f59e0b"
                      : isFinalStep
                        ? "rgba(245,158,11,0.15)"
                        : dark
                          ? "#1a2230"
                          : "#f1f5f9",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border:
                      isFinalStep && !quizPassed.final
                        ? "1.5px solid #f59e0b"
                        : "none",
                  }}
                >
                  {quizPassed.final ? (
                    <Trophy size={13} color="white" />
                  ) : (
                    <Target
                      size={13}
                      color={isFinalStep ? "#f59e0b" : "#94a3b8"}
                    />
                  )}
                </div>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: isFinalStep ? 700 : 600,
                      color: isFinalStep
                        ? dark
                          ? "#fef3c7"
                          : "#0f172a"
                        : dark
                          ? "#e5e7eb"
                          : "#374151",
                    }}
                  >
                    Final Assessment
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: "#94a3b8" }}>
                    {quizPassed.final
                      ? "Passed"
                      : allModsDone
                        ? "Ready"
                        : "Complete modules first"}
                  </p>
                </div>
              </button>
            )}

            {courseComplete && (
              <div
                style={{
                  padding: "12px 16px",
                  borderTop: dark ? "1px solid transparent" : "1px solid #f8fafc",
                }}
              >
                <button
                  onClick={onCertificate}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "linear-gradient(135deg,#f59e0b,#d97706)",
                    color: "white",
                    border: "none",
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    boxShadow: "0 4px 12px rgba(245,158,11,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <Medal size={14} /> Get Certificate
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* Main */}
        <main style={{ flex: 1, minWidth: 0 }}>
          {isFinalStep ? (
            <div
              style={{
                background: "white",
                borderRadius: 20,
                border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
                overflow: "hidden",
                boxShadow: dark
                  ? "0 18px 34px rgba(0,0,0,0.35)"
                  : "0 1px 8px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  padding: "28px 32px",
                  borderBottom: dark ? "1px solid transparent" : "1px solid #f8fafc",
                  background: dark
                    ? "linear-gradient(135deg,rgba(245,158,11,0.20),rgba(217,119,6,0.14))"
                    : "linear-gradient(135deg,#fffbeb,#fef3c7)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 14,
                      background: "#f59e0b",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Trophy size={22} color="white" />
                  </div>
                  <div>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 800,
                        color: dark ? "#fef3c7" : "#0f172a",
                        letterSpacing: "-0.03em",
                      }}
                    >
                      Final Assessment
                    </h2>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: dark ? "#fde68a" : "#78716c",
                        marginTop: 4,
                      }}
                    >
                      Complete this to finish the course
                    </p>
                  </div>
                </div>
              </div>
              <div style={{ padding: "24px 32px" }}>
                {phase === "done" && courseComplete ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "40px 24px",
                      animation: "fadeIn 0.3s ease",
                    }}
                  >
                    <Trophy
                      size={56}
                      color="#f59e0b"
                      style={{ margin: "0 auto 16px" }}
                    />
                    <h3
                      style={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: dark ? "#f8fafc" : "#0f172a",
                        marginBottom: 8,
                        letterSpacing: "-0.03em",
                      }}
                    >
                      Course Complete!
                    </h3>
                    <p
                      style={{
                        color: dark ? "#cbd5e1" : "#64748b",
                        fontSize: 14,
                        marginBottom: 28,
                      }}
                    >
                      Congratulations! You've completed all modules and
                      assessments.
                    </p>
                    <button
                      onClick={onCertificate}
                      style={{
                        padding: "14px 36px",
                        background: "linear-gradient(135deg,#f59e0b,#d97706)",
                        color: "white",
                        border: "none",
                        borderRadius: 14,
                        fontSize: 15,
                        fontWeight: 800,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: "0 6px 20px rgba(245,158,11,0.35)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <Medal size={18} /> Download Your Certificate
                    </button>
                  </div>
                ) : finalQuiz ? (
                  <QuizView
                    quiz={finalQuiz}
                    onComplete={handleFinalQuizComplete}
                    userId={userId}
                    courseId={course.id}
                    savedResult={savedResults[finalQuiz.id] || null}
                    TENANT_ID={TENANT_ID}
                    dark={dark}
                    onResultSaved={(row) =>
                      handleResultSaved(finalQuiz.id, row)
                    }
                  />
                ) : (
                  <div style={{ textAlign: "center", padding: "40px" }}>
                    <p style={{ color: "#64748b", fontSize: 14 }}>
                      No final quiz for this course.
                    </p>
                    <button
                      onClick={() => {
                        setPhase("done");
                        onCertificate();
                      }}
                      style={{
                        marginTop: 16,
                        padding: "12px 28px",
                        background: "#f59e0b",
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Medal size={14} /> Get Certificate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : activeMod ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Module header */}
              <div
                style={{
                  background: "white",
                  borderRadius: 20,
                  border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
                  overflow: "hidden",
                  boxShadow: dark
                    ? "0 14px 30px rgba(0,0,0,0.35)"
                    : "0 1px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  style={{
                    height: 4,
                    background: `linear-gradient(90deg,${catHex},${catHex}88)`,
                  }}
                />
                <div style={{ padding: "24px 28px" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 16,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            padding: "3px 10px",
                            background: `${catHex}15`,
                            color: catHex,
                            borderRadius: 99,
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Module {activeModIdx + 1}
                        </span>
                        {completedMods[activeModIdx] && (
                          <span
                            style={{
                              padding: "3px 10px",
                              background: "#f0fdf4",
                              color: "#16a34a",
                              borderRadius: 99,
                              fontSize: 10,
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <Check size={10} /> Complete
                          </span>
                        )}
                      </div>
                      <h2
                        style={{
                          margin: 0,
                          fontSize: 22,
                          fontWeight: 800,
                          color: dark ? "#e5e7eb" : "#0f172a",
                          letterSpacing: "-0.03em",
                        }}
                      >
                        {activeMod.title || `Module ${activeModIdx + 1}`}
                      </h2>
                      {activeMod.description && (
                        <p
                          style={{
                            margin: "8px 0 0",
                            fontSize: 14,
                            color: dark ? "#9fb0c8" : "#64748b",
                            lineHeight: 1.6,
                          }}
                        >
                          {activeMod.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tab selector */}
              <div
                style={{
                  display: "flex",
                  gap: 3,
                  background: dark ? "#171f2c" : "white",
                  borderRadius: 12,
                  padding: 4,
                  border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
                  alignSelf: "flex-start",
                }}
              >
                {["content", "quiz"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPhase(p)}
                    style={{
                      padding: "7px 18px",
                      borderRadius: 8,
                      border: "none",
                      background: phase === p ? NAVY : "transparent",
                      color: phase === p ? "white" : dark ? "#9fb0c8" : "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.15s",
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {p === "content" ? (
                      <>
                        <BookOpen size={12} /> Learning Material
                      </>
                    ) : (
                      <>
                        <ClipboardList size={12} /> Module Quiz
                      </>
                    )}
                  </button>
                ))}
              </div>

              {/* Content phase */}
              {phase === "content" && (
                <div
                  style={{
                    background: "white",
                    borderRadius: 20,
                    border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
                    boxShadow: dark
                      ? "0 14px 30px rgba(0,0,0,0.35)"
                      : "0 1px 8px rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ padding: "24px 28px 0" }}>
                    <p
                      style={{
                        margin: "0 0 16px",
                        fontSize: 11,
                        fontWeight: 800,
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {attachedMats.length} Resource
                      {attachedMats.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  {attachedMats.length === 0 ? (
                    <div style={{ padding: "48px 28px", textAlign: "center" }}>
                      <File
                        size={32}
                        color="#94a3b8"
                        style={{ margin: "0 auto 12px" }}
                      />
                      <p style={{ fontSize: 14, color: "#94a3b8" }}>
                        No materials attached to this module.
                      </p>
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: "0 28px 28px",
                        display: "flex",
                        flexDirection: "column",
                        gap: 10,
                      }}
                    >
                      {attachedMats.map((mat) => {
                        const { label, Icon } = getFileMeta(mat.file_type);
                        const viewed = viewedMats[mat.id];
                        return (
                          <div
                            key={mat.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 14,
                              padding: "16px 18px",
                              borderRadius: 14,
                              background: dark ? "#1a2230" : "#f8fafc",
                              border: dark
                                ? "1.5px solid transparent"
                                : "1.5px solid #f1f5f9",
                              cursor: "pointer",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = dark
                                ? "transparent"
                                : catHex + "44";
                              e.currentTarget.style.background = dark
                                ? "#1f2a3b"
                                : "#fafbff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = dark
                                ? "transparent"
                                : "#f1f5f9";
                              e.currentTarget.style.background = dark
                                ? "#1a2230"
                                : "#f8fafc";
                            }}
                            onClick={() => {
                              setPreviewMat(mat);
                              setViewedMats((v) => ({ ...v, [mat.id]: true }));
                            }}
                          >
                            <div
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: 12,
                                background: `${catHex}15`,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                              }}
                            >
                              <Icon size={20} color={catHex} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  color: dark ? "#e5e7eb" : "#0f172a",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {mat.title}
                              </p>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  color: "#94a3b8",
                                  marginTop: 2,
                                }}
                              >
                                {label}
                                {mat.file_size
                                  ? ` · ${formatSize(mat.file_size)}`
                                  : ""}
                              </p>
                            </div>
                            {viewed && (
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 700,
                                  color: "#16a34a",
                                  flexShrink: 0,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 3,
                                }}
                              >
                                <Check size={10} /> Viewed
                              </span>
                            )}
                            <Eye
                              size={14}
                              color={dark ? "#9fb0c8" : "#94a3b8"}
                              style={{ flexShrink: 0 }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div
                    style={{
                      padding: "0 28px 24px",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      onClick={() => setPhase("quiz")}
                      style={{
                        padding: "10px 24px",
                        background: NAVY,
                        color: "white",
                        border: "none",
                        borderRadius: 10,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        boxShadow: `0 4px 12px ${NAVY}40`,
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = NAVY_HOVER)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = NAVY)
                      }
                    >
                      Take Module Quiz <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Quiz phase */}
              {phase === "quiz" &&
                (() => {
                  const mq = getModQuiz(activeModIdx);
                  const savedResult = mq ? savedResults[mq.id] || null : null;
                  return (
                    <div
                      style={{
                        background: "white",
                        borderRadius: 20,
                        border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
                        padding: "24px 28px",
                        boxShadow: dark
                          ? "0 14px 30px rgba(0,0,0,0.35)"
                          : "0 1px 8px rgba(0,0,0,0.05)",
                      }}
                    >
                      <div style={{ marginBottom: 4 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            fontWeight: 800,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          Module Quiz
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: 15,
                            fontWeight: 800,
                            color: "#0f172a",
                          }}
                        >
                          {activeMod.title}
                        </p>
                      </div>
                      <QuizView
                        quiz={mq}
                        onComplete={(passed) =>
                          handleModQuizComplete(passed, activeModIdx)
                        }
                        userId={userId}
                        courseId={course.id}
                        savedResult={savedResult}
                        TENANT_ID={TENANT_ID}
                        dark={dark}
                        onResultSaved={(row) =>
                          mq && handleResultSaved(mq.id, row)
                        }
                      />
                    </div>
                  );
                })()}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSE CARD
// ─────────────────────────────────────────────────────────────────────────────
function CourseCard({ course, onClick, index, dark = false }) {
  const catHex = CATEGORY_HEX[course.category] || "#94a3b8";
  const diff = DIFF[course.difficulty] || DIFF.Beginner;
  const CatIcon = CATEGORY_ICONS[course.category] || GraduationCap;
  const modCount = (course.modules || []).length;
  const matCount = (course.modules || []).reduce(
    (s, m) => s + (m.material_ids?.length || 0),
    0,
  );

  return (
    <div
      onClick={onClick}
      style={{
        background: dark ? "#171a21" : "white",
        borderRadius: 20,
        border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
        boxShadow: dark ? "0 1px 8px rgba(0,0,0,0.35)" : "0 1px 6px rgba(0,0,0,0.04)",
        animation: `fadeInUp 0.4s ease both`,
        animationDelay: `${index * 60}ms`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 8px 28px rgba(0,0,0,0.1),0 0 0 2px ${catHex}30`;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 6px rgba(0,0,0,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg,${catHex},${catHex}66)`,
        }}
      />
      <div style={{ padding: "20px 22px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `${catHex}15`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <CatIcon size={22} color={catHex} />
          </div>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 99,
              fontSize: 10,
              fontWeight: 700,
              background: diff.bg,
              color: diff.color,
              border: `1px solid ${diff.border}`,
              flexShrink: 0,
            }}
          >
            {course.difficulty}
          </div>
        </div>
        <p
          style={{
            margin: "0 0 6px",
            fontSize: 10,
            fontWeight: 800,
            color: catHex,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
          }}
        >
          {course.category}
        </p>
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 16,
            fontWeight: 800,
            color: dark ? "#e5e7eb" : "#0f172a",
            letterSpacing: "-0.025em",
            lineHeight: 1.35,
          }}
        >
          {course.title}
        </h3>
        {course.description && (
          <p
            style={{
              margin: "0 0 16px",
              fontSize: 12,
              color: dark ? "#94a3b8" : "#64748b",
              lineHeight: 1.6,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {course.description}
          </p>
        )}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 18,
            paddingTop: 12,
            borderTop: dark ? "1px solid #2a2f3a" : "1px solid #f8fafc",
          }}
        >
          {[
            {
              Icon: Package,
              val: `${modCount} module${modCount !== 1 ? "s" : ""}`,
            },
            {
              Icon: FileText,
              val: `${matCount} file${matCount !== 1 ? "s" : ""}`,
            },
            { Icon: Calendar, val: dayjs(course.created_at).format("MMM D") },
          ].map(({ Icon, val }) => (
            <span
              key={val}
              style={{
                fontSize: 11,
                color: dark ? "#94a3b8" : "#94a3b8",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Icon size={12} /> {val}
            </span>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "11px 0",
            borderRadius: 12,
            background: NAVY,
            color: "white",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: `0 4px 12px ${NAVY}40`,
          }}
        >
          <Play size={14} fill="white" /> Start Course
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COURSES LIST
// ─────────────────────────────────────────────────────────────────────────────
function CoursesListView({ onOpenCourse, dark = false }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState("All");
  const [activeDiff, setActiveDiff] = useState("All");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });
      setCourses(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = courses.filter(
    (c) =>
      (activeCat === "All" || c.category === activeCat) &&
      (activeDiff === "All" || c.difficulty === activeDiff) &&
      (!search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())),
  );

  const catCounts = CATEGORIES.reduce((acc, c) => {
    acc[c] = courses.filter((m) => m.category === c).length;
    return acc;
  }, {});

  return (
    <div
      className={`training-portal${dark ? " dark" : ""}`}
      style={{
        minHeight: "100vh",
        background: dark ? "#111318" : "#f8fafc",
        fontFamily: "'Plus Jakarta Sans','DM Sans',sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing:border-box; }
        @keyframes fadeIn    { from{opacity:0}          to{opacity:1} }
        @keyframes fadeInUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes scaleIn   { from{opacity:0;transform:scale(0.95)}      to{opacity:1;transform:scale(1)} }
        .skeleton-line { background:linear-gradient(90deg,#f1f5f9 25%,#e8edf2 50%,#f1f5f9 75%);background-size:400px 100%;animation:shimmer 1.3s infinite;border-radius:6px; }
        @keyframes shimmer { 0%{background-position:-400px 0} 100%{background-position:400px 0} }
        .training-portal.dark .skeleton-line { background:linear-gradient(90deg,#1f2430 25%,#2a2f3a 50%,#1f2430 75%); }
        .training-portal.dark [style*="background: white"],
        .training-portal.dark [style*="background:white"] { background: #171a21 !important; }
        .training-portal.dark [style*="background: #f8fafc"],
        .training-portal.dark [style*="background:#f8fafc"],
        .training-portal.dark [style*="background: #fafbfc"] { background: #111318 !important; }
        .training-portal.dark [style*="border: 1px solid #f1f5f9"],
        .training-portal.dark [style*="border:1px solid #f1f5f9"],
        .training-portal.dark [style*="borderBottom: \"1px solid #f1f5f9\""] { border-color: transparent !important; }
        .training-portal.dark [style*="color: #0f172a"],
        .training-portal.dark [style*="color:#0f172a"],
        .training-portal.dark .text-gray-900 { color: #e5e7eb !important; }
        .training-portal.dark [style*="color: #64748b"],
        .training-portal.dark [style*="color: #94a3b8"],
        .training-portal.dark .text-gray-600,
        .training-portal.dark .text-gray-500 { color: #94a3b8 !important; }
        .training-portal.dark input,
        .training-portal.dark select {
          background: #141821 !important;
          border-color: #2a2f3a !important;
          color: #e5e7eb !important;
        }
      `}</style>

      <div
        className="mb-10 pb-3"
        style={{
          background: dark ? "#171a21" : "#fff",
          borderBottom: `1px solid ${dark ? "#2a2f3a" : "#e5e7eb"}`,
        }}
      >
        <h1 className="text-xl font-bold" style={{ color: dark ? "#e5e7eb" : "#111827" }}>
          Training Module
        </h1>
        <p className="mt-0.5 text-xs" style={{ color: dark ? "#94a3b8" : "#4b5563" }}>
          Learn key concepts and complete lessons step by step
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "28px 48px" }}>
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            flexWrap: "wrap",
            background: dark ? "#171a21" : "white",
            borderRadius: 16,
            padding: "14px 18px",
            border: dark ? "1px solid transparent" : "1px solid #f1f5f9",
            marginBottom: 28,
            boxShadow: dark
              ? "0 10px 24px rgba(0,0,0,0.3)"
              : "0 1px 4px rgba(0,0,0,0.04)",
          }}
        >
          <div style={{ position: "relative", flexGrow: 1, minWidth: 200 }}>
            <Search
              size={14}
              color="#94a3b8"
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              style={{
                paddingLeft: 36,
                paddingRight: 12,
                paddingTop: 8,
                paddingBottom: 8,
                border: "1.5px solid #e2e8f0",
                borderRadius: 10,
                fontSize: 13,
                width: "100%",
                outline: "none",
                fontFamily: "inherit",
                color: "#1e293b",
                background: "#f8fafc",
              }}
              onFocus={(e) => (e.target.style.borderColor = NAVY)}
              onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
            />
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {["All", ...CATEGORIES.filter((c) => catCounts[c] > 0)].map(
              (cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCat(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 99,
                    border: "1.5px solid",
                    borderColor: activeCat === cat ? NAVY : "#e2e8f0",
                    background: activeCat === cat ? NAVY : "white",
                    color: activeCat === cat ? "white" : "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}
                >
                  {cat}
                </button>
              ),
            )}
          </div>
          <select
            value={activeDiff}
            onChange={(e) => setActiveDiff(e.target.value)}
            style={{
              padding: "7px 12px",
              border: "1.5px solid #e2e8f0",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              color: "#475569",
              background: "white",
              cursor: "pointer",
              fontFamily: "inherit",
              outline: "none",
            }}
          >
            <option value="All">All Levels</option>
            {["Beginner", "Intermediate", "Advanced"].map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {!loading && (
          <p
            style={{
              margin: "0 0 18px",
              fontSize: 12,
              color: "#94a3b8",
              fontWeight: 600,
            }}
          >
            {filtered.length} course{filtered.length !== 1 ? "s" : ""}
            {search ? ` for "${search}"` : ""}
          </p>
        )}

        {loading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 18,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: 20,
                  overflow: "hidden",
                  border: "1px solid #f1f5f9",
                  padding: "20px 22px",
                }}
              >
                <div
                  style={{ height: 4, background: "#f1f5f9", marginBottom: 20 }}
                />
                <div
                  className="skeleton-line"
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    marginBottom: 12,
                  }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "40%", height: 10, marginBottom: 10 }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "80%", height: 18, marginBottom: 8 }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "65%", height: 14, marginBottom: 20 }}
                />
                <div
                  className="skeleton-line"
                  style={{ width: "100%", height: 40, borderRadius: 12 }}
                />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div
            style={{ textAlign: "center", paddingTop: 80, paddingBottom: 80 }}
          >
            <GraduationCap
              size={48}
              color="#94a3b8"
              style={{ margin: "0 auto 12px" }}
            />
            <p
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#475569",
                marginBottom: 6,
              }}
            >
              {courses.length === 0 ? "No courses yet" : "No matches found"}
            </p>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>
              {courses.length === 0
                ? "Courses will appear here once created."
                : "Try adjusting your search or filters."}
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
              gap: 18,
            }}
          >
            {filtered.map((c, i) => (
              <CourseCard
                key={c.id}
                course={c}
                index={i}
                dark={dark}
                onClick={() => onOpenCourse(c)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function EmployeeTrainingPortal() {
  const [activeCourse, setActiveCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [allMaterials, setAllMaterials] = useState([]);
  const [showCert, setShowCert] = useState(false);
  const [userName, setUserName] = useState("Team Member");
  const [userId, setUserId] = useState(null);
  const [TENANT_NAME, setTenantName] = useState("");
  const [TENANT_ID, setTenantId] = useState("");
  const [dark, setDark] = useState(getIsDarkTheme);

  useEffect(() => {
    fetchCurrentTenant();
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        setUserName(
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Learner",
        );
        const { data: mats } = await supabase
          .from("training_materials")
          .select("*")
          .order("title");
        if (mats) setAllMaterials(mats);
      }
    })();
  }, []);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    if (typeof media.addEventListener === "function")
      media.addEventListener("change", syncTheme);
    else if (typeof media.addListener === "function")
      media.addListener(syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      if (typeof media.removeEventListener === "function")
        media.removeEventListener("change", syncTheme);
      else if (typeof media.removeListener === "function")
        media.removeListener(syncTheme);
    };
  }, []);

  const fetchCurrentTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id, company_name")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      const tid = data?.tenant_id;
      console.log(tid, data?.company_name);
      setTenantId(tid);
      setTenantName(data?.company_name);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const handleOpenCourse = async (course) => {
    const { data: qData } = await supabase
      .from("course_quizzes")
      .select("*")
      .eq("course_id", course.id);
    const cleanedQuizzes = (qData || []).map((q) => ({
      ...q,
      questions: (q.questions || []).filter((x) => !x._meta),
    }));

    const allMatIds = (course.modules || []).flatMap(
      (m) => m.material_ids || [],
    );
    const { data: matRows } = await supabase
      .from("training_materials")
      .select("*")
      .in("id", allMatIds);

    const matsWithUrls = await Promise.all(
      (matRows || []).map(async (mat) => {
        const { data: urlData } = supabase.storage
          .from("training-materials")
          .getPublicUrl(mat.file_path);
        return { ...mat, file_url: urlData?.publicUrl };
      }),
    );

    setAllMaterials(matsWithUrls);
    setQuizzes(cleanedQuizzes);
    setActiveCourse(course);
  };

  if (!activeCourse)
    return <CoursesListView onOpenCourse={handleOpenCourse} dark={dark} />;

  return (
    <>
      {showCert && (
        <CertificateModal
          userName={userName}
          courseName={activeCourse.title}
          TENANT_NAME={TENANT_NAME}
          onClose={() => setShowCert(false)}
        />
      )}
      <CourseDetailView
        course={activeCourse}
        quizzes={quizzes}
        allMaterials={allMaterials}
        onBack={() => setActiveCourse(null)}
        onCertificate={() => setShowCert(true)}
        TENANT_ID={TENANT_ID}
        userName={userName}
        userId={userId}
        dark={dark}
      />
    </>
  );
}
