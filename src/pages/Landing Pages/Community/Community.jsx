import { useEffect, useMemo, useState } from "react";
import { MessageSquare, ThumbsDown, ThumbsUp, Send, Search, Clock, User, Info, CheckCircle } from "lucide-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";

/* ─── helpers ─────────────────────────────────────────────────────────────── */

const getVoterKey = () => {
  if (typeof window === "undefined") return "server";
  const existing = localStorage.getItem("community_voter_key");
  if (existing) return existing;
  const generated =
    window.crypto?.randomUUID?.() ||
    `v_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  localStorage.setItem("community_voter_key", generated);
  return generated;
};

const timeAgo = (value) => {
  if (!value) return "";
  const diff = (Date.now() - new Date(value)) / 1000;
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const scoreFor = (rows) =>
  (rows || []).reduce((acc, r) => acc + Number(r.reaction || 0), 0);

/* ─── sub-components ───────────────────────────────────────────────────────── */

function MetaChip({ icon: Icon, children }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        background: "#f7f9fd",
        border: "1px solid #e4eaf6",
        borderRadius: 20,
        padding: "3px 9px",
        fontSize: 11,
        color: "#8796b3",
        fontWeight: 500,
      }}
    >
      {Icon && <Icon size={11} />}
      {children}
    </span>
  );
}

function VoteButton({ active, onClick, icon: Icon, label, small }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: small ? 4 : 5,
        border: `1.5px solid ${active ? "#194696" : "#e4eaf6"}`,
        borderRadius: small ? 5 : 6,
        padding: small ? "3px 8px" : "5px 11px",
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        color: active ? "#194696" : "#4a5878",
        background: active ? "#eef2fb" : "#fff",
        fontFamily: "'Manrope', 'Segoe UI', sans-serif",
        cursor: "pointer",
        transition: "all .15s",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "#194696";
          e.currentTarget.style.color = "#194696";
          e.currentTarget.style.background = "#eef2fb";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.borderColor = "#e4eaf6";
          e.currentTarget.style.color = "#4a5878";
          e.currentTarget.style.background = "#fff";
        }
      }}
    >
      <Icon size={small ? 11 : 12} fill={active ? "currentColor" : "none"} />
      {label}
    </button>
  );
}

function ScorePill({ score }) {
  const color = score > 0 ? "#194696" : score < 0 ? "#e24b4a" : "#8796b3";
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 700,
        color,
        padding: "5px 10px",
        background: "#fff",
        border: "1.5px solid #e4eaf6",
        borderRadius: 6,
      }}
    >
      {score > 0 ? "+" : ""}
      {score}
    </span>
  );
}

function AnswerCard({ answer, reactions, myReactions, onReact }) {
  const aKey = `answer:${answer.id}`;
  const score = scoreFor(reactions[aKey]);
  const mine = myReactions[aKey] || 0;

  return (
    <div
      style={{
        background: "#f7f9fd",
        border: "1px solid #e4eaf6",
        borderRadius: 9,
        padding: "14px 16px",
        marginBottom: 10,
      }}
    >
      <p
        style={{
          fontSize: 13.5,
          color: "#0f1c35",
          lineHeight: 1.75,
          marginBottom: 10,
        }}
      >
        {answer.body}
      </p>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <MetaChip icon={User}>{answer.author_name || "Anonymous"}</MetaChip>
        <MetaChip icon={Clock}>{timeAgo(answer.created_at)}</MetaChip>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            fontWeight: 700,
            color: score > 0 ? "#194696" : score < 0 ? "#e24b4a" : "#8796b3",
          }}
        >
          {score > 0 ? "+" : ""}
          {score}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <VoteButton
          small
          active={mine === 1}
          icon={ThumbsUp}
          label="Helpful"
          onClick={() => onReact({ targetType: "answer", targetId: answer.id, value: 1 })}
        />
        <VoteButton
          small
          active={mine === -1}
          icon={ThumbsDown}
          label="Not helpful"
          onClick={() => onReact({ targetType: "answer", targetId: answer.id, value: -1 })}
        />
      </div>
    </div>
  );
}

/* ─── main component ───────────────────────────────────────────────────────── */

export default function CommunityPage() {
  const { user, profile } = useAuth();
  const voterKey = getVoterKey();

  const [loading, setLoading] = useState(true);
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [submittingAnswerId, setSubmittingAnswerId] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [answersByQuestion, setAnswersByQuestion] = useState({});
  const [reactionsByTarget, setReactionsByTarget] = useState({});
  const [myReactions, setMyReactions] = useState({});

  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState({});
  const [questionForm, setQuestionForm] = useState({ title: "", body: "", author_name: "" });
  const [answerDrafts, setAnswerDrafts] = useState({});

  const displayName = profile?.full_name || profile?.company_name || "";

  /* ── data fetching ── */

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: qData, error: qErr } = await supabase
        .from("community_questions")
        .select("id,title,body,author_name,user_id,created_at")
        .order("created_at", { ascending: false });
      if (qErr) throw qErr;
      const questionRows = qData || [];
      setQuestions(questionRows);

      if (questionRows.length === 0) {
        setAnswersByQuestion({});
        setReactionsByTarget({});
        setMyReactions({});
        return;
      }

      const questionIds = questionRows.map((q) => q.id);
      const { data: aData, error: aErr } = await supabase
        .from("community_answers")
        .select("id,question_id,body,author_name,user_id,created_at")
        .in("question_id", questionIds)
        .order("created_at", { ascending: true });
      if (aErr) throw aErr;

      const answers = aData || [];
      const grouped = {};
      answers.forEach((a) => {
        if (!grouped[a.question_id]) grouped[a.question_id] = [];
        grouped[a.question_id].push(a);
      });
      setAnswersByQuestion(grouped);

      const answerIds = answers.map((a) => a.id);
      const targetIds = [...questionIds, ...answerIds];
      if (targetIds.length === 0) {
        setReactionsByTarget({});
        setMyReactions({});
        return;
      }

      const { data: rData, error: rErr } = await supabase
        .from("community_reactions")
        .select("id,target_type,target_id,reaction,voter_key")
        .in("target_id", targetIds);
      if (rErr) throw rErr;

      const byTarget = {};
      const mine = {};
      (rData || []).forEach((r) => {
        const key = `${r.target_type}:${r.target_id}`;
        if (!byTarget[key]) byTarget[key] = [];
        byTarget[key].push(r);
        if (r.voter_key === voterKey) mine[key] = Number(r.reaction);
      });
      setReactionsByTarget(byTarget);
      setMyReactions(mine);
    } catch (err) {
      console.error("Community load failed:", err);
      setQuestions([]);
      setAnswersByQuestion({});
      setReactionsByTarget({});
      setMyReactions({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ── derived data ── */

  const totalAnswers = useMemo(
    () => Object.values(answersByQuestion).reduce((a, v) => a + v.length, 0),
    [answersByQuestion]
  );

  const visibleQuestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return questions;
    return questions.filter((item) =>
      `${item.title || ""} ${item.body || ""} ${item.author_name || ""}`.toLowerCase().includes(q)
    );
  }, [questions, search]);

  const resolveAuthorName = (value) => {
    const fallback = displayName || "Anonymous";
    return String(value || "").trim() || fallback;
  };

  /* ── mutations ── */

  const submitQuestion = async (e) => {
    e.preventDefault();
    const title = questionForm.title.trim();
    const body = questionForm.body.trim();
    const author_name = resolveAuthorName(questionForm.author_name);
    if (!title || !body) return;

    setSubmittingQuestion(true);
    const { error } = await supabase
      .from("community_questions")
      .insert({ title, body, author_name, user_id: user?.id || null });
    setSubmittingQuestion(false);
    if (error) { console.error("Question create failed:", error); return; }

    setQuestionForm({ title: "", body: "", author_name: displayName || "" });
    fetchData();
  };

  const submitAnswer = async (questionId) => {
    const draft = answerDrafts[questionId] || {};
    const body = String(draft.body || "").trim();
    const author_name = resolveAuthorName(draft.author_name);
    if (!body) return;

    setSubmittingAnswerId(questionId);
    const { error } = await supabase
      .from("community_answers")
      .insert({ question_id: questionId, body, author_name, user_id: user?.id || null });
    setSubmittingAnswerId(null);
    if (error) { console.error("Answer create failed:", error); return; }

    setAnswerDrafts((prev) => ({
      ...prev,
      [questionId]: { body: "", author_name: displayName || "" },
    }));
    fetchData();
  };

  const updateReactionState = ({ targetType, targetId, nextValue }) => {
    const key = `${targetType}:${targetId}`;

    setMyReactions((prev) => {
      const next = { ...prev };
      if (nextValue === 0) delete next[key];
      else next[key] = nextValue;
      return next;
    });

    setReactionsByTarget((prev) => {
      const existing = prev[key] || [];
      const withoutMine = existing.filter((row) => row.voter_key !== voterKey);
      const nextRows =
        nextValue === 0
          ? withoutMine
          : [
              ...withoutMine,
              {
                target_type: targetType,
                target_id: targetId,
                reaction: nextValue,
                voter_key: voterKey,
              },
            ];
      return { ...prev, [key]: nextRows };
    });
  };

  const react = async ({ targetType, targetId, value }) => {
    const key = `${targetType}:${targetId}`;
    const current = myReactions[key] || 0;
    const nextValue = current === value ? 0 : value;

    // Optimistic local update so likes/dislikes do not trigger a full reload.
    updateReactionState({ targetType, targetId, nextValue });

    if (nextValue === 0) {
      const { error } = await supabase
        .from("community_reactions")
        .delete()
        .eq("target_type", targetType)
        .eq("target_id", targetId)
        .eq("voter_key", voterKey);
      if (error) {
        console.error("Reaction remove failed:", error);
        updateReactionState({ targetType, targetId, nextValue: current });
      }
      return;
    } else {
      const { error } = await supabase.from("community_reactions").upsert(
        { target_type: targetType, target_id: targetId, reaction: nextValue, voter_key: voterKey },
        { onConflict: "target_type,target_id,voter_key" }
      );
      if (error) {
        console.error("Reaction save failed:", error);
        updateReactionState({ targetType, targetId, nextValue: current });
      }
    }
  };

  /* ── shared input styles ── */

  const inputStyle = {
    width: "100%",
    border: "1.5px solid #e4eaf6",
    borderRadius: 9,
    padding: "10px 13px",
    fontFamily: "'Manrope', 'Segoe UI', sans-serif",
    fontSize: 13,
    color: "#0f1c35",
    background: "#f7f9fd",
    outline: "none",
  };

  /* ── render ── */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f6fb",
        color: "#0f1c35",
        fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; }
        .cm-input:focus { border-color: #194696 !important; background: #fff !important; }
        .cm-toggle:hover { background: #eef2fb; }
        .cm-tip-icon { width:26px; height:26px; border-radius:6px; background:#eef2fb; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        @media (max-width: 1024px) {
          .cm-main-wrap { padding-top: 92px !important; padding-bottom: 56px !important; }
          .cm-page-inner { padding: 0 14px !important; }
          .cm-hero { padding: 26px 18px 22px !important; border-radius: 16px !important; }
          .cm-hero-circle-1, .cm-hero-circle-2 { display: none !important; }
          .cm-stats { gap: 16px !important; }
          .cm-layout { grid-template-columns: 1fr !important; gap: 14px !important; }
          .cm-sidebar { order: 2; }
          .cm-feed { order: 1; }
          .cm-post-card, .cm-tips-card { padding: 16px !important; border-radius: 14px !important; }
          .cm-search { padding: 10px 12px !important; border-radius: 12px !important; }
          .cm-question-body { padding: 14px 14px 12px !important; }
          .cm-action-bar { padding: 10px 14px !important; gap: 6px !important; flex-wrap: wrap; }
          .cm-replies-wrap { padding: 0 14px 14px !important; }
          .cm-toggle { margin-left: 0 !important; width: 100% !important; text-align: left; }
          .cm-reply-footer { flex-direction: column; align-items: flex-start !important; gap: 8px !important; }
        }
        @media (max-width: 640px) {
          .cm-hero h1 { font-size: 28px !important; line-height: 1.2 !important; }
          .cm-hero p { font-size: 13px !important; }
          .cm-question-title { font-size: 15px !important; }
          .cm-question-text { font-size: 13px !important; }
          .cm-empty { padding: 34px 14px !important; }
          .cm-loading { padding: 14px !important; }
        }
      `}</style>

      {/* Navbar */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          top: 0,
          zIndex: 50,
          background: "rgba(255,255,255,.78)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div style={{ margin: "0 auto", maxWidth: 1240, padding: "0 20px" }}>
          <LandingNavbar />
        </div>
      </div>

      <div className="cm-main-wrap" style={{ paddingTop: 104, paddingBottom: 80 }}>
        <div className="cm-page-inner" style={{ margin: "0 auto", maxWidth: 1160, padding: "0 20px" }}>

          {/* ── Hero ── */}
          <div
            className="cm-hero"
            style={{
              background: "linear-gradient(135deg,#194696 0%,#1d54b8 60%,#2563cc 100%)",
              borderRadius: 20,
              padding: "36px 36px 32px",
              marginBottom: 24,
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* decorative circles */}
            <div className="cm-hero-circle-1" style={{ position:"absolute",top:-40,right:-40,width:200,height:200,background:"rgba(255,255,255,.06)",borderRadius:"50%" }} />
            <div className="cm-hero-circle-2" style={{ position:"absolute",bottom:-60,right:60,width:140,height:140,background:"rgba(255,255,255,.04)",borderRadius:"50%" }} />

            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,.15)",
                border: "1px solid rgba(255,255,255,.25)",
                borderRadius: 20,
                padding: "4px 12px",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: ".1em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,.9)",
                marginBottom: 14,
              }}
            >
              <MessageSquare size={12} />
              Ryzent Community
            </div>

            <h1
              style={{
                fontSize: "clamp(24px,4vw,36px)",
                fontWeight: 800,
                color: "#fff",
                lineHeight: 1.2,
                letterSpacing: "-.02em",
                marginBottom: 8,
              }}
            >
              Ask Questions.<br />Share Answers. Build Together.
            </h1>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,.75)", lineHeight: 1.7, maxWidth: 560 }}>
              Public discussion space for docs, tutorials, and product usage.
              Guests and logged-in users can both post and reply.
            </p>

            <div className="cm-stats" style={{ display: "flex", gap: 24, marginTop: 20, flexWrap: "wrap" }}>
              {[
                { value: questions.length, label: "Questions" },
                { value: totalAnswers, label: "Answers" },
              ].map(({ value, label }) => (
                <div key={label} style={{ display: "flex", flexDirection: "column" }}>
                  <strong style={{ fontSize: 22, fontWeight: 800, color: "#fff" }}>{value}</strong>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.6)", textTransform: "uppercase", letterSpacing: ".08em", marginTop: 1 }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Main layout ── */}
          <div
            className="cm-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "340px minmax(0,1fr)",
              gap: 20,
              alignItems: "start",
            }}
          >
            {/* ── Sidebar ── */}
            <aside className="cm-sidebar">
              {/* Post question card */}
              <div
                className="cm-post-card"
                style={{
                  background: "#fff",
                  border: "1px solid #e4eaf6",
                  borderRadius: 16,
                  padding: 22,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#194696",
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                    marginBottom: 12,
                  }}
                >
                  Post a Question
                </div>
                <p style={{ fontSize: 12.5, color: "#8796b3", lineHeight: 1.6, marginBottom: 18 }}>
                  Anyone can post — guests welcome. Keep questions clear and specific for the best answers.
                </p>
                <div style={{ height: 1, background: "#e4eaf6", marginBottom: 16 }} />

                <form onSubmit={submitQuestion}>
                  {/* Author name (guests only) */}
                  {!user && (
                    <div style={{ marginBottom: 10 }}>
                      <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4a5878", marginBottom: 5 }}>
                        Your name (optional)
                      </label>
                      <input
                        className="cm-input"
                        style={inputStyle}
                        value={questionForm.author_name}
                        onChange={(e) => setQuestionForm((p) => ({ ...p, author_name: e.target.value }))}
                        placeholder="e.g. Jane Smith"
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4a5878", marginBottom: 5 }}>
                      Question title <span style={{ color: "#e24b4a" }}>*</span>
                    </label>
                    <input
                      className="cm-input"
                      style={inputStyle}
                      value={questionForm.title}
                      onChange={(e) => setQuestionForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Summarize your question clearly"
                    />
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: "block", fontSize: 11.5, fontWeight: 600, color: "#4a5878", marginBottom: 5 }}>
                      Details <span style={{ color: "#e24b4a" }}>*</span>
                    </label>
                    <textarea
                      className="cm-input"
                      style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                      rows={5}
                      value={questionForm.body}
                      onChange={(e) => setQuestionForm((p) => ({ ...p, body: e.target.value }))}
                      placeholder="Describe what you're trying to understand or solve..."
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingQuestion}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 7,
                      background: "#194696",
                      color: "#fff",
                      border: "none",
                      borderRadius: 9,
                      padding: "10px 16px",
                      fontFamily: "'Manrope', 'Segoe UI', sans-serif",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: "pointer",
                      opacity: submittingQuestion ? .55 : 1,
                    }}
                  >
                    <Send size={13} />
                    {submittingQuestion ? "Posting..." : "Post Question"}
                  </button>
                </form>
              </div>

              {/* Tips card */}
              <div
                className="cm-tips-card"
                style={{
                  background: "#fff",
                  border: "1px solid #e4eaf6",
                  borderRadius: 16,
                  padding: "18px 22px",
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#194696",
                    textTransform: "uppercase",
                    letterSpacing: ".12em",
                    marginBottom: 14,
                  }}
                >
                  Community Tips
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { icon: Info, text: "Be specific — include code snippets or error messages when relevant." },
                    { icon: Search, text: "Search before posting — your question may already be answered." },
                    { icon: CheckCircle, text: "Upvote answers that helped you so others benefit too." },
                  ].map(({ icon: Icon, text }, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div className="cm-tip-icon">
                        <Icon size={13} color="#194696" />
                      </div>
                      <p style={{ fontSize: 12, color: "#8796b3", lineHeight: 1.6 }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </aside>

            {/* ── Feed ── */}
            <section className="cm-feed">
              {/* Search */}
              <div
                className="cm-search"
                style={{
                  background: "#fff",
                  border: "1.5px solid #e4eaf6",
                  borderRadius: 14,
                  padding: "12px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <Search size={15} color="#8796b3" style={{ flexShrink: 0 }} />
                <input
                  style={{
                    border: "none",
                    outline: "none",
                    background: "transparent",
                    fontFamily: "'Manrope', 'Segoe UI', sans-serif",
                    fontSize: 13.5,
                    color: "#0f1c35",
                    width: "100%",
                  }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search questions by title, content, or author..."
                />
              </div>

              {/* Question list */}
              {loading ? (
                <div
                  className="cm-loading"
                  style={{
                    background: "#fff",
                    border: "1px solid #e4eaf6",
                    borderRadius: 14,
                    padding: 22,
                  }}
                >
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ marginBottom: 20 }}>
                      <div style={{ height: 14, background: "#e4eaf6", borderRadius: 6, width: "60%", marginBottom: 8, animation: "pulse 1.5s infinite" }} />
                      <div style={{ height: 10, background: "#e4eaf6", borderRadius: 6, width: "100%", marginBottom: 6 }} />
                      <div style={{ height: 10, background: "#e4eaf6", borderRadius: 6, width: "80%" }} />
                    </div>
                  ))}
                </div>
              ) : visibleQuestions.length === 0 ? (
                <div
                  className="cm-empty"
                  style={{
                    background: "#fff",
                    border: "1px solid #e4eaf6",
                    borderRadius: 14,
                    padding: "48px 24px",
                    textAlign: "center",
                  }}
                >
                  <MessageSquare size={40} color="#cdd8ef" style={{ marginBottom: 12 }} />
                  <p style={{ fontSize: 14, color: "#8796b3" }}>
                    {search ? "No results found for that search." : "No questions yet — be the first to ask!"}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {visibleQuestions.map((q, index) => {
                    const qKey = `question:${q.id}`;
                    const qScore = scoreFor(reactionsByTarget[qKey]);
                    const qMine = myReactions[qKey] || 0;
                    const answers = answersByQuestion[q.id] || [];
                    const isOpen = !!expanded[q.id];

                    return (
                      <article
                        key={q.id}
                        style={{
                          background: "#fff",
                          border: "1px solid #e4eaf6",
                          borderRadius: 14,
                          overflow: "hidden",
                          transition: "border-color .2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#cdd8ef")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#e4eaf6")}
                      >
                        {/* Card body */}
                        <div className="cm-question-body" style={{ padding: "20px 22px 16px" }}>
                          {/* Index badge */}
                          <div
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 22,
                              height: 22,
                              borderRadius: 6,
                              background: "#eef2fb",
                              color: "#194696",
                              fontSize: 10,
                              fontWeight: 800,
                              marginBottom: 10,
                            }}
                          >
                            {index + 1}
                          </div>

                          <h3
                            className="cm-question-title"
                            style={{
                              fontSize: 16.5,
                              fontWeight: 800,
                              color: "#0f1c35",
                              lineHeight: 1.3,
                              marginBottom: 8,
                              letterSpacing: "-.01em",
                            }}
                          >
                            {q.title}
                          </h3>
                          <p
                            className="cm-question-text"
                            style={{
                              fontSize: 13.5,
                              color: "#4a5878",
                              lineHeight: 1.75,
                              marginBottom: 14,
                            }}
                          >
                            {q.body}
                          </p>

                          {/* Meta */}
                          <div
                            style={{
                              display: "flex",
                              flexWrap: "wrap",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <MetaChip icon={User}>{q.author_name || "Anonymous"}</MetaChip>
                            <MetaChip icon={Clock}>{timeAgo(q.created_at)}</MetaChip>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 4,
                                background: "#eef2fb",
                                border: "1px solid #dce7f9",
                                borderRadius: 20,
                                padding: "2px 9px",
                                fontSize: 11,
                                fontWeight: 700,
                                color: "#194696",
                              }}
                            >
                              <MessageSquare size={10} />
                              {answers.length} {answers.length === 1 ? "reply" : "replies"}
                            </span>
                          </div>
                        </div>

                        {/* Card actions bar */}
                        <div
                          className="cm-action-bar"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "12px 22px",
                            background: "#f7f9fd",
                            borderTop: "1px solid #e4eaf6",
                          }}
                        >
                          <VoteButton
                            active={qMine === 1}
                            icon={ThumbsUp}
                            label="Helpful"
                            onClick={() => react({ targetType: "question", targetId: q.id, value: 1 })}
                          />
                          <VoteButton
                            active={qMine === -1}
                            icon={ThumbsDown}
                            label="Not helpful"
                            onClick={() => react({ targetType: "question", targetId: q.id, value: -1 })}
                          />
                          <ScorePill score={qScore} />
                          <button
                            className="cm-toggle"
                            type="button"
                            style={{
                              marginLeft: "auto",
                              fontFamily: "'Manrope', 'Segoe UI', sans-serif",
                              fontSize: 12,
                              fontWeight: 700,
                              color: "#194696",
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              padding: "5px 10px",
                              borderRadius: 6,
                            }}
                            onClick={() =>
                              setExpanded((p) => ({ ...p, [q.id]: !p[q.id] }))
                            }
                          >
                            {isOpen ? "Hide replies ↑" : "View replies ↓"}
                          </button>
                        </div>

                        {/* Replies section */}
                        {isOpen && (
                          <div className="cm-replies-wrap" style={{ padding: "0 22px 20px" }}>
                            <div
                              style={{
                                fontSize: 11.5,
                                fontWeight: 700,
                                color: "#8796b3",
                                textTransform: "uppercase",
                                letterSpacing: ".1em",
                                padding: "16px 0 12px",
                                borderTop: "1px solid #e4eaf6",
                              }}
                            >
                              {answers.length
                                ? `${answers.length} ${answers.length === 1 ? "Reply" : "Replies"}`
                                : "No replies yet"}
                            </div>

                            {answers.map((a) => (
                              <AnswerCard
                                key={a.id}
                                answer={a}
                                reactions={reactionsByTarget}
                                myReactions={myReactions}
                                onReact={react}
                              />
                            ))}

                            {/* Reply form */}
                            <div
                              style={{
                                background: "#fff",
                                border: "1.5px solid #e4eaf6",
                                borderRadius: 9,
                                padding: 14,
                                marginTop: 4,
                              }}
                            >
                              <p
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#4a5878",
                                  marginBottom: 10,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 5,
                                }}
                              >
                                <MessageSquare size={12} color="#194696" />
                                Add your reply
                              </p>

                              {!user && (
                                <input
                                  className="cm-input"
                                  style={{ ...inputStyle, marginBottom: 8 }}
                                  value={answerDrafts[q.id]?.author_name || ""}
                                  onChange={(e) =>
                                    setAnswerDrafts((p) => ({
                                      ...p,
                                      [q.id]: { ...(p[q.id] || {}), author_name: e.target.value },
                                    }))
                                  }
                                  placeholder="Your name (optional)"
                                />
                              )}

                              <textarea
                                className="cm-input"
                                style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }}
                                rows={3}
                                value={answerDrafts[q.id]?.body || ""}
                                onChange={(e) =>
                                  setAnswerDrafts((p) => ({
                                    ...p,
                                    [q.id]: { ...(p[q.id] || {}), body: e.target.value },
                                  }))
                                }
                                placeholder="Share your knowledge or experience..."
                              />

                              <div
                                className="cm-reply-footer"
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  marginTop: 10,
                                }}
                              >
                                <span style={{ fontSize: 11, color: "#8796b3" }}>
                                  Respectful and constructive answers only
                                </span>
                                <button
                                  type="button"
                                  onClick={() => submitAnswer(q.id)}
                                  disabled={submittingAnswerId === q.id}
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    background: "#194696",
                                    color: "#fff",
                                    border: "none",
                                    borderRadius: 7,
                                    padding: "8px 14px",
                                    fontFamily: "'Manrope', 'Segoe UI', sans-serif",
                                    fontSize: 12,
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    opacity: submittingAnswerId === q.id ? .55 : 1,
                                  }}
                                >
                                  <Send size={12} />
                                  {submittingAnswerId === q.id ? "Posting..." : "Post Reply"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <ProductCtaFooterSection />
    </div>
  );
}
