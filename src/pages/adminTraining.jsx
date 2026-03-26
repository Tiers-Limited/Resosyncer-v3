import { useState, useEffect, useRef, useCallback } from "react";
import {
  Modal,
  Input,
  Select,
  Spin,
  Tooltip,
  message,
  Progress,
  Popconfirm,
  Upload as AntUpload,
} from "antd";
import {
  Upload,
  Trash2,
  Eye,
  Download,
  File,
  FileText,
  Image,
  FileType2,
  Video,
  Folder,
  Plus,
  Search,
  ExternalLink,
  Pencil,
  X,
  Inbox,
  Bot,
  Zap,
  Lightbulb,
  CheckCircle2,
  Book,
  Send,
  LayoutList,
  LayoutGrid,
  GraduationCap,
  ClipboardList,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Circle,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Layers,
  Trophy,
  Play,
  FileQuestion,
  Settings,
  MoreVertical,
  Clock,
  Users,
  ChevronDown,
  ChevronUp,
  Link2,
  Unlink,
  Star,
  BarChart2,
  Lock,
  Unlock,
  PenLine,
  Wand2,
  PlusCircle,
  MinusCircle,
  UploadCloud,
  ZoomIn,
  ZoomOut,
  Maximize2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import dayjs from "dayjs";

const { Option } = Select;
const { TextArea } = Input;

// ── Config ────────────────────────────────────────────────────────────────────
const STORAGE_BUCKET = "training-materials";
const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TENANT_NAME = import.meta.env.VITE_TENANT_NAME || "Acme Corp";

// ── Constants ─────────────────────────────────────────────────────────────────
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
const DIFFICULTY = ["Beginner", "Intermediate", "Advanced"];

const CATEGORY_META = {
  Onboarding: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    hex: "#10b981",
  },
  Technical: {
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    hex: "#3b82f6",
  },
  "HR & Compliance": {
    color: "text-violet-700",
    bg: "bg-violet-50",
    border: "border-violet-200",
    hex: "#8b5cf6",
  },
  Design: {
    color: "text-pink-700",
    bg: "bg-pink-50",
    border: "border-pink-200",
    hex: "#ec4899",
  },
  Management: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    hex: "#f59e0b",
  },
  Security: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    hex: "#ef4444",
  },
  Sales: {
    color: "text-cyan-700",
    bg: "bg-cyan-50",
    border: "border-cyan-200",
    hex: "#06b6d4",
  },
  Finance: {
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    hex: "#14b8a6",
  },
  General: {
    color: "text-slate-600",
    bg: "bg-slate-50",
    border: "border-slate-200",
    hex: "#94a3b8",
  },
};

const DIFF_META = {
  Beginner: {
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  Intermediate: {
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  Advanced: {
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
  },
};

const FILE_TYPES = {
  "application/pdf": {
    Icon: FileText,
    cc: "text-red-500",
    bc: "bg-red-50",
    label: "PDF",
  },
  "image/png": {
    Icon: Image,
    cc: "text-sky-500",
    bc: "bg-sky-50",
    label: "Image",
  },
  "image/jpeg": {
    Icon: Image,
    cc: "text-sky-500",
    bc: "bg-sky-50",
    label: "Image",
  },
  "image/gif": {
    Icon: Image,
    cc: "text-sky-500",
    bc: "bg-sky-50",
    label: "Image",
  },
  "image/webp": {
    Icon: Image,
    cc: "text-sky-500",
    bc: "bg-sky-50",
    label: "Image",
  },
  "video/mp4": {
    Icon: Video,
    cc: "text-purple-500",
    bc: "bg-purple-50",
    label: "Video",
  },
  "video/webm": {
    Icon: Video,
    cc: "text-purple-500",
    bc: "bg-purple-50",
    label: "Video",
  },
  "application/msword": {
    Icon: FileType2,
    cc: "text-blue-500",
    bc: "bg-blue-50",
    label: "DOC",
  },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    Icon: FileType2,
    cc: "text-blue-500",
    bc: "bg-blue-50",
    label: "DOCX",
  },
  "application/vnd.ms-excel": {
    Icon: FileText,
    cc: "text-emerald-500",
    bc: "bg-emerald-50",
    label: "XLS",
  },
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": {
    Icon: FileText,
    cc: "text-emerald-500",
    bc: "bg-emerald-50",
    label: "XLSX",
  },
  "application/vnd.ms-powerpoint": {
    Icon: FileText,
    cc: "text-amber-500",
    bc: "bg-amber-50",
    label: "PPT",
  },
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": {
    Icon: FileText,
    cc: "text-amber-500",
    bc: "bg-amber-50",
    label: "PPTX",
  },
  "application/zip": {
    Icon: File,
    cc: "text-slate-500",
    bc: "bg-slate-50",
    label: "ZIP",
  },
};
const getFT = (mime) =>
  FILE_TYPES[mime] || {
    Icon: File,
    cc: "text-slate-500",
    bc: "bg-slate-50",
    label: "File",
  };
const formatSize = (b) =>
  !b
    ? "—"
    : b < 1024
      ? `${b} B`
      : b < 1048576
        ? `${(b / 1024).toFixed(1)} KB`
        : `${(b / 1048576).toFixed(1)} MB`;

const isImage = (mime) => mime?.startsWith("image/");
const isVideo = (mime) => mime?.startsWith("video/");
const isPDF = (mime) => mime === "application/pdf";
const isPreviewable = (mime) => isImage(mime) || isVideo(mime) || isPDF(mime);

// ── Document Viewer Modal ─────────────────────────────────────────────────────
function DocumentViewerModal({ material, onClose }) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgZoom, setImgZoom] = useState(1);

  useEffect(() => {
    if (!material) return;
    setLoading(true);
    setError(null);
    setUrl(null);
    setImgZoom(1);

    (async () => {
      try {
        // Try signed URL first (60 min expiry)
        const { data, error: signedErr } = await supabase.storage
          .from(STORAGE_BUCKET)
          .createSignedUrl(material.file_path, 3600);

        if (signedErr || !data?.signedUrl) {
          // Fallback: public URL
          const { data: pubData } = supabase.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(material.file_path);
          if (!pubData?.publicUrl) throw new Error("Could not generate URL");
          setUrl(pubData.publicUrl);
        } else {
          setUrl(data.signedUrl);
        }
      } catch (e) {
        setError(e.message || "Failed to load document");
      }
      setLoading(false);
    })();
  }, [material]);

  const handleDownload = async () => {
    if (!url) return;
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = material.title || "document";
      a.target = "_blank";
      a.click();
    } catch {
      window.open(url, "_blank");
    }
  };

  const ft = getFT(material?.file_type);
  const mime = material?.file_type || "";

  return (
    <Modal
      open={!!material}
      onCancel={onClose}
      footer={null}
      width={isImage(mime) ? 760 : isPDF(mime) ? 900 : 600}
      destroyOnClose
      styles={{ body: { padding: 0 } }}
      style={{ top: 24 }}
      title={null}
      closable={false}
    >
      {/* Custom header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white rounded-t-2xl">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl ${ft.bc} flex items-center justify-center shrink-0`}
          >
            <ft.Icon size={16} className={ft.cc} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[14px] text-slate-900 truncate leading-snug">
              {material?.title}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {ft.label} · {formatSize(material?.file_size)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-4">
          {isImage(mime) && url && (
            <>
              <button
                onClick={() => setImgZoom((z) => Math.max(0.5, z - 0.25))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
                title="Zoom out"
              >
                <ZoomOut size={14} />
              </button>
              <span className="text-[12px] font-semibold text-slate-500 w-10 text-center">
                {Math.round(imgZoom * 100)}%
              </span>
              <button
                onClick={() => setImgZoom((z) => Math.min(3, z + 0.25))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
                title="Zoom in"
              >
                <ZoomIn size={14} />
              </button>
            </>
          )}
          {url && (
            <button
              onClick={() => window.open(url, "_blank")}
              className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-all"
              title="Open in new tab"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={!url}
            className="flex items-center gap-1.5 px-3 h-8 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[12px] font-bold rounded-lg transition-all"
          >
            <Download size={12} /> Download
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg border border-slate-200 bg-slate-50 hover:bg-red-50 hover:border-red-200 hover:text-red-500 flex items-center justify-center text-slate-400 transition-all"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Viewer body */}
      <div
        className="bg-slate-50 rounded-b-2xl overflow-hidden"
        style={{ minHeight: 400 }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Spin size="large" />
            <p className="text-[13px] text-slate-400 font-medium">
              Loading document…
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center">
              <AlertCircle size={20} className="text-red-500" />
            </div>
            <p className="font-semibold text-slate-700">
              Could not load preview
            </p>
            <p className="text-[12px] text-slate-400 max-w-xs text-center">
              {error}
            </p>
            {url && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 h-9 bg-slate-900 text-white text-[13px] font-bold rounded-xl mt-1"
              >
                <Download size={13} /> Download Instead
              </button>
            )}
          </div>
        )}

        {!loading && !error && url && (
          <>
            {/* PDF */}
            {isPDF(mime) && (
              <iframe
                src={url}
                title={material?.title}
                className="w-full border-0"
                style={{ height: "75vh" }}
                onError={() => setError("PDF preview failed. Try downloading.")}
              />
            )}

            {/* Image */}
            {isImage(mime) && (
              <div
                className="overflow-auto flex items-start justify-center p-6"
                style={{ maxHeight: "75vh" }}
              >
                <img
                  src={url}
                  alt={material?.title}
                  style={{
                    transform: `scale(${imgZoom})`,
                    transformOrigin: "top center",
                    transition: "transform 0.2s ease",
                    maxWidth: "100%",
                    display: "block",
                    borderRadius: 8,
                    boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                  }}
                  onError={() => setError("Image failed to load.")}
                />
              </div>
            )}

            {/* Video */}
            {isVideo(mime) && (
              <div
                className="flex items-center justify-center p-6"
                style={{ maxHeight: "75vh" }}
              >
                <video
                  src={url}
                  controls
                  className="max-w-full rounded-xl shadow-lg"
                  style={{ maxHeight: "65vh" }}
                  onError={() =>
                    setError("Video playback failed. Try downloading.")
                  }
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            )}

            {/* Non-previewable fallback (shouldn't normally reach here) */}
            {!isPDF(mime) && !isImage(mime) && !isVideo(mime) && (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div
                  className={`w-16 h-16 rounded-2xl ${ft.bc} flex items-center justify-center`}
                >
                  <ft.Icon size={28} className={ft.cc} />
                </div>
                <p className="font-semibold text-slate-700">
                  Preview not available
                </p>
                <p className="text-[12px] text-slate-400">
                  This file type cannot be previewed in browser.
                </p>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 h-9 bg-slate-900 text-white text-[13px] font-bold rounded-xl mt-1"
                >
                  <Download size={13} /> Download to View
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}

// ── Skeleton Components ───────────────────────────────────────────────────────
function SkeletonPulse({ className = "" }) {
  return (
    <div className={`animate-pulse bg-slate-200 rounded-lg ${className}`} />
  );
}

function CourseCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <div className="h-1.5 w-full bg-slate-200 animate-pulse" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex-1 space-y-2">
            <SkeletonPulse className="h-4 w-3/4" />
            <SkeletonPulse className="h-3 w-full" />
            <SkeletonPulse className="h-3 w-2/3" />
          </div>
        </div>
        <div className="flex gap-1.5 mb-4">
          <SkeletonPulse className="h-5 w-20 rounded-full" />
          <SkeletonPulse className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-3 w-16" />
          <SkeletonPulse className="h-3 w-12" />
        </div>
        <SkeletonPulse className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

function CoursesListSkeleton() {
  return (
    <div className="px-6 py-6">
      <div className="flex gap-3 mb-6 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="flex items-baseline gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl"
          >
            <SkeletonPulse className="h-6 w-8" />
            <SkeletonPulse className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
        {[...Array(6)].map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function CourseDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-60px)]">
      <aside className="w-64 bg-white border-r border-slate-100 flex flex-col py-5 shrink-0">
        <SkeletonPulse className="h-3 w-24 mx-5 mb-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-3">
            <SkeletonPulse className="w-7 h-7 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonPulse className="h-3 w-24" />
              <SkeletonPulse className="h-2.5 w-16" />
            </div>
          </div>
        ))}
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="space-y-2">
              <SkeletonPulse className="h-6 w-48" />
              <SkeletonPulse className="h-3.5 w-72" />
            </div>
            <SkeletonPulse className="h-9 w-28 rounded-xl" />
          </div>
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm mb-4"
            >
              <div className="flex items-center gap-3 px-5 py-4">
                <SkeletonPulse className="w-8 h-8 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <SkeletonPulse className="h-3.5 w-48" />
                  <SkeletonPulse className="h-2.5 w-28" />
                </div>
                <div className="flex items-center gap-2">
                  <SkeletonPulse className="h-7 w-20 rounded-lg" />
                  <SkeletonPulse className="w-7 h-7 rounded-lg" />
                  <SkeletonPulse className="w-7 h-7 rounded-lg" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripMarkdown(t) {
  return (t || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_{1,2}(.+?)_{1,2}/g, "$1")
    .replace(/#{1,6}\s+/g, "")
    .replace(/`(.+?)`/g, "$1");
}

async function callGroq(system, user, maxTokens = 1024) {
  if (!GROQ_API_KEY) throw new Error("VITE_GROK_API_KEY not set");
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e?.error?.message || "Groq error");
  }
  return ((await res.json()).choices?.[0]?.message?.content || "").trim();
}

function emptyQuestion() {
  return {
    question: "",
    options: ["", "", "", ""],
    correct_index: 0,
    explanation: "",
  };
}

// ── Quiz Editor ───────────────────────────────────────────────────────────────
function QuizEditor({
  quiz,
  onChange,
  onRegenerate,
  generating,
  title,
  tenantId,
  courseId,
  quizType,
  modIndex,
}) {
  const hasQuestions = !!quiz?.questions?.length;
  const [forceChoose, setForceChoose] = useState(false);
  const mode =
    hasQuestions && !forceChoose ? "edit" : !hasQuestions ? "choose" : "choose";

  const startManual = () => {
    setForceChoose(false);
    onChange(() => ({ questions: [emptyQuestion()] }));
  };

  const handleRegenerate = () => {
    setForceChoose(false);
    onRegenerate();
  };

  const addQuestion = () => {
    onChange((qz) => ({
      ...qz,
      questions: [...(qz?.questions || []), emptyQuestion()],
    }));
  };

  const removeQuestion = (qi) => {
    onChange((qz) => ({
      ...qz,
      questions: qz.questions.filter((_, j) => j !== qi),
    }));
  };

  if (!hasQuestions) {
    return (
      <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center">
        <FileQuestion size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="font-semibold text-slate-700 text-lg mb-1">No quiz yet</p>
        <p className="text-sm text-slate-400 mb-6">
          Choose how you'd like to create this quiz
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
          <button
            onClick={handleRegenerate}
            disabled={generating}
            className="flex-1 flex flex-col items-center gap-2 px-4 py-4 bg-gradient-to-br from-indigo-500 to-violet-600 hover:opacity-90 disabled:opacity-40 text-white rounded-xl transition-all shadow-md shadow-indigo-200"
          >
            {generating ? <Spin size="small" /> : <Wand2 size={20} />}
            <span className="text-[13px] font-bold">
              {generating ? "Generating…" : "AI Generate"}
            </span>
            <span className="text-[10px] opacity-80">
              Auto-create 5 questions
            </span>
          </button>
          <button
            onClick={startManual}
            className="flex-1 flex flex-col items-center gap-2 px-4 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition-all"
          >
            <PenLine size={20} />
            <span className="text-[13px] font-bold">Manual</span>
            <span className="text-[10px] text-slate-400">
              Write your own questions
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between mb-1">
        <div>
          <p className="text-sm font-bold text-slate-800">{title}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {quiz.questions?.length || 0} questions — click circles to set
            correct answer
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3 h-8 border border-emerald-200 bg-emerald-50 text-emerald-600 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-all"
          >
            <Plus size={12} /> Add Question
          </button>
          <button
            onClick={() => {
              onRegenerate();
            }}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 h-8 border border-indigo-200 bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-40"
          >
            {generating ? (
              <Spin size="small" />
            ) : (
              <>
                <Wand2 size={12} /> AI Regenerate
              </>
            )}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
        {(quiz.questions || []).map((q, qi) => (
          <div
            key={qi}
            className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
          >
            <div className="flex items-start gap-2 mb-3">
              <span className="w-6 h-6 rounded-lg bg-slate-900 text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                Q{qi + 1}
              </span>
              <input
                value={q.question}
                onChange={(e) =>
                  onChange((qz) => ({
                    ...qz,
                    questions: qz.questions.map((x, j) =>
                      j === qi ? { ...x, question: e.target.value } : x,
                    ),
                  }))
                }
                placeholder="Enter your question here…"
                className="flex-1 border border-slate-200 rounded-lg px-3 py-1.5 text-[13px] font-semibold text-slate-800 outline-none focus:border-indigo-400 transition-all"
              />
              <button
                onClick={() => removeQuestion(qi)}
                className="w-6 h-6 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all mt-0.5 shrink-0"
              >
                <X size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              {(q.options || []).map((opt, oi) => (
                <div
                  key={oi}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-[12px] font-medium transition-all ${q.correct_index === oi ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                >
                  <button
                    onClick={() =>
                      onChange((qz) => ({
                        ...qz,
                        questions: qz.questions.map((x, j) =>
                          j === qi ? { ...x, correct_index: oi } : x,
                        ),
                      }))
                    }
                    className="shrink-0"
                    title="Set as correct answer"
                  >
                    {q.correct_index === oi ? (
                      <CheckCircle size={14} className="text-emerald-500" />
                    ) : (
                      <Circle size={14} className="text-slate-300" />
                    )}
                  </button>
                  <input
                    value={opt}
                    onChange={(e) =>
                      onChange((qz) => ({
                        ...qz,
                        questions: qz.questions.map((x, j) =>
                          j === qi
                            ? {
                                ...x,
                                options: x.options.map((o, oi2) =>
                                  oi2 === oi ? e.target.value : o,
                                ),
                              }
                            : x,
                        ),
                      }))
                    }
                    placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                    className="flex-1 bg-transparent outline-none min-w-0 text-[12px]"
                  />
                </div>
              ))}
            </div>
            <input
              value={q.explanation || ""}
              onChange={(e) =>
                onChange((qz) => ({
                  ...qz,
                  questions: qz.questions.map((x, j) =>
                    j === qi ? { ...x, explanation: e.target.value } : x,
                  ),
                }))
              }
              placeholder="Explanation (optional) — shown after answering"
              className="w-full border border-dashed border-slate-200 rounded-lg px-3 py-1.5 text-[11px] text-slate-400 outline-none focus:border-indigo-300 transition-all mt-1"
            />
          </div>
        ))}
        <button
          onClick={addQuestion}
          className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 rounded-xl py-3 text-[13px] font-semibold text-slate-400 hover:text-indigo-500 transition-all"
        >
          <PlusCircle size={15} /> Add Question
        </button>
      </div>
    </div>
  );
}

// ── Module File Upload Helper ─────────────────────────────────────────────────
function ModuleFileUploader({ tenantId, onUploaded }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!file) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${tenantId}/${Date.now()}_${safeName}`;

      const arrayBuffer = await file.arrayBuffer();

      const { data: storageData, error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, arrayBuffer, {
          contentType: file.type || "application/octet-stream",
          upsert: false,
        });

      if (upErr) throw upErr;

      const { data: inserted, error: dbErr } = await supabase
        .from("training_materials")
        .insert({
          tenant_id: tenantId,
          title: file.name.replace(/\.[^/.]+$/, ""),
          file_path: path,
          file_type: file.type || "application/octet-stream",
          file_size: file.size,
          category: "General",
        })
        .select()
        .single();

      if (dbErr) throw dbErr;

      message.success(`"${inserted.title}" uploaded!`);
      onSuccess(inserted);
      onUploaded(inserted);
    } catch (e) {
      console.error("Upload error:", e);
      message.error("Upload failed: " + (e.message || "Unknown error"));
      onError(e);
    }
    setUploading(false);
  };

  return (
    <AntUpload
      customRequest={handleUpload}
      showUploadList={false}
      multiple={false}
      accept="application/pdf,image/*,video/*,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
    >
      <button
        disabled={uploading}
        className="flex items-center gap-1.5 text-[11px] font-semibold text-violet-600 bg-violet-50 border border-violet-200 rounded-lg px-2.5 h-7 hover:bg-violet-100 transition-all disabled:opacity-40"
        type="button"
      >
        {uploading ? (
          <Spin size="small" />
        ) : (
          <>
            <UploadCloud size={11} /> Upload File
          </>
        )}
      </button>
    </AntUpload>
  );
}

// ── Material Row with View button ─────────────────────────────────────────────
function MaterialRow({ mat, onDetach, onView, showDetach = true }) {
  const ft = getFT(mat.file_type);
  const { Icon } = ft;
  const canPreview = isPreviewable(mat.file_type);

  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl group">
      <div
        className={`w-8 h-8 rounded-lg ${ft.bc} flex items-center justify-center shrink-0`}
      >
        <Icon size={14} className={ft.cc} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-slate-800 truncate">
          {mat.title}
        </p>
        <p className="text-[10px] text-slate-400">
          {ft.label} · {formatSize(mat.file_size)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {/* View button */}
        <Tooltip title={canPreview ? "Preview document" : "Download to view"}>
          <button
            onClick={() => onView(mat)}
            className="flex items-center gap-1 px-2 h-6 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
          >
            <Eye size={10} />
            View
          </button>
        </Tooltip>
        {showDetach && (
          <button
            onClick={() => onDetach(mat.id)}
            className="w-6 h-6 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg flex items-center justify-center transition-all"
            title="Detach"
          >
            <Unlink size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COURSE DETAIL VIEW (wizard)
// ════════════════════════════════════════════════════════════════════════════
function CourseDetailView({
  course,
  tenantId,
  allMaterials: initMaterials,
  onBack,
  onUpdate,
}) {
  const [modules, setModules] = useState([]);
  const [moduleQuizzes, setModuleQuizzes] = useState({});
  const [finalQuiz, setFinalQuiz] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [genState, setGenState] = useState({});
  const [expandedMod, setExpandedMod] = useState(0);
  const [matPickerOpen, setMatPickerOpen] = useState(null);
  const [allMaterials, setAllMaterials] = useState(initMaterials || []);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [viewingMaterial, setViewingMaterial] = useState(null); // ← NEW

  useEffect(() => {
    (async () => {
      setLoadingCourse(true);
      try {
        const { data: freshCourse } = await supabase
          .from("courses")
          .select("*")
          .eq("id", course.id)
          .single();

        if (freshCourse) {
          setModules(freshCourse.modules || []);
        } else {
          setModules(course.modules || []);
        }

        const { data: quizData } = await supabase
          .from("course_quizzes")
          .select("*")
          .eq("course_id", course.id);

        if (quizData) {
          const mq = {};
          quizData.forEach((q) => {
            const meta = q.questions?.[0]?._meta;
            if (meta?.type === "final") {
              setFinalQuiz({
                ...q,
                questions: q.questions.filter((x) => !x._meta),
              });
            } else if (meta?.type === "module" && meta.module_index != null) {
              mq[meta.module_index] = {
                ...q,
                questions: q.questions.filter((x) => !x._meta),
              };
            }
          });
          setModuleQuizzes(mq);
        }

        const { data: mats } = await supabase
          .from("training_materials")
          .select("*")
          .eq("tenant_id", tenantId)
          .order("title");
        if (mats) setAllMaterials(mats);
      } catch (e) {
        console.error("Failed to load course:", e);
        setModules(course.modules || []);
      }
      setLoadingCourse(false);
    })();
  }, [course.id, tenantId]);

  const handleModuleUpload = (modIdx, mat) => {
    setAllMaterials((prev) => {
      if (prev.find((m) => m.id === mat.id)) return prev;
      return [...prev, mat];
    });
    setModules((ms) =>
      ms.map((m, i) => {
        if (i !== modIdx) return m;
        const ids = m.material_ids || [];
        return ids.includes(mat.id)
          ? m
          : { ...m, material_ids: [...ids, mat.id] };
      }),
    );
  };

  const totalSteps = 1 + modules.length + 1;
  const stepLabels = [
    "Modules",
    ...modules.map((m, i) => `${m.title || `Module ${i + 1}`} Quiz`),
    "Final Quiz",
  ];

  const generateQuiz = async (type, modIndex) => {
    const key = type === "final" ? "final" : `mod_${modIndex}`;
    setGenState((s) => ({ ...s, [key]: true }));
    try {
      const context =
        type === "final"
          ? `Course: ${course.title}\nCategory: ${course.category}\nAll modules: ${modules.map((m, i) => `Module ${i + 1}: ${m.title}`).join(", ")}`
          : `Course: ${course.title}\nModule: ${modules[modIndex]?.title}\nMaterials: ${(modules[modIndex]?.material_ids || []).map((id) => allMaterials.find((m) => m.id === id)?.title || id).join(", ")}`;
      const raw = await callGroq(
        `You are a quiz creator. Return ONLY valid JSON, no markdown.
Shape: {"questions":[{"question":"string","options":["A","B","C","D"],"correct_index":0,"explanation":"string"}]}
Create 5 multiple-choice questions. correct_index is 0-based.`,
        context,
        1500,
      );
      const parsed = JSON.parse(
        raw
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim(),
      );
      if (type === "final")
        setFinalQuiz((prev) => ({
          ...(prev || {}),
          questions: parsed.questions,
        }));
      else
        setModuleQuizzes((q) => ({
          ...q,
          [modIndex]: { ...(q[modIndex] || {}), questions: parsed.questions },
        }));
    } catch (e) {
      message.error("Quiz generation failed: " + e.message);
    }
    setGenState((s) => ({ ...s, [key]: false }));
  };

  const upsertQuiz = async (existingId, title, questions) => {
    const payload = {
      course_id: course.id,
      tenant_id: tenantId,
      title,
      questions,
    };
    if (existingId) {
      const { error } = await supabase
        .from("course_quizzes")
        .update(payload)
        .eq("id", existingId);
      if (error) throw error;
      return existingId;
    }
    const { data: existing } = await supabase
      .from("course_quizzes")
      .select("id")
      .eq("course_id", course.id)
      .eq("title", title)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase
        .from("course_quizzes")
        .update(payload)
        .eq("id", existing.id);
      if (error) throw error;
      return existing.id;
    }
    const { data: inserted, error } = await supabase
      .from("course_quizzes")
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return inserted?.id;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error: courseErr } = await supabase
        .from("courses")
        .update({ modules })
        .eq("id", course.id)
        .eq("tenant_id", tenantId);
      if (courseErr) throw courseErr;

      const newMQ = { ...moduleQuizzes };
      for (const [idx, qz] of Object.entries(moduleQuizzes)) {
        if (!qz?.questions?.length) continue;
        const modTitle =
          modules[parseInt(idx)]?.title || `Module ${parseInt(idx) + 1}`;
        const title = `${modTitle} Quiz`;
        const questionsWithMeta = [
          { _meta: { type: "module", module_index: parseInt(idx) } },
          ...qz.questions,
        ];
        const savedId = await upsertQuiz(qz.id, title, questionsWithMeta);
        if (savedId && !qz.id) newMQ[idx] = { ...qz, id: savedId };
      }
      setModuleQuizzes(newMQ);

      if (finalQuiz?.questions?.length) {
        const title = `${course.title} — Final Quiz`;
        const questionsWithMeta = [
          { _meta: { type: "final" } },
          ...finalQuiz.questions,
        ];
        const savedId = await upsertQuiz(
          finalQuiz.id,
          title,
          questionsWithMeta,
        );
        if (savedId && !finalQuiz.id)
          setFinalQuiz((q) => ({ ...q, id: savedId }));
      }

      message.success("Course saved!");
      if (onUpdate) onUpdate({ ...course, modules });
    } catch (e) {
      console.error("Save error:", e);
      message.error("Save failed: " + (e.message || "Unknown error"));
    }
    setSaving(false);
  };

  const toggleMaterial = (modIdx, matId) => {
    setModules((ms) =>
      ms.map((m, i) => {
        if (i !== modIdx) return m;
        const ids = m.material_ids || [];
        return {
          ...m,
          material_ids: ids.includes(matId)
            ? ids.filter((x) => x !== matId)
            : [...ids, matId],
        };
      }),
    );
  };

  const catMeta = CATEGORY_META[course.category] || CATEGORY_META.General;

  if (loadingCourse)
    return (
      <div
        className="min-h-screen bg-[#f8fafc]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
          *{font-family:'DM Sans',sans-serif!important}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
          .animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
        `}</style>
        <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <SkeletonPulse className="h-4 w-24" />
            <span className="text-slate-200">|</span>
            <div className="flex items-center gap-2.5">
              <SkeletonPulse className="w-7 h-7 rounded-lg" />
              <SkeletonPulse className="h-4 w-40" />
              <SkeletonPulse className="h-5 w-16 rounded-full" />
            </div>
          </div>
          <SkeletonPulse className="h-9 w-32 rounded-xl" />
        </header>
        <CourseDetailSkeleton />
      </div>
    );

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        *{font-family:'DM Sans',sans-serif!important}
        .ant-select-selector{border-radius:10px!important;border-color:#e2e8f0!important}
        .ant-modal-content{border-radius:16px!important;padding:0!important;overflow:hidden!important}
        .ant-modal-header{padding:20px 24px 0!important;border-bottom:none!important}
        .ant-modal-body{padding:0!important}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
      `}</style>

      {/* Document viewer modal */}
      {viewingMaterial && (
        <DocumentViewerModal
          material={viewingMaterial}
          onClose={() => setViewingMaterial(null)}
        />
      )}

      {/* Top bar */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-[13px] font-semibold transition-colors"
          >
            <ArrowLeft size={16} /> All Courses
          </button>
          <span className="text-slate-200">|</span>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: catMeta.hex }}
            >
              <GraduationCap size={13} className="text-white" />
            </div>
            <p className="font-bold text-[15px] text-slate-900">
              {course.title}
            </p>
            {(() => {
              const d = DIFF_META[course.difficulty] || DIFF_META.Beginner;
              return (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${d.color} ${d.bg} ${d.border}`}
                >
                  {course.difficulty}
                </span>
              );
            })()}
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 h-9 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[13px] font-bold rounded-xl transition-all"
        >
          {saving ? (
            <>
              <Spin size="small" /> Saving…
            </>
          ) : (
            <>
              <CheckCircle2 size={14} /> Save Course
            </>
          )}
        </button>
      </header>

      <div className="flex h-[calc(100vh-60px)]">
        {/* Step rail */}
        <aside className="w-64 bg-white border-r border-slate-100 flex flex-col py-5 shrink-0 overflow-y-auto">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-5 mb-3">
            Course Steps
          </p>
          {stepLabels.map((label, i) => {
            const isModules = i === 0;
            const isFinal = i === totalSteps - 1;
            const isModQuiz = !isModules && !isFinal;
            const active = activeStep === i;
            const modIdx = isModQuiz ? i - 1 : null;
            const hasContent = isModules
              ? true
              : isModQuiz
                ? !!moduleQuizzes[modIdx]?.questions?.length
                : !!finalQuiz?.questions?.length;
            return (
              <button
                key={i}
                onClick={() => setActiveStep(i)}
                className={`w-full text-left px-5 py-3 flex items-center gap-3 transition-all border-l-2 ${active ? "border-l-slate-900 bg-slate-50" : "border-l-transparent hover:bg-slate-50/60"}`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all ${active ? "bg-slate-900 text-white" : hasContent && !isModules ? "bg-emerald-50 text-emerald-600 border border-emerald-200" : "bg-slate-100 text-slate-400"}`}
                >
                  {isModules ? (
                    <Layers size={13} />
                  ) : isFinal ? (
                    <Trophy size={13} />
                  ) : (
                    <FileQuestion size={13} />
                  )}
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-[12px] font-semibold truncate ${active ? "text-slate-900" : "text-slate-600"}`}
                  >
                    {label}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {isModules
                      ? `${modules.length} module${modules.length !== 1 ? "s" : ""}`
                      : hasContent
                        ? "Quiz ready ✓"
                        : "Not generated"}
                  </p>
                </div>
              </button>
            );
          })}
        </aside>

        {/* Main panel */}
        <main className="flex-1 overflow-y-auto p-8">
          {/* ── MODULES STEP ── */}
          {activeStep === 0 && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Course Modules
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Modules group your materials. Each module gets its own quiz.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setModules((ms) => [
                      ...ms,
                      { title: "", description: "", material_ids: [] },
                    ]);
                    setExpandedMod(modules.length);
                  }}
                  className="flex items-center gap-2 px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl"
                >
                  <Plus size={14} /> Add Module
                </button>
              </div>

              {modules.length === 0 ? (
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-14 text-center">
                  <Layers size={44} className="mx-auto text-slate-200 mb-3" />
                  <p className="font-semibold text-slate-500 text-lg">
                    No modules yet
                  </p>
                  <p className="text-sm text-slate-400 mt-1 mb-5">
                    Add modules to structure your course content
                  </p>
                  <button
                    onClick={() =>
                      setModules([
                        { title: "", description: "", material_ids: [] },
                      ])
                    }
                    className="flex items-center gap-2 px-5 h-10 bg-slate-900 text-white text-[13px] font-bold rounded-xl mx-auto"
                  >
                    <Plus size={14} /> Add First Module
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {modules.map((mod, mi) => {
                    const open = expandedMod === mi;
                    const attachedMats = (mod.material_ids || [])
                      .map((id) => allMaterials.find((m) => m.id === id))
                      .filter(Boolean);
                    return (
                      <div
                        key={mi}
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm"
                      >
                        <div className="flex items-center gap-3 px-5 py-4">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center text-[12px] font-bold shrink-0">
                            {mi + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <input
                              value={mod.title}
                              onChange={(e) =>
                                setModules((ms) =>
                                  ms.map((m, i) =>
                                    i === mi
                                      ? { ...m, title: e.target.value }
                                      : m,
                                  ),
                                )
                              }
                              placeholder={`Module ${mi + 1} title`}
                              className="w-full text-[14px] font-semibold text-slate-900 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 pb-0.5 transition-all"
                            />
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {attachedMats.length} material
                              {attachedMats.length !== 1 ? "s" : ""} attached
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => setActiveStep(mi + 1)}
                              className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 h-7 hover:bg-indigo-100 transition-all"
                            >
                              <FileQuestion size={11} />{" "}
                              {moduleQuizzes[mi] ? "Edit Quiz" : "Add Quiz"}
                            </button>
                            <Popconfirm
                              title="Remove this module?"
                              onConfirm={() =>
                                setModules((ms) =>
                                  ms.filter((_, i) => i !== mi),
                                )
                              }
                              okText="Remove"
                              okButtonProps={{ danger: true }}
                            >
                              <button className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-all">
                                <Trash2 size={12} />
                              </button>
                            </Popconfirm>
                            <button
                              onClick={() => setExpandedMod(open ? -1 : mi)}
                              className="w-7 h-7 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 flex items-center justify-center hover:bg-slate-100 transition-all"
                            >
                              {open ? (
                                <ChevronUp size={13} />
                              ) : (
                                <ChevronDown size={13} />
                              )}
                            </button>
                          </div>
                        </div>

                        {open && (
                          <div className="border-t border-slate-100 px-5 py-4">
                            <textarea
                              value={mod.description || ""}
                              onChange={(e) =>
                                setModules((ms) =>
                                  ms.map((m, i) =>
                                    i === mi
                                      ? { ...m, description: e.target.value }
                                      : m,
                                  ),
                                )
                              }
                              placeholder="Module description or learning objectives (optional)…"
                              rows={2}
                              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] text-slate-700 outline-none focus:border-indigo-400 transition-all resize-none mb-4"
                            />

                            <div className="flex items-center justify-between mb-3">
                              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                Attached Materials
                              </p>
                              <div className="flex items-center gap-2">
                                <ModuleFileUploader
                                  tenantId={tenantId}
                                  onUploaded={(mat) =>
                                    handleModuleUpload(mi, mat)
                                  }
                                />
                                <button
                                  onClick={() => setMatPickerOpen(mi)}
                                  className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg px-2.5 h-7 hover:bg-indigo-100 transition-all"
                                >
                                  <Link2 size={11} /> From Library
                                </button>
                              </div>
                            </div>

                            {attachedMats.length === 0 ? (
                              <div className="border border-dashed border-slate-200 rounded-xl p-5 text-center">
                                <div className="flex items-center justify-center gap-4 mb-2">
                                  <UploadCloud
                                    size={20}
                                    className="text-slate-300"
                                  />
                                  <Link2 size={20} className="text-slate-300" />
                                </div>
                                <p className="text-[13px] text-slate-400 mb-2">
                                  No materials attached yet
                                </p>
                                <div className="flex items-center justify-center gap-3">
                                  <ModuleFileUploader
                                    tenantId={tenantId}
                                    onUploaded={(mat) =>
                                      handleModuleUpload(mi, mat)
                                    }
                                  />
                                  <button
                                    onClick={() => setMatPickerOpen(mi)}
                                    className="text-[12px] font-semibold text-indigo-500 hover:text-indigo-700"
                                  >
                                    Browse library →
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2">
                                {attachedMats.map((mat) => (
                                  <MaterialRow
                                    key={mat.id}
                                    mat={mat}
                                    onDetach={(id) => toggleMaterial(mi, id)}
                                    onView={setViewingMaterial}
                                    showDetach
                                  />
                                ))}
                                <div className="flex items-center gap-2 pt-1">
                                  <ModuleFileUploader
                                    tenantId={tenantId}
                                    onUploaded={(mat) =>
                                      handleModuleUpload(mi, mat)
                                    }
                                  />
                                  <button
                                    onClick={() => setMatPickerOpen(mi)}
                                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-2.5 h-7 hover:bg-slate-100 transition-all"
                                  >
                                    <Plus size={11} /> More from Library
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {modules.length > 0 && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setActiveStep(1)}
                    className="flex items-center gap-2 px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl"
                  >
                    Next: Module Quizzes <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── MODULE QUIZ STEPS ── */}
          {activeStep >= 1 &&
            activeStep <= modules.length &&
            (() => {
              const modIdx = activeStep - 1;
              const mod = modules[modIdx];
              const qz = moduleQuizzes[modIdx];
              const key = `mod_${modIdx}`;
              const attachedMats = (mod?.material_ids || [])
                .map((id) => allMaterials.find((m) => m.id === id))
                .filter(Boolean);
              return (
                <div className="max-w-3xl mx-auto">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {modIdx + 1}
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        {mod?.title || `Module ${modIdx + 1}`} — Quiz
                      </h2>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Questions for this module — AI or manual
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Based on these materials
                    </p>
                    {attachedMats.length === 0 ? (
                      <p className="text-[13px] text-slate-400 italic">
                        No materials — quiz will be based on module title only.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {attachedMats.map((mat) => {
                          const ft = getFT(mat.file_type);
                          return (
                            <div
                              key={mat.id}
                              className="flex items-center gap-2"
                            >
                              <span
                                className={`flex items-center gap-1.5 text-[11px] font-semibold ${ft.cc} ${ft.bc} border border-slate-200 rounded-full px-2.5 py-1`}
                              >
                                <ft.Icon size={11} /> {mat.title}
                              </span>
                              <button
                                onClick={() => setViewingMaterial(mat)}
                                className="flex items-center gap-1 px-2 h-5 text-[10px] font-semibold text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full border border-transparent hover:border-indigo-200 transition-all"
                                title="Preview"
                              >
                                <Eye size={9} /> View
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                    <QuizEditor
                      quiz={qz || null}
                      onChange={(fn) =>
                        setModuleQuizzes((q) => ({
                          ...q,
                          [modIdx]: fn(q[modIdx] || null),
                        }))
                      }
                      onRegenerate={() => generateQuiz("module", modIdx)}
                      generating={!!genState[key]}
                      title={`${mod?.title || "Module"} Quiz`}
                      quizType="module"
                      modIndex={modIdx}
                    />
                  </div>

                  <div className="flex justify-between mt-6">
                    <button
                      onClick={() => setActiveStep(modIdx)}
                      className="flex items-center gap-2 px-4 h-10 border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50"
                    >
                      <ChevronLeft size={14} /> Back
                    </button>
                    <button
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="flex items-center gap-2 px-5 h-10 bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold rounded-xl"
                    >
                      {activeStep === modules.length ? (
                        <>
                          <Trophy size={14} /> Final Quiz
                        </>
                      ) : (
                        <>
                          Next Module Quiz <ChevronRight size={14} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })()}

          {/* ── FINAL QUIZ STEP ── */}
          {activeStep === totalSteps - 1 && (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shrink-0">
                  <Trophy size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Final Course Quiz
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Comprehensive quiz covering all modules — learners take this
                    to complete the course
                  </p>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 mb-5 shadow-sm">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Covers all {modules.length} module
                  {modules.length !== 1 ? "s" : ""}
                </p>
                <div className="flex flex-wrap gap-2">
                  {modules.map((m, i) => (
                    <span
                      key={i}
                      className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 bg-slate-100 border border-slate-200 rounded-full px-2.5 py-1"
                    >
                      <span className="w-4 h-4 rounded-md bg-slate-900 text-white text-[9px] flex items-center justify-center font-bold">
                        {i + 1}
                      </span>
                      {m.title || `Module ${i + 1}`}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                <QuizEditor
                  quiz={finalQuiz || null}
                  onChange={(fn) => setFinalQuiz((q) => fn(q))}
                  onRegenerate={() => generateQuiz("final")}
                  generating={!!genState["final"]}
                  title="Final Quiz"
                  quizType="final"
                />
              </div>

              <div className="flex justify-between mt-6">
                <button
                  onClick={() => setActiveStep(totalSteps - 2)}
                  className="flex items-center gap-2 px-4 h-10 border border-slate-200 bg-white text-slate-600 text-[13px] font-semibold rounded-xl hover:bg-slate-50"
                >
                  <ChevronLeft size={14} /> Back
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-5 h-10 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[13px] font-bold rounded-xl"
                >
                  {saving ? (
                    <>
                      <Spin size="small" /> Saving…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} /> Save Everything
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Material picker modal */}
      {matPickerOpen !== null && (
        <Modal
          open
          onCancel={() => setMatPickerOpen(null)}
          footer={
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setMatPickerOpen(null)}
                className="px-4 h-9 bg-slate-900 text-white text-[13px] font-bold rounded-xl"
              >
                Done
              </button>
            </div>
          }
          width={600}
          title={
            <div className="flex items-center gap-2">
              <Link2 size={15} className="text-indigo-500" />
              <span className="font-bold">
                Attach Materials — "
                {modules[matPickerOpen]?.title || `Module ${matPickerOpen + 1}`}
                "
              </span>
            </div>
          }
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-slate-400">
              Click any material to attach or detach it from this module.
            </p>
            <ModuleFileUploader
              tenantId={tenantId}
              onUploaded={(mat) => {
                handleModuleUpload(matPickerOpen, mat);
              }}
            />
          </div>
          <div className="max-h-[420px] overflow-y-auto flex flex-col gap-2">
            {allMaterials.length === 0 && (
              <p className="text-center text-slate-400 py-8">
                No materials in library. Upload some first.
              </p>
            )}
            {allMaterials.map((mat) => {
              const ft = getFT(mat.file_type);
              const { Icon } = ft;
              const selected = (
                modules[matPickerOpen]?.material_ids || []
              ).includes(mat.id);
              return (
                <div
                  key={mat.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${selected ? "border-indigo-300 bg-indigo-50" : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                >
                  {/* Clicking icon area toggles selection */}
                  <div
                    onClick={() => toggleMaterial(matPickerOpen, mat.id)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${ft.bc} flex items-center justify-center shrink-0`}
                    >
                      <Icon size={16} className={ft.cc} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-slate-800 truncate">
                        {mat.title}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {mat.category} · {ft.label} ·{" "}
                        {formatSize(mat.file_size)}
                      </p>
                    </div>
                  </div>
                  {/* View button (doesn't toggle selection) */}
                  <Tooltip
                    title={
                      isPreviewable(mat.file_type)
                        ? "Preview"
                        : "Download to view"
                    }
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingMaterial(mat);
                      }}
                      className="flex items-center gap-1 px-2 h-6 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-md hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 transition-all shrink-0"
                    >
                      <Eye size={10} /> View
                    </button>
                  </Tooltip>
                  {/* Selection indicator */}
                  <div
                    onClick={() => toggleMaterial(matPickerOpen, mat.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${selected ? "border-indigo-500 bg-indigo-500" : "border-slate-300"}`}
                  >
                    {selected && (
                      <CheckCircle2 size={12} className="text-white" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Modal>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// COURSES LIST VIEW
// ════════════════════════════════════════════════════════════════════════════
function CoursesListView({ tenantId, allMaterials, onOpenCourse }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: null,
    difficulty: "Beginner",
  });
  const [creating, setCreating] = useState(false);
  const [genOutline, setGenOutline] = useState(false);
  const [search, setSearch] = useState("");
  const [filterDiff, setFilterDiff] = useState(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    const { data } = await supabase
      .from("courses")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("created_at", { ascending: false });
    setCourses(data || []);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  const generateOutline = async () => {
    if (!form.title) return message.warning("Enter a title first");
    setGenOutline(true);
    try {
      const raw = await callGroq(
        `You are a curriculum designer. Return ONLY valid JSON, no markdown. Shape: {"description":"string"}`,
        `Course: ${form.title}\nCategory: ${form.category || "General"}\nDifficulty: ${form.difficulty}`,
        512,
      );
      const parsed = JSON.parse(
        raw
          .replace(/^```json\s*/i, "")
          .replace(/```\s*$/i, "")
          .trim(),
      );
      if (parsed.description)
        setForm((f) => ({ ...f, description: parsed.description }));
    } catch (e) {
      message.error("AI failed: " + e.message);
    }
    setGenOutline(false);
  };

  const handleCreate = async () => {
    if (!form.title.trim()) return message.warning("Title required");
    if (!form.category) return message.warning("Select a category");
    setCreating(true);
    const { data, error } = await supabase
      .from("courses")
      .insert({
        tenant_id: tenantId,
        title: form.title,
        description: form.description || null,
        category: form.category,
        difficulty: form.difficulty,
        modules: [],
      })
      .select()
      .single();
    if (error) {
      message.error(error.message);
      setCreating(false);
      return;
    }
    message.success("Course created! Opening editor…");
    setCreateOpen(false);
    setForm({
      title: "",
      description: "",
      category: null,
      difficulty: "Beginner",
    });
    setCreating(false);
    onOpenCourse(data);
  };

  const handleDelete = async (id) => {
    await supabase.from("course_quizzes").delete().eq("course_id", id);
    await supabase
      .from("courses")
      .delete()
      .eq("id", id)
      .eq("tenant_id", tenantId);
    message.success("Course deleted");
    setCourses((c) => c.filter((x) => x.id !== id));
  };

  const filtered = courses.filter(
    (c) =>
      (!search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        (c.description || "").toLowerCase().includes(search.toLowerCase())) &&
      (!filterDiff || c.difficulty === filterDiff),
  );

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
        *{font-family:'DM Sans',sans-serif!important}
        .ant-select-selector{border-radius:10px!important;border-color:#e2e8f0!important}
        .ant-modal-content{border-radius:16px!important;padding:0!important;overflow:hidden!important}
        .ant-modal-header{padding:20px 24px 0!important;border-bottom:none!important}
        .ant-modal-body{padding:16px 24px 24px!important}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
        .animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
      `}</style>

      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 h-[60px] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-900 flex items-center justify-center">
            <GraduationCap size={14} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-[15px] text-slate-900 leading-none">
              Courses
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{TENANT_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              className="pl-9 pr-3 h-9 w-48 bg-slate-50 border border-slate-200 rounded-xl text-[13px] text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all"
            />
          </div>
          <Select
            placeholder="Difficulty"
            style={{ width: 130, height: 36 }}
            value={filterDiff}
            onChange={setFilterDiff}
            allowClear
          >
            {DIFFICULTY.map((d) => (
              <Option key={d} value={d}>
                {d}
              </Option>
            ))}
          </Select>
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 h-9 bg-slate-900 hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl"
          >
            <Plus size={14} /> New Course
          </button>
        </div>
      </header>

      <div className="px-6 py-6">
        {loading ? (
          <CoursesListSkeleton />
        ) : (
          <>
            {!loading && courses.length > 0 && (
              <div className="flex gap-3 mb-6 flex-wrap">
                {[
                  {
                    label: "Total",
                    value: courses.length,
                    cc: "text-slate-800",
                  },
                  {
                    label: "Beginner",
                    value: courses.filter((c) => c.difficulty === "Beginner")
                      .length,
                    cc: "text-emerald-600",
                  },
                  {
                    label: "Intermediate",
                    value: courses.filter(
                      (c) => c.difficulty === "Intermediate",
                    ).length,
                    cc: "text-amber-600",
                  },
                  {
                    label: "Advanced",
                    value: courses.filter((c) => c.difficulty === "Advanced")
                      .length,
                    cc: "text-red-600",
                  },
                ].map(({ label, value, cc }) => (
                  <div
                    key={label}
                    className="flex items-baseline gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl"
                  >
                    <span className={`text-xl font-extrabold ${cc}`}>
                      {value}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <GraduationCap size={32} className="text-slate-300" />
                </div>
                <p className="font-bold text-slate-600 text-lg">
                  {courses.length === 0 ? "No courses yet" : "No results"}
                </p>
                <p className="text-slate-400 text-sm">
                  {courses.length === 0
                    ? "Create your first course to get started"
                    : "Try a different search or filter"}
                </p>
                {courses.length === 0 && (
                  <button
                    onClick={() => setCreateOpen(true)}
                    className="flex items-center gap-2 px-5 h-10 bg-slate-900 text-white text-[13px] font-bold rounded-xl mt-2"
                  >
                    <Plus size={14} /> Create First Course
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
                {filtered.map((course) => {
                  const cm =
                    CATEGORY_META[course.category] || CATEGORY_META.General;
                  const dm = DIFF_META[course.difficulty] || DIFF_META.Beginner;
                  const modCount = (course.modules || []).length;
                  const matCount = (course.modules || []).reduce(
                    (s, m) => s + (m.material_ids?.length || 0),
                    0,
                  );
                  return (
                    <div
                      key={course.id}
                      className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group cursor-pointer"
                      onClick={() => onOpenCourse(course)}
                    >
                      <div
                        className="h-1.5 w-full"
                        style={{ background: cm.hex }}
                      />
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-[15px] text-slate-900 leading-snug">
                              {course.title}
                            </p>
                            {course.description && (
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                                {course.description}
                              </p>
                            )}
                          </div>
                          <Popconfirm
                            title="Delete course and all quizzes?"
                            onConfirm={(e) => {
                              e?.stopPropagation();
                              handleDelete(course.id);
                            }}
                            okText="Delete"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="w-7 h-7 rounded-lg border border-red-200 bg-red-50 text-red-400 hover:bg-red-100 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shrink-0"
                            >
                              <Trash2 size={12} />
                            </button>
                          </Popconfirm>
                        </div>

                        <div className="flex flex-wrap gap-1.5 mb-4">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cm.color} ${cm.bg} ${cm.border}`}
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full"
                              style={{ background: cm.hex }}
                            />{" "}
                            {course.category}
                          </span>
                          <span
                            className={`inline-flex text-[10px] font-bold px-2.5 py-1 rounded-full border ${dm.color} ${dm.bg} ${dm.border}`}
                          >
                            {course.difficulty}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Layers size={11} /> {modCount} module
                            {modCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen size={11} /> {matCount} material
                            {matCount !== 1 ? "s" : ""}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={11} />{" "}
                            {dayjs(course.created_at).format("MMM DD")}
                          </span>
                        </div>

                        <div className="flex items-center justify-center gap-2 h-9 bg-slate-900 group-hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl transition-all">
                          <Play size={13} /> Open Course
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        onCancel={() => {
          if (!creating) setCreateOpen(false);
        }}
        footer={null}
        width={540}
        destroyOnClose
        title={
          <div className="flex items-center gap-2 pb-1">
            <GraduationCap size={16} className="text-indigo-500" />
            <span className="font-bold text-[16px]">New Course</span>
          </div>
        }
      >
        <div className="flex flex-col gap-3 my-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                value={form.title}
                onChange={(e) =>
                  setForm((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g. Security Awareness Training"
                className="flex-1 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-indigo-400 transition-all"
              />
              <button
                onClick={generateOutline}
                disabled={genOutline || !form.title}
                className="flex items-center gap-1.5 px-3.5 h-10 bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 disabled:opacity-40 text-white text-xs font-bold rounded-xl shrink-0"
              >
                {genOutline ? (
                  <Spin size="small" />
                ) : (
                  <>
                    <Zap size={12} /> AI Fill
                  </>
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What will learners achieve?"
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-[13px] outline-none focus:border-indigo-400 transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Category <span className="text-red-500">*</span>
              </label>
              <Select
                placeholder="Select"
                style={{ width: "100%", height: 38 }}
                value={form.category}
                onChange={(v) => setForm((f) => ({ ...f, category: v }))}
              >
                {CATEGORIES.map((c) => (
                  <Option key={c} value={c}>
                    {c}
                  </Option>
                ))}
              </Select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Difficulty
              </label>
              <Select
                style={{ width: "100%", height: 38 }}
                value={form.difficulty}
                onChange={(v) => setForm((f) => ({ ...f, difficulty: v }))}
              >
                {DIFFICULTY.map((d) => (
                  <Option key={d} value={d}>
                    {d}
                  </Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={() => setCreateOpen(false)}
            disabled={creating}
            className="px-4 h-9 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={creating || !form.title || !form.category}
            className="flex items-center gap-2 px-5 h-9 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white text-[13px] font-bold rounded-xl"
          >
            {creating ? (
              <>
                <Spin size="small" /> Creating…
              </>
            ) : (
              <>
                <GraduationCap size={14} /> Create & Open
              </>
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT EXPORT
// ════════════════════════════════════════════════════════════════════════════
export default function AdminTrainingCourses() {
  const [tenantId, setTenantId] = useState(undefined);
  const [allMaterials, setAllMats] = useState([]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const {
          data: { user },
          error: authErr,
        } = await supabase.auth.getUser();
        if (authErr || !user) {
          setAuthError(authErr?.message || "Not authenticated");
          setTenantId(null);
          return;
        }
        const { data: p, error: profileErr } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        if (profileErr) {
          console.error("Profile load error:", profileErr);
          setTenantId(user.id);
          return;
        }
        setTenantId(p?.tenant_id || user.id);
      } catch (e) {
        console.error(e);
        setTenantId(null);
      }
    })();
  }, []);

  useEffect(() => {
    if (!tenantId) return;
    supabase
      .from("training_materials")
      .select("*")
      .eq("tenant_id", tenantId)
      .order("title")
      .then(({ data }) => setAllMats(data || []));
  }, [tenantId]);

  if (tenantId === undefined)
    return (
      <div
        className="min-h-screen bg-[#f8fafc]"
        style={{ fontFamily: "'DM Sans', sans-serif" }}
      >
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap');
          *{font-family:'DM Sans',sans-serif!important}
          @keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
          .animate-pulse{animation:pulse 2s cubic-bezier(.4,0,.6,1) infinite}
        `}</style>
        <header className="bg-white border-b border-slate-100 px-6 h-[60px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="w-8 h-8 rounded-xl" />
            <div className="space-y-1.5">
              <SkeletonPulse className="h-3.5 w-20" />
              <SkeletonPulse className="h-2.5 w-16" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <SkeletonPulse className="h-9 w-36 rounded-xl" />
            <SkeletonPulse className="h-9 w-24 rounded-xl" />
            <SkeletonPulse className="h-9 w-28 rounded-xl" />
          </div>
        </header>
        <CoursesListSkeleton />
      </div>
    );

  if (tenantId === null)
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <p className="font-bold text-slate-800 text-lg mb-2">
            Authentication required
          </p>
          <p className="text-slate-400 text-sm">
            {authError || "Please sign in to access courses."}
          </p>
        </div>
      </div>
    );

  if (activeCourse)
    return (
      <CourseDetailView
        course={activeCourse}
        tenantId={tenantId}
        allMaterials={allMaterials}
        onBack={() => setActiveCourse(null)}
        onUpdate={(updated) => setActiveCourse(updated)}
      />
    );

  return (
    <CoursesListView
      tenantId={tenantId}
      allMaterials={allMaterials}
      onOpenCourse={setActiveCourse}
    />
  );
}
