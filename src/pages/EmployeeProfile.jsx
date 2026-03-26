import { useState, useEffect, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Upload,
  message,
  Avatar,
  DatePicker,
  Select,
  InputNumber,
} from "antd";
import {
  User,
  Lock,
  Mail,
  Briefcase,
  Globe,
  Clock,
  AlertCircle,
  Shield,
  Camera,
  Check,
  DollarSign,
  Building2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import dayjs from "dayjs";

const { TextArea } = Input;

/* ─── Constants ─────────────────────────────────────────────────────── */
const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "PKR", symbol: "₨", name: "Pakistani Rupee" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "OTHER", symbol: "", name: "Other (specify)" },
];

const TIMEZONES = [
  "UTC-12:00",
  "UTC-11:00",
  "UTC-10:00",
  "UTC-09:00",
  "UTC-08:00 (PST)",
  "UTC-07:00 (MST)",
  "UTC-06:00 (CST)",
  "UTC-05:00 (EST)",
  "UTC-04:00 (AST)",
  "UTC-03:00",
  "UTC+00:00 (GMT/UTC)",
  "UTC+01:00 (CET)",
  "UTC+02:00 (EET)",
  "UTC+03:00 (MSK)",
  "UTC+04:00 (GST)",
  "UTC+05:00 (PKT)",
  "UTC+05:30 (IST)",
  "UTC+06:00",
  "UTC+07:00 (WIB)",
  "UTC+08:00 (SGT/CST)",
  "UTC+09:00 (JST)",
  "UTC+10:00 (AEST)",
  "UTC+12:00 (NZST)",
];

const EMPLOYMENT_TYPES = [
  { value: "full_time", label: "Full-Time" },
  { value: "part_time", label: "Part-Time" },
  { value: "contract", label: "Contract" },
  { value: "freelancer", label: "Freelancer" },
  { value: "intern", label: "Intern" },
];

const LANGUAGES = [
  "English",
  "Urdu",
  "Arabic",
  "French",
  "German",
  "Spanish",
  "Chinese (Mandarin)",
  "Hindi",
  "Portuguese",
  "Russian",
  "Japanese",
  "Korean",
  "Turkish",
  "Italian",
  "Dutch",
  "Persian",
  "Bengali",
  "Punjabi",
  "Swahili",
  "Malay",
  "Indonesian",
  "Thai",
  "Vietnamese",
  "Polish",
  "Ukrainian",
  "Romanian",
  "Greek",
  "Czech",
  "Hungarian",
  "Swedish",
];

const SKILL_OPTIONS = [
  "JavaScript",
  "TypeScript",
  "React",
  "Vue",
  "Angular",
  "Node.js",
  "Python",
  "Django",
  "FastAPI",
  "PHP",
  "Laravel",
  "Java",
  "Spring",
  "C#",
  ".NET",
  "Go",
  "Ruby",
  "Rails",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "DevOps",
  "AWS",
  "GCP",
  "Azure",
  "Docker",
  "Kubernetes",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "GraphQL",
  "REST",
  "UI/UX Design",
  "Figma",
  "Project Management",
  "Scrum",
  "Agile",
  "Data Analysis",
  "Machine Learning",
  "AI/ML",
  "Cybersecurity",
  "QA/Testing",
  "SEO",
  "Digital Marketing",
];

const AVATAR_PALETTE = [
  "#1677ff",
  "#52c41a",
  "#fa8c16",
  "#eb2f96",
  "#722ed1",
  "#13c2c2",
  "#f5222d",
  "#2f54eb",
  "#faad14",
  "#08979c",
];

const getInitials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const getAvatarColor = (name = "") => {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
};

/* ─── CSS ─────────────────────────────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap');

.ep-prof { font-family:'DM Sans',-apple-system,sans-serif; max-width:960px; }

.ep-prof-header { margin-bottom:28px; }
.ep-prof-title  { font-size:24px; font-weight:700; color:#0a0a0a; margin:0; letter-spacing:-.4px; }
.ep-prof-sub    { font-size:13px; color:#9a9a9a; margin:3px 0 0; }

.ep-hero { background:#fff; border:1px solid #ebebeb; border-radius:20px; padding:28px; margin-bottom:20px; display:flex; align-items:center; gap:24px; flex-wrap:wrap; }
.ep-av-wrap { position:relative; flex-shrink:0; }
.ep-av-upload { position:absolute; bottom:0; right:0; width:28px; height:28px; border-radius:50%; background:#0a0a0a; border:2.5px solid #fff; display:flex; align-items:center; justify-content:center; cursor:pointer; transition:background .15s; }
.ep-av-upload:hover { background:#333; }
.ep-hero-info { flex:1; min-width:0; }
.ep-hero-name { font-size:20px; font-weight:700; color:#0a0a0a; margin:0 0 3px; }
.ep-hero-role { font-size:12px; font-weight:600; text-transform:uppercase; letter-spacing:.5px; color:#9a9a9a; margin-bottom:10px; }
.ep-hero-chips { display:flex; flex-wrap:wrap; gap:6px; }
.ep-chip { display:inline-flex; align-items:center; gap:5px; background:#f5f5f5; border-radius:7px; padding:4px 10px; font-size:11.5px; font-weight:600; color:#6a6a6a; }
.ep-chip svg { color:#b0b0b0; }

.ep-salary-card { background:linear-gradient(135deg,#0a0a0a 0%,#1e293b 100%); border-radius:16px; padding:20px 24px; color:#fff; display:flex; align-items:center; justify-content:space-between; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
.ep-salary-label { font-size:10.5px; text-transform:uppercase; letter-spacing:.7px; color:#64748b; font-weight:700; margin-bottom:4px; }
.ep-salary-value { font-size:22px; font-weight:700; color:#fff; letter-spacing:-.5px; }
.ep-salary-sub   { font-size:11.5px; color:#64748b; margin-top:2px; }
.ep-salary-badge { background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12); border-radius:10px; padding:8px 14px; text-align:right; }

.ep-tabs { display:flex; gap:2px; background:#f5f5f5; border-radius:12px; padding:3px; margin-bottom:20px; width:fit-content; }
.ep-tab  { border:none; background:transparent; cursor:pointer; padding:8px 18px; border-radius:9px; font-size:13px; font-weight:600; color:#9a9a9a; font-family:'DM Sans',sans-serif; transition:all .15s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
.ep-tab.active  { background:#fff; color:#0a0a0a; box-shadow:0 1px 4px rgba(0,0,0,.1); }
.ep-tab:hover:not(.active) { color:#555; }

.ep-sec { background:#fff; border:1px solid #ebebeb; border-radius:16px; padding:24px; margin-bottom:16px; }
.ep-sec-title { font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.7px; color:#b0b0b0; margin:0 0 18px; display:flex; align-items:center; gap:7px; }
.ep-sec-title svg { color:#d0d0d0; }

.ep-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:0 16px; }
@media(max-width:600px){ .ep-grid-2{grid-template-columns:1fr;} }

.ep-save-bar { display:flex; justify-content:flex-end; gap:8px; padding-top:4px; }
.ep-save-btn { background:#0a0a0a !important; border-color:#0a0a0a !important; border-radius:10px !important; font-weight:700 !important; font-family:'DM Sans',sans-serif !important; height:38px !important; display:flex !important; align-items:center !important; gap:6px !important; }
.ep-save-btn:hover { background:#2a2a2a !important; border-color:#2a2a2a !important; }

.ep-pw-card { background:#fff; border:1px solid #ebebeb; border-radius:16px; padding:28px; max-width:460px; }
.ep-pw-note { background:#f9fafb; border:1px solid #f0f0f0; border-radius:10px; padding:12px 14px; font-size:12.5px; color:#6a6a6a; display:flex; align-items:flex-start; gap:8px; margin-bottom:20px; }
.ep-pw-note svg { color:#b0b0b0; flex-shrink:0; margin-top:1px; }

.ep-info-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f5f5f5; font-size:13px; }
.ep-info-row:last-child { border-bottom:none; }
.ep-info-label { color:#9a9a9a; font-weight:500; display:flex; align-items:center; gap:6px; }
.ep-info-val   { color:#0a0a0a; font-weight:600; }

.ep-prof .ant-form-item-label > label { font-size:13px; font-weight:600; color:#4a4a4a; font-family:'DM Sans',sans-serif; }
.ep-prof .ant-input, .ep-prof .ant-input-number, .ep-prof .ant-picker,
.ep-prof .ant-select-selector { border-radius:9px !important; font-family:'DM Sans',sans-serif !important; }
.ep-prof .ant-form-item { margin-bottom:14px; }
`;

/* ─── Salary display helper ─────────────────────────────────────────── */
const SalaryDisplay = ({ profile }) => {
  const cur = profile?.currency || "PKR";
  const sym = CURRENCIES.find((c) => c.code === cur)?.symbol || cur;
  if (profile?.salary_type === "fixed" && profile?.salary_amount) {
    return (
      <div className="ep-salary-card">
        <div>
          <div className="ep-salary-label">Monthly Salary</div>
          <div className="ep-salary-value">
            {sym} {parseFloat(profile.salary_amount).toLocaleString()}
          </div>
          <div className="ep-salary-sub">Fixed • {cur}</div>
        </div>
        <div className="ep-salary-badge">
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
            TYPE
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            Fixed
          </div>
        </div>
      </div>
    );
  }
  if (profile?.salary_type === "base_commission") {
    return (
      <div className="ep-salary-card">
        <div>
          <div className="ep-salary-label">Base Salary</div>
          <div className="ep-salary-value">
            {sym} {parseFloat(profile.base_salary || 0).toLocaleString()}
          </div>
          <div className="ep-salary-sub">
            + {profile.commission_rate || 0}% commission
          </div>
        </div>
        <div className="ep-salary-badge">
          <div style={{ fontSize: 10, color: "#64748b", marginBottom: 2 }}>
            TYPE
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>
            Base + Commission
          </div>
        </div>
      </div>
    );
  }
  return null;
};

/* ═══════════════════════════════════════════════════════════════════════ */
const EmployeeProfile = () => {
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePicUrl, setProfilePicUrl] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");
  const { profile, refreshProfile } = useAuth();

  // ─── This ref holds ALL field values across all tabs at all times ───
  const allValuesRef = useRef({});

  // ─── Seed ref + form when profile loads ────────────────────────────
  useEffect(() => {
    if (!profile) return;

    const knownCurrency = CURRENCIES.find(
      (c) => c.code === profile.currency && c.code !== "OTHER",
    );
    const initialValues = {
      full_name: profile.full_name,
      email: profile.email,
      contact: profile.contact,
      address: profile.address,
      bio: profile.bio,
      cnic: profile.cnic,
      dob: profile.dob ? dayjs(profile.dob) : null,
      nationality: profile.nationality,
      languages: profile.languages || [],
      employment_type: profile.employment_type,
      timezone: profile.timezone,
      github_username: profile.github_username,
      linkedin_url: profile.linkedin_url,
      portfolio_url: profile.portfolio_url,
      experience_years: profile.experience_years,
      working_hours: profile.working_hours,
      skills: profile.skills || [],
      emergency_contact_name: profile.emergency_contact_name,
      emergency_contact_phone: profile.emergency_contact_phone,
      bank_name: profile.bank_name,
      bank_account_number: profile.bank_account_number,
      bank_account_name: profile.bank_account_name,
      currency: knownCurrency
        ? profile.currency
        : profile.currency
          ? "OTHER"
          : undefined,
      custom_currency: knownCurrency ? "" : profile.currency,
    };

    // Store in ref AND set on form
    allValuesRef.current = initialValues;
    form.setFieldsValue(initialValues);
    setProfilePicUrl(profile.user_photo);
  }, [profile, form]);

  // ─── Sync form → ref on every field change ─────────────────────────
  const handleValuesChange = (_, allCurrentValues) => {
    allValuesRef.current = { ...allValuesRef.current, ...allCurrentValues };
  };

  // ─── When switching tabs: flush current tab's values into ref,
  //     then set ALL values from ref onto the form so the next tab
  //     mounts with its fields already populated ─────────────────────
  const handleTabSwitch = (tabKey) => {
    // Capture whatever is mounted right now before unmounting
    const currentFormValues = form.getFieldsValue();
    allValuesRef.current = { ...allValuesRef.current, ...currentFormValues };

    setActiveTab(tabKey);

    // After state update / re-render, restore full values to form
    setTimeout(() => {
      form.setFieldsValue(allValuesRef.current);
    }, 0);
  };

  // ─── Save: always use ref (complete data) ─────────────────────────
  const handleUpdateProfile = async () => {
    try {
      // Validate only the currently visible fields
      await form.validateFields();
    } catch {
      return;
    }

    // Flush latest visible values into ref before building payload
    const currentFormValues = form.getFieldsValue();
    allValuesRef.current = { ...allValuesRef.current, ...currentFormValues };

    const values = allValuesRef.current;

    setLoading(true);
    try {
      const resolvedCurrency =
        values.currency === "OTHER" ? values.custom_currency : values.currency;

      const updateData = {
        full_name: values.full_name,
        contact: values.contact,
        address: values.address,
        bio: values.bio,
        cnic: values.cnic || null,
        dob: values.dob ? dayjs(values.dob).format("YYYY-MM-DD") : null,
        nationality: values.nationality || null,
        languages: values.languages || [],
        employment_type: values.employment_type || null,
        timezone: values.timezone || null,
        github_username: values.github_username || null,
        linkedin_url: values.linkedin_url || null,
        portfolio_url: values.portfolio_url || null,
        experience_years: values.experience_years || null,
        working_hours: values.working_hours || null,
        skills: values.skills || [],
        emergency_contact_name: values.emergency_contact_name || null,
        emergency_contact_phone: values.emergency_contact_phone || null,
        bank_name: values.bank_name || null,
        bank_account_number: values.bank_account_number || null,
        bank_account_name: values.bank_account_name || null,
        currency: resolvedCurrency || null,
      };

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", profile.id);

      if (error) throw error;
      message.success("Profile updated successfully");
      refreshProfile();
    } catch (err) {
      message.error("Failed to update profile");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (values) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: values.new_password,
      });
      if (error) throw error;
      message.success("Password changed successfully");
      passwordForm.resetFields();
    } catch (err) {
      message.error("Failed to change password");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProfilePicture = async (file) => {
    setUploading(true);
    try {
      if (profilePicUrl) {
        const oldPath = profilePicUrl.split("/").pop();
        await supabase.storage
          .from("profile-pictures")
          .remove([`${profile.id}/${oldPath}`]);
      }
      const filePath = `${profile.id}/${Date.now()}.${file.name.split(".").pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data } = supabase.storage
        .from("profile-pictures")
        .getPublicUrl(filePath);
      await supabase
        .from("profiles")
        .update({ user_photo: data.publicUrl })
        .eq("id", profile.id);
      setProfilePicUrl(data.publicUrl);
      message.success("Photo updated");
      refreshProfile();
    } catch {
      message.error("Upload failed");
    } finally {
      setUploading(false);
    }
    return false;
  };

  const roleLabel =
    profile?.role === "project_manager" ? "Project Manager" : "Employee";
  const empType = EMPLOYMENT_TYPES.find(
    (t) => t.value === profile?.employment_type,
  )?.label;

  const TABS = [
    { key: "personal", label: "Personal", icon: <User size={13} /> },
    { key: "work", label: "Work", icon: <Briefcase size={13} /> },
    { key: "emergency", label: "Emergency", icon: <AlertCircle size={13} /> },
    { key: "bank", label: "Banking", icon: <Building2 size={13} /> },
    { key: "password", label: "Password", icon: <Shield size={13} /> },
  ];

  // ─── Shared save button ─────────────────────────────────────────────
  const SaveBar = () => (
    <div className="ep-save-bar">
      <Button
        type="primary"
        onClick={handleUpdateProfile}
        loading={loading}
        className="ep-save-btn"
        icon={<Check size={13} />}
      >
        Save Changes
      </Button>
    </div>
  );

  return (
    <div className="ep-prof">
      <style>{CSS}</style>

      {/* Page header */}
      <div className="ep-prof-header">
        <h1 className="ep-prof-title">My Profile</h1>
        <p className="ep-prof-sub">
          Manage your personal information and preferences
        </p>
      </div>

      {/* Hero */}
      <div className="ep-hero">
        <div className="ep-av-wrap">
          {profilePicUrl ? (
            <Avatar
              size={80}
              src={profilePicUrl}
              style={{ borderRadius: 16 }}
            />
          ) : (
            <Avatar
              size={80}
              style={{
                borderRadius: 16,
                background: getAvatarColor(profile?.full_name || ""),
                fontSize: 26,
                fontWeight: 700,
              }}
            >
              {getInitials(profile?.full_name)}
            </Avatar>
          )}
          <Upload
            beforeUpload={handleUploadProfilePicture}
            showUploadList={false}
            accept="image/*"
          >
            <div className="ep-av-upload" title="Change photo">
              <Camera size={12} color="#fff" />
            </div>
          </Upload>
        </div>
        <div className="ep-hero-info">
          <div className="ep-hero-name">{profile?.full_name || "—"}</div>
          <div className="ep-hero-role">{roleLabel}</div>
          <div className="ep-hero-chips">
            {profile?.email && (
              <span className="ep-chip">
                <Mail size={11} />
                {profile.email}
              </span>
            )}
            {empType && (
              <span className="ep-chip">
                <Briefcase size={11} />
                {empType}
              </span>
            )}
            {profile?.timezone && (
              <span className="ep-chip">
                <Globe size={11} />
                {profile.timezone}
              </span>
            )}
            {profile?.working_hours && (
              <span className="ep-chip">
                <Clock size={11} />
                {profile.working_hours}h/day
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Salary (read-only) */}
      {profile?.salary_type && <SalaryDisplay profile={profile} />}

      {/* Tab nav */}
      <div className="ep-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ep-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => handleTabSwitch(t.key)}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Single Form wrapping ALL tabs ─────────────────────────────
           preserveValue keeps unmounted fields' values in the store  */}
      <Form
        form={form}
        layout="vertical"
        onValuesChange={handleValuesChange}
        // Do NOT use onFinish here — we call handleUpdateProfile manually
      >
        {/* ── Personal Tab ── */}
        {activeTab === "personal" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <User size={13} />
                Personal Information
              </div>
              <div className="ep-grid-2">
                <Form.Item
                  name="full_name"
                  label="Full Name"
                  rules={[{ required: true, message: "Required" }]}
                >
                  <Input placeholder="Jane Doe" />
                </Form.Item>
                <Form.Item name="email" label="Email">
                  <Input disabled />
                </Form.Item>
                <Form.Item name="contact" label="Contact Number">
                  <Input placeholder="+1 555 000 0000" />
                </Form.Item>
                <Form.Item name="nationality" label="Nationality / Country">
                  <Input placeholder="e.g. Pakistani, American" />
                </Form.Item>
                <Form.Item name="cnic" label="National ID / Passport">
                  <Input placeholder="ID or passport number" />
                </Form.Item>
                <Form.Item name="dob" label="Date of Birth">
                  <DatePicker style={{ width: "100%" }} format="YYYY-MM-DD" />
                </Form.Item>
                <Form.Item
                  name="languages"
                  label="Languages Spoken"
                  style={{ gridColumn: "span 2" }}
                >
                  <Select
                    mode="multiple"
                    placeholder="Select languages"
                    allowClear
                  >
                    {LANGUAGES.map((l) => (
                      <Select.Option key={l} value={l}>
                        {l}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </div>
              <Form.Item name="address" label="Address">
                <TextArea rows={2} placeholder="Street, City, Country" />
              </Form.Item>
              <Form.Item name="bio" label="Bio">
                <TextArea rows={3} placeholder="Tell us about yourself…" />
              </Form.Item>
            </div>
            <SaveBar />
          </>
        )}

        {/* ── Work Tab ── */}
        {activeTab === "work" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <Briefcase size={13} />
                Work Details
              </div>
              <div className="ep-grid-2">
                <Form.Item name="employment_type" label="Employment Type">
                  <Select placeholder="Select type" disabled>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <Select.Option key={t.value} value={t.value}>
                        {t.label}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="timezone" label="Timezone">
                  <Select placeholder="Select timezone" showSearch>
                    {TIMEZONES.map((tz) => (
                      <Select.Option key={tz} value={tz}>
                        {tz}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item name="experience_years" label="Years of Experience">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={0}
                    max={60}
                    placeholder="5"
                    addonAfter="yrs"
                  />
                </Form.Item>
                <Form.Item name="working_hours" label="Working Hours / Day">
                  <InputNumber
                    style={{ width: "100%" }}
                    min={1}
                    max={24}
                    precision={1}
                    placeholder="8"
                    addonAfter="hrs"
                    readOnly
                  />
                </Form.Item>
                <Form.Item name="github_username" label="GitHub Username">
                  <Input placeholder="username" prefix="@" />
                </Form.Item>
                <Form.Item name="linkedin_url" label="LinkedIn Profile">
                  <Input placeholder="linkedin.com/in/username" />
                </Form.Item>
                <Form.Item name="portfolio_url" label="Portfolio / Website">
                  <Input placeholder="https://yoursite.com" />
                </Form.Item>
              </div>
              <Form.Item name="skills" label="Skills">
                <Select
                  mode="multiple"
                  placeholder="Add skills…"
                  allowClear
                  showSearch
                >
                  {SKILL_OPTIONS.map((s) => (
                    <Select.Option key={s} value={s}>
                      {s}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {(profile?.teams?.name ||
              profile?.job_title ||
              profile?.department) && (
              <div className="ep-sec">
                <div className="ep-sec-title">
                  <Lock size={13} />
                  Assigned by Admin
                </div>
                {profile?.teams?.name && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Briefcase size={12} />
                      Team
                    </span>
                    <span className="ep-info-val">{profile.teams.name}</span>
                  </div>
                )}
                {profile?.job_title && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Briefcase size={12} />
                      Job Title
                    </span>
                    <span className="ep-info-val">{profile.job_title}</span>
                  </div>
                )}
                {profile?.department && (
                  <div className="ep-info-row">
                    <span className="ep-info-label">
                      <Building2 size={12} />
                      Department
                    </span>
                    <span className="ep-info-val">{profile.department}</span>
                  </div>
                )}
                <p
                  style={{
                    fontSize: 11.5,
                    color: "#b0b0b0",
                    marginTop: 10,
                    marginBottom: 0,
                  }}
                >
                  Contact your admin to update these fields.
                </p>
              </div>
            )}
            <SaveBar />
          </>
        )}

        {/* ── Emergency Tab ── */}
        {activeTab === "emergency" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <AlertCircle size={13} />
                Emergency Contact
              </div>
              <p style={{ fontSize: 13, color: "#9a9a9a", marginBottom: 18 }}>
                This information is only used in case of an emergency and is
                kept confidential.
              </p>
              <div className="ep-grid-2">
                <Form.Item name="emergency_contact_name" label="Contact Name">
                  <Input placeholder="Full name" />
                </Form.Item>
                <Form.Item name="emergency_contact_phone" label="Contact Phone">
                  <Input placeholder="+1 555 000 0000" />
                </Form.Item>
              </div>
            </div>
            <SaveBar />
          </>
        )}

        {/* ── Bank Tab ── */}
        {activeTab === "bank" && (
          <>
            <div className="ep-sec">
              <div className="ep-sec-title">
                <Building2 size={13} />
                Bank Details
              </div>
              <div className="ep-grid-2">
                <Form.Item
                  name="bank_name"
                  label="Bank Name"
                  help={
                    <span style={{ fontSize: 11.5, color: "#b0b0b0" }}>
                      Type any bank name worldwide
                    </span>
                  }
                >
                  <Input placeholder="e.g. HSBC, Chase, Meezan Bank…" />
                </Form.Item>
                <Form.Item name="bank_account_name" label="Account Holder Name">
                  <Input placeholder="As on bank records" />
                </Form.Item>
                <Form.Item
                  name="bank_account_number"
                  label="Account / IBAN Number"
                >
                  <Input placeholder="IBAN or account number" />
                </Form.Item>
              </div>
            </div>

            <div className="ep-sec">
              <div className="ep-sec-title">
                <DollarSign size={13} />
                Preferred Currency
              </div>
              <div className="ep-grid-2">
                <Form.Item name="currency" label="Currency">
                  <Select
                    placeholder="Select currency"
                    showSearch
                    filterOption={(input, option) =>
                      option?.children
                        ?.toLowerCase()
                        .includes(input.toLowerCase())
                    }
                  >
                    {CURRENCIES.map((c) => (
                      <Select.Option key={c.code} value={c.code}>
                        {c.code === "OTHER"
                          ? "Other (type manually)"
                          : `${c.symbol} ${c.code} — ${c.name}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item
                  noStyle
                  shouldUpdate={(p, c) => p.currency !== c.currency}
                >
                  {({ getFieldValue }) =>
                    getFieldValue("currency") === "OTHER" ? (
                      <Form.Item
                        name="custom_currency"
                        label="Currency Code / Name"
                        rules={[
                          {
                            required: true,
                            message: "Please enter a currency",
                          },
                        ]}
                      >
                        <Input placeholder="e.g. BTC, USDT, XOF…" />
                      </Form.Item>
                    ) : (
                      <div />
                    )
                  }
                </Form.Item>
              </div>
            </div>
            <SaveBar />
          </>
        )}
      </Form>

      {/* ── Password Tab — separate form, no data conflict ── */}
      {activeTab === "password" && (
        <div className="ep-pw-card">
          <div className="ep-pw-note">
            <Shield size={14} />
            <span>
              Choose a strong password at least 8 characters long. You will be
              signed out of other sessions after changing it.
            </span>
          </div>
          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="new_password"
              label="New Password"
              rules={[
                { required: true, message: "Please enter a new password" },
                { min: 6, message: "At least 6 characters" },
              ]}
            >
              <Input.Password
                placeholder="Enter new password"
                style={{ borderRadius: 9 }}
              />
            </Form.Item>
            <Form.Item
              name="confirm_password"
              label="Confirm Password"
              dependencies={["new_password"]}
              rules={[
                { required: true, message: "Please confirm your password" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("new_password") === value)
                      return Promise.resolve();
                    return Promise.reject(new Error("Passwords do not match"));
                  },
                }),
              ]}
            >
              <Input.Password
                placeholder="Confirm new password"
                style={{ borderRadius: 9 }}
              />
            </Form.Item>
            <div
              className="ep-save-bar"
              style={{ justifyContent: "flex-start", paddingTop: 8 }}
            >
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="ep-save-btn"
                icon={<Lock size={13} />}
              >
                Change Password
              </Button>
            </div>
          </Form>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
