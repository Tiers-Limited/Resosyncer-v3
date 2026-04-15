import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headset,
  LifeBuoy,
  MessageCircleMore,
  Paperclip,
  Send,
  ShieldCheck,
  Star,
  Ticket,
  X,
  Zap,
} from "lucide-react";
import { message } from "antd";
import { Link } from "react-router-dom";
import Lottie from "lottie-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { useAuth } from "../../../contexts/AuthContext";
import { supabase } from "../../../lib/supabase";

const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL;
const LIVE_AGENT_REGEX =
  /\b(live agent|human|real person|support agent|representative|connect me|talk to (someone|human))\b/i;
const OFFENSIVE_REGEX =
  /\b(stupid|idiot|dumb|shit|fuck|bitch|asshole|moron|useless)\b/i;
const GUEST_CONVERSATION_ID = "guest-local";
const RYZENT_SUPPORT_TOPICS = [
  "Documents Access & Permissions",
  "Leads CRM Setup",
  "Teams & Member Assignment",
  "Standups Tracking Issue",
  "Billing & Subscription",
  "Integrations & API",
  "Other",
];

const ticketPipeline = [
  {
    title: "Submitted",
    body: "Issue details, priority, and attachment are captured in one structured form.",
    icon: Ticket,
  },
  {
    title: "Triaged",
    body: "Support team assigns ownership and routes the ticket to the right technical queue.",
    icon: ShieldCheck,
  },
  {
    title: "In Progress",
    body: "Engineers and support collaborate with updates in the same thread for full context.",
    icon: Zap,
  },
  {
    title: "Resolved",
    body: "A clear fix summary and verification note are posted before closure.",
    icon: CheckCircle2,
  },
];

export default function SupportProductPage() {
  const { profile } = useAuth();
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const [chatAttachment, setChatAttachment] = useState(null);
  const [supportAnimation, setSupportAnimation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messagesState, setMessagesState] = useState([]);
  const [aiMessagesByConversation, setAiMessagesByConversation] = useState({});
  const [superadmins, setSuperadmins] = useState([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingChat, setSendingChat] = useState(false);
  const [closeReviewOpen, setCloseReviewOpen] = useState(false);
  const [closeRating, setCloseRating] = useState(0);
  const [closeFeedback, setCloseFeedback] = useState("");
  const attachmentInputRef = useRef(null);
  const ticketAttachmentInputRef = useRef(null);
  const [ticketAttachment, setTicketAttachment] = useState(null);
  const [creatingTicket, setCreatingTicket] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");
  const [ticket, setTicket] = useState({
    title: "",
    priority: "medium",
    details: "",
  });

  const selectedConversation = useMemo(
    () => conversations.find((c) => c.id === selectedConversationId) || null,
    [conversations, selectedConversationId],
  );

  const combinedThreadMessages = useMemo(() => {
    const ai = aiMessagesByConversation[selectedConversationId] || [];
    const merged = [...messagesState, ...ai];
    merged.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return merged;
  }, [aiMessagesByConversation, messagesState, selectedConversationId]);

  const handleTicketChange = (key, value) => {
    setTicket((prev) => ({ ...prev, [key]: value }));
  };

  const addAiMessage = useCallback((conversationId, content) => {
    if (!conversationId || !content) return;
    const aiMsg = {
      id: `ai-${conversationId}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      conversation_id: conversationId,
      sender_id: null,
      content,
      created_at: new Date().toISOString(),
      is_ai: true,
      sender: { full_name: "Ryzent AI Assistant", role: "assistant" },
    };
    setAiMessagesByConversation((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), aiMsg],
    }));
  }, []);

  const loadConversations = useCallback(async ({ silent = false } = {}) => {
    if (!profile?.id || !profile?.tenant_id) {
      setConversations([]);
      setSelectedConversationId(null);
      return;
    }
    if (!silent) setLoadingChat(true);
    try {
      const { data, error } = await supabase
        .from("support_conversations")
        .select("*")
        .eq("tenant_id", profile.tenant_id)
        .eq("status", "open")
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      const rows = (data || []).filter((c) => (c.subject || "").trim() !== "General Support");
      setConversations(rows);
      if (!selectedConversationId && rows.length > 0) {
        setSelectedConversationId(rows[0].id);
      }
      if (
        selectedConversationId &&
        rows.length > 0 &&
        !rows.some((r) => r.id === selectedConversationId)
      ) {
        setSelectedConversationId(rows[0].id);
      }
    } catch {
      setConversations([]);
    } finally {
      if (!silent) setLoadingChat(false);
    }
  }, [profile?.id, profile?.tenant_id, selectedConversationId]);

  const loadMessages = useCallback(async (conversationId) => {
    if (!conversationId) {
      setMessagesState([]);
      return;
    }
    const { data, error } = await supabase
      .from("support_messages")
      .select(
        "id, conversation_id, sender_id, content, attachment_url, attachment_name, attachment_size, created_at, sender:profiles!support_messages_sender_id_fkey(id, full_name, role)",
      )
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error) setMessagesState(data || []);
  }, []);

  const loadSuperadmins = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["superadmin", "super_admin"]);
    if (!error) setSuperadmins(data || []);
  }, []);

  const groq = useCallback(async (userContent) => {
    if (!GROQ_API_KEY) throw new Error("Missing GROQ key");
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are Ryzent Support AI. Give concise, practical support guidance in plain text. Do not use markdown, bullets, or asterisks. If user asks for a live agent, confirm escalation.",
          },
          { role: "user", content: userContent },
        ],
        temperature: 0.25,
        max_tokens: 450,
      }),
    });
    if (!res.ok) throw new Error("Groq failed");
    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content?.trim() || "";
    return raw
      .replace(/\*\*/g, "")
      .replace(/^\s*[-*]\s+/gm, "")
      .trim();
  }, []);

  const sendEmail = useCallback(async ({ to, subject, body, companyName }) => {
    if (!EMAIL_API || !to) return;
    try {
      await fetch(`${EMAIL_API}/api/email/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, html: body, companyName }),
      });
    } catch {
      // Ignore email transport failures in product-page widget.
    }
  }, []);

  const uploadSupportFile = useCallback(
    async (file, scope = "support-chat") => {
      const cleanName = (file.name || "file").replace(/[^\w.\-]/g, "_");
      const prefix = profile?.id ? `${profile.id}/` : "";
      const path = `${prefix}${scope}/${Date.now()}-${cleanName}`;
      const { error: uploadError } = await supabase.storage
        .from("chat-files")
        .upload(path, file, { contentType: file.type || undefined });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("chat-files").getPublicUrl(path);
      return {
        attachment_url: data?.publicUrl || null,
        attachment_name: file.name || cleanName,
        attachment_size: file.size || null,
        attachment_type: file.type || null,
      };
    },
    [profile?.id],
  );

  const createTicket = useCallback(
    async (e) => {
      e.preventDefault();
      const contactEmail = (profile?.email || guestEmail || "").trim();
      if (!ticket.title.trim() || !ticket.details.trim()) {
        message.warning("Please add ticket title and issue details.");
        return;
      }
      if (!contactEmail) {
        message.warning("Please add a valid email so support can contact you.");
        return;
      }
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail);
      if (!isValidEmail) {
        message.warning("Please enter a valid email address.");
        return;
      }

      setCreatingTicket(true);
      try {
        let attachment = {
          attachment_url: null,
          attachment_name: null,
          attachment_size: null,
          attachment_type: null,
        };
        if (ticketAttachment) {
          attachment = await uploadSupportFile(
            ticketAttachment,
            profile?.id ? "support-ticket" : "public-support-ticket",
          );
        }

        const description = profile?.id
          ? ticket.details.trim()
          : `Contact Email: ${contactEmail}\n\n${ticket.details.trim()}`;
        const { error } = await supabase
          .from("support_tickets")
          .insert([
            {
              tenant_id: profile?.tenant_id || null,
              submitted_by: profile?.id || null,
              title: ticket.title.trim(),
              description,
              priority: ticket.priority,
              status: "open",
              source: profile?.id ? "customer_support" : "customer_support_guest",
              ...attachment,
            },
          ]);
        if (error) throw error;

        if (contactEmail) {
          const html = `
            <div style="font-family:Arial,sans-serif;line-height:1.6">
              <h3>Your Ryzent support ticket has been received</h3>
              <p><strong>Title:</strong> ${ticket.title}</p>
              <p><strong>Priority:</strong> ${ticket.priority}</p>
              <p>Our support team will review this and follow up soon.</p>
            </div>
          `;
          await sendEmail({
            to: contactEmail,
            subject: "Ryzent Support Ticket Received",
            body: html,
            companyName: "Ryzent AI",
          });
        }

        setTicket({
          title: "",
          priority: "medium",
          details: "",
        });
        if (!profile?.id) setGuestEmail("");
        setTicketAttachment(null);
        message.success("Ticket submitted successfully.");
      } catch (e2) {
        message.error(e2.message || "Failed to submit ticket.");
      } finally {
        setCreatingTicket(false);
      }
    },
    [guestEmail, profile?.email, profile?.id, profile?.tenant_id, sendEmail, ticket, ticketAttachment, uploadSupportFile],
  );

  const createOrGetConversation = useCallback(async (topic = "Ryzent Product Support") => {
    if (!profile?.id || !profile?.tenant_id) {
      setSelectedConversationId(GUEST_CONVERSATION_ID);
      return GUEST_CONVERSATION_ID;
    }
    const existing = conversations.find((c) => c.status === "open");
    if (existing) {
      setSelectedConversationId(existing.id);
      return existing.id;
    }
    const { data, error } = await supabase
      .from("support_conversations")
      .insert([
        {
          tenant_id: profile.tenant_id,
          initiated_by: profile.id,
          subject: topic,
          status: "open",
          channel_type: "live_chat",
          last_message_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();
    if (error || !data) return null;
    setConversations((prev) => [data, ...prev]);
    setSelectedConversationId(data.id);
    return data.id;
  }, [conversations, profile?.id, profile?.tenant_id]);

  const startConversationByTopic = useCallback(
    async (topic) => {
      const conversationId = await createOrGetConversation(topic);
      if (!conversationId) return;
      addAiMessage(
        conversationId,
        `Got it. I can help with "${topic}". Share a quick description and I will guide you step by step. You can ask for a live agent anytime.`,
      );
    },
    [addAiMessage, createOrGetConversation],
  );

  const closeConversation = useCallback(async () => {
    if (!selectedConversationId) return;
    if (selectedConversationId === GUEST_CONVERSATION_ID) {
      setSelectedConversationId(null);
      setMessagesState([]);
      return;
    }
    await supabase
      .from("support_conversations")
      .update({ status: "closed", last_message_at: new Date().toISOString() })
      .eq("id", selectedConversationId);
    setConversations((prev) => prev.filter((c) => c.id !== selectedConversationId));
    setSelectedConversationId(null);
    setMessagesState([]);
  }, [selectedConversationId]);

  const submitCloseReview = useCallback(async () => {
    if (!selectedConversationId) return;
    const parts = [];
    if (closeRating > 0) parts.push(`Rating: ${closeRating}/5`);
    if (closeFeedback.trim()) parts.push(`Feedback: ${closeFeedback.trim()}`);
    if (parts.length > 0 && profile?.id) {
      await supabase.from("support_messages").insert([
        {
          conversation_id: selectedConversationId,
          sender_id: profile.id,
          content: `[Chat Review] ${parts.join(" | ")}`,
        },
      ]);
    }
    setCloseReviewOpen(false);
    setCloseRating(0);
    setCloseFeedback("");
    await closeConversation();
  }, [closeConversation, closeFeedback, closeRating, profile?.id, selectedConversationId]);

  const escalateConversation = useCallback(
    async (conversationId, userMessage) => {
      const current = conversations.find((c) => c.id === conversationId);
      const firstSuperadmin = superadmins[0] || null;
      const updates = {
        subject: (current?.subject || "Support Chat").startsWith("[LIVE AGENT]")
          ? current?.subject
          : `[LIVE AGENT] ${current?.subject || "Support Chat"}`,
        assigned_superadmin_id: firstSuperadmin?.id || current?.assigned_superadmin_id || null,
        last_message_at: new Date().toISOString(),
      };
      await supabase.from("support_conversations").update(updates).eq("id", conversationId);
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, ...updates } : c)),
      );

      const recipients = superadmins.map((s) => s.email).filter(Boolean);
      if (recipients.length > 0) {
        const html = `
          <div style="font-family:Arial,sans-serif;line-height:1.6">
            <h3>Live Agent Escalation Requested</h3>
            <p><strong>Tenant:</strong> ${profile?.tenant_id || "N/A"}</p>
            <p><strong>Conversation:</strong> ${conversationId}</p>
            <p><strong>User:</strong> ${profile?.full_name || profile?.id || "Unknown"}</p>
            <p><strong>Message:</strong> ${userMessage || "(no text provided)"}</p>
          </div>
        `;
        await Promise.allSettled(
          recipients.map((to) =>
            sendEmail({
              to,
              subject: "Ryzent Support: Live Agent Escalation",
              body: html,
              companyName: "Ryzent AI",
            }),
          ),
        );
      }
      addAiMessage(
        conversationId,
        "You are now connected to live support. A superadmin has been notified and will continue this thread.",
      );
    },
    [addAiMessage, conversations, profile?.full_name, profile?.id, profile?.tenant_id, sendEmail, superadmins],
  );

  const isConversationLiveAgent = useCallback(
    (conversationId) => {
      const current = conversations.find((c) => c.id === conversationId);
      if (!current) return false;
      return (
        !!current.assigned_superadmin_id ||
        (current.subject || "").startsWith("[LIVE AGENT]")
      );
    },
    [conversations],
  );

  const sendChatMessage = useCallback(async () => {
    const body = chatDraft.trim();
    if (!body && !chatAttachment) return;
    setSendingChat(true);
    try {
      let conversationId = selectedConversationId;
      if (!conversationId) {
        if (!profile?.id) {
          conversationId = GUEST_CONVERSATION_ID;
          setSelectedConversationId(GUEST_CONVERSATION_ID);
        } else {
          return;
        }
      }

      if (!profile?.id) {
        if (chatAttachment) {
          message.warning("Guest chat supports text only. Sign in to send files.");
          setChatAttachment(null);
        }
        setChatDraft("");
        const escalationRequested = LIVE_AGENT_REGEX.test(body) || OFFENSIVE_REGEX.test(body);
        if (escalationRequested) {
          addAiMessage(
            conversationId,
            "I can help with immediate guidance here. For live agent handoff, please sign in or submit a support ticket with your email.",
          );
          return;
        }
        try {
          const aiReply = await groq(body);
          addAiMessage(
            conversationId,
            aiReply || "I can help further. You can also submit a ticket for follow-up.",
          );
        } catch {
          addAiMessage(
            conversationId,
            "I can help with this. If you need deeper follow-up, submit a support ticket and the team will contact you.",
          );
        }
        return;
      }
      let attachment = {
        attachment_url: null,
        attachment_name: null,
        attachment_size: null,
        attachment_type: null,
      };
      if (chatAttachment) {
        attachment = await uploadSupportFile(chatAttachment);
      }
      const { error } = await supabase.from("support_messages").insert([
        {
          conversation_id: conversationId,
          sender_id: profile.id,
          content: body || null,
          ...attachment,
        },
      ]);
      if (error) throw error;
      await supabase
        .from("support_conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", conversationId);
      setChatDraft("");
      setChatAttachment(null);
      await Promise.all([loadConversations({ silent: true }), loadMessages(conversationId)]);

      const escalationRequested = LIVE_AGENT_REGEX.test(body) || OFFENSIVE_REGEX.test(body);
      const liveAgentConnected = isConversationLiveAgent(conversationId);

      if (escalationRequested) {
        if (!liveAgentConnected) {
          await escalateConversation(conversationId, body);
        }
        return;
      }

      if (liveAgentConnected) {
        return;
      }

      try {
        const aiReply = await groq(body);
        addAiMessage(
          conversationId,
          aiReply || "I can help further. Ask for a live agent anytime and I will escalate this chat.",
        );
      } catch {
        addAiMessage(
          conversationId,
          "I can help with this. If you prefer, ask for a live agent and I will escalate immediately.",
        );
      }
    } finally {
      setSendingChat(false);
    }
  }, [
    addAiMessage,
    chatAttachment,
    chatDraft,
    escalateConversation,
    groq,
    isConversationLiveAgent,
    loadConversations,
    loadMessages,
    profile?.id,
    selectedConversationId,
    uploadSupportFile,
  ]);

  useEffect(() => {
    let active = true;
    const loadAnimation = async () => {
      try {
        const response = await fetch("/customersupport.json");
        if (!response.ok) return;
        const data = await response.json();
        if (active) setSupportAnimation(data);
      } catch {
        // No-op: hero will fallback to a static placeholder.
      }
    };
    loadAnimation();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!profile?.id) return;
    loadConversations({ silent: false }).catch(() => {});
    loadSuperadmins().catch(() => {});
  }, [loadConversations, loadSuperadmins, profile?.id]);

  useEffect(() => {
    if (!selectedConversationId) {
      setMessagesState([]);
      return;
    }
    loadMessages(selectedConversationId).catch(() => {});
  }, [loadMessages, selectedConversationId]);

  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`support-product-${profile.id}-${selectedConversationId || "none"}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_conversations" },
        () => loadConversations({ silent: true }),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_messages" },
        (payload) => {
          const cid = payload.new?.conversation_id || payload.old?.conversation_id;
          if (selectedConversationId && cid === selectedConversationId) {
            loadMessages(selectedConversationId).catch(() => {});
          }
          loadConversations({ silent: true });
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadConversations, loadMessages, profile?.id, selectedConversationId]);

  return (
    <div className="min-h-screen bg-[#f5f8ff] text-slate-900" style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes supportPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26,77,167,0.24); }
          70% { transform: scale(1.03); box-shadow: 0 0 0 16px rgba(26,77,167,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(26,77,167,0); }
        }
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.8)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_8%_18%,rgba(105,165,255,0.26)_0%,rgba(245,248,255,0)_46%),radial-gradient(circle_at_88%_14%,rgba(98,194,173,0.2)_0%,rgba(245,248,255,0)_44%),linear-gradient(180deg,#f7faff_0%,#ebf3ff_58%,#dce9ff_100%)] pb-20 pt-32 md:pb-24 md:pt-36">
        <div className="mx-auto grid w-full max-w-[1240px] items-start gap-8 px-6 md:grid-cols-[minmax(0,1fr)_520px] md:px-10">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-[#d5e2fa] bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-[0.13em] text-[#1f4da1]">
              <LifeBuoy size={12} />
              Dedicated support experience
            </p>
            <h1 className="mt-5 max-w-3xl text-[clamp(34px,5.6vw,60px)] font-bold leading-[1.03] tracking-[-0.04em] text-[#10213f]">
              Resolve Issues Faster with Live Chat and Structured Ticketing
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-slate-600 md:text-[17px]">
              A separate support workspace designed for speed: instant live chat for urgent questions and detailed ticket
              submission for technical issues that need structured follow-through.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setChatOpen(true)}
                className="inline-flex items-center gap-1 rounded-full bg-[#1a4da7] px-5 py-2.5 text-[12px] font-bold text-white no-underline"
              >
                Open live chat
                <ArrowRight size={13} />
              </button>
              <a
                href="#ticket-form"
                className="rounded-full border border-[#1a4da7] bg-white px-5 py-2.5 text-[12px] font-bold text-[#1a4da7] no-underline"
              >
                Submit ticket demo
              </a>
            </div>
          </div>

          <div className="w-full">
            {supportAnimation ? (
              <Lottie
                animationData={supportAnimation}
                loop
                autoplay
                className="h-[360px] w-full md:h-[430px]"
              />
            ) : (
              <div className="flex h-[360px] w-full items-center justify-center md:h-[430px]">
                <div className="inline-flex items-center gap-2 text-[11px] font-bold text-[#1a4da7]">
                  <Headset size={14} />
                  Loading support animation...
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-6 pb-24 pt-14 md:px-10">
        <section className="rounded-[24px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Live chat widget</p>
              <h2 className="mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-[#13284f]">
                Floating Chat at Bottom-Right for Instant Support
              </h2>
              <p className="mt-3 max-w-3xl text-[14px] leading-7 text-slate-600">
                Users can open support from any point on the page. The floating launcher opens a full chat panel
                with conversation list, status badges, SLA tracking, and attachment-ready messaging.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setChatOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#1a4da7] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#163f89]"
            >
              Launch chat widget
              <MessageCircleMore size={14} />
            </button>
          </div>
        </section>

        <section id="ticket-form" className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <article className="rounded-[24px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Ticket submission</p>
            <h2 className="mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-[#13284f]">
              Submit Detailed Issues with Priority, Context, and Attachments
            </h2>
            <p className="mt-3 text-[14px] leading-7 text-slate-600">
              Structured ticket forms reduce back-and-forth. Provide clear issue details, pick severity, attach evidence,
              and track updates in one thread until resolution.
            </p>

            <form onSubmit={createTicket}>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="text-[12px] font-bold text-slate-600">
                Ticket title
                <input
                  type="text"
                  value={ticket.title}
                  onChange={(e) => handleTicketChange("title", e.target.value)}
                  placeholder="Example: Unable to upload signed contracts"
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe5f9] bg-[#f8fbff] px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#1a4da7] focus:bg-white"
                />
              </label>
              {!profile?.id ? (
                <label className="text-[12px] font-bold text-slate-600">
                  Email
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="Enter your email for support updates"
                    className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe5f9] bg-[#f8fbff] px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#1a4da7] focus:bg-white"
                  />
                </label>
              ) : null}
              <label className="text-[12px] font-bold text-slate-600">
                Priority
                <select
                  value={ticket.priority}
                  onChange={(e) => handleTicketChange("priority", e.target.value)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-[#dbe5f9] bg-[#f8fbff] px-3 text-[13px] text-slate-700 outline-none transition focus:border-[#1a4da7] focus:bg-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
              <label className="text-[12px] font-bold text-slate-600">
                Attachment
                <input
                  ref={ticketAttachmentInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setTicketAttachment(file);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={() => ticketAttachmentInputRef.current?.click()}
                  className="mt-1.5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#b9caec] bg-[#f8fbff] text-[13px] font-semibold text-[#1a4da7] transition hover:bg-white"
                >
                  <Paperclip size={14} />
                  {ticketAttachment ? ticketAttachment.name : "Add screenshot or logs"}
                </button>
              </label>
              </div>

              <label className="mt-4 block text-[12px] font-bold text-slate-600">
                Issue details
                <textarea
                  value={ticket.details}
                  onChange={(e) => handleTicketChange("details", e.target.value)}
                  rows={5}
                  placeholder="Describe what happened, expected behavior, and any reproducible steps."
                  className="mt-1.5 w-full rounded-xl border border-[#dbe5f9] bg-[#f8fbff] px-3 py-2 text-[13px] leading-6 text-slate-700 outline-none transition focus:border-[#1a4da7] focus:bg-white"
                />
              </label>

              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={creatingTicket}
                  className="rounded-full bg-[#1a4da7] px-5 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#163f89] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingTicket ? "Submitting..." : "Submit ticket"}
                </button>
              </div>
            </form>
          </article>

          <aside className="rounded-[24px] border border-[#dce7fb] bg-white p-5 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">What you get</p>
            <div className="mt-3 space-y-3">
              {[
                "Live chat for fast troubleshooting and status checks",
                "Ticket threads with attachments and history",
                "Priority-aware triage for urgent incidents",
                "Transparent resolution notes and handoff context",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-xl bg-[#f7faff] p-3">
                  <CheckCircle2 size={15} className="mt-0.5 text-[#1a4da7]" />
                  <p className="text-[13px] leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-[#d7e6ff] bg-[linear-gradient(160deg,#f8fbff_0%,#eef5ff_100%)] p-4">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Support availability</p>
              <p className="mt-2 text-[20px] font-bold text-[#11264a]">24/7 Coverage</p>
              <p className="mt-1 text-[12px] leading-6 text-slate-600">
                Priority queues and technical escalation paths for platform-critical issues.
              </p>
            </div>
          </aside>
        </section>

        <section className="mt-10 rounded-[24px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Ticket lifecycle</p>
          <h3 className="mt-2 text-[30px] font-bold leading-[1.05] tracking-[-0.03em] text-[#13284f]">
            Designed for Traceable Resolution from First Report to Final Fix
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {ticketPipeline.map((stage) => {
              const Icon = stage.icon;
              return (
                <article key={stage.title} className="rounded-2xl border border-[#e4ecfb] bg-[#f9fbff] p-4">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#1a4da7] shadow-[0_8px_18px_rgba(26,77,167,0.12)]">
                    <Icon size={16} />
                  </span>
                  <p className="mt-3 text-[17px] font-bold text-[#1a315a]">{stage.title}</p>
                  <p className="mt-1 text-[13px] leading-6 text-slate-600">{stage.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mt-10 rounded-[24px] border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">Need instant help?</p>
              <h4 className="mt-1 text-[28px] font-bold tracking-[-0.03em] text-[#13284f]">Start with live chat, escalate with tickets</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                to="/register"
                className="rounded-full bg-[#1a4da7] px-5 py-2.5 text-[12px] font-bold text-white no-underline"
              >
                Start free trial
              </Link>
              <a
                href="https://calendly.com/shahbazrafique101/ryzent-demo"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#1a4da7] bg-white px-5 py-2.5 text-[12px] font-bold text-[#1a4da7] no-underline"
              >
                Book support demo
              </a>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-5 right-5 z-[60] md:bottom-6 md:right-6">
        {chatOpen ? (
          <div className="mb-3 h-[72vh] max-h-[620px] w-[92vw] max-w-[560px] overflow-hidden rounded-[22px] border border-[#d7e4fb] bg-white shadow-[0_28px_60px_rgba(14,39,82,0.24)]">
            <div className="flex items-center justify-between border-b border-[#e5ecfb] bg-[linear-gradient(180deg,#f8fbff_0%,#f1f6ff_100%)] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-[#d7e4fb]">
                  <img
                    src="/Ryzent.png"
                    alt="Ryzent"
                    className="h-7 w-7 rounded-full object-cover"
                  />
                </span>
                <div>
                  <p className="text-[13px] font-bold text-[#1b315a]">Ryzent Live Support</p>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.09em] text-[#1a4da7]">Online now</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="h-[calc(100%-57px)]">
              {!closeReviewOpen ? (
                <section className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-[#e6ecf9] px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Active thread</p>
                    <p className="text-[15px] font-bold text-[#13284f]">
                      {selectedConversation?.subject || "Live Support"}
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-[#dce7fb] bg-[#f8fbff] px-2.5 py-1">
                      <Clock3 size={12} className="text-[#1a4da7]" />
                      <span className="text-[10px] font-bold text-[#1a4da7]">SLA</span>
                    </div>
                    {selectedConversationId ? (
                      <button
                        type="button"
                        onClick={() => setCloseReviewOpen(true)}
                        className="rounded-full border border-[#e4b9b9] bg-[#fff5f5] px-2.5 py-1 text-[10px] font-bold text-[#b13f3f]"
                      >
                        Close chat
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="flex-1 overflow-y-scroll p-4" style={{ scrollbarWidth: "thin" }}>
                  {loadingChat && profile?.id && !selectedConversationId ? (
                    <div className="text-[12px] text-slate-500">Loading conversations...</div>
                  ) : !selectedConversationId ? (
                    <div className="rounded-xl border border-[#e6ecfa] bg-[#f8faff] p-3">
                      <p className="mb-2 text-[11px] font-semibold text-slate-600">
                        Choose a Ryzent support topic to start chat:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {RYZENT_SUPPORT_TOPICS.map((topic) => (
                          <button
                            key={topic}
                            type="button"
                            onClick={() => startConversationByTopic(topic)}
                            className="rounded-full border border-[#d5e2fa] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#1a4da7] hover:bg-[#f1f6ff]"
                          >
                            {topic}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : combinedThreadMessages.length === 0 ? (
                    <div className="text-[12px] text-slate-500">
                      Send a message to continue this Ryzent support conversation.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {combinedThreadMessages.map((messageItem, index) => {
                        const isAi = !!messageItem.is_ai;
                        const isMine = !isAi && messageItem.sender_id === profile?.id;
                        const isSupport = isAi || !isMine;
                        return (
                          <div key={messageItem.id || `${messageItem.created_at}-${index}`} className={`flex ${isSupport ? "justify-start" : "justify-end"}`}>
                            <div
                              className={`max-w-[84%] rounded-2xl px-3 py-2.5 text-[12px] leading-6 ${
                                isSupport
                                  ? "rounded-bl-sm border border-[#dce8ff] bg-[#f4f8ff] text-[#14305d]"
                                  : "rounded-br-sm bg-[#173f85] text-white"
                              }`}
                            >
                              {messageItem.content}
                              {messageItem.attachment_url ? (
                                <a
                                  href={messageItem.attachment_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-1.5 block text-[11px] underline"
                                >
                                  {messageItem.attachment_name || "Attachment"}
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="border-t border-[#e6ecf9] p-3">
                  {chatAttachment ? (
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-[#f4f8ff] px-2.5 py-1.5 text-[11px] text-[#1a4da7]">
                      <span className="truncate">{chatAttachment.name}</span>
                      <button
                        type="button"
                        onClick={() => setChatAttachment(null)}
                        className="rounded px-1 text-[#7a8da8] hover:bg-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-center gap-2 rounded-xl border border-[#d9e6ff] bg-[#f7faff] p-2">
                    <input
                      ref={attachmentInputRef}
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setChatAttachment(file);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => attachmentInputRef.current?.click()}
                      disabled={!selectedConversationId || sendingChat || !profile?.id}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Paperclip size={15} />
                    </button>
                    <input
                      type="text"
                      value={chatDraft}
                      onChange={(e) => setChatDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && selectedConversationId) sendChatMessage();
                      }}
                      placeholder={
                        selectedConversationId
                          ? "Write a support message..."
                          : "Choose a Ryzent topic to start"
                      }
                      disabled={!selectedConversationId || sendingChat}
                      className="h-9 w-full border-none bg-transparent text-[13px] text-slate-700 outline-none placeholder:text-slate-400"
                    />
                    <button
                      type="button"
                      disabled={!selectedConversationId || sendingChat || (!chatDraft.trim() && !chatAttachment)}
                      onClick={sendChatMessage}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1a4da7] text-white transition hover:bg-[#163f89] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>
                </section>
              ) : (
                <section className="flex h-full flex-col">
                  <div className="border-b border-[#e6ecf9] px-4 py-3">
                    <p className="text-[13px] font-bold text-[#1b315a]">Before closing, rate your support chat</p>
                    <p className="mt-1 text-[11px] text-slate-500">Your feedback helps us improve response quality.</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: "thin" }}>
                    <div className="mt-1 flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setCloseRating(n)}
                          className={`inline-flex h-8 w-8 items-center justify-center rounded-full border ${
                            closeRating >= n
                              ? "border-[#f0b429] bg-[#fff8e6] text-[#c47a00]"
                              : "border-[#dbe5f8] bg-white text-slate-400"
                          }`}
                          aria-label={`Rate ${n}`}
                        >
                          <Star size={14} fill={closeRating >= n ? "currentColor" : "none"} />
                        </button>
                      ))}
                    </div>

                    <textarea
                      value={closeFeedback}
                      onChange={(e) => setCloseFeedback(e.target.value)}
                      placeholder="Optional feedback..."
                      className="mt-4 w-full rounded-xl border border-[#dbe5f8] bg-[#f8fbff] px-3 py-2 text-[12px] text-slate-700 outline-none"
                      rows={5}
                    />
                  </div>

                  <div className="border-t border-[#e6ecf9] p-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setCloseReviewOpen(false)}
                        className="rounded-full border border-[#d7e4fb] bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600"
                      >
                        Back to chat
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setCloseReviewOpen(false);
                          setCloseRating(0);
                          setCloseFeedback("");
                          await closeConversation();
                        }}
                        className="rounded-full border border-[#d7e4fb] bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600"
                      >
                        Skip & Close
                      </button>
                      <button
                        type="button"
                        onClick={submitCloseReview}
                        className="rounded-full bg-[#1a4da7] px-3 py-1.5 text-[11px] font-bold text-white"
                      >
                        Submit & Close
                      </button>
                    </div>
                  </div>
                </section>
              )}
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setChatOpen((prev) => !prev)}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-[#1a4da7] text-white shadow-[0_20px_44px_rgba(18,54,111,0.35)] transition hover:bg-[#163f89]"
          style={{ animation: !chatOpen ? "supportPulse 2.2s ease-in-out infinite" : "none" }}
          aria-label={chatOpen ? "Close support chat" : "Open support chat"}
        >
          {chatOpen ? <X size={20} /> : <MessageCircleMore size={22} />}
        </button>
      </div>

      <ProductCtaFooterSection />
    </div>
  );
}
