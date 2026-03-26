import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Button,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  Select,
  DatePicker,
  Drawer,
  Tooltip,
  Badge,
  Dropdown,
  Space,
  Divider,
  Empty,
  message,
  Switch,
  InputNumber,
  Popconfirm,
  Spin,
  Tabs,
} from "antd";
import {
  Plus,
  Copy,
  Eye,
  Trash2,
  User,
  Calendar,
  MoreHorizontal,
  FileText,
  Users,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  GripVertical,
  Send,
  Download,
  Loader2,
  Palette,
  Link,
  Link2,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";
import dayjs from "dayjs";
import { supabase } from "../lib/supabase";

const EMAIL_API = import.meta.env.VITE_EMAIL_API_URL || "http://localhost:3001";
const EMAIL_KEY = import.meta.env.VITE_EMAIL_API_KEY || "";

const { Option } = Select;
const { TextArea } = Input;

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

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "URL / Link" },
  { value: "number", label: "Number" },
  { value: "select", label: "Dropdown" },
  { value: "file", label: "File Upload" },
  { value: "date", label: "Date" },
];

const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Human Resources",
  "Sales",
  "Finance",
  "Operations",
  "Product",
];

const DEFAULT_FIELDS = [
  { id: "df1", type: "text", label: "Full Name", required: true },
  { id: "df2", type: "email", label: "Email Address", required: true },
  { id: "df3", type: "phone", label: "Phone Number", required: true },
  { id: "df4", type: "file", label: "Upload CV / Resume", required: true },
];

const ACCENT_SWATCHES = [
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#0f172a",
  "#0ea5e9",
  "#14b8a6",
];

const EMAIL_TEMPLATES = [
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview Scheduled" },
  { value: "offer", label: "Offer Letter" },
  { value: "rejected", label: "Rejection" },
  { value: "custom", label: "Custom Message" },
];

const DEFAULT_SUBJECTS = {
  shortlisted: (job, co) =>
    `Great news! You've been shortlisted — ${job} at ${co}`,
  interview_scheduled: (job, co) => `Interview Scheduled — ${job} at ${co}`,
  offer: (job, co) => `Job Offer — ${job} at ${co}`,
  rejected: (job, co) => `Your application for ${job} at ${co}`,
  custom: () => "",
};

const PUBLIC_DOMAIN =
  import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;

const DEFAULT_BRANDING = {
  company_name: "",
  tagline: "",
  logo_url: "",
  accent_color: "#3b82f6",
  sendTrackingLink: true,
};

/* ── Helpers ─────────────────────────────────────────────────────────────── */
const stageInfo = (key) =>
  STAGES.find((s) => s.key === key) || {
    label: key,
    color: "#94a3b8",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };

const copyLink = (jobId) => {
  navigator.clipboard
    .writeText(`${PUBLIC_DOMAIN}/apply/${jobId}`)
    .then(() => message.success("Link copied!"));
};

const mapJob = (r) => ({
  id: r.id,
  title: r.title,
  department: r.department,
  status: r.status,
  deadline: r.deadline,
  fields: r.fields || [],
  branding: r.branding || null,
  tenantId: r.tenant_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

const mapApplicant = (r) => ({
  id: r.id,
  jobId: r.job_id,
  tenantId: r.tenant_id,
  name: r.name,
  email: r.email,
  phone: r.phone,
  stage: r.stage,
  score: r.score,
  interviewDate: r.interview_date
    ? dayjs(r.interview_date).format("YYYY-MM-DD HH:mm")
    : null,
  notes: r.notes || "",
  answers: r.answers || {},
  cvUrl: r.cv_url,
  appliedAt: r.applied_at ? dayjs(r.applied_at).format("YYYY-MM-DD") : "",
});

const scoreColor = (s) =>
  s >= 80 ? "#10b981" : s >= 50 ? "#f59e0b" : "#ef4444";

const sendTrackingEmail = async ({
  applicantId,
  applicantName,
  applicantEmail,
  jobTitle,
  companyName,
  fromEmail,
  fromName,
}) => {
  const trackingUrl = `${PUBLIC_DOMAIN}/track/${applicantId}`;
  try {
    await fetch(`${EMAIL_API}/api/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${EMAIL_KEY}`,
      },
      body: JSON.stringify({
        to: applicantEmail,
        fromName: fromName || companyName || "Recruitment Team",
        fromEmail: fromEmail || import.meta.env.VITE_DEFAULT_FROM_EMAIL || "",
        subject: `Your application for ${jobTitle}${companyName ? ` at ${companyName}` : ""} — Track your status`,
        templateType: "application_received",
        applicantName,
        jobTitle,
        companyName: companyName || "",
        trackingUrl,
      }),
    });
  } catch (err) {
    console.warn("Tracking email failed to send:", err.message);
  }
};

/* ── UI sub-components ───────────────────────────────────────────────────── */
const KpiCard = ({ icon, value, label, color }) => (
  <div
    className="rec-kpi rec-fade"
    style={{
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: 14,
      padding: "18px 20px",
      display: "flex",
      alignItems: "center",
      gap: 14,
    }}
  >
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: `${color}15`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
    <div>
      <div
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: "#0f172a",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 12,
          color: "#94a3b8",
          marginTop: 3,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

const StageBadge = ({ stage }) => {
  const s = stageInfo(stage);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 10px",
        borderRadius: 6,
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: s.color,
          display: "inline-block",
        }}
      />
      {s.label}
    </span>
  );
};

/* Tenant badge shown in header */
const TenantBadge = () => <></>;

const lbl = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "#374151",
  marginBottom: 5,
  letterSpacing: "0.02em",
};

/* ── JobBrandingTab ──────────────────────────────────────────────────────── */
const JobBrandingTab = ({ branding, onChange }) => {
  const b = branding || DEFAULT_BRANDING;
  const accent = b.accent_color || "#3b82f6";
  const sendTracking = b.sendTrackingLink !== false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={lbl}>Company Name</label>
            <Input
              value={b.company_name}
              onChange={(e) => onChange({ ...b, company_name: e.target.value })}
              placeholder="e.g. Acme Corp"
            />
          </div>
          <div>
            <label style={lbl}>
              Tagline{" "}
              <span style={{ color: "#94a3b8", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <Input
              value={b.tagline}
              onChange={(e) => onChange({ ...b, tagline: e.target.value })}
              placeholder="e.g. We're building something great"
            />
          </div>
          <div>
            <label style={lbl}>Logo URL</label>
            <Input
              prefix={<Link size={13} color="#94a3b8" />}
              value={b.logo_url}
              onChange={(e) => onChange({ ...b, logo_url: e.target.value })}
              placeholder="https://…/logo.png"
            />
          </div>
          <div>
            <label style={lbl}>Accent Colour</label>
            <Input
              value={b.accent_color}
              onChange={(e) => onChange({ ...b, accent_color: e.target.value })}
              prefix={
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 3,
                    background: accent,
                    border: "1px solid #e2e8f0",
                  }}
                />
              }
              placeholder="#3b82f6"
              style={{ marginBottom: 10 }}
            />
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
              {ACCENT_SWATCHES.map((col) => (
                <div
                  key={col}
                  onClick={() => onChange({ ...b, accent_color: col })}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: col,
                    cursor: "pointer",
                    border:
                      b.accent_color === col
                        ? "3px solid #0f172a"
                        : "2px solid transparent",
                    transition: "border 0.12s",
                    boxShadow:
                      b.accent_color === col ? "0 0 0 1px #fff inset" : "none",
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.06em",
              marginBottom: 10,
            }}
          >
            LIVE PREVIEW
          </div>
          <div
            style={{
              background: "#f8fafc",
              borderRadius: 12,
              padding: "18px 14px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 14,
              }}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt=""
                  style={{ height: 26, objectFit: "contain", borderRadius: 4 }}
                  onError={(e) => {
                    e.target.style.display = "none";
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 7,
                    background: accent,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: 13,
                  }}
                >
                  {(b.company_name || "A").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div
                  style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}
                >
                  {b.company_name || "Company Name"}
                </div>
                {b.tagline && (
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>
                    {b.tagline}
                  </div>
                )}
              </div>
            </div>
            <div
              style={{
                background: "#fff",
                borderRadius: 10,
                padding: 14,
                border: "1px solid #e2e8f0",
              }}
            >
              <div
                style={{
                  display: "inline-block",
                  background: `${accent}18`,
                  color: accent,
                  borderRadius: 5,
                  padding: "2px 8px",
                  fontSize: 10,
                  fontWeight: 700,
                  marginBottom: 7,
                }}
              >
                Design
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: 4,
                }}
              >
                UI/UX Designer
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#f59e0b",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} /> Deadline: Mar 1, 2025
              </div>
              {["Full Name *", "Email Address *", "Resume *"].map((l) => (
                <div key={l} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#374151",
                      marginBottom: 3,
                    }}
                  >
                    {l}
                  </div>
                  <div
                    style={{
                      height: 26,
                      borderRadius: 5,
                      border: "1px solid #e2e8f0",
                      background: "#fafafa",
                    }}
                  />
                </div>
              ))}
              <div
                style={{
                  height: 34,
                  borderRadius: 7,
                  background: accent,
                  marginTop: 12,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 12,
                }}
              >
                Submit Application
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 16,
          padding: "16px 18px",
          background: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              flexShrink: 0,
              background: sendTracking ? "#eff6ff" : "#f8fafc",
              border: `1px solid ${sendTracking ? "#bfdbfe" : "#e2e8f0"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: sendTracking ? "#3b82f6" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            <Link2 size={15} />
          </div>
          <div>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 2,
              }}
            >
              Send tracking link to applicant
            </div>
            <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              When enabled, the confirmation email will include a personal link
              so applicants can track their application status in real time.
            </div>
          </div>
        </div>
        <Switch
          checked={sendTracking}
          onChange={(v) => onChange({ ...b, sendTrackingLink: v })}
          style={{ flexShrink: 0, marginTop: 4 }}
        />
      </div>
    </div>
  );
};

/* ── FormBuilderModal ────────────────────────────────────────────────────── */
const FormBuilderModal = ({ open, job, onClose, onSave, saving }) => {
  const [fields, setFields] = useState([]);
  const [adding, setAdding] = useState(false);
  const [newField, setNewField] = useState({
    type: "text",
    label: "",
    required: false,
    options: "",
  });
  const [activeTab, setActiveTab] = useState("fields");
  const [branding, setBranding] = useState(DEFAULT_BRANDING);

  useEffect(() => {
    if (job) {
      setFields(job.fields || []);
      setBranding(job.branding || DEFAULT_BRANDING);
      setActiveTab("fields");
    }
  }, [job]);

  const addField = () => {
    if (!newField.label.trim())
      return message.warning("Field label is required");
    setFields([
      ...fields,
      {
        id: `f${Date.now()}`,
        type: newField.type,
        label: newField.label,
        required: newField.required,
        options:
          newField.type === "select"
            ? newField.options
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined,
      },
    ]);
    setNewField({ type: "text", label: "", required: false, options: "" });
    setAdding(false);
  };

  const tabItems = [
    {
      key: "fields",
      label: (
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <FileText size={13} style={{ marginRight: 6 }} />
          Form Fields
        </span>
      ),
      children: (
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>
            Configure the fields candidates will fill in when applying.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              marginBottom: 16,
              maxHeight: 300,
              overflowY: "auto",
            }}
          >
            {fields.length === 0 && (
              <Empty
                description="No fields yet."
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
            {fields.map((f, idx) => (
              <div
                key={f.id}
                className="rec-slide"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "11px 14px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 10,
                  background: "#f8fafc",
                  animationDelay: `${idx * 30}ms`,
                }}
              >
                <GripVertical
                  size={14}
                  color="#cbd5e1"
                  style={{ cursor: "grab" }}
                />
                <div style={{ flex: 1 }}>
                  <span
                    style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}
                  >
                    {f.label}
                  </span>
                  <span
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      color: "#94a3b8",
                      background: "#e2e8f0",
                      padding: "1px 6px",
                      borderRadius: 4,
                    }}
                  >
                    {f.type}
                  </span>
                  {f.required && (
                    <span
                      style={{
                        marginLeft: 6,
                        fontSize: 10,
                        background: "#fef2f2",
                        color: "#ef4444",
                        padding: "1px 6px",
                        borderRadius: 4,
                        fontWeight: 700,
                      }}
                    >
                      Required
                    </span>
                  )}
                  {f.options?.length > 0 && (
                    <span
                      style={{ fontSize: 11, color: "#64748b", marginLeft: 8 }}
                    >
                      Options: {f.options.join(", ")}
                    </span>
                  )}
                </div>
                <Popconfirm
                  title="Remove this field?"
                  onConfirm={() =>
                    setFields(fields.filter((x) => x.id !== f.id))
                  }
                  okButtonProps={{ danger: true }}
                >
                  <Button
                    type="text"
                    icon={<Trash2 size={13} />}
                    size="small"
                    danger
                  />
                </Popconfirm>
              </div>
            ))}
          </div>
          {adding ? (
            <div
              style={{
                padding: "14px 16px",
                border: "1.5px dashed #3b82f6",
                borderRadius: 12,
                background: "#eff6ff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginBottom: 10,
                }}
              >
                <Select
                  value={newField.type}
                  onChange={(v) => setNewField({ ...newField, type: v })}
                  style={{ width: 150 }}
                >
                  {FIELD_TYPES.map((t) => (
                    <Option key={t.value} value={t.value}>
                      {t.label}
                    </Option>
                  ))}
                </Select>
                <Input
                  placeholder="Field label e.g. Portfolio URL"
                  value={newField.label}
                  onChange={(e) =>
                    setNewField({ ...newField, label: e.target.value })
                  }
                  style={{ flex: 1, minWidth: 180 }}
                  onPressEnter={addField}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Switch
                    size="small"
                    checked={newField.required}
                    onChange={(v) => setNewField({ ...newField, required: v })}
                  />
                  <span style={{ fontSize: 12, color: "#64748b" }}>
                    Required
                  </span>
                </div>
              </div>
              {newField.type === "select" && (
                <Input
                  placeholder="Comma-separated options: Junior, Mid, Senior"
                  value={newField.options}
                  onChange={(e) =>
                    setNewField({ ...newField, options: e.target.value })
                  }
                  style={{ marginBottom: 10 }}
                />
              )}
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={addField}
                  style={{ background: "#3b82f6", borderColor: "#3b82f6" }}
                >
                  Add Field
                </Button>
                <Button size="small" onClick={() => setAdding(false)}>
                  Cancel
                </Button>
              </Space>
            </div>
          ) : (
            <Button
              icon={<Plus size={13} />}
              onClick={() => setAdding(true)}
              block
              style={{
                borderStyle: "dashed",
                borderRadius: 8,
                height: 38,
                fontWeight: 600,
              }}
            >
              Add Field
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "branding",
      label: (
        <span style={{ fontWeight: 600, fontSize: 13 }}>
          <Palette size={13} style={{ marginRight: 6 }} />
          Branding & Settings
        </span>
      ),
      children: (
        <div style={{ paddingTop: 8 }}>
          <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16 }}>
            Customize how this job's application form appears to candidates, and
            configure email settings.
          </p>
          <JobBrandingTab branding={branding} onChange={setBranding} />
        </div>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              fontSize: 15,
            }}
          >
            <FileText size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Form Builder</div>
            <div style={{ fontSize: 12, color: "#94a3b8", fontWeight: 400 }}>
              {job?.title}
            </div>
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={() => onSave(fields, branding)}
      okText={saving ? "Saving…" : "Save"}
      confirmLoading={saving}
      width={760}
      okButtonProps={{
        style: {
          background: "#0f172a",
          borderColor: "#0f172a",
          fontWeight: 600,
        },
      }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginTop: 4 }}
      />
    </Modal>
  );
};

/* ── EmailModal ──────────────────────────────────────────────────────────── */
const EmailModal = ({ open, applicant, job, onClose }) => {
  const [form] = Form.useForm();
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState("custom");
  const branding = job?.branding || DEFAULT_BRANDING;

  useEffect(() => {
    if (!open || !applicant || !job) return;
    const company = branding.company_name || "Our Company";
    const subjectFn = DEFAULT_SUBJECTS[template];
    form.setFieldsValue({
      to: applicant.email,
      fromName: company,
      fromEmail: import.meta.env.VITE_DEFAULT_FROM_EMAIL || "",
      subject: subjectFn ? subjectFn(job.title, company) : "",
      templateType: template,
      applicantName: applicant.name,
      jobTitle: job.title,
      companyName: company,
      logoUrl: branding.logo_url || "",
      interviewDate: applicant.interviewDate?.split(" ")[0] || "",
      interviewTime: applicant.interviewDate?.split(" ")[1] || "",
      interviewFormat: "Video Call",
      meetingLink: "",
      interviewerName: "",
      salary: "",
      startDate: "",
      offerExpiry: "",
      hrName: "",
      customMessage: "",
      body: "",
    });
  }, [open, applicant, job, template]);

  const handleTemplateChange = (val) => {
    setTemplate(val);
    const company = branding.company_name || "Our Company";
    const subjectFn = DEFAULT_SUBJECTS[val];
    if (subjectFn && job)
      form.setFieldValue("subject", subjectFn(job.title, company));
    form.setFieldValue("templateType", val);
  };

  const send = async () => {
    const values = await form.validateFields();
    setSending(true);
    try {
      const res = await fetch(`${EMAIL_API}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${EMAIL_KEY}`,
        },
        body: JSON.stringify({ ...values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Email failed");
      message.success(`Email sent to ${values.to}`);
      onClose();
    } catch (err) {
      message.error("Failed to send: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const showInterview = template === "interview_scheduled";
  const showOffer = template === "offer";
  const showReject = template === "rejected";
  const showCustom = template === "custom";

  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
            }}
          >
            <Mail size={15} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Send Email</div>
            {applicant && (
              <div style={{ fontSize: 12, color: "#94a3b8" }}>
                to {applicant.name} · {applicant.email}
              </div>
            )}
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={send}
      okText={sending ? "Sending…" : "Send Email"}
      confirmLoading={sending}
      width={580}
      okButtonProps={{
        style: {
          background: "#3b82f6",
          borderColor: "#3b82f6",
          fontWeight: 600,
        },
        icon: <Send size={13} />,
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <Form.Item
            name="fromName"
            label="From Name"
            rules={[{ required: true }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="fromEmail"
            label="From Email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input />
          </Form.Item>
        </div>
        <Form.Item
          name="to"
          label="To"
          rules={[{ required: true, type: "email" }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="templateType" label="Template">
          <Select onChange={handleTemplateChange} value={template}>
            {EMAIL_TEMPLATES.map((t) => (
              <Option key={t.value} value={t.value}>
                {t.label}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item name="subject" label="Subject" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="applicantName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="jobTitle" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="companyName" hidden>
          <Input />
        </Form.Item>
        <Form.Item name="logoUrl" hidden>
          <Input />
        </Form.Item>
        {showInterview && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              INTERVIEW DETAILS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Form.Item
                name="interviewDate"
                label="Date"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="Mon, 20 Jan 2025" />
              </Form.Item>
              <Form.Item
                name="interviewTime"
                label="Time"
                rules={[{ required: true }]}
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="10:00 AM" />
              </Form.Item>
              <Form.Item
                name="interviewFormat"
                label="Format"
                style={{ marginBottom: 8 }}
              >
                <Select>
                  <Option value="Video Call">Video Call</Option>
                  <Option value="Phone Call">Phone Call</Option>
                  <Option value="In Person">In Person</Option>
                </Select>
              </Form.Item>
              <Form.Item
                name="interviewerName"
                label="Interviewer"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="Sarah from HR" />
              </Form.Item>
            </div>
            <Form.Item
              name="meetingLink"
              label="Meeting Link"
              style={{ marginBottom: 0 }}
            >
              <Input placeholder="https://meet.google.com/…" />
            </Form.Item>
          </div>
        )}
        {showOffer && (
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: "#94a3b8",
                letterSpacing: "0.06em",
                marginBottom: 10,
              }}
            >
              OFFER DETAILS
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <Form.Item
                name="salary"
                label="Salary"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="$60,000/year" />
              </Form.Item>
              <Form.Item
                name="startDate"
                label="Start Date"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="1 Feb 2025" />
              </Form.Item>
              <Form.Item
                name="offerExpiry"
                label="Offer Expires"
                style={{ marginBottom: 8 }}
              >
                <Input placeholder="25 Jan 2025" />
              </Form.Item>
              <Form.Item
                name="hrName"
                label="HR Contact"
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Sarah Ahmed" />
              </Form.Item>
            </div>
          </div>
        )}
        {showReject && (
          <Form.Item
            name="customMessage"
            label="Custom Message (optional)"
            extra="Leave blank for default rejection message."
          >
            <TextArea rows={3} />
          </Form.Item>
        )}
        {showCustom && (
          <Form.Item
            name="body"
            label="Message Body"
            rules={[{ required: true }]}
          >
            <TextArea rows={5} />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
};

/* ── NewJobModal ─────────────────────────────────────────────────────────── */
const NewJobModal = ({ open, onClose, onCreate, saving }) => {
  const [form] = Form.useForm();
  const submit = () => {
    form.validateFields().then((values) => {
      onCreate({
        title: values.title,
        department: values.department,
        deadline: values.deadline?.format("YYYY-MM-DD") || null,
        fields: DEFAULT_FIELDS,
      });
      form.resetFields();
    });
  };
  return (
    <Modal
      open={open}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "#f0fdf4",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#10b981",
            }}
          >
            <Plus size={15} />
          </div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>
            Create Job Opening
          </div>
        </div>
      }
      onCancel={onClose}
      onOk={submit}
      okText={saving ? "Creating…" : "Create Opening"}
      confirmLoading={saving}
      okButtonProps={{
        style: {
          background: "#0f172a",
          borderColor: "#0f172a",
          fontWeight: 600,
        },
      }}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="title"
          label={<span style={lbl}>Job Title</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Input
            placeholder="e.g. Senior UI/UX Designer"
            style={{ height: 38 }}
          />
        </Form.Item>
        <Form.Item
          name="department"
          label={<span style={lbl}>Department</span>}
          rules={[{ required: true, message: "Required" }]}
        >
          <Select placeholder="Select department" style={{ height: 38 }}>
            {DEPARTMENTS.map((d) => (
              <Option key={d} value={d}>
                {d}
              </Option>
            ))}
          </Select>
        </Form.Item>
        <Form.Item
          name="deadline"
          label={<span style={lbl}>Application Deadline</span>}
        >
          <DatePicker style={{ width: "100%", height: 38 }} />
        </Form.Item>
      </Form>
      <div style={{ fontSize: 12, color: "#94a3b8", marginTop: -8 }}>
        Default form fields (name, email, phone, CV) are added automatically.
        Customise in Form Builder.
      </div>
    </Modal>
  );
};

/* ── ApplicantDrawer ─────────────────────────────────────────────────────── */
const ApplicantDrawer = ({
  open,
  applicant,
  job,
  onClose,
  onUpdate,
  onDelete,
  saving,
  onEmail,
}) => {
  const [stage, setStage] = useState("applied");
  const [notes, setNotes] = useState("");
  const [score, setScore] = useState(null);
  const [interviewDate, setInterviewDate] = useState(null);
  const [scheduleMode, setScheduleMode] = useState(false);

  useEffect(() => {
    if (applicant) {
      setStage(applicant.stage || "applied");
      setNotes(applicant.notes || "");
      setScore(applicant.score ?? null);
      setInterviewDate(
        applicant.interviewDate ? dayjs(applicant.interviewDate) : null,
      );
      setScheduleMode(false);
    }
  }, [applicant]);

  if (!applicant) return null;

  const save = () =>
    onUpdate({
      ...applicant,
      stage,
      notes,
      score,
      interviewDate: interviewDate
        ? interviewDate.format("YYYY-MM-DD HH:mm")
        : null,
    });

  const answerRows = useMemo(() => {
    const answers = applicant.answers || {};
    let cvUrlUsed = false;
    if (job?.fields?.length) {
      return job.fields.map((f) => {
        let value = answers[f.id] ?? null;
        if (f.type === "file" && !value && !cvUrlUsed && applicant.cvUrl) {
          value = applicant.cvUrl;
          cvUrlUsed = true;
        }
        return { id: f.id, label: f.label, type: f.type, value };
      });
    }
    return Object.entries(answers).map(([k, v]) => ({
      id: k,
      label: k,
      type:
        typeof v === "string" &&
        v.startsWith("http") &&
        (v.includes(".pdf") ||
          v.includes(".doc") ||
          v.includes("recruitment-cvs"))
          ? "file"
          : "text",
      value: v,
    }));
  }, [applicant, job]);

  const extractStoragePath = (url) => {
    try {
      const m = "/recruitment-cvs/";
      const i = url.indexOf(m);
      return i !== -1 ? url.slice(i + m.length) : null;
    } catch {
      return null;
    }
  };

  const openFile = async (url) => {
    if (!url) return;
    const path = extractStoragePath(url);
    if (path) {
      const { data } = await supabase.storage
        .from("recruitment-cvs")
        .createSignedUrl(path, 3600);
      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
        return;
      }
    }
    window.open(url, "_blank");
  };

  const renderAnswerValue = (row) => {
    const empty =
      row.value === null || row.value === undefined || row.value === "";
    if (row.type === "file") {
      if (empty)
        return (
          <span style={{ color: "#d1d5db", fontSize: 13 }}>
            No file uploaded
          </span>
        );
      return (
        <button
          onClick={() => openFile(row.value)}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            color: "#3b82f6",
            fontSize: 13,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 5,
            textDecoration: "underline",
          }}
        >
          <FileText size={13} /> View / Download
        </button>
      );
    }
    if (empty) return <span style={{ color: "#d1d5db", fontSize: 13 }}>—</span>;
    if (
      row.type === "url" ||
      (typeof row.value === "string" && row.value.startsWith("http"))
    )
      return (
        <a
          href={row.value}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 13, color: "#3b82f6", wordBreak: "break-all" }}
        >
          {row.value}
        </a>
      );
    return (
      <span style={{ fontSize: 13, color: "#0f172a", wordBreak: "break-word" }}>
        {String(row.value)}
      </span>
    );
  };

  const trackingUrl = `${PUBLIC_DOMAIN}/track/${applicant.id}`;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={520}
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              fontWeight: 800,
              fontSize: 16,
              flexShrink: 0,
            }}
          >
            {applicant.name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>
              {applicant.name}
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Applied {applicant.appliedAt}
            </div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <StageBadge stage={applicant.stage} />
          </div>
        </div>
      }
      extra={
        <Space size={6}>
          <Popconfirm
            title="Delete this application?"
            description="This cannot be undone."
            onConfirm={() => onDelete(applicant.id)}
            okText="Delete"
            okButtonProps={{ danger: true }}
          >
            <Button
              danger
              icon={<Trash2 size={13} />}
              size="small"
              loading={saving}
            >
              Delete
            </Button>
          </Popconfirm>
          <Button icon={<Mail size={13} />} size="small" onClick={onEmail}>
            Email
          </Button>
          <Button
            type="primary"
            onClick={save}
            loading={saving}
            size="small"
            style={{
              background: "#0f172a",
              borderColor: "#0f172a",
              fontWeight: 600,
            }}
          >
            Save
          </Button>
        </Space>
      }
      styles={{
        header: { borderBottom: "1px solid #f1f5f9", paddingBottom: 16 },
        body: { padding: "20px 24px" },
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 10,
            }}
          >
            APPLICATION DETAILS
          </div>
          <div
            style={{
              border: "1px solid #e2e8f0",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            {answerRows.map((row, i) => (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr",
                  borderBottom:
                    i < answerRows.length - 1 ? "1px solid #f1f5f9" : "none",
                  background: i % 2 === 0 ? "#fff" : "#f8fafc",
                }}
              >
                <div
                  style={{
                    padding: "10px 14px",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    borderRight: "1px solid #f1f5f9",
                    letterSpacing: "0.01em",
                  }}
                >
                  {row.label}
                </div>
                <div style={{ padding: "10px 14px" }}>
                  {renderAnswerValue(row)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 6,
            }}
          >
            APPLICANT TRACKING LINK
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                color: "#475569",
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {trackingUrl}
            </span>
            <Tooltip title="Copy tracking link">
              <Button
                size="small"
                icon={<Copy size={12} />}
                onClick={() =>
                  navigator.clipboard
                    .writeText(trackingUrl)
                    .then(() => message.success("Tracking link copied!"))
                }
              >
                Copy
              </Button>
            </Tooltip>
          </div>
        </div>

        <Divider style={{ margin: 0, borderColor: "#f1f5f9" }} />

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            PIPELINE STAGE
          </div>
          <Select value={stage} onChange={setStage} style={{ width: "100%" }}>
            {STAGES.map((s) => (
              <Option key={s.key} value={s.key}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: s.color,
                      display: "inline-block",
                    }}
                  />
                  <span style={{ fontWeight: 600 }}>{s.label}</span>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            CANDIDATE SCORE (0–100)
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <InputNumber
              min={0}
              max={100}
              value={score}
              onChange={setScore}
              placeholder="e.g. 85"
              style={{ width: 100 }}
            />
            {score != null && (
              <div
                style={{
                  flex: 1,
                  height: 6,
                  borderRadius: 99,
                  background: "#f1f5f9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${score}%`,
                    background: scoreColor(score),
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }}
                />
              </div>
            )}
            {score != null && (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: scoreColor(score),
                }}
              >
                {score}/100
              </span>
            )}
          </div>
        </div>

        <Divider style={{ margin: 0, borderColor: "#f1f5f9" }} />

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            INTERVIEW
          </div>
          {applicant.interviewDate && !scheduleMode ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: 9,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  color: "#92400e",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                <Calendar size={13} /> {applicant.interviewDate}
              </span>
              <Button size="small" onClick={() => setScheduleMode(true)}>
                Reschedule
              </Button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm"
                value={interviewDate}
                onChange={setInterviewDate}
                style={{ width: "100%" }}
                placeholder="Pick date & time"
              />
              {scheduleMode && (
                <Button size="small" onClick={() => setScheduleMode(false)}>
                  Cancel
                </Button>
              )}
            </div>
          )}
          {interviewDate && (
            <Button
              block
              icon={<Mail size={13} />}
              style={{
                marginTop: 8,
                borderColor: "#3b82f6",
                color: "#3b82f6",
                fontWeight: 600,
              }}
              onClick={onEmail}
            >
              Send Interview Invite
            </Button>
          )}
        </div>

        <Divider style={{ margin: 0, borderColor: "#f1f5f9" }} />

        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: "#94a3b8",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            INTERNAL NOTES
          </div>
          <TextArea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add private notes about this candidate…"
            style={{ resize: "none" }}
          />
        </div>
      </div>
    </Drawer>
  );
};

/* ── StageColumn ─────────────────────────────────────────────────────────── */
const StageColumn = ({ stage, applicants, onView }) => (
  <div style={{ flex: "0 0 210px", minWidth: 210 }}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 10,
        padding: "0 2px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: stage.color,
            display: "inline-block",
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#0f172a",
            letterSpacing: "0.02em",
          }}
        >
          {stage.label}
        </span>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#fff",
          background: stage.color,
          padding: "1px 7px",
          borderRadius: 20,
        }}
      >
        {applicants.length}
      </span>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {applicants.length === 0 && (
        <div
          style={{
            border: "1.5px dashed #e2e8f0",
            borderRadius: 10,
            padding: "20px 10px",
            textAlign: "center",
            color: "#cbd5e1",
            fontSize: 12,
          }}
        >
          No candidates
        </div>
      )}
      {applicants.map((a, idx) => (
        <div
          key={a.id}
          className="rec-stage-card rec-fade"
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 10,
            padding: "11px 13px",
            animationDelay: `${idx * 25}ms`,
            borderTop: `3px solid ${stage.color}`,
            cursor: "pointer",
          }}
          onClick={() => onView(a)}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: "#0f172a",
              marginBottom: 2,
            }}
          >
            {a.name}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
            {a.email}
          </div>
          {a.interviewDate && (
            <div
              style={{
                fontSize: 11,
                color: "#f59e0b",
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontWeight: 500,
              }}
            >
              <Calendar size={10} /> {a.interviewDate}
            </div>
          )}
          {a.score != null && (
            <div style={{ marginTop: 6 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 3,
                }}
              >
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Score</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: scoreColor(a.score),
                  }}
                >
                  {a.score}
                </span>
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 99,
                  background: "#f1f5f9",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${a.score}%`,
                    background: scoreColor(a.score),
                    borderRadius: 99,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  </div>
);

/* ── JobCard ─────────────────────────────────────────────────────────────── */
const JobCard = ({
  job,
  applicantCount,
  onPipeline,
  onFormBuilder,
  onToggle,
  onDelete,
  onCopyLink,
}) => {
  const brand = job.branding || DEFAULT_BRANDING;
  const accent = brand.accent_color || "#3b82f6";
  const isActive = job.status === "active";

  return (
    <div
      className="rec-job-card rec-fade"
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 14,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ height: 4, background: accent }} />
      <div
        style={{
          padding: "16px 18px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 15,
                color: "#0f172a",
                lineHeight: 1.2,
                marginBottom: 4,
              }}
            >
              {job.title}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  color: "#64748b",
                  background: "#f1f5f9",
                  padding: "2px 8px",
                  borderRadius: 5,
                  fontWeight: 600,
                }}
              >
                {job.department}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 5,
                  background: isActive ? "#ecfdf5" : "#f8fafc",
                  color: isActive ? "#10b981" : "#94a3b8",
                  border: `1px solid ${isActive ? "#a7f3d0" : "#e2e8f0"}`,
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: isActive ? "#10b981" : "#94a3b8",
                    display: "inline-block",
                  }}
                />
                {isActive ? "Active" : "Closed"}
              </span>
            </div>
          </div>
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "pipeline",
                  icon: <Users size={13} />,
                  label: "View Pipeline",
                  onClick: onPipeline,
                },
                {
                  key: "form",
                  icon: <FileText size={13} />,
                  label: "Edit Form & Branding",
                  onClick: onFormBuilder,
                },
                {
                  key: "copy",
                  icon: <Copy size={13} />,
                  label: "Copy Apply Link",
                  onClick: onCopyLink,
                },
                {
                  key: "toggle",
                  icon: isActive ? (
                    <XCircle size={13} />
                  ) : (
                    <CheckCircle size={13} />
                  ),
                  label: isActive ? "Close Opening" : "Reopen",
                  onClick: onToggle,
                },
                { type: "divider" },
                {
                  key: "delete",
                  icon: <Trash2 size={13} />,
                  label: "Delete",
                  danger: true,
                  onClick: onDelete,
                },
              ],
            }}
          >
            <Button
              type="text"
              icon={<MoreHorizontal size={15} />}
              size="small"
              style={{ color: "#94a3b8" }}
            />
          </Dropdown>
        </div>

        {brand.company_name && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "7px 10px",
              background: "#f8fafc",
              borderRadius: 8,
              border: "1px solid #f1f5f9",
            }}
          >
            {brand.logo_url ? (
              <img
                src={brand.logo_url}
                alt=""
                style={{ height: 18, objectFit: "contain", borderRadius: 3 }}
                onError={(e) => {
                  e.target.style.display = "none";
                }}
              />
            ) : (
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 5,
                  background: accent,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 10,
                  flexShrink: 0,
                }}
              >
                {brand.company_name.charAt(0)}
              </div>
            )}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: "#475569",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {brand.company_name}
            </span>
            {brand.tagline && (
              <span
                style={{
                  fontSize: 10,
                  color: "#94a3b8",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                — {brand.tagline}
              </span>
            )}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={onPipeline}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <span style={{ fontSize: 18, fontWeight: 800, color: accent }}>
              {applicantCount}
            </span>
            <span style={{ fontSize: 11, color: "#94a3b8" }}>
              applicant{applicantCount !== 1 ? "s" : ""}
            </span>
          </button>
          {job.deadline && (
            <>
              <span
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "#e2e8f0",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  color: dayjs(job.deadline).isBefore(dayjs())
                    ? "#ef4444"
                    : "#94a3b8",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <Clock size={10} /> {job.deadline}
              </span>
            </>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              fontSize: 10,
              fontWeight: 600,
              padding: "2px 7px",
              borderRadius: 5,
              background:
                brand.sendTrackingLink !== false ? "#eff6ff" : "#f8fafc",
              color: brand.sendTrackingLink !== false ? "#3b82f6" : "#94a3b8",
              border: `1px solid ${brand.sendTrackingLink !== false ? "#bfdbfe" : "#e2e8f0"}`,
            }}
          >
            <Link2 size={9} />
            {brand.sendTrackingLink !== false
              ? "Tracking link on"
              : "Tracking link off"}
          </span>
        </div>
      </div>

      <div
        style={{
          borderTop: "1px solid #f1f5f9",
          padding: "10px 14px",
          display: "flex",
          gap: 8,
          background: "#fafafa",
        }}
      >
        <Button
          size="small"
          icon={<Users size={12} />}
          onClick={onPipeline}
          style={{ flex: 1, fontWeight: 600, fontSize: 12 }}
        >
          Pipeline
        </Button>
        <Button
          size="small"
          icon={<FileText size={12} />}
          onClick={onFormBuilder}
          style={{ flex: 1, fontWeight: 600, fontSize: 12 }}
        >
          Form
        </Button>
        <Tooltip title="Copy apply link">
          <Button size="small" icon={<Copy size={12} />} onClick={onCopyLink} />
        </Tooltip>
      </div>
    </div>
  );
};

export default function Recruitment() {
  const [jobs, setJobs] = useState([]);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [view, setView] = useState("jobs");
  const [selectedJob, setSelectedJob] = useState(null);
  const [pipelineFilter, setPipelineFilter] = useState(null);

  const [newJobOpen, setNewJobOpen] = useState(false);
  const [formBuilderJob, setFormBuilderJob] = useState(null);
  const [viewApplicant, setViewApplicant] = useState(null);
  const [emailApplicant, setEmailApplicant] = useState(null);
  const [TENANT_ID, setTenantId] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        setTenantId(profile?.tenant_id ?? null);
      } catch (e) {
        console.error(e);
      }
    };
    init();
  }, []);

  /* ── Fetch — always scoped to TENANT_ID ──────────────────────────── */
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [
        { data: jobRows, error: jobErr },
        { data: appRows, error: appErr },
      ] = await Promise.all([
        supabase
          .from("recruitment_jobs")
          .select("*")
          .eq("tenant_id", TENANT_ID) // ← tenant filter
          .order("created_at", { ascending: false }),
        supabase
          .from("recruitment_applicants")
          .select("*")
          .eq("tenant_id", TENANT_ID) // ← tenant filter
          .order("applied_at", { ascending: false }),
      ]);
      if (jobErr) throw jobErr;
      if (appErr) throw appErr;
      setJobs((jobRows || []).map(mapJob));
      setApplicants((appRows || []).map(mapApplicant));
    } catch {
      message.error("Failed to load recruitment data");
    } finally {
      setLoading(false);
    }
  }, [TENANT_ID]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  /* ── Realtime — filter channel to this tenant ────────────────────── */
  useEffect(() => {
    const ch = supabase
      .channel(`recruitment-realtime-${TENANT_ID}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recruitment_jobs",
          filter: `tenant_id=eq.${TENANT_ID}`,
        },
        (p) => {
          if (p.eventType === "INSERT")
            setJobs((prev) => [mapJob(p.new), ...prev]);
          if (p.eventType === "UPDATE")
            setJobs((prev) =>
              prev.map((j) => (j.id === p.new.id ? mapJob(p.new) : j)),
            );
          if (p.eventType === "DELETE")
            setJobs((prev) => prev.filter((j) => j.id !== p.old.id));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recruitment_applicants",
          filter: `tenant_id=eq.${TENANT_ID}`,
        },
        (p) => {
          if (p.eventType === "INSERT")
            setApplicants((prev) => [mapApplicant(p.new), ...prev]);
          if (p.eventType === "UPDATE")
            setApplicants((prev) =>
              prev.map((a) => (a.id === p.new.id ? mapApplicant(p.new) : a)),
            );
          if (p.eventType === "DELETE")
            setApplicants((prev) => prev.filter((a) => a.id !== p.old.id));
        },
      )
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  /* ── CRUD — all writes include tenant_id ─────────────────────────── */
  const createJob = async (values) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("recruitment_jobs").insert([
        {
          tenant_id: TENANT_ID, // ← tenant_id
          title: values.title,
          department: values.department,
          deadline: values.deadline || null,
          fields: values.fields,
          branding: DEFAULT_BRANDING,
          status: "active",
        },
      ]);
      if (error) throw error;
      setNewJobOpen(false);
      message.success("Job opening created!");
    } catch {
      message.error("Failed to create job opening");
    } finally {
      setSaving(false);
    }
  };

  const saveFormFields = async (fields, branding) => {
    if (!formBuilderJob) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .update({ fields, branding })
        .eq("id", formBuilderJob.id)
        .eq("tenant_id", TENANT_ID); // ← tenant guard
      if (error) throw error;
      setJobs((prev) =>
        prev.map((j) =>
          j.id === formBuilderJob.id ? { ...j, fields, branding } : j,
        ),
      );
      if (selectedJob?.id === formBuilderJob.id)
        setSelectedJob((prev) => ({ ...prev, fields, branding }));
      setFormBuilderJob(null);
      message.success("Form & branding saved!");
    } catch {
      message.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === "active" ? "closed" : "active";
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .update({ status: newStatus })
        .eq("id", job.id)
        .eq("tenant_id", TENANT_ID); // ← tenant guard
      if (error) throw error;
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)),
      );
    } catch {
      message.error("Failed to update status");
    }
  };

  const deleteJob = async (id) => {
    try {
      const { error } = await supabase
        .from("recruitment_jobs")
        .delete()
        .eq("id", id)
        .eq("tenant_id", TENANT_ID); // ← tenant guard
      if (error) throw error;
      setJobs((prev) => prev.filter((j) => j.id !== id));
      setApplicants((prev) => prev.filter((a) => a.jobId !== id));
      if (selectedJob?.id === id) {
        setSelectedJob(null);
        setView("jobs");
      }
      message.success("Job opening deleted");
    } catch {
      message.error("Failed to delete");
    }
  };

  const updateApplicant = async (updated) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("recruitment_applicants")
        .update({
          stage: updated.stage,
          notes: updated.notes,
          score: updated.score,
          interview_date: updated.interviewDate
            ? dayjs(updated.interviewDate).toISOString()
            : null,
        })
        .eq("id", updated.id)
        .eq("tenant_id", TENANT_ID); // ← tenant guard
      if (error) throw error;
      setApplicants((prev) =>
        prev.map((a) => (a.id === updated.id ? updated : a)),
      );
      setViewApplicant(null);
      message.success("Applicant updated");
    } catch {
      message.error("Failed to update applicant");
    } finally {
      setSaving(false);
    }
  };

  const deleteApplicant = async (id) => {
    try {
      const { error } = await supabase
        .from("recruitment_applicants")
        .delete()
        .eq("id", id)
        .eq("tenant_id", TENANT_ID); // ← tenant guard
      if (error) throw error;
      setApplicants((prev) => prev.filter((a) => a.id !== id));
      setViewApplicant(null);
      message.success("Application deleted");
    } catch {
      message.error("Failed to delete application");
    }
  };

  /* ── Derived ──────────────────────────────────────────────────────── */
  const jobApplicants = useMemo(() => {
    let list = selectedJob
      ? applicants.filter((a) => a.jobId === selectedJob.id)
      : applicants;
    if (pipelineFilter) list = list.filter((a) => a.stage === pipelineFilter);
    return list;
  }, [applicants, selectedJob, pipelineFilter]);

  const stats = useMemo(
    () => ({
      activeJobs: jobs.filter((j) => j.status === "active").length,
      total: applicants.length,
      scheduled: applicants.filter((a) => a.interviewDate).length,
      hired: applicants.filter((a) => a.stage === "hired").length,
    }),
    [jobs, applicants],
  );

  const drawerJob = useMemo(
    () =>
      viewApplicant
        ? jobs.find((j) => j.id === viewApplicant.jobId) || null
        : null,
    [viewApplicant, jobs],
  );
  const emailJob = useMemo(
    () =>
      emailApplicant
        ? jobs.find((j) => j.id === emailApplicant.jobId) || null
        : null,
    [emailApplicant, jobs],
  );

  /* ── Applicant table columns ──────────────────────────────────────── */
  const applicantColumns = [
    {
      title: "Candidate",
      dataIndex: "name",
      render: (name, row) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              background: "#eff6ff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#3b82f6",
              fontWeight: 800,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            {name.charAt(0)}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
              {name}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8" }}>{row.email}</div>
          </div>
        </div>
      ),
    },
    ...(!selectedJob
      ? [
          {
            title: "Role",
            dataIndex: "jobId",
            render: (id) => {
              const j = jobs.find((j) => j.id === id);
              const accent = j?.branding?.accent_color || "#3b82f6";
              return j ? (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: accent,
                    background: `${accent}12`,
                    padding: "2px 8px",
                    borderRadius: 5,
                  }}
                >
                  {j.title}
                </span>
              ) : (
                "—"
              );
            },
          },
        ]
      : []),
    {
      title: "Stage",
      dataIndex: "stage",
      render: (s) => <StageBadge stage={s} />,
    },
    {
      title: "Score",
      dataIndex: "score",
      render: (s) =>
        s != null ? (
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: `${scoreColor(s)}15`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{ fontSize: 12, fontWeight: 800, color: scoreColor(s) }}
              >
                {s}
              </span>
            </div>
          </div>
        ) : (
          <span style={{ color: "#d1d5db", fontSize: 12 }}>—</span>
        ),
    },
    {
      title: "Interview",
      dataIndex: "interviewDate",
      render: (d) =>
        d ? (
          <span
            style={{
              fontSize: 12,
              color: "#f59e0b",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontWeight: 500,
            }}
          >
            <Calendar size={12} /> {d}
          </span>
        ) : (
          <span style={{ color: "#d1d5db", fontSize: 12 }}>Not scheduled</span>
        ),
    },
    {
      title: "Applied",
      dataIndex: "appliedAt",
      render: (d) => (
        <span style={{ fontSize: 12, color: "#94a3b8" }}>{d}</span>
      ),
    },
    {
      title: "",
      key: "actions",
      width: 100,
      render: (_, row) => (
        <Space size={4}>
          <Tooltip title="View application">
            <Button
              icon={<Eye size={13} />}
              size="small"
              onClick={() => setViewApplicant(row)}
            />
          </Tooltip>
          <Tooltip title="Send email">
            {" "}
            <Button
              icon={<Mail size={13} />}
              size="small"
              onClick={() => setEmailApplicant(row)}
            />
          </Tooltip>
          <Popconfirm
            title="Delete this application?"
            onConfirm={() => deleteApplicant(row.id)}
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Delete">
              <Button icon={<Trash2 size={13} />} size="small" danger />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  /* ── Loading ──────────────────────────────────────────────────────── */
  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <Spin
          indicator={
            <Loader2
              style={{
                fontSize: 32,
                color: "#3b82f6",
                animation: "spin 1s linear infinite",
              }}
            />
          }
        />
      </div>
    );

  /* ── Render ───────────────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div
        className="rec-fade"
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          padding: "20px 28px",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 4,
              }}
            >
              <h1
                style={{
                  margin: 0,
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-0.04em",
                  lineHeight: 1,
                }}
              >
                Recruitment
              </h1>
              <TenantBadge /> {/* ← shows active tenant */}
            </div>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              Build forms · Share links · Track candidates end-to-end
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                background: "#f1f5f9",
                borderRadius: 9,
                padding: 3,
                gap: 2,
              }}
            >
              {[
                {
                  key: "jobs",
                  label: "Openings",
                  icon: <FileText size={13} />,
                },
                {
                  key: "pipeline",
                  label: "Pipeline",
                  icon: <Users size={13} />,
                },
              ].map((t) => (
                <button
                  key={t.key}
                  onClick={() => {
                    setView(t.key);
                    if (t.key === "jobs") setSelectedJob(null);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 14px",
                    borderRadius: 7,
                    border: "none",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    transition: "all 0.15s",
                    background: view === t.key ? "#0f172a" : "transparent",
                    color: view === t.key ? "#fff" : "#64748b",
                  }}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
            <Button
              type="primary"
              icon={<Plus size={14} />}
              onClick={() => setNewJobOpen(true)}
              style={{
                background: "#0f172a",
                borderColor: "#0f172a",
                fontWeight: 700,
                height: 38,
                borderRadius: 9,
              }}
            >
              New Opening
            </Button>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 28px 32px" }}>
        {/* ── KPIs ────────────────────────────────────────────────── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <KpiCard
            icon={<FileText size={18} />}
            value={stats.activeJobs}
            label="Active Openings"
            color="#3b82f6"
          />
          <KpiCard
            icon={<User size={18} />}
            value={stats.total}
            label="Total Applicants"
            color="#8b5cf6"
          />
          <KpiCard
            icon={<Calendar size={18} />}
            value={stats.scheduled}
            label="Interviews Scheduled"
            color="#f59e0b"
          />
          <KpiCard
            icon={<CheckCircle size={18} />}
            value={stats.hired}
            label="Hired"
            color="#10b981"
          />
        </div>

        {/* ── Jobs Grid ───────────────────────────────────────────── */}
        {view === "jobs" && (
          <div className="rec-fade">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
                {jobs.length} Job Opening{jobs.length !== 1 ? "s" : ""}
              </div>
            </div>
            {jobs.length === 0 ? (
              <div
                style={{
                  background: "#fff",
                  border: "2px dashed #e2e8f0",
                  borderRadius: 16,
                  padding: "60px 40px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#0f172a",
                    marginBottom: 6,
                  }}
                >
                  No job openings yet
                </div>
                <div
                  style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}
                >
                  Create your first opening and start receiving applications
                </div>
                <Button
                  type="primary"
                  icon={<Plus size={13} />}
                  onClick={() => setNewJobOpen(true)}
                  style={{
                    background: "#0f172a",
                    borderColor: "#0f172a",
                    fontWeight: 600,
                  }}
                >
                  Create Opening
                </Button>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                  gap: 16,
                }}
              >
                {jobs.map((job, idx) => (
                  <div key={job.id} style={{ animationDelay: `${idx * 40}ms` }}>
                    <JobCard
                      job={job}
                      applicantCount={
                        applicants.filter((a) => a.jobId === job.id).length
                      }
                      onPipeline={() => {
                        setSelectedJob(job);
                        setView("pipeline");
                      }}
                      onFormBuilder={() => setFormBuilderJob(job)}
                      onToggle={() => toggleJobStatus(job)}
                      onDelete={() => deleteJob(job.id)}
                      onCopyLink={() => copyLink(job.id)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Pipeline View ────────────────────────────────────────── */}
        {view === "pipeline" && (
          <div className="rec-fade">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 20,
                flexWrap: "wrap",
              }}
            >
              <Select
                style={{ width: 260 }}
                placeholder="Filter by job opening"
                allowClear
                value={selectedJob?.id}
                onChange={(v) =>
                  setSelectedJob(v ? jobs.find((j) => j.id === v) : null)
                }
              >
                {jobs.map((j) => (
                  <Option key={j.id} value={j.id}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{j.title}</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#fff",
                          background: j.branding?.accent_color || "#3b82f6",
                          padding: "1px 7px",
                          borderRadius: 20,
                          marginLeft: 8,
                        }}
                      >
                        {applicants.filter((a) => a.jobId === j.id).length}
                      </span>
                    </div>
                  </Option>
                ))}
              </Select>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                <button
                  onClick={() => setPipelineFilter(null)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 7,
                    border: `1px solid ${pipelineFilter === null ? "#0f172a" : "#e2e8f0"}`,
                    background: pipelineFilter === null ? "#0f172a" : "#fff",
                    color: pipelineFilter === null ? "#fff" : "#64748b",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  All
                </button>
                {STAGES.map((s) => (
                  <button
                    key={s.key}
                    onClick={() =>
                      setPipelineFilter(pipelineFilter === s.key ? null : s.key)
                    }
                    style={{
                      padding: "5px 12px",
                      borderRadius: 7,
                      border: `1px solid ${pipelineFilter === s.key ? s.color : "#e2e8f0"}`,
                      background: pipelineFilter === s.key ? s.bg : "#fff",
                      color: pipelineFilter === s.key ? s.color : "#64748b",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              {selectedJob && (
                <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                  <Button
                    size="small"
                    icon={<Copy size={12} />}
                    onClick={() => copyLink(selectedJob.id)}
                  >
                    Copy Link
                  </Button>
                  <Button
                    size="small"
                    icon={<FileText size={12} />}
                    onClick={() => setFormBuilderJob(selectedJob)}
                  >
                    Edit Form
                  </Button>
                </div>
              )}
            </div>

            <div style={{ overflowX: "auto", paddingBottom: 12 }}>
              <div
                style={{ display: "flex", gap: 14, minWidth: "fit-content" }}
              >
                {STAGES.map((stage) => (
                  <StageColumn
                    key={stage.key}
                    stage={stage}
                    applicants={jobApplicants.filter(
                      (a) => a.stage === stage.key,
                    )}
                    onView={setViewApplicant}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                marginTop: 28,
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  padding: "16px 20px",
                  borderBottom: "1px solid #f1f5f9",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{ fontWeight: 800, fontSize: 14, color: "#0f172a" }}
                >
                  All Candidates
                </span>
                {selectedJob && (
                  <span
                    style={{
                      fontSize: 11,
                      background:
                        (selectedJob.branding?.accent_color || "#3b82f6") +
                        "15",
                      color: selectedJob.branding?.accent_color || "#3b82f6",
                      padding: "2px 9px",
                      borderRadius: 5,
                      fontWeight: 700,
                    }}
                  >
                    {selectedJob.title}
                  </span>
                )}
                <span
                  style={{
                    fontSize: 11,
                    background: "#f1f5f9",
                    color: "#64748b",
                    padding: "2px 9px",
                    borderRadius: 5,
                    fontWeight: 600,
                  }}
                >
                  {jobApplicants.length} total
                </span>
              </div>
              <Table
                className="rec-table"
                dataSource={jobApplicants}
                columns={applicantColumns}
                rowKey="id"
                pagination={{
                  pageSize: 8,
                  size: "small",
                  showTotal: (t) => `${t} candidates`,
                }}
                locale={{
                  emptyText: (
                    <Empty
                      description="No applicants yet"
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                    />
                  ),
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Modals & Drawers ─────────────────────────────────────────── */}
      <NewJobModal
        open={newJobOpen}
        onClose={() => setNewJobOpen(false)}
        onCreate={createJob}
        saving={saving}
      />

      {formBuilderJob && (
        <FormBuilderModal
          open={!!formBuilderJob}
          job={formBuilderJob}
          onClose={() => setFormBuilderJob(null)}
          onSave={saveFormFields}
          saving={saving}
        />
      )}

      {viewApplicant && (
        <ApplicantDrawer
          open={!!viewApplicant}
          applicant={viewApplicant}
          job={drawerJob}
          onClose={() => setViewApplicant(null)}
          onUpdate={updateApplicant}
          onDelete={deleteApplicant}
          saving={saving}
          onEmail={() => setEmailApplicant(viewApplicant)}
        />
      )}

      <EmailModal
        open={!!emailApplicant}
        applicant={emailApplicant}
        job={emailJob}
        onClose={() => setEmailApplicant(null)}
      />
    </div>
  );
}
