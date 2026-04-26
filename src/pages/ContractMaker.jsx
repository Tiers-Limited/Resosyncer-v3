import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  Input,
  Select,
  DatePicker,
  TimePicker,
  Checkbox,
  Typography,
  Alert,
  Upload,
  Modal,
  Tooltip,
} from "antd";
import {
  FileTextOutlined,
  DownloadOutlined,
  ThunderboltOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckOutlined,
  PlusOutlined,
  UserOutlined,
  SafetyCertificateOutlined,
  CalendarOutlined,
  UploadOutlined,
  FileOutlined,
  InboxOutlined,
  SignatureOutlined,
  FontSizeOutlined,
  ClearOutlined,
  CheckCircleFilled,
  ClockCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import {
  Lock,
  ArrowRight,
  Zap,
  ChevronRight,
  FileText,
  Shield,
  Scroll,
  Briefcase,
  Users,
  FileCheck,
  Handshake,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useLocation, useNavigate } from "react-router-dom";
import {
  connectDocusignOAuth,
  createDocusignEnvelope,
  createDocusignRecipientView,
  getDocusignEnvelopeStatus,
  emailDocusignSignedDocument,
  getDocusignSignedDocument,
  getDocusignAccount,
  getDocusignStatus,
} from "./integrations/DocuSign/api";
import { getNames as getCountryNames } from "country-list";
import dayjs from "dayjs";

const { TextArea } = Input;
const { Dragger } = Upload;
const COUNTRY_OPTIONS = getCountryNames().map((name) => ({
  label: name,
  value: name,
}));

const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "dge3lt4u6";
const CLOUDINARY_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "wukncq9d";
const TNR = "Arial, Helvetica, sans-serif";
const MIN_PROMPT_CHARS = 100;
const CONTRACT_DRAFT_STORAGE_KEY = "contract_maker_draft_v1";
const CONTRACT_PENDING_ENVELOPES_STORAGE_KEY =
  "contract_maker_pending_envelopes_v1";
const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const readPendingEnvelopeIds = () => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return [];
    const raw = localStorage.getItem(CONTRACT_PENDING_ENVELOPES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => String(item || "").trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};

const writePendingEnvelopeIds = (ids) => {
  try {
    if (typeof window === "undefined" || !window.localStorage) return;
    const normalized = Array.from(
      new Set((Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim())),
    ).filter(Boolean);
    localStorage.setItem(
      CONTRACT_PENDING_ENVELOPES_STORAGE_KEY,
      JSON.stringify(normalized),
    );
  } catch {
    // noop
  }
};

// ------------------------ Document Types ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const DOC_TYPES = [
  {
    key: "contract",
    label: "Service Contract",
    icon: <FileText size={15} />,
    desc: "General service or work agreements",
    color: "#3b82f6",
    bg: "#eff6ff",
  },
  {
    key: "nda",
    label: "NDA",
    icon: <Shield size={15} />,
    desc: "Non-disclosure agreements",
    color: "#8b5cf6",
    bg: "#f5f3ff",
  },
  {
    key: "employment",
    label: "Employment",
    icon: <Briefcase size={15} />,
    desc: "Employment & offer letters",
    color: "#10b981",
    bg: "#ecfdf5",
  },
  {
    key: "partnership",
    label: "Partnership",
    icon: <Handshake size={15} />,
    desc: "Business partnership agreements",
    color: "#f59e0b",
    bg: "#fffbeb",
  },
  {
    key: "mou",
    label: "MOU",
    icon: <FileCheck size={15} />,
    desc: "Memorandum of understanding",
    color: "#6366f1",
    bg: "#eef2ff",
  },
  {
    key: "freelance",
    label: "Freelance",
    icon: <Users size={15} />,
    desc: "Freelancer & consultant agreements",
    color: "#0ea5e9",
    bg: "#f0f9ff",
  },
  {
    key: "custom",
    label: "Custom",
    icon: <FileTextOutlined style={{ fontSize: 15 }} />,
    desc: "Any other legal document",
    color: "#64748b",
    bg: "#f8fafc",
  },
];

const DOC_SYSTEM_PROMPTS = {
  nda: `You are a professional legal document drafting assistant specializing in Non-Disclosure Agreements. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Disclosing Party", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Receiving Party", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS
2. PARTIES AND RECITALS
3. CONFIDENTIAL INFORMATION
4. OBLIGATIONS OF RECEIVING PARTY
5. EXCLUSIONS FROM CONFIDENTIALITY
6. TERM AND DURATION
7. RETURN OR DESTRUCTION OF INFORMATION
8. REMEDIES
9. GOVERNING LAW AND DISPUTE RESOLUTION
10. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  employment: `You are a professional legal document drafting assistant specializing in Employment Agreements. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Employer", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Employee", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS AND INTERPRETATION
2. PARTIES AND RECITALS
3. POSITION AND DUTIES
4. COMMENCEMENT AND TERM
5. COMPENSATION AND BENEFITS - use table: Benefit | Details
6. WORKING HOURS AND LOCATION
7. LEAVE ENTITLEMENTS
8. CONFIDENTIALITY AND NON-DISCLOSURE
9. INTELLECTUAL PROPERTY
10. NON-COMPETE AND NON-SOLICITATION
11. TERMINATION
12. GOVERNING LAW AND DISPUTE RESOLUTION
13. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  offerLetter: `You are a professional legal document drafting assistant specializing in Job Offer Letters. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Employer", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Candidate", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "", "paragraphs": ["Letter paragraph content."], "table": null }
  ]
}

REQUIRED CONTENT (letter flow, not numbered section headings):
- Opening offer statement
- Candidate details
- Role title and reporting structure
- Start date and work location
- Compensation summary - use table: Component | Amount | Notes
- Benefits and allowances - use table: Benefit | Details
- Working hours and leave
- Conditions precedent
- Acceptance instructions and deadline
- At-will / termination statement
- Confidentiality and IP acknowledgement
- Governing law
- Signature/acceptance block

RULES:
- Write this specifically as an offer letter format, not a full employment agreement.
- Include an explicit acceptance deadline date placeholder if user did not provide one.
- Do not add numbered section headings.
- "heading" may be empty for each section.
- Use practical placeholders in paragraphs where details are unknown, for example:
  [Employee Name], [Employer Address], [Salary], [Joining Date], [Work Location].
- paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  partnership: `You are a professional legal document drafting assistant specializing in Partnership Agreements. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Partner A", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Partner B", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS AND INTERPRETATION
2. PARTIES AND FORMATION
3. PURPOSE AND SCOPE
4. CAPITAL CONTRIBUTIONS - use table: Partner | Contribution | Percentage
5. PROFIT AND LOSS SHARING
6. MANAGEMENT AND DECISION MAKING
7. BANKING AND ACCOUNTS
8. DUTIES AND OBLIGATIONS OF PARTNERS
9. ADMISSION OF NEW PARTNERS
10. TRANSFER OF INTEREST
11. DISSOLUTION AND WINDING UP
12. GOVERNING LAW AND DISPUTE RESOLUTION
13. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  lease: `You are a professional legal document drafting assistant specializing in Lease Agreements. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Lessor / Landlord", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Lessee / Tenant", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS
2. PARTIES AND PREMISES
3. LEASE TERM
4. RENT AND PAYMENT TERMS - use table: Item | Amount | Due Date
5. SECURITY DEPOSIT
6. USE OF PREMISES
7. MAINTENANCE AND REPAIRS
8. ALTERATIONS AND IMPROVEMENTS
9. INSURANCE
10. SUBLETTING AND ASSIGNMENT
11. DEFAULT AND REMEDIES
12. TERMINATION
13. GOVERNING LAW AND DISPUTE RESOLUTION
14. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  mou: `You are a professional legal document drafting assistant specializing in Memoranda of Understanding. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Party A", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Party B", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. PURPOSE AND BACKGROUND
2. PARTIES
3. SCOPE OF COLLABORATION
4. ROLES AND RESPONSIBILITIES - use table: Party | Responsibilities
5. TIMELINE AND MILESTONES - use table: Milestone | Target Date
6. FINANCIAL ARRANGEMENTS
7. CONFIDENTIALITY
8. INTELLECTUAL PROPERTY
9. TERM AND TERMINATION
10. NON-BINDING NATURE
11. GOVERNING LAW
12. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  freelance: `You are a professional legal document drafting assistant specializing in Freelance/Consultant Agreements. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Client", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Freelancer / Consultant", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS AND INTERPRETATION
2. PARTIES AND RECITALS
3. SCOPE OF SERVICES
4. DELIVERABLES AND ACCEPTANCE
5. PROJECT TIMELINE - use table: Milestone | Deadline | Deliverable
6. FEES AND PAYMENT - use table: Item | Rate/Amount
7. INDEPENDENT CONTRACTOR STATUS
8. INTELLECTUAL PROPERTY
9. CONFIDENTIALITY
10. WARRANTIES
11. LIMITATION OF LIABILITY
12. TERMINATION
13. GOVERNING LAW
14. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  contract: `You are a professional legal contract drafting assistant. Return ONLY a raw JSON object - no markdown, no code fences, no explanation.

JSON structure:
{
  "title": "CONTRACT TITLE IN CAPS",
  "parties": [
    { "label": "Service Provider", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" },
    { "label": "Client", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose paragraph one.", "Paragraph two if needed."], "table": null }
  ]
}

REQUIRED SECTIONS:
1. DEFINITIONS AND INTERPRETATION
2. PARTIES AND RECITALS
3. SCOPE OF WORK
4. DELIVERABLES AND ACCEPTANCE CRITERIA
5. PROJECT TIMELINE AND MILESTONES - use table: Phase | Duration | Deliverable
6. PAYMENT TERMS - use table if milestone-based
7. TECHNOLOGY STACK - use table: Layer | Technology
8. INTELLECTUAL PROPERTY RIGHTS
9. CONFIDENTIALITY AND NON-DISCLOSURE
10. WARRANTIES AND REPRESENTATIONS
11. LIMITATION OF LIABILITY AND INDEMNIFICATION
12. TERMINATION
13. GOVERNING LAW AND DISPUTE RESOLUTION
14. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  custom: `You are a professional legal document drafting assistant. The user will describe the document they need. Infer the appropriate document type, parties, and sections. Return ONLY a raw JSON object.

JSON structure:
{
  "title": "DOCUMENT TITLE IN CAPS",
  "parties": [
    { "label": "Party Label", "name": "[NAME]", "address": "[ADDRESS]", "email": "[EMAIL]" }
  ],
  "sections": [
    { "heading": "1. SECTION HEADING", "paragraphs": ["Legal prose."], "table": null }
  ]
}

RULES:
- Create appropriate sections based on the document type described
- Use tables where data is tabular/structured
- paragraphs are plain text arrays
- No markdown anywhere
- Minimum 10 sections
- Return ONLY JSON`,
};

// ------------------------ Helpers ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed: " + src));
    document.head.appendChild(s);
  });
}

async function ensureLibraries() {
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  );
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  );
}

const buildPrompt = (text, extra, docType) =>
  `Generate a complete professional ${DOC_TYPES.find((d) => d.key === docType)?.label || "legal document"} based on the following:\n\n${text.slice(0, 14000)}${extra ? `\n\nExtra instructions: ${extra}` : ""}`;

const OFFER_LETTER_KEYWORDS =
  /\boffer letter\b|\bjob offer\b|\boffer of employment\b|\bemployment offer\b|\bemployment letter\b|\bappointment letter\b/i;

const LETTER_STYLE_VARIANTS = new Set(["offerLetter"]);

const DOC_BLUEPRINTS = {
  nda: [
    "1. DEFINITIONS",
    "2. PARTIES AND RECITALS",
    "3. CONFIDENTIAL INFORMATION",
    "4. OBLIGATIONS OF RECEIVING PARTY",
    "5. EXCLUSIONS FROM CONFIDENTIALITY",
    "6. TERM AND DURATION",
    "7. RETURN OR DESTRUCTION OF INFORMATION",
    "8. REMEDIES",
    "9. GOVERNING LAW AND DISPUTE RESOLUTION",
    "10. GENERAL PROVISIONS",
  ],
  contract: [
    "1. DEFINITIONS AND INTERPRETATION",
    "2. PARTIES AND RECITALS",
    "3. SCOPE OF WORK",
    "4. DELIVERABLES AND ACCEPTANCE CRITERIA",
    "5. PROJECT TIMELINE AND MILESTONES",
    "6. PAYMENT TERMS",
    "7. TECHNOLOGY STACK",
    "8. INTELLECTUAL PROPERTY RIGHTS",
    "9. CONFIDENTIALITY AND NON-DISCLOSURE",
    "10. WARRANTIES AND REPRESENTATIONS",
    "11. LIMITATION OF LIABILITY AND INDEMNIFICATION",
    "12. TERMINATION",
    "13. GOVERNING LAW AND DISPUTE RESOLUTION",
    "14. GENERAL PROVISIONS",
  ],
  employment: [
    "1. DEFINITIONS AND INTERPRETATION",
    "2. PARTIES AND RECITALS",
    "3. POSITION AND DUTIES",
    "4. COMMENCEMENT AND TERM",
    "5. COMPENSATION AND BENEFITS",
    "6. WORKING HOURS AND LOCATION",
    "7. LEAVE ENTITLEMENTS",
    "8. CONFIDENTIALITY AND NON-DISCLOSURE",
    "9. INTELLECTUAL PROPERTY",
    "10. NON-COMPETE AND NON-SOLICITATION",
    "11. TERMINATION",
    "12. GOVERNING LAW AND DISPUTE RESOLUTION",
    "13. GENERAL PROVISIONS",
  ],
  offerLetter: [
    "1. OFFER INTRODUCTION",
    "2. CANDIDATE DETAILS",
    "3. ROLE TITLE AND REPORTING STRUCTURE",
    "4. START DATE AND WORK LOCATION",
    "5. COMPENSATION SUMMARY",
    "6. BENEFITS AND ALLOWANCES",
    "7. WORKING HOURS AND LEAVE",
    "8. CONDITIONS PRECEDENT",
    "9. ACCEPTANCE INSTRUCTIONS AND DEADLINE",
    "10. AT-WILL / TERMINATION STATEMENT",
    "11. CONFIDENTIALITY AND IP ACKNOWLEDGEMENT",
    "12. GOVERNING LAW",
    "13. SIGNATURES",
  ],
  partnership: [
    "1. DEFINITIONS AND INTERPRETATION",
    "2. PARTIES AND FORMATION",
    "3. PURPOSE AND SCOPE",
    "4. CAPITAL CONTRIBUTIONS",
    "5. PROFIT AND LOSS SHARING",
    "6. MANAGEMENT AND DECISION MAKING",
    "7. BANKING AND ACCOUNTS",
    "8. DUTIES AND OBLIGATIONS OF PARTNERS",
    "9. ADMISSION OF NEW PARTNERS",
    "10. TRANSFER OF INTEREST",
    "11. DISSOLUTION AND WINDING UP",
    "12. GOVERNING LAW AND DISPUTE RESOLUTION",
    "13. GENERAL PROVISIONS",
  ],
  mou: [
    "1. PURPOSE AND BACKGROUND",
    "2. PARTIES",
    "3. SCOPE OF COLLABORATION",
    "4. ROLES AND RESPONSIBILITIES",
    "5. TIMELINE AND MILESTONES",
    "6. FINANCIAL ARRANGEMENTS",
    "7. CONFIDENTIALITY",
    "8. INTELLECTUAL PROPERTY",
    "9. TERM AND TERMINATION",
    "10. NON-BINDING NATURE",
    "11. GOVERNING LAW",
    "12. GENERAL PROVISIONS",
  ],
  freelance: [
    "1. DEFINITIONS AND INTERPRETATION",
    "2. PARTIES AND RECITALS",
    "3. SCOPE OF SERVICES",
    "4. DELIVERABLES AND ACCEPTANCE",
    "5. PROJECT TIMELINE",
    "6. FEES AND PAYMENT",
    "7. INDEPENDENT CONTRACTOR STATUS",
    "8. INTELLECTUAL PROPERTY",
    "9. CONFIDENTIALITY",
    "10. WARRANTIES",
    "11. LIMITATION OF LIABILITY",
    "12. TERMINATION",
    "13. GOVERNING LAW",
    "14. GENERAL PROVISIONS",
  ],
  custom: [],
};

const DEFAULT_PARTY_LABELS = {
  nda: ["Disclosing Party", "Receiving Party"],
  contract: ["Service Provider", "Client"],
  employment: ["Employer", "Employee"],
  offerLetter: ["Employer", "Candidate"],
  partnership: ["Partner A", "Partner B"],
  mou: ["Party A", "Party B"],
  freelance: ["Client", "Freelancer / Consultant"],
  custom: ["Party A", "Party B"],
};

const formatHumanDate = (value) => {
  const raw = String(value || "").trim();
  if (raw) {
    const parsed = new Date(`${raw}T00:00:00`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  }
  return new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const PLACEHOLDER_REGEX = /\[([^[\]]+)\]/g;

const normalizePlaceholderToken = (token) =>
  String(token || "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

const extractPlaceholderTokensFromText = (text) => {
  const source = String(text ?? "");
  const result = [];
  let match;
  while ((match = PLACEHOLDER_REGEX.exec(source)) !== null) {
    const token = String(match[1] || "").trim();
    if (token) result.push(token);
  }
  PLACEHOLDER_REGEX.lastIndex = 0;
  return result;
};

const escapeRegExp = (value) =>
  String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replacePlaceholderTokensInText = (text, entries) => {
  let next = String(text ?? "");
  entries.forEach(({ token, value }) => {
    if (!token || value === undefined || value === null || value === "") return;
    const pattern = new RegExp(`\\[\\s*${escapeRegExp(token)}\\s*\\]`, "gi");
    next = next.replace(pattern, String(value));
  });
  return next;
};

const removePlaceholderTokensInText = (text, tokens) => {
  let next = String(text ?? "");
  tokens.forEach((token) => {
    if (!token) return;
    const pattern = new RegExp(`\\[\\s*${escapeRegExp(token)}\\s*\\]`, "gi");
    next = next.replace(pattern, "");
  });
  return next
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .trim();
};

const normalizeTableRowCells = (row) => {
  if (Array.isArray(row)) return row;
  if (row && typeof row === "object") return Object.values(row);
  if (row === null || row === undefined) return [];
  return [row];
};

const detectPlaceholderFieldType = (token) => {
  const t = normalizePlaceholderToken(token);
  if (!t) return "text";
  const words = t.split(/[^a-z0-9]+/).filter(Boolean);
  const hasWord = (word) => words.includes(word);
  const hasPhrase = (phrase) => t.includes(phrase);

  if (hasWord("email")) return "email";
  if (hasWord("country") || hasWord("nationality")) return "country";
  if (
    hasWord("date") ||
    hasWord("dob") ||
    hasWord("birth") ||
    hasWord("joining") ||
    hasPhrase("start date") ||
    hasPhrase("end date") ||
    hasWord("deadline") ||
    hasWord("effective")
  ) {
    return "date";
  }
  if (hasWord("time") || hasWord("hour") || hasWord("shift") || hasWord("slot"))
    return "time";
  if (
    /(condition|conditions|term|terms|scope|responsibilit|instruction|note|clause|description|details|address)/i.test(
      t,
    )
  )
    return "textarea";
  return "text";
};

const getPartyFieldPlaceholders = (variant, partyIndex = 0) => {
  if (variant === "offerLetter") {
    if (partyIndex === 0) {
      return {
        name: "Employer / Company Name",
        address: "Employer Address",
        email: "hr@company.com",
      };
    }
    return {
      name: "Employee / Candidate Name",
      address: "Employee Address",
      email: "employee@email.com",
    };
  }
  if (variant === "employment") {
    if (partyIndex === 0) {
      return {
        name: "Employer Name",
        address: "Employer Address",
        email: "hr@company.com",
      };
    }
    return {
      name: "Employee Name",
      address: "Employee Address",
      email: "employee@email.com",
    };
  }
  return {
    name: "Full Name",
    address: "Address",
    email: "Email",
  };
};

const resolveDocVariant = (docType, userContent) => {
  if (docType === "employment" && OFFER_LETTER_KEYWORDS.test(userContent || "")) {
    return "offerLetter";
  }
  return docType;
};

const toParagraphs = (section) => {
  if (Array.isArray(section?.paragraphs)) {
    return section.paragraphs
      .map((p) => String(p || "").trim())
      .filter(Boolean);
  }
  if (typeof section?.content === "string" && section.content.trim()) {
    return [section.content.trim()];
  }
  return [];
};

const normalizeHeading = (heading) =>
  String(heading || "")
    .toLowerCase()
    .replace(/^\d+\.\s*/, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const headingScore = (a, b) => {
  const aa = new Set(normalizeHeading(a).split(" ").filter(Boolean));
  const bb = new Set(normalizeHeading(b).split(" ").filter(Boolean));
  if (!aa.size || !bb.size) return 0;
  const overlap = [...aa].filter((w) => bb.has(w)).length;
  return overlap / Math.max(aa.size, bb.size);
};

const mergeWithBlueprint = (sections, variant) => {
  const blueprint = DOC_BLUEPRINTS[variant] || DOC_BLUEPRINTS.custom;
  const sourceSections = Array.isArray(sections) ? sections : [];

  // Offer/appointment letters are narrative documents and should not force numbered section headings.
  if (LETTER_STYLE_VARIANTS.has(variant)) {
    const normalized = sourceSections
      .map((source) => {
        const paragraphs = toParagraphs(source);
        const hasTable = !!(
          source?.table?.headers &&
          Array.isArray(source?.table?.rows) &&
          source.table.rows.length
        );
        if (!paragraphs.length && !hasTable) return null;
        return {
          heading: "",
          paragraphs: paragraphs.length
            ? paragraphs
            : ["Details to be finalized by the parties."],
          table: source?.table || null,
        };
      })
      .filter(Boolean);
    return normalized.length
      ? normalized
      : [
          {
            heading: "",
            paragraphs: ["Details to be finalized by the parties."],
            table: null,
          },
        ];
  }

  if (!blueprint.length) return sourceSections;

  const used = new Set();
  const merged = blueprint.map((targetHeading) => {
    let bestIndex = -1;
    let bestScore = 0;
    sourceSections.forEach((source, index) => {
      if (used.has(index)) return;
      const score = headingScore(source?.heading, targetHeading);
      if (score > bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });

    if (bestIndex >= 0 && bestScore >= 0.25) {
      used.add(bestIndex);
      const source = sourceSections[bestIndex] || {};
      const paragraphs = toParagraphs(source);
      return {
        heading: targetHeading,
        paragraphs: paragraphs.length
          ? paragraphs
          : ["Details to be finalized by the parties."],
        table: source.table || null,
      };
    }

    return {
      heading: targetHeading,
      paragraphs: ["Details to be finalized by the parties."],
      table: null,
    };
  });

  sourceSections.forEach((source, index) => {
    if (used.has(index)) return;
    const paragraphs = toParagraphs(source);
    if (!String(source?.heading || "").trim() || !paragraphs.length) return;
    merged.push({
      heading: source.heading,
      paragraphs,
      table: source.table || null,
    });
  });

  return merged;
};

const toTitleCase = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const parseInlineKeyValuePairs = (paragraph) => {
  const text = String(paragraph || "").replace(/\s+/g, " ").trim();
  const colonIndex = text.indexOf(":");
  if (colonIndex < 0) return null;
  const intro = text.slice(0, colonIndex + 1).trim();
  const rest = text.slice(colonIndex + 1).trim();
  if (!rest) return null;

  const chunks = rest.split(/\s*,\s*(?=[A-Za-z][A-Za-z '\/&-]{1,40}\s*[-:])/g);
  const rows = [];
  chunks.forEach((chunk) => {
    const m = chunk.match(/^([A-Za-z][A-Za-z '\/&-]{1,50})\s*[-:]\s*(.+)$/);
    if (!m) return;
    rows.push([toTitleCase(m[1]), String(m[2] || "").trim()]);
  });
  if (rows.length < 2) return null;
  return { intro, rows };
};

const formatSectionsForReadability = (sections) =>
  (Array.isArray(sections) ? sections : []).map((section) => {
    if (section?.table?.headers?.length && section?.table?.rows?.length) return section;
    const paragraphs = Array.isArray(section?.paragraphs) ? section.paragraphs : [];
    const normalizedParagraphs = [];
    const tableRows = [];

    paragraphs.forEach((para) => {
      const parsed = parseInlineKeyValuePairs(para);
      if (!parsed) {
        normalizedParagraphs.push(para);
        return;
      }
      if (parsed.intro) normalizedParagraphs.push(parsed.intro);
      parsed.rows.forEach((row) => tableRows.push(row));
    });

    if (!tableRows.length) {
      return {
        ...section,
        paragraphs: normalizedParagraphs,
      };
    }

    return {
      ...section,
      paragraphs: normalizedParagraphs,
      table: {
        headers: ["Field", "Details"],
        rows: tableRows,
      },
    };
  });

const isSignatureSectionLike = (section) => {
  const heading = String(section?.heading || "").toLowerCase();
  const joined = (section?.paragraphs || []).join(" ").toLowerCase();
  return heading.includes("signature") || joined.includes("signature");
};

const upsertDualPartySignatureSection = (sections, parties, variant) => {
  const existing = Array.isArray(sections) ? sections : [];
  const withoutSignatureSections = existing.filter(
    (section) => !isSignatureSectionLike(section),
  );

  const p = Array.isArray(parties) ? parties : [];
  const partyAName = String(p?.[0]?.name || "Party A").trim();
  const partyALabel = String(p?.[0]?.label || "Party A").trim();
  const partyBName = String(p?.[1]?.name || "Party B").trim();
  const partyBLabel = String(p?.[1]?.label || "Party B").trim();

  return [
    ...withoutSignatureSections,
    {
      heading: LETTER_STYLE_VARIANTS.has(variant) ? "" : "SIGNATURES",
      paragraphs: [
        "Both parties agree to the terms and sign below.",
      ],
      table: {
        headers: ["Party", "Name", "Signature", "Date"],
        rows: [
          [partyALabel, partyAName, "____________________", "____________________"],
          [partyBLabel, partyBName, "____________________", "____________________"],
        ],
      },
    },
  ];
};

const normalizeParties = (parties, variant) => {
  const labels = DEFAULT_PARTY_LABELS[variant] || DEFAULT_PARTY_LABELS.custom;
  const safe = Array.isArray(parties) ? parties.slice(0, 4) : [];
  const normalized = safe.map((p, i) => ({
    label: p?.label || labels[i] || `Party ${i + 1}`,
    name: p?.name || "",
    address: p?.address || "",
    email: p?.email || "",
  }));

  while (normalized.length < 2) {
    const i = normalized.length;
    normalized.push({
      label: labels[i] || `Party ${i + 1}`,
      name: "",
      address: "",
      email: "",
    });
  }
  return normalized;
};

const normalizeGeneratedDocument = (result, docType, userContent) => {
  const variant = resolveDocVariant(docType, userContent);
  const fallbackLabel =
    DOC_TYPES.find((d) => d.key === docType)?.label || "Legal Document";
  const parties = normalizeParties(result?.parties, variant);
  const mergedSections = mergeWithBlueprint(result?.sections, variant);
  const readableSections = formatSectionsForReadability(mergedSections);
  const sectionsWithSignatures = upsertDualPartySignatureSection(
    readableSections,
    parties,
    variant,
  );

  return {
    variant,
    title: String(result?.title || `${fallbackLabel}`),
    parties,
    sections: sectionsWithSignatures,
  };
};

const buildUserContent = ({ text, extra, docType }) => {
  const typeLabel =
    DOC_TYPES.find((d) => d.key === docType)?.label || "Legal Document";
  const variant = resolveDocVariant(docType, `${text || ""}\n${extra || ""}`);
  return `Document Type: ${typeLabel} (${docType})
Instructions:
- Draft strictly for this document type.
- Use clauses and tone specific to this document type only.
- Keep headings and structure aligned with this document type.${LETTER_STYLE_VARIANTS.has(variant) ? "\n- This is a letter-style document: do not use numbered section headings." : ""}

Source details:
${String(text || "").slice(0, 14000)}${extra ? `\n\nExtra instructions: ${extra}` : ""}`;
};

const resolveSystemPrompt = (docType, userContent) => {
  const variant = resolveDocVariant(docType, userContent);
  return DOC_SYSTEM_PROMPTS[variant] || DOC_SYSTEM_PROMPTS.custom;
};

async function callGroq(userContent, docType) {
  if (!GROQ_API_KEY) throw new Error("VITE_GROK_API_KEY not set in .env");
  const systemPrompt = resolveSystemPrompt(docType, userContent);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.25,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) {
    const e = await res.json();
    throw new Error(e?.error?.message || "Groq API error");
  }
  const data = await res.json();
  let raw = (data.choices?.[0]?.message?.content || "").trim();
  raw = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  try {
    return JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]);
    throw new Error("AI returned invalid JSON. Please try again.");
  }
}

async function extractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || name.endsWith(".md")) {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = (e) => res(e.target.result);
      r.onerror = rej;
      r.readAsText(file);
    });
  }
  if (name.endsWith(".pdf")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.pdfjsLib) {
            await loadScript(
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
            );
            window.pdfjsLib.GlobalWorkerOptions.workerSrc =
              "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
          }
          const pdf = await window.pdfjsLib.getDocument({
            data: e.target.result,
          }).promise;
          let text = "";
          for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
            const page = await pdf.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item) => item.str).join(" ") + "\n";
          }
          resolve(text.trim());
        } catch {
          resolve("");
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  if (name.endsWith(".docx")) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          if (!window.mammoth)
            await loadScript(
              "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
            );
          const result = await window.mammoth.extractRawText({
            arrayBuffer: e.target.result,
          });
          resolve(result.value || "");
        } catch {
          resolve("");
        }
      };
      reader.readAsArrayBuffer(file);
    });
  }
  return "";
}

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = String(event?.target?.result || "");
      const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : "";
      resolve(base64 || "");
    };
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.readAsDataURL(file);
  });

const htmlToPlainText = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(String(html || ""), "text/html");
  return (doc?.body?.textContent || "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

const remoteImageToDataUrl = async (url) => {
  const target = String(url || "").trim();
  if (!target || !/^https?:\/\//i.test(target)) return target;
  const res = await fetch(target);
  if (!res.ok) return target;
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || target));
    reader.onerror = () => reject(new Error("Failed to process image"));
    reader.readAsDataURL(blob);
  });
};

async function htmlTextToPdfBase64(htmlText, documentName = "Agreement") {
  await ensureLibraries();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const marginX = 56;
  const marginY = 60;
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  const maxY = doc.internal.pageSize.getHeight() - marginY;
  let y = marginY;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(documentName, maxWidth);
  titleLines.forEach((line) => {
    doc.text(line, marginX, y);
    y += 22;
  });
  y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const plain = htmlToPlainText(htmlText);
  const lines = doc.splitTextToSize(plain || " ", maxWidth);
  lines.forEach((line) => {
    if (y > maxY) {
      doc.addPage();
      y = marginY;
    }
    doc.text(line, marginX, y);
    y += 16;
  });

  const dataUri = doc.output("datauristring");
  return dataUri.split(",")[1] || "";
}

async function uploadPdfBlobToCloudinary(blob, filenameBase = "agreement") {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
    throw new Error(
      "Cloudinary config missing. Set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET.",
    );
  }
  const safeName = String(filenameBase || "agreement")
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 80);

  const form = new FormData();
  form.append("file", blob, `${safeName || "agreement"}.pdf`);
  form.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  form.append("resource_type", "raw");
  form.append("folder", "docusign");
  form.append("public_id", `${safeName || "agreement"}_${Date.now()}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
    {
      method: "POST",
      body: form,
    },
  );
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.error?.message || "Failed to upload PDF to Cloudinary.");
  }
  return String(payload?.secure_url || payload?.url || "").trim();
}

async function downloadDocumentPDF({
  docTitle,
  effectiveDate,
  companyName,
  confidentiality,
  logoDataUrl,
  contractData,
  signatures,
  showSectionHeadings = true,
  saveFile = true,
  returnBase64 = false,
  returnBlob = false,
}) {
  await ensureLibraries();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const PW = doc.internal.pageSize.getWidth();
  const PH = doc.internal.pageSize.getHeight();
  const ML = 62,
    MR = 62,
    MT = 72,
    MB = 64;
  const CW = PW - ML - MR;
  let y = MT;
  let currentPage = 1;
  const C = {
    black: [0, 0, 0],
    dark: [28, 28, 28],
    mid: [85, 85, 85],
    light: [155, 155, 155],
    rule: [212, 212, 212],
    thBg: [18, 18, 18],
    rowAlt: [247, 247, 247],
    boxBg: [250, 250, 250],
  };

  const drawPageChrome = () => {
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.4);
    doc.line(ML, 42, PW - MR, 42);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text((docTitle || "DOCUMENT").toUpperCase(), ML, 36);
    doc.text(companyName ? companyName.toUpperCase() : "", PW - MR, 36, {
      align: "right",
    });
    const fy = PH - 28;
    doc.setDrawColor(...C.rule);
    doc.line(ML, fy - 8, PW - MR, fy - 8);
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text(`Page ${currentPage}`, PW - MR, fy, { align: "right" });
  };
  const newPage = () => {
    drawPageChrome();
    doc.addPage();
    currentPage++;
    y = MT;
    drawPageChrome();
  };
  const need = (h) => {
    if (y + h > PH - MB) newPage();
  };
  const sp = (h = 10) => {
    y += h;
  };

  drawPageChrome();
  const pdfParties = Array.isArray(contractData?.parties) ? contractData.parties : [];
  const senderParty = pdfParties[0] || {};
  const recipientParty = pdfParties[1] || pdfParties[0] || {};
  const primarySignature = Array.isArray(signatures) ? signatures[0] || {} : {};
  const letterDate = formatHumanDate(effectiveDate);
  const recipientName = String(
    primarySignature?.name || recipientParty?.name || "Recipient Name",
  ).trim();
  const recipientTitle = String(primarySignature?.title || "Position Title").trim();
  const senderName = String(companyName || senderParty?.name || "Company Name").trim();
  const senderAddress = String(senderParty?.address || "Company Address").trim();
  const headerStartY = y + 2;
  let headerLeftEndY = headerStartY;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.mid);
  doc.text("Date", ML, headerLeftEndY);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...C.dark);
  doc.text(letterDate, ML + 44, headerLeftEndY);
  headerLeftEndY += 18;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.mid);
  doc.text("To", ML, headerLeftEndY);
  headerLeftEndY += 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...C.dark);
  doc.text(recipientName, ML, headerLeftEndY);
  headerLeftEndY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.mid);
  doc.text(recipientTitle, ML, headerLeftEndY);
  headerLeftEndY += 22;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...C.dark);
  doc.text(senderName, ML, headerLeftEndY);
  headerLeftEndY += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...C.mid);
  const senderAddressLines = doc.splitTextToSize(senderAddress, CW * 0.6);
  senderAddressLines.forEach((line) => {
    doc.text(line, ML, headerLeftEndY);
    headerLeftEndY += 13;
  });

  let logoBottomY = headerStartY;
  if (logoDataUrl && logoDataUrl.startsWith("data:image")) {
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxW = 132;
            const maxH = 58;
            let lw = img.naturalWidth || img.width;
            let lh = img.naturalHeight || img.height;
            const ratio = lw / lh;
            if (lw > maxW) {
              lw = maxW;
              lh = lw / ratio;
            }
            if (lh > maxH) {
              lh = maxH;
              lw = lh * ratio;
            }
            const lx = PW - MR - lw;
            doc.addImage(img, "PNG", lx, headerStartY - 4, lw, lh);
            logoBottomY = headerStartY - 4 + lh;
          } catch (e) {
            console.warn(e);
          }
          resolve();
        };
        img.onerror = resolve;
        img.src = logoDataUrl;
      });
    } catch (e) {
      console.warn(e);
    }
  }

  y = Math.max(headerLeftEndY, logoBottomY) + 14;
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.75);
  doc.line(ML, y, PW - MR, y);
  y += 20;
  if (confidentiality) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.setDrawColor(...C.light);
    doc.setLineWidth(0.5);
    const stamp = "C O N F I D E N T I A L";
    const sw = doc.getTextWidth(stamp) + 24;
    doc.rect(PW / 2 - sw / 2, y - 10, sw, 15);
    doc.text(stamp, PW / 2, y, { align: "center" });
    y += 20;
  }
  sp(20);
  const sections = contractData?.sections || [];
  sections.forEach((section) => {
    need(50);
    const sectionHeading = String(section?.heading || "").trim();
    if (showSectionHeadings && sectionHeading) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...C.black);
      const headingLines = doc.splitTextToSize(sectionHeading.toUpperCase(), CW);
      headingLines.forEach((hl) => {
        need(18);
        doc.text(hl, ML, y);
        y += 18;
      });
      y += 6;
    }
    const paras = Array.isArray(section.paragraphs)
      ? section.paragraphs
      : section.content
        ? [section.content]
        : [];
    paras.forEach((para) => {
      if (!para?.trim()) return;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...C.dark);
      const lines = doc.splitTextToSize(para.trim(), CW);
      need(lines.length * 16 + 8);
      doc.text(para.trim(), ML, y, {
        maxWidth: CW,
        align: "justify",
      });
      y += lines.length * 16;
      y += 6;
    });
    if (section.table?.headers && section.table?.rows?.length) {
      need(36);
      doc.autoTable({
        startY: y,
        head: [section.table.headers],
        body: section.table.rows,
        margin: { left: ML, right: MR },
        tableWidth: CW,
        styles: {
          font: "helvetica",
          fontSize: 10,
          cellPadding: { top: 7, right: 12, bottom: 7, left: 12 },
          lineColor: [210, 210, 210],
          lineWidth: 0.4,
          textColor: C.dark,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          font: "helvetica",
          fontStyle: "bold",
          fontSize: 11,
          fillColor: C.thBg,
          textColor: [255, 255, 255],
          halign: "left",
          cellPadding: { top: 9, right: 12, bottom: 9, left: 12 },
        },
        alternateRowStyles: { fillColor: C.rowAlt },
        columnStyles: { 0: { fontStyle: "bold" } },
        tableLineColor: [185, 185, 185],
        tableLineWidth: 0.4,
        didDrawPage: () => {
          currentPage = doc.internal.getNumberOfPages();
          drawPageChrome();
        },
      });
      y = doc.lastAutoTable.finalY + 14;
    }
    sp(16);
  });
  drawPageChrome();
  const filename =
    (docTitle || "Document").replace(/[^a-zA-Z0-9 _-]/g, "").trim() + ".pdf";
  const dataUri = returnBase64 ? doc.output("datauristring") : "";
  const blob = returnBlob ? doc.output("blob") : null;
  if (saveFile) {
    doc.save(filename);
  }
  if (returnBlob) return blob;
  return returnBase64 ? dataUri.split(",")[1] || "" : "";
}

// ------------------------ Paywall ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function DocumentGeneratorPaywall({ dark = false }) {
  const colors = dark
    ? {
        page: "#141416",
        header: "#1a1b1f",
        panel: "#1a1b1f",
        panelAlt: "#17181c",
        panelMuted: "#202127",
        border: "#2a2b31",
        text: "#f3f4f6",
        textMuted: "#9ca3af",
        textSubtle: "#818897",
        overlay: "linear-gradient(180deg, rgba(20,20,22,0) 0%, #1a1b1f 8%)",
        proBadgeBg:
          "linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%)",
        proBadgeBorder: "#4b4f61",
      }
    : {
        page: "#f8fafc",
        header: "#fff",
        panel: "#fff",
        panelAlt: "#f8fafc",
        panelMuted: "#f1f5f9",
        border: "#e2e8f0",
        text: "#0f172a",
        textMuted: "#64748b",
        textSubtle: "#94a3b8",
        overlay: "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 8%)",
        proBadgeBg: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
        proBadgeBorder: "#ddd6fe",
      };

  const features = [
    {
      icon: <FileText size={16} />,
      title: "8 Document Types",
      desc: "Contracts, NDAs, employment, partnership, lease, MOU, freelance and more.",
    },
    {
      icon: <ThunderboltOutlined style={{ fontSize: 16 }} />,
      title: "AI-Powered Drafting",
      desc: "Llama 3.3 generates complete, legally structured documents in seconds.",
    },
    {
      icon: <EditOutlined style={{ fontSize: 16 }} />,
      title: "Inline Editing",
      desc: "Click any clause, heading or table cell to edit directly in the document.",
    },
    {
      icon: <SignatureOutlined style={{ fontSize: 16 }} />,
      title: "Digital Signatures",
      desc: "Draw, type or upload signatures and embed them directly in the PDF.",
    },
    {
      icon: <DownloadOutlined style={{ fontSize: 16 }} />,
      title: "PDF Export",
      desc: "Professional PDF output with headers, tables, page numbers, and your logo.",
    },
    {
      icon: <Shield size={16} />,
      title: "Confidential Stamp",
      desc: "Mark documents as confidential with a professional watermark stamp.",
    },
  ];

  const mockDocs = [
    {
      name: "Service Agreement - Acme Corp",
      type: "Contract",
      color: "#3b82f6",
      date: "Mar 28, 2026",
    },
    {
      name: "Non-Disclosure Agreement",
      type: "NDA",
      color: "#8b5cf6",
      date: "Mar 25, 2026",
    },
    {
      name: "Employment Contract - J. Smith",
      type: "Employment",
      color: "#10b981",
      date: "Mar 20, 2026",
    },
    {
      name: "Partnership Agreement",
      type: "Partnership",
      color: "#f59e0b",
      date: "Mar 15, 2026",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.page,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: colors.header,
          borderBottom: `1px solid ${colors.border}`,
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
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 26,
                fontWeight: 800,
                color: colors.text,
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Document Generator
            </h1>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: 13 }}>
              AI-powered • 8 document types • PDF export • Digital signatures
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "0 28px 40px" }}>
        {/* Blurred KPI strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            marginBottom: 24,
            filter: "blur(6px)",
            pointerEvents: "none",
            userSelect: "none",
            opacity: 0.45,
          }}
        >
          {[
            ["#3b82f6", "24", "Documents Created"],
            ["#8b5cf6", "8", "Document Types"],
            ["#10b981", "12", "Signed Documents"],
            ["#f59e0b", "3", "This Week"],
          ].map(([color, val, label]) => (
            <div
              key={label}
              style={{
                background: colors.panel,
                border: `1px solid ${colors.border}`,
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
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: colors.text,
                    lineHeight: 1,
                  }}
                >
                  {val}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: colors.textSubtle,
                    marginTop: 3,
                    fontWeight: 500,
                  }}
                >
                  {label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main paywall card */}
        <div
          style={{
            position: "relative",
            background: colors.panel,
            border: `1px solid ${colors.border}`,
            borderRadius: 20,
            overflow: "hidden",
          }}
        >
          {/* Blurred mock + badge wrapper */}
          <div style={{ position: "relative" }}>
            {/* Blurred mock UI */}
            <div
              style={{
                filter: "blur(5px)",
                pointerEvents: "none",
                userSelect: "none",
                opacity: 0.3,
                borderBottom: `1px solid ${colors.border}`,
                overflow: "hidden",
                padding: "24px 24px 0",
              }}
            >
              {/* Doc type pills */}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  marginBottom: 20,
                  flexWrap: "wrap",
                }}
              >
                {DOC_TYPES.slice(0, 6).map((d) => (
                  <div
                    key={d.key}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      background: d.bg,
                      color: d.color,
                      fontSize: 12,
                      fontWeight: 700,
                      border: `1px solid ${d.color}30`,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    {d.icon} {d.label}
                  </div>
                ))}
              </div>
              {/* Mock doc list */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                  paddingBottom: 20,
                }}
              >
                {mockDocs.map((d, i) => (
                  <div
                    key={i}
                    style={{
                      background: colors.panelAlt,
                      border: `1px solid ${colors.border}`,
                      borderRadius: 10,
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      borderLeft: `3px solid ${d.color}`,
                    }}
                  >
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 9,
                        background: `${d.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: d.color,
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 13,
                          color: colors.text,
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: colors.textSubtle,
                          marginTop: 2,
                        }}
                      >
                        {d.date}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: d.color,
                        background: `${d.color}12`,
                        padding: "2px 8px",
                        borderRadius: 5,
                      }}
                    >
                      {d.type}
                    </span>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 7,
                        background: colors.panelMuted,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: colors.textSubtle,
                      }}
                    >
                      <DownloadOutlined style={{ fontSize: 12 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pro badge centered on blur */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "8px 18px",
                background: colors.proBadgeBg,
                border: `1px solid ${colors.proBadgeBorder}`,
                borderRadius: 30,
                backdropFilter: "blur(2px)",
                boxShadow: "0 4px 16px rgba(99,102,241,0.15)",
                whiteSpace: "nowrap",
                marginTop: -100,
              }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Lock size={11} color="#fff" />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Locked Feature
              </span>
            </div>
          </div>

          {/* Paywall content */}
          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -290,
              background: colors.overlay,
            }}
          >
            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 900,
                  color: colors.text,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.15,
                }}
              >
                Generate any legal document with
                <br />
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  AI in seconds
                </span>
              </h2>
            </div>
            <p
              style={{
                textAlign: "center",
                fontSize: 15,
                color: colors.textMuted,
                maxWidth: 480,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              From NDAs to employment contracts, lease agreements to
              partnerships - describe your document and get a complete,
              professional draft ready to sign and download.
            </p>

            {/* Doc type grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 10,
                maxWidth: 760,
                margin: "0 auto 28px",
              }}
            >
              {DOC_TYPES.map((d) => (
                <div
                  key={d.key}
                  style={{
                    padding: "14px 16px",
                    background: dark ? `${d.color}1a` : d.bg,
                    border: `1px solid ${dark ? `${d.color}55` : `${d.color}25`}`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    boxShadow: dark ? "inset 0 1px 0 rgba(255,255,255,0.03)" : "none",
                  }}
                >
                  <div style={{ color: d.color, flexShrink: 0 }}>{d.icon}</div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: colors.text,
                      }}
                    >
                      {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: colors.textMuted,
                        lineHeight: 1.4,
                      }}
                    >
                      {d.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
                maxWidth: 760,
                margin: "0 auto 36px",
              }}
            >
              {features.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "16px 18px",
                    background: colors.panelAlt,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 12,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: 9,
                      background: colors.panel,
                      border: `1px solid ${colors.border}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#3b82f6",
                      flexShrink: 0,
                    }}
                  >
                    {f.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: colors.text,
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textMuted,
                        lineHeight: 1.5,
                      }}
                    >
                      {f.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* How it works */}
            <div
              style={{
                maxWidth: 760,
                margin: "0 auto 36px",
                background: colors.panelAlt,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: colors.textSubtle,
                  letterSpacing: "0.07em",
                  marginBottom: 16,
                }}
              >
                HOW IT WORKS
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                {[
                  {
                    label: "Choose Type",
                    sub: "Pick from 8 document types",
                    color: "#3b82f6",
                    icon: <FileText size={14} />,
                  },
                  {
                    label: "Describe It",
                    sub: "Or upload an existing doc",
                    color: "#6366f1",
                    icon: <EditOutlined style={{ fontSize: 14 }} />,
                  },
                  {
                    label: "AI Drafts",
                    sub: "Full legal document in ~15s",
                    color: "#8b5cf6",
                    icon: <ThunderboltOutlined style={{ fontSize: 14 }} />,
                  },
                  {
                    label: "Sign & Export",
                    sub: "Add signatures, download PDF",
                    color: "#10b981",
                    icon: <DownloadOutlined style={{ fontSize: 14 }} />,
                  },
                ].map((s, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flex: 1,
                      minWidth: 0,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: `${s.color}12`,
                          border: `1.5px solid ${s.color}30`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: s.color,
                          margin: "0 auto 8px",
                        }}
                      >
                        {s.icon}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: colors.text,
                          marginBottom: 2,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: colors.textSubtle,
                          lineHeight: 1.4,
                        }}
                      >
                        {s.sub}
                      </div>
                    </div>
                    {i < 3 && (
                      <div
                        style={{
                          flexShrink: 0,
                          padding: "0 4px",
                          color: dark ? "#4b5563" : "#d1d5db",
                        }}
                      >
                        <ChevronRight size={16} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div style={{ textAlign: "center" }}>
              <a
                href="/subscription"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "14px 32px",
                  background:
                    "linear-gradient(135deg, #1e40af 0%, #7c3aed 100%)",
                  color: "#fff",
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 15,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  boxShadow:
                    "0 4px 24px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-1px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 32px rgba(99,102,241,0.45), 0 1px 3px rgba(0,0,0,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 4px 24px rgba(99,102,241,0.35), 0 1px 3px rgba(0,0,0,0.1)";
                }}
              >
                <Zap size={16} fill="currentColor" />
                Upgrade to unlock Document Generator
                <ArrowRight size={16} />
              </a>
              <p
                style={{
                  margin: "12px 0 0",
                  fontSize: 12,
                  color: colors.textSubtle,
                }}
              >
                Upgrade your plan to access AI document generation and all Pro
                features.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ------------------------ Signature Modal --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function SignatureModal({ visible, onClose, onSave, signerName }) {
  const [mode, setMode] = useState("draw");
  const [textSig, setTextSig] = useState(signerName || "");
  const [textFont, setTextFont] = useState("Dancing Script");
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const lastPos = useRef(null);

  useEffect(() => {
    if (visible && mode === "draw") {
      setTimeout(() => {
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#fff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#111";
          ctx.lineWidth = 2.2;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      }, 50);
    }
  }, [visible, mode]);

  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width,
      scaleY = canvas.height / rect.height;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };
  const startDraw = (e) => {
    e.preventDefault();
    drawing.current = true;
    lastPos.current = getPos(e, canvasRef.current);
  };
  const draw = (e) => {
    e.preventDefault();
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPos.current = pos;
  };
  const stopDraw = () => {
    drawing.current = false;
  };
  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSave = () => {
    if (mode === "draw") {
      const canvas = canvasRef.current;
      const data = canvas
        .getContext("2d")
        .getImageData(0, 0, canvas.width, canvas.height).data;
      const hasContent = Array.from(data).some(
        (v, i) => i % 4 !== 3 && v < 240,
      );
      if (!hasContent) {
        alert("Please draw your signature first.");
        return;
      }
      onSave(canvas.toDataURL("image/png"));
    } else if (mode === "text") {
      if (!textSig.trim()) {
        alert("Please enter your name.");
        return;
      }
      const offCanvas = document.createElement("canvas");
      offCanvas.width = 500;
      offCanvas.height = 120;
      const ctx = offCanvas.getContext("2d");
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, 500, 120);
      ctx.fillStyle = "#111";
      ctx.font = `56px '${textFont}', cursive`;
      ctx.textBaseline = "middle";
      ctx.fillText(textSig, 18, 62);
      onSave(offCanvas.toDataURL("image/png"));
    }
    onClose();
  };

  const handleImageUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      onSave(e.target.result);
      onClose();
    };
    reader.readAsDataURL(file);
    return false;
  };
  const fonts = [
    "Dancing Script",
    "Pacifico",
    "Sacramento",
    "Great Vibes",
    "Satisfy",
  ];

  return (
    <Modal
      open={visible}
      title={null}
      onCancel={onClose}
      footer={null}
      centered
      width={520}
      styles={{
        content: {
          borderRadius: 16,
          padding: 0,
          overflow: "hidden",
          border: "1px solid #e5e5e5",
        },
        mask: { backdropFilter: "blur(4px)" },
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Pacifico&family=Sacramento&family=Great+Vibes&family=Satisfy&display=swap"
        rel="stylesheet"
      />
      <div className="p-6">
        <div className="mb-5">
          <h3 className="text-base font-semibold text-gray-900 m-0">
            Add Signature
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Draw, type, or upload your signature
          </p>
        </div>
        <div className="flex rounded-lg bg-gray-50 border border-gray-100 p-0.5 mb-5">
          {[
            ["draw", <SignatureOutlined />, "Draw"],
            ["text", <FontSizeOutlined />, "Type"],
            ["upload", <UploadOutlined />, "Upload"],
          ].map(([m, icon, label]) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium rounded-md transition-all cursor-pointer border-0 ${mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-400 bg-transparent hover:text-gray-600"}`}
            >
              {icon} {label}
            </button>
          ))}
        </div>
        {mode === "draw" && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400">
                Draw your signature below
              </span>
              <button
                onClick={clearCanvas}
                className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 cursor-pointer border border-gray-200 rounded px-2 py-1 bg-white transition-colors"
              >
                <ClearOutlined style={{ fontSize: 10 }} /> Clear
              </button>
            </div>
            <canvas
              ref={canvasRef}
              width={480}
              height={140}
              className="border border-gray-200 rounded-lg w-full block cursor-crosshair touch-none bg-white"
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={stopDraw}
              onMouseLeave={stopDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={stopDraw}
            />
            <p className="text-xs text-gray-300 text-center mt-2">Sign above</p>
          </div>
        )}
        {mode === "text" && (
          <div className="flex flex-col gap-3">
            <Input
              value={textSig}
              onChange={(e) => setTextSig(e.target.value)}
              placeholder="Type your full name"
              className="rounded-lg text-sm"
            />
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">
                Choose style
              </p>
              <div className="flex flex-wrap gap-2">
                {fonts.map((f) => (
                  <button
                    key={f}
                    onClick={() => setTextFont(f)}
                    className={`border rounded-lg px-3 py-1.5 cursor-pointer bg-white transition-all ${textFont === f ? "border-gray-900 shadow-sm" : "border-gray-200 hover:border-gray-400"}`}
                    style={{
                      fontFamily: `'${f}', cursive`,
                      fontSize: 22,
                      color: "#111",
                    }}
                  >
                    {textSig || "Sign"}
                  </button>
                ))}
              </div>
            </div>
            {textSig && (
              <div className="border border-gray-100 rounded-lg px-4 py-3 bg-gray-50 text-center">
                <span
                  style={{
                    fontFamily: `'${textFont}', cursive`,
                    fontSize: 38,
                    color: "#111",
                  }}
                >
                  {textSig}
                </span>
              </div>
            )}
          </div>
        )}
        {mode === "upload" && (
          <Dragger
            accept="image/*"
            showUploadList={false}
            beforeUpload={handleImageUpload}
            className="rounded-lg"
            style={{ borderColor: "#e5e5e5", background: "white" }}
          >
            <div className="py-8">
              <UploadOutlined className="text-3xl text-gray-300 block mb-3" />
              <p className="text-sm font-semibold text-gray-500 mb-1">
                Upload signature image
              </p>
              <p className="text-xs text-gray-300">
                PNG with transparent background recommended
              </p>
            </div>
          </Dragger>
        )}
        <div className="flex gap-2 justify-end mt-5 pt-4 border-t border-gray-100">
          <Button onClick={onClose} className="rounded-lg">
            Cancel
          </Button>
          {mode !== "upload" && (
            <Button
              type="primary"
              onClick={handleSave}
              className="rounded-lg font-semibold"
              style={{ background: "#111", border: "none" }}
            >
              Apply Signature
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ------------------------ Editable Block ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function EditableBlock({ value, isHeading, onEdit, onDelete, onAddAfter }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [hover, setHover] = useState(false);
  const commit = () => {
    onEdit(val);
    setEditing(false);
  };

  if (editing)
    return (
      <div className="flex gap-2 items-start mb-1">
        <TextArea
          autoFocus
          value={val}
          onChange={(e) => setVal(e.target.value)}
          autoSize
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setVal(value);
              setEditing(false);
            }
          }}
          style={{
            fontFamily: isHeading ? "Arial, Helvetica, sans-serif" : TNR,
            fontSize: isHeading ? 12 : 13,
            fontWeight: isHeading ? 800 : 400,
            borderColor: "#111",
            borderRadius: 6,
            color: "#111",
          }}
        />
        <button
          onClick={commit}
          className="bg-gray-900 text-white rounded-md w-7 h-7 flex items-center justify-center border-0 cursor-pointer flex-shrink-0"
        >
          <CheckOutlined style={{ fontSize: 10 }} />
        </button>
        <button
          onClick={() => {
            setVal(value);
            setEditing(false);
          }}
          className="border border-gray-200 rounded-md w-7 h-7 flex items-center justify-center bg-white cursor-pointer text-gray-400 flex-shrink-0 text-sm"
        >
          <ClearOutlined style={{ fontSize: 10 }} />
        </button>
      </div>
    );

  return (
    <div
      className="relative mb-1"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        onClick={() => setEditing(true)}
        className="cursor-text rounded transition-colors px-1.5"
        style={{
          fontFamily: isHeading ? "Arial, Helvetica, sans-serif" : TNR,
          fontSize: isHeading ? 12 : 13,
          fontWeight: isHeading ? 800 : 400,
          textTransform: isHeading ? "uppercase" : "none",
          textAlign: isHeading ? "left" : "justify",
          letterSpacing: isHeading ? "0.06em" : "normal",
          lineHeight: 1.75,
          color: isHeading ? "#000" : "#222",
          paddingRight: 56,
          background: hover ? "#f5f5f5" : "transparent",
          borderBottom: isHeading ? "1px solid #e8e8e8" : "none",
          paddingBottom: isHeading ? 3 : 0,
        }}
      >
        {value}
      </div>
      {hover && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
          <Tooltip title="Edit">
            <button
              onClick={() => setEditing(true)}
              className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded bg-white cursor-pointer text-gray-400 hover:text-gray-700 transition-colors"
            >
              <EditOutlined style={{ fontSize: 9 }} />
            </button>
          </Tooltip>
          {onAddAfter && (
            <Tooltip title="Add below">
              <button
                onClick={onAddAfter}
                className="w-5 h-5 flex items-center justify-center border border-gray-200 rounded bg-white cursor-pointer text-gray-400 hover:text-gray-700 transition-colors"
              >
                <PlusOutlined style={{ fontSize: 9 }} />
              </button>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip title="Delete">
              <button
                onClick={onDelete}
                className="w-5 h-5 flex items-center justify-center border border-red-200 rounded bg-white cursor-pointer text-red-400 hover:text-red-600 transition-colors"
              >
                <DeleteOutlined style={{ fontSize: 9 }} />
              </button>
            </Tooltip>
          )}
        </div>
      )}
    </div>
  );
}

// ------------------------ Signature Card ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
function SignatureCard({ sig, idx, onChange, onRemove }) {
  const [sigModalOpen, setSigModalOpen] = useState(false);
  return (
    <div className="cm-card border border-gray-100 rounded-xl p-4 bg-white relative">
      <div className="absolute top-3 right-3">
        <button
          onClick={() => onRemove(idx)}
          className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-400 border-0 bg-transparent cursor-pointer transition-colors rounded"
        >
          <DeleteOutlined style={{ fontSize: 12 }} />
        </button>
      </div>
      <p className="text-xs text-gray-300 uppercase tracking-widest mb-3 font-medium">
        Signatory {idx + 1}
      </p>
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          {
            key: "role",
            placeholder: "Role (Client, Vendor, Employer, etc.)",
            icon: <SafetyCertificateOutlined className="text-gray-300" />,
          },
          {
            key: "name",
            placeholder: "Full Legal Name",
            icon: <UserOutlined className="text-gray-300" />,
          },
          {
            key: "title",
            placeholder: "Title / Position",
            icon: <EditOutlined className="text-gray-300" />,
          },
          {
            key: "date",
            placeholder: "Signing Date",
            icon: <CalendarOutlined className="text-gray-300" />,
          },
        ].map(({ key, placeholder, icon }) => (
          <Input
            key={key}
            prefix={icon}
            placeholder={placeholder}
            value={sig[key] || ""}
            onChange={(e) => onChange(idx, key, e.target.value)}
            size="small"
            className="rounded-lg text-xs"
            style={{ fontSize: 12 }}
          />
        ))}
      </div>
      {sig.signatureImage ? (
        <div className="border border-gray-100 rounded-lg p-2 bg-gray-50 flex items-center justify-between">
          <img
            src={sig.signatureImage}
            alt="signature"
            className="max-h-8 max-w-32 object-contain"
          />
          <div className="flex gap-1.5">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setSigModalOpen(true)}
              className="text-xs rounded-lg"
            >
              Change
            </Button>
            <Button
              size="small"
              danger
              icon={<DeleteOutlined />}
              onClick={() => onChange(idx, "signatureImage", null)}
              className="text-xs rounded-lg"
            >
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setSigModalOpen(true)}
          className="w-full border-2 border-dashed border-gray-200 rounded-lg py-2.5 text-xs text-gray-400 flex items-center justify-center gap-2 cursor-pointer bg-white hover:border-gray-400 hover:text-gray-600 transition-all"
        >
          <SignatureOutlined style={{ fontSize: 13 }} /> Add Signature
        </button>
      )}
      <div className="mt-2.5 flex items-center gap-2">
        <input
          type="checkbox"
          id={`wit-${idx}`}
          checked={!!sig.witness}
          onChange={(e) => onChange(idx, "witness", e.target.checked)}
          className="cursor-pointer"
        />
        <label
          htmlFor={`wit-${idx}`}
          className="text-xs text-gray-400 cursor-pointer"
        >
          Include witness line
        </label>
      </div>
      <SignatureModal
        visible={sigModalOpen}
        onClose={() => setSigModalOpen(false)}
        onSave={(dataUrl) => onChange(idx, "signatureImage", dataUrl)}
        signerName={sig.name}
      />
    </div>
  );
}

function SidePanel({ title, children, action }) {
  return (
    <div className="cm-card bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm transition-all">
      <div className="px-4 py-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50">
        <span className="text-sm font-semibold text-gray-800 tracking-tight">
          {title}
        </span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ------------------------ Main ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
export default function DocumentGenerator() {
  const location = useLocation();
  const navigate = useNavigate();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);
  const planTier = String(orgPlan || "").toLowerCase();
  const isStarterPlan =
    planTier.includes("free") || planTier.includes("starter");

  const [docType, setDocType] = useState("contract");
  const [docVariant, setDocVariant] = useState("contract");
  const [inputMode, setInputMode] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedText, setUploadedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [step, setStep] = useState("input");
  const [genStep, setGenStep] = useState(0);
  const [docTitle, setDocTitle] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [confidentiality, setConfidentiality] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [contractData, setContractData] = useState(null);
  const [sections, setSections] = useState([]);
  const [parties, setParties] = useState([]);
  const [signatures, setSignatures] = useState([]);
  const [setupOpen, setSetupOpen] = useState(false);
  const [sendingToDocusign, setSendingToDocusign] = useState(false);
  const [docusignLoading, setDocusignLoading] = useState(false);
  const [docusignConnecting, setDocusignConnecting] = useState(false);
  const [docusignStatus, setDocusignStatus] = useState(null);
  const [docusignAccount, setDocusignAccount] = useState(null);
  const [envelopeId, setEnvelopeId] = useState("");
  const [docusignSignerName, setDocusignSignerName] = useState("");
  const [docusignSignerEmail, setDocusignSignerEmail] = useState("");
  const [docusignEmailSubject, setDocusignEmailSubject] = useState(
    "Please sign this agreement",
  );
  const [signedDocumentUrl, setSignedDocumentUrl] = useState("");
  const [signedDocumentSource, setSignedDocumentSource] = useState("");
  const [signedDocumentLoading, setSignedDocumentLoading] = useState(false);
  const [signedDocumentEmailTo, setSignedDocumentEmailTo] = useState("");
  const [isSignerEmailAutoFillEnabled, setIsSignerEmailAutoFillEnabled] =
    useState(true);
  const [isSignedEmailAutoFillEnabled, setIsSignedEmailAutoFillEnabled] =
    useState(true);
  const [sendingSignedDocumentEmail, setSendingSignedDocumentEmail] = useState(false);
  const [currentUserId, setCurrentUserId] = useState("");
  const [currentUserEmail, setCurrentUserEmail] = useState("");
  const [currentUserName, setCurrentUserName] = useState("");
  const [currentTenantId, setCurrentTenantId] = useState("");
  const [pendingEnvelopeIds, setPendingEnvelopeIds] = useState(() =>
    readPendingEnvelopeIds(),
  );
  const [placeholderModalOpen, setPlaceholderModalOpen] = useState(false);
  const [placeholderValues, setPlaceholderValues] = useState({});
  const [placeholderEnabled, setPlaceholderEnabled] = useState({});
  const [placeholderPromptedKey, setPlaceholderPromptedKey] = useState("");
  const persistedEnvelopeIdsRef = useRef(new Set());
  const addPendingEnvelopeId = useCallback((id) => {
    const targetId = String(id || "").trim();
    if (!targetId) return;
    setPendingEnvelopeIds((prev) => {
      const next = Array.from(new Set([...(prev || []), targetId]));
      writePendingEnvelopeIds(next);
      return next;
    });
  }, []);
  const removePendingEnvelopeId = useCallback((id) => {
    const targetId = String(id || "").trim();
    if (!targetId) return;
    setPendingEnvelopeIds((prev) => {
      const next = (prev || []).filter((item) => item !== targetId);
      writePendingEnvelopeIds(next);
      return next;
    });
  }, []);
  const isMobile = viewportWidth < 1024;
  const showSectionHeadings = !LETTER_STYLE_VARIANTS.has(docVariant);
  const buildDraftSnapshot = useCallback(
    () => ({
      step,
      docType,
      docVariant,
      inputMode,
      prompt,
      uploadedText,
      docTitle,
      companyName,
      effectiveDate,
      confidentiality,
      logoDataUrl,
      contractData,
      sections,
      parties,
      signatures,
    }),
    [
      step,
      docType,
      docVariant,
      inputMode,
      prompt,
      uploadedText,
      docTitle,
      companyName,
      effectiveDate,
      confidentiality,
      logoDataUrl,
      contractData,
      sections,
      parties,
      signatures,
    ],
  );
  const persistDraft = useCallback(() => {
    try {
      sessionStorage.setItem(
        CONTRACT_DRAFT_STORAGE_KEY,
        JSON.stringify(buildDraftSnapshot()),
      );
    } catch (e) {
      console.warn("Failed to persist contract draft", e);
    }
  }, [buildDraftSnapshot]);
  const clearPersistedDraft = useCallback(() => {
    try {
      sessionStorage.removeItem(CONTRACT_DRAFT_STORAGE_KEY);
    } catch (e) {
      console.warn("Failed to clear contract draft", e);
    }
  }, []);
  const restoreDraft = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(CONTRACT_DRAFT_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return false;
      if (data.docType) setDocType(data.docType);
      if (data.docVariant) setDocVariant(data.docVariant);
      if (data.inputMode) setInputMode(data.inputMode);
      if (typeof data.prompt === "string") setPrompt(data.prompt);
      if (typeof data.uploadedText === "string") setUploadedText(data.uploadedText);
      if (typeof data.step === "string") setStep(data.step);
      if (typeof data.docTitle === "string") setDocTitle(data.docTitle);
      if (typeof data.companyName === "string") setCompanyName(data.companyName);
      if (typeof data.effectiveDate === "string") setEffectiveDate(data.effectiveDate);
      if (typeof data.confidentiality === "boolean")
        setConfidentiality(data.confidentiality);
      if (typeof data.logoDataUrl === "string" || data.logoDataUrl === null)
        setLogoDataUrl(data.logoDataUrl);
      if (data.contractData) setContractData(data.contractData);
      if (Array.isArray(data.sections)) setSections(data.sections);
      if (Array.isArray(data.parties)) setParties(data.parties);
      if (Array.isArray(data.signatures)) setSignatures(data.signatures);
      return true;
    } catch (e) {
      console.warn("Failed to restore contract draft", e);
      return false;
    }
  }, []);
  const persistSignedContractToDocuments = useCallback(
    async ({ envelopeId: id, url }) => {
      const targetEnvelopeId = String(id || "").trim();
      const sourceUrl = String(url || "").trim();
      if (!targetEnvelopeId || !sourceUrl) return false;
      if (persistedEnvelopeIdsRef.current.has(targetEnvelopeId)) return true;
      persistedEnvelopeIdsRef.current.add(targetEnvelopeId);

      try {
        let authUserId = String(currentUserId || "").trim();
        if (!authUserId) {
          const {
            data: { user },
          } = await supabase.auth.getUser();
          authUserId = String(user?.id || "").trim();
        }
        if (!authUserId) throw new Error("User not available.");

        let tenantId = String(currentTenantId || "").trim();
        let uploaderProfileId = authUserId;
        if (!tenantId) {
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("id, tenant_id")
            .eq("id", authUserId)
            .maybeSingle();
          if (!profileError && profileData) {
            tenantId = String(profileData.tenant_id || "").trim();
            uploaderProfileId = String(profileData.id || authUserId).trim();
          }
        }
        if (!tenantId) throw new Error("Tenant not available.");

        const fileRes = await fetch(sourceUrl);
        if (!fileRes.ok) {
          throw new Error("Could not fetch signed document file.");
        }
        const blob = await fileRes.blob();
        const safeTitle =
          String(docTitle || "Agreement")
            .trim()
            .replace(/[^a-zA-Z0-9-_ ]/g, "")
            .replace(/\s+/g, "_")
            .slice(0, 60) || "Agreement";
        const storagePath = `${tenantId}/${authUserId}/Contracts/${safeTitle}_${targetEnvelopeId}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from("documents")
          .upload(storagePath, blob, {
            contentType: "application/pdf",
            upsert: true,
          });
        if (uploadError) throw uploadError;

        let contractsFolderId = null;
        const { data: existingFolder } = await supabase
          .from("documents")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("type", "folder")
          .is("parent_id", null)
          .ilike("name", "contracts")
          .limit(1)
          .maybeSingle();

        if (existingFolder?.id) {
          contractsFolderId = existingFolder.id;
        } else {
          const { data: createdFolder, error: folderInsertError } = await supabase
            .from("documents")
            .insert([
              {
                name: "Contracts",
                type: "folder",
                parent_id: null,
                uploaded_by: uploaderProfileId,
                tenant_id: tenantId,
              },
            ])
            .select("id")
            .single();
          if (folderInsertError) throw folderInsertError;
          contractsFolderId = createdFolder?.id || null;
        }

        const { data: existingDoc } = await supabase
          .from("documents")
          .select("id")
          .eq("tenant_id", tenantId)
          .eq("file_url", storagePath)
          .limit(1)
          .maybeSingle();

        if (!existingDoc?.id) {
          const partyAName = String(parties?.[0]?.name || "").trim();
          const partyBName = String(parties?.[1]?.name || "").trim();
          const typeLabel =
            DOC_TYPES.find((d) => d.key === docVariant)?.label || "Contract";
          const partyPair = [partyAName, partyBName].filter(Boolean).join(" & ");
          const prettyNameBase = partyPair
            ? `${typeLabel} - ${partyPair}`
            : String(docTitle || typeLabel).trim();
          const prettyName = `${prettyNameBase.slice(0, 180)}.pdf`;
          const { error: docInsertError } = await supabase.from("documents").insert([
            {
              name: prettyName,
              type: "file",
              file_url: storagePath,
              file_size: blob.size || null,
              mime_type: "application/pdf",
              parent_id: contractsFolderId,
              uploaded_by: uploaderProfileId,
              tenant_id: tenantId,
            },
          ]);
          if (docInsertError) throw docInsertError;
        }
        return true;
      } catch (e) {
        persistedEnvelopeIdsRef.current.delete(targetEnvelopeId);
        console.error("Failed to persist signed contract to documents", e);
        return false;
      }
    },
    [currentUserId, currentTenantId, docTitle, parties, docVariant],
  );

  useEffect(() => {
    const onResize = () => {
      if (typeof window !== "undefined") {
        setViewportWidth(window.innerWidth);
      }
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const refreshDocusignState = useCallback(async () => {
    setDocusignLoading(true);
    try {
      const status = await getDocusignStatus();
      setDocusignStatus(status || null);
      if (status?.connected) {
        try {
          const account = await getDocusignAccount();
          setDocusignAccount(account || null);
        } catch {
          setDocusignAccount(null);
        }
      } else {
        setDocusignAccount(null);
      }
      return status || null;
    } catch (e) {
      setDocusignStatus(null);
      setDocusignAccount(null);
      setError(e?.message || "Could not load DocuSign status.");
      return null;
    } finally {
      setDocusignLoading(false);
    }
  }, []);

  const openDocusignDirect = useCallback(() => {
    persistDraft();
    const returnTo = `${window.location.origin}/integrations/docusign/callback`;
    connectDocusignOAuth(returnTo, { userId: currentUserId });
  }, [persistDraft, currentUserId]);

  const handleConnectDocusign = useCallback(() => {
    setDocusignConnecting(true);
    setError("");
    setSuccess("");
    try {
      openDocusignDirect();
    } finally {
      setDocusignConnecting(false);
    }
  }, [openDocusignDirect]);

  const fetchSignedDocumentByEnvelope = useCallback(async (id, options = {}) => {
    const silent = Boolean(options?.silent);
    const suppressLoading = Boolean(options?.suppressLoading);
    const targetId = String(id || "").trim();
    if (!targetId) return;
    const activeEnvelopeId = String(envelopeId || "").trim();
    const isActiveEnvelope = activeEnvelopeId === targetId;
    if (!suppressLoading && isActiveEnvelope) setSignedDocumentLoading(true);
    if (!silent) setError("");
    try {
      if (
        isActiveEnvelope &&
        signedDocumentSource === "blob" &&
        signedDocumentUrl
      ) {
        URL.revokeObjectURL(signedDocumentUrl);
      }
      const envelopeState = await getDocusignEnvelopeStatus(targetId);
      const envelopeStatus = String(envelopeState?.status || "").toLowerCase();
      if (envelopeStatus !== "completed") {
        if (!silent) {
          setSuccess(
            `Envelope ${targetId} is currently "${envelopeStatus || "in progress"}". We will store the latest document after both parties complete signing.`,
          );
        }
        return;
      }
      const result = await getDocusignSignedDocument(targetId);
      const url = String(result?.url || "").trim();
      if (!url) throw new Error("Signed document is not available yet.");
      const source = String(result?.source || "");
      if (isActiveEnvelope) {
        setSignedDocumentUrl(url);
        setSignedDocumentSource(source);
      }
      const persisted = await persistSignedContractToDocuments({
        envelopeId: targetId,
        url,
      });
      if (persisted) {
        removePendingEnvelopeId(targetId);
      }
      if (!silent && isActiveEnvelope) {
        setSuccess("Signed document is available and saved to Documents > Contracts.");
      }
    } catch (e) {
      if (!silent) {
        if (isActiveEnvelope) {
          setSignedDocumentUrl("");
          setSignedDocumentSource("");
        }
        setError(e?.message || "Could not load signed document.");
      }
    } finally {
      if (!suppressLoading && isActiveEnvelope) setSignedDocumentLoading(false);
    }
  }, [
    envelopeId,
    signedDocumentSource,
    signedDocumentUrl,
    persistSignedContractToDocuments,
    removePendingEnvelopeId,
  ]);

  useEffect(() => {
    const targetId = String(envelopeId || "").trim();
    if (!targetId || step !== "editor") return;

    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled) return;
      await fetchSignedDocumentByEnvelope(targetId, {
        silent: true,
        suppressLoading: true,
      });
      if (cancelled) return;
      if (!signedDocumentUrl) {
        timer = setTimeout(tick, 20000);
      }
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [envelopeId, step, signedDocumentUrl, fetchSignedDocumentByEnvelope]);

  useEffect(() => {
    if (!pendingEnvelopeIds.length) return;
    let cancelled = false;
    let timer = null;

    const tick = async () => {
      if (cancelled) return;
      await Promise.all(
        pendingEnvelopeIds.map((id) =>
          fetchSignedDocumentByEnvelope(id, {
            silent: true,
            suppressLoading: true,
          }),
        ),
      );
      if (cancelled) return;
      timer = setTimeout(tick, 20000);
    };

    tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pendingEnvelopeIds, fetchSignedDocumentByEnvelope]);

  const handleSendSignedDocumentEmail = useCallback(async () => {
    const targetId = String(envelopeId || "").trim();
    const email = String(signedDocumentEmailTo || "").trim();
    if (!targetId) {
      setError("Envelope ID is missing.");
      return;
    }
    if (!email) {
      setError("Enter recipient email.");
      return;
    }
    setSendingSignedDocumentEmail(true);
    setError("");
    try {
      await emailDocusignSignedDocument(targetId, {
        to: email,
        email,
        envelopeId: targetId,
      });
      setSuccess(`Signed document sent to ${email}.`);
    } catch (e) {
      setError(e?.message || "Failed to send signed document email.");
    } finally {
      setSendingSignedDocumentEmail(false);
    }
  }, [envelopeId, signedDocumentEmailTo]);

  const buildEnvelopeDocumentBlob = useCallback(async () => {
    if (!sections.length) {
      throw new Error("Create the document first before sending to DocuSign.");
    }
    return downloadDocumentPDF({
      docTitle,
      effectiveDate,
      companyName,
      confidentiality,
      logoDataUrl,
      contractData: { ...contractData, sections, parties },
      signatures,
      showSectionHeadings,
      saveFile: false,
      returnBlob: true,
    });
  }, [
    docTitle,
    effectiveDate,
    companyName,
    confidentiality,
    logoDataUrl,
    contractData,
    sections,
    parties,
    signatures,
    showSectionHeadings,
  ]);

  useEffect(() => {
    restoreDraft();
  }, [restoreDraft]);

  useEffect(() => {
    refreshDocusignState();
  }, [refreshDocusignState]);

  useEffect(() => {
    return () => {
      if (signedDocumentSource === "blob" && signedDocumentUrl) {
        URL.revokeObjectURL(signedDocumentUrl);
      }
    };
  }, [signedDocumentSource, signedDocumentUrl]);

  useEffect(() => {
    const state = location?.state || {};
    const callbackType = String(state?.docusignCallback || "").trim();
    const callbackEnvelopeId = String(state?.envelopeId || "").trim();
    if (!callbackType) return;

    if (callbackType === "signed_return" && callbackEnvelopeId) {
      setStep("editor");
      setEnvelopeId(callbackEnvelopeId);
      addPendingEnvelopeId(callbackEnvelopeId);
      fetchSignedDocumentByEnvelope(callbackEnvelopeId);
      setSuccess("Returned from DocuSign signing.");
    } else if (callbackType === "error") {
      setError(String(state?.docusignMessage || "DocuSign callback failed."));
    } else if (callbackType === "connected") {
      setSuccess("DocuSign connected.");
    }

    navigate(location.pathname, { replace: true, state: null });
  }, [
    location,
    navigate,
    addPendingEnvelopeId,
    fetchSignedDocumentByEnvelope,
  ]);

  useEffect(() => {
    const counterPartyName = String(parties?.[1]?.name || "").trim();
    const counterPartyEmail = String(parties?.[1]?.email || "").trim();
    if (!docusignSignerName && counterPartyName) {
      setDocusignSignerName(counterPartyName);
    }
    if (isSignerEmailAutoFillEnabled && !docusignSignerEmail && counterPartyEmail) {
      setDocusignSignerEmail(counterPartyEmail);
    }
    if (
      isSignedEmailAutoFillEnabled &&
      !signedDocumentEmailTo &&
      docusignSignerEmail
    ) {
      setSignedDocumentEmailTo(docusignSignerEmail);
    }
  }, [
    parties,
    docusignSignerName,
    docusignSignerEmail,
    signedDocumentEmailTo,
    isSignerEmailAutoFillEnabled,
    isSignedEmailAutoFillEnabled,
  ]);

  useEffect(() => {
    const senderPartyName = String(parties?.[0]?.name || "").trim();
    const normalizedCompany = String(companyName || "").trim();
    const shouldSyncEmployerName =
      docVariant === "employment" || docVariant === "offerLetter";
    if (!shouldSyncEmployerName || !normalizedCompany) return;
    if (senderPartyName === normalizedCompany) return;
    setParties((prev) => {
      if (!Array.isArray(prev)) return prev;
      const next = [...prev];
      if (!next[0]) {
        next[0] = {
          label: DEFAULT_PARTY_LABELS[docVariant]?.[0] || "Employer",
          name: normalizedCompany,
          address: "",
          email: "",
        };
        return next;
      }
      next[0] = { ...next[0], name: normalizedCompany };
      return next;
    });
  }, [companyName, docVariant, parties]);

  // ---------------- Fetch plan ----------------
  useEffect(() => {
    const init = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setPlanLoading(false);
          return;
        }
        setCurrentUserId(user.id);
        setCurrentUserEmail(String(user.email || "").trim());
        const fallbackNameFromEmail = String(user.email || "")
          .split("@")[0]
          .replace(/[._-]+/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .replace(/\b\w/g, (c) => c.toUpperCase());
        const metaName = String(
          user?.user_metadata?.full_name ||
            user?.user_metadata?.name ||
            user?.user_metadata?.display_name ||
            "",
        ).trim();
        setCurrentUserName(metaName || fallbackNameFromEmail || "Current User");
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id, company_name, user_photo")
          .eq("id", user.id)
          .single();
        setCurrentTenantId(String(profile?.tenant_id || "").trim());
        const profileCompany = String(profile?.company_name || "").trim();
        let resolvedCompanyName = profileCompany;
        let resolvedLogo =
          profile?.user_photo || "";
        console.log(profile);
        if (profile?.tenant_id) {
          const { data: org } = await supabase
            .from("tenants")
            .select("*")
            .eq("id", profile.tenant_id)
            .single();
          setOrgPlan(org?.plan ?? null);
          resolvedCompanyName =
            resolvedCompanyName ||
            String(org?.company_name || org?.name || "").trim();
          resolvedLogo =
            resolvedLogo ||
            org?.logo_url ||
            org?.company_logo ||
            org?.logo ||
            "";
          if (!resolvedLogo) {
            const { data: ws } = await supabase
              .from("workspace_settings")
              .select("*")
              .eq("tenant_id", profile.tenant_id)
              .maybeSingle();
            resolvedLogo = ws?.logo_url || ws?.brand_logo_url || ws?.company_logo || "";
          }
        }
        if (resolvedCompanyName) {
          setCompanyName(resolvedCompanyName);
        }
        setEffectiveDate((prev) => prev || new Date().toISOString().slice(0, 10));
        if (resolvedLogo) {
          try {
            const normalizedLogo = await remoteImageToDataUrl(resolvedLogo);
            setLogoDataUrl(normalizedLogo);
          } catch {
            setLogoDataUrl(resolvedLogo);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setPlanLoading(false);
      }
    };
    init();
  }, []);

  const handleFileUpload = async (file) => {
    setUploadedFile(file);
    setExtracting(true);
    setError("");
    try {
      const t = await extractTextFromFile(file);
      setUploadedText(t);
    } catch {
      setError("Could not read file.");
    } finally {
      setExtracting(false);
    }
    return false;
  };

  const handleGenerate = async () => {
    setSuccess("");
    if (inputMode === "text" && !prompt.trim()) {
      setError("Please describe the document.");
      return;
    }
    if (inputMode === "text" && prompt.trim().length < MIN_PROMPT_CHARS) {
      setError(
        `Please enter at least ${MIN_PROMPT_CHARS} characters in the description.`,
      );
      return;
    }
    if (inputMode === "upload" && !uploadedText) {
      setError("Please upload a document first.");
      return;
    }
    setError("");
    setLoading(true);
    setGenStep(1);
    try {
      const userContent =
        inputMode === "upload"
          ? buildUserContent({ text: uploadedText, extra: prompt, docType })
          : buildUserContent({ text: prompt.trim(), extra: "", docType });
      const result = await callGroq(userContent, docType);
      const normalized = normalizeGeneratedDocument(result, docType, userContent);
      setContractData(normalized);
      setDocVariant(normalized?.variant || resolveDocVariant(docType, userContent));
      setSections(normalized.sections || []);
      setParties(normalized.parties || []);
      setDocTitle(
        (
          normalized.title ||
          DOC_TYPES.find((d) => d.key === docType)?.label.toUpperCase() ||
          "DOCUMENT"
        )
          .replace(/[^a-zA-Z0-9 &,\-]/g, "")
          .slice(0, 80),
      );
      setPlaceholderPromptedKey("");
      setGenStep(2);
      setSetupOpen(false);
      setStep("editor");
    } catch (e) {
      setError(e.message);
      setGenStep(0);
    } finally {
      setLoading(false);
    }
  };

  const updateParty = (pi, key, val) =>
    setParties((p) =>
      p.map((party, i) => (i === pi ? { ...party, [key]: val } : party)),
    );
  const ensurePartyAndUpdate = useCallback(
    (partyIndex, key, value) => {
      setParties((prev) => {
        const next = Array.isArray(prev) ? [...prev] : [];
        const labels = DEFAULT_PARTY_LABELS[docVariant] || DEFAULT_PARTY_LABELS.custom;
        while (next.length <= partyIndex) {
          const idx = next.length;
          next.push({
            label: labels[idx] || `Party ${idx + 1}`,
            name: "",
            address: "",
            email: "",
          });
        }
        next[partyIndex] = { ...next[partyIndex], [key]: value };
        return next;
      });
    },
    [docVariant],
  );
  const updateRecipientNameInline = useCallback(
    (value) => {
      const clean = String(value || "").trim();
      setSignatures((prev) => {
        if (!Array.isArray(prev) || prev.length === 0) return prev;
        const next = [...prev];
        next[0] = { ...next[0], name: clean };
        return next;
      });
      ensurePartyAndUpdate(1, "name", clean);
    },
    [ensurePartyAndUpdate],
  );
  const updateRecipientTitleInline = useCallback((value) => {
    const clean = String(value || "").trim();
    setSignatures((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;
      const next = [...prev];
      next[0] = { ...next[0], title: clean };
      return next;
    });
  }, []);
  const updateSenderCompanyInline = useCallback(
    (value) => {
      const clean = String(value || "").trim();
      setCompanyName(clean);
      ensurePartyAndUpdate(0, "name", clean);
    },
    [ensurePartyAndUpdate],
  );
  const updateSenderAddressInline = useCallback(
    (value) => {
      const clean = String(value || "").trim();
      ensurePartyAndUpdate(0, "address", clean);
    },
    [ensurePartyAndUpdate],
  );
  const updateHeading = (si, v) =>
    setSections((p) => p.map((s, i) => (i === si ? { ...s, heading: v } : s)));
  const updatePara = (si, pi, v) =>
    setSections((p) =>
      p.map((s, i) =>
        i === si
          ? {
              ...s,
              paragraphs: s.paragraphs.map((pp, j) => (j === pi ? v : pp)),
            }
          : s,
      ),
    );
  const deletePara = (si, pi) =>
    setSections((p) =>
      p.map((s, i) =>
        i === si
          ? { ...s, paragraphs: s.paragraphs.filter((_, j) => j !== pi) }
          : s,
      ),
    );
  const addParaAfter = (si, pi) =>
    setSections((p) =>
      p.map((s, i) => {
        if (i !== si) return s;
        const ps = [...s.paragraphs];
        ps.splice(pi + 1, 0, "Click to edit.");
        return { ...s, paragraphs: ps };
      }),
    );
  const deleteSection = (si) =>
    setSections((p) => p.filter((_, i) => i !== si));
  const addSection = (si) =>
    setSections((p) => {
      const n = [...p];
      n.splice(si + 1, 0, {
        heading: showSectionHeadings ? "NEW SECTION" : "",
        paragraphs: ["Click to edit."],
        table: null,
      });
      return n;
    });
  const updateCell = (si, ri, ci, v) =>
    setSections((p) =>
      p.map((s, i) => {
        if (i !== si || !s.table) return s;
        return {
          ...s,
          table: {
            ...s.table,
            rows: s.table.rows.map((r, r2) =>
              r2 === ri ? r.map((c, c2) => (c2 === ci ? v : c)) : r,
            ),
          },
        };
      }),
    );
  const updateSig = (i, k, v) =>
    setSignatures((p) => p.map((s, j) => (j === i ? { ...s, [k]: v } : s)));
  const addSig = () =>
    setSignatures((p) => [
      ...p,
      {
        role: `Party ${String.fromCharCode(65 + p.length)}`,
        name: "",
        title: "",
        date: "",
        witness: false,
        signatureImage: null,
      },
    ]);
  const removeSig = (i) => setSignatures((p) => p.filter((_, j) => j !== i));
  const handleReset = () => {
    clearPersistedDraft();
    setStep("input");
    setDocVariant(docType);
    setSections([]);
    setContractData(null);
    setPrompt("");
    setError("");
    setSuccess("");
    setGenStep(0);
    setDocTitle("");
    setEffectiveDate("");
    setConfidentiality(false);
    setUploadedFile(null);
    setUploadedText("");
    setParties([]);
    setSignatures([]);
    if (signedDocumentSource === "blob" && signedDocumentUrl) {
      URL.revokeObjectURL(signedDocumentUrl);
    }
    setEnvelopeId("");
    setSignedDocumentUrl("");
    setSignedDocumentSource("");
    setSignedDocumentEmailTo("");
    setPlaceholderModalOpen(false);
    setPlaceholderValues({});
    setPlaceholderPromptedKey("");
    setIsSignerEmailAutoFillEnabled(true);
    setIsSignedEmailAutoFillEnabled(true);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    setSuccess("");
    try {
      await downloadDocumentPDF({
        docTitle,
        effectiveDate,
        companyName,
        confidentiality,
        logoDataUrl,
        contractData: { ...contractData, sections, parties },
        signatures,
        showSectionHeadings,
      });
    } catch (e) {
      setError("PDF error: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleSendToDocusign = useCallback(async () => {
    setSendingToDocusign(true);
    setError("");
    setSuccess("");
    try {
      const status = docusignStatus?.connected
        ? docusignStatus
        : await refreshDocusignState();
      if (!status?.connected) {
        throw new Error(
          "DocuSign is not connected. Use Connect DocuSign first.",
        );
      }

      const signerName = String(docusignSignerName || "").trim();
      const signerEmail = String(docusignSignerEmail || "").trim();
      const normalizedCurrentUserEmail = String(currentUserEmail || "")
        .trim()
        .toLowerCase();
      const creatorSignerName = String(currentUserName || "").trim();
      const emailSubject = String(docusignEmailSubject || "").trim();
      if (!creatorSignerName || !normalizedCurrentUserEmail) {
        throw new Error("Current user signer profile is missing.");
      }
      if (!signerName || !signerEmail) {
        throw new Error("Second party signer name and email are required.");
      }
      if (normalizedCurrentUserEmail === signerEmail.toLowerCase()) {
        throw new Error(
          "Second party signer email must be different from your account email.",
        );
      }
      if (!emailSubject) {
        throw new Error("Email subject is required.");
      }

      const documentBlob = await buildEnvelopeDocumentBlob();
      if (!documentBlob) {
        throw new Error("Could not prepare the document for DocuSign.");
      }
      const cloudinaryUrl = await uploadPdfBlobToCloudinary(
        documentBlob,
        docTitle || "Agreement",
      );
      if (!cloudinaryUrl) {
        throw new Error("Cloudinary upload failed for DocuSign document.");
      }

      const envelopePayload = {
        emailSubject,
        status: "sent",
        fileExtension: "pdf",
        documentName: docTitle || "Agreement",
        documentUrl: cloudinaryUrl,
        cloudinaryUrl,
        signers: [
          {
            recipientId: "1",
            routingOrder: "1",
            email: normalizedCurrentUserEmail,
            name: creatorSignerName,
            clientUserId: "1000",
          },
          {
            recipientId: "2",
            routingOrder: "2",
            email: signerEmail,
            name: signerName,
          },
        ],
        signer: {
          email: normalizedCurrentUserEmail,
          name: creatorSignerName,
          clientUserId: "1000",
        },
      };

      const envelopeResult = await createDocusignEnvelope(envelopePayload);
      const nextEnvelopeId = String(
        envelopeResult?.envelopeId || envelopeResult?.id || "",
      ).trim();
      if (!nextEnvelopeId) {
        throw new Error("Envelope created but envelopeId was not returned.");
      }
      setEnvelopeId(nextEnvelopeId);
      addPendingEnvelopeId(nextEnvelopeId);

      let signingUrl = "";
      try {
        const recipientViewPayload = {
          recipientId: "1",
          email: normalizedCurrentUserEmail,
          name: creatorSignerName,
          clientUserId: "1000",
          returnUrl: `${window.location.origin}/integrations/docusign/callback?flow=sign&envelopeId=${encodeURIComponent(nextEnvelopeId)}`,
        };
        const recipientViewResult = await createDocusignRecipientView(
          nextEnvelopeId,
          recipientViewPayload,
        );
        signingUrl = String(
          recipientViewResult?.url ||
            recipientViewResult?.recipientViewUrl ||
            recipientViewResult?.signingUrl ||
            "",
        ).trim();
      } catch {
        signingUrl = "";
      }

      persistDraft();
      if (signingUrl) {
        window.location.assign(signingUrl);
        setSuccess(
          `DocuSign is ready. Envelope ID: ${nextEnvelopeId}. Opening your signing view now; party 2 will receive their signing email next.`,
        );
      } else {
        setSuccess(
          `Envelope ${nextEnvelopeId} created. If in-app signing cannot open, check your DocuSign email. Party 2 (${signerEmail}) will receive their signing request after your step.`,
        );
      }
    } catch (e) {
      setError(e?.message || "Failed to send document to DocuSign.");
    } finally {
      setSendingToDocusign(false);
    }
  }, [
    docusignStatus,
    refreshDocusignState,
    docusignSignerName,
    docusignSignerEmail,
    currentUserEmail,
    currentUserName,
    docusignEmailSubject,
    buildEnvelopeDocumentBlob,
    docTitle,
    persistDraft,
    addPendingEnvelopeId,
  ]);

  const promptLength = prompt.trim().length;
  const canGen =
    inputMode === "text"
      ? promptLength >= MIN_PROMPT_CHARS
      : !!uploadedText;
  const inputLbl =
    "text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5";
  const selectedDocType = DOC_TYPES.find((d) => d.key === docType);
  const previewRecipientName = String(
    signatures?.[0]?.name || parties?.[1]?.name || "Name Here",
  ).trim();
  const previewRecipientTitle = String(
    signatures?.[0]?.title || "Position Title",
  ).trim();
  const previewSenderName = String(companyName || parties?.[0]?.name || "Company Name Here").trim();
  const previewSenderAddress = String(
    parties?.[0]?.address || "Company Address Place Here",
  ).trim();
  const previewLetterDate = formatHumanDate(effectiveDate);
  const detectedPlaceholders = useMemo(() => {
    const found = new Map();
    const addFromText = (value) => {
      extractPlaceholderTokensFromText(value).forEach((token) => {
        const key = normalizePlaceholderToken(token);
        if (!key || found.has(key)) return;
        found.set(key, token);
      });
    };

    addFromText(docTitle);
    addFromText(companyName);
    addFromText(effectiveDate);
    addFromText(docusignSignerName);
    addFromText(docusignSignerEmail);
    addFromText(docusignEmailSubject);

    (parties || []).forEach((party) => {
      addFromText(party?.label);
      addFromText(party?.name);
      addFromText(party?.address);
      addFromText(party?.email);
    });

    (signatures || []).forEach((sig) => {
      addFromText(sig?.role);
      addFromText(sig?.name);
      addFromText(sig?.title);
      addFromText(sig?.date);
    });

    (sections || []).forEach((section) => {
      addFromText(section?.heading);
      (section?.paragraphs || []).forEach((p) => addFromText(p));
      (section?.table?.headers || []).forEach((h) => addFromText(h));
      (section?.table?.rows || []).forEach((row) =>
        normalizeTableRowCells(row).forEach((cell) => addFromText(cell)),
      );
    });

    return Array.from(found.entries()).map(([key, token]) => ({ key, token }));
  }, [
    docTitle,
    companyName,
    effectiveDate,
    docusignSignerName,
    docusignSignerEmail,
    docusignEmailSubject,
    parties,
    signatures,
    sections,
  ]);
  const placeholderDiscoveryKey = useMemo(
    () => detectedPlaceholders.map((p) => p.key).join("|"),
    [detectedPlaceholders],
  );
  const placeholderFields = useMemo(
    () => {
      const hasTimeContext = detectedPlaceholders.some(({ key }) =>
        /(start time|end time|working hours|work hours|shift time)/i.test(key),
      );
      return detectedPlaceholders.map(({ key, token }) => {
        const normalized = normalizePlaceholderToken(token);
        const displayToken =
          normalized === "number" && hasTimeContext ? "Working Hours" : token;
        return {
          key,
          token,
          displayToken,
          type: detectPlaceholderFieldType(token),
        };
      });
    },
    [detectedPlaceholders],
  );

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  useEffect(() => {
    if (!placeholderFields.length) return;
    setPlaceholderValues((prev) => {
      const next = { ...prev };
      placeholderFields.forEach(({ key }) => {
        if (!(key in next)) next[key] = "";
      });
      return next;
    });
    setPlaceholderEnabled((prev) => {
      const next = { ...prev };
      placeholderFields.forEach(({ key }) => {
        if (!(key in next)) next[key] = true;
      });
      return next;
    });
  }, [placeholderFields]);

  useEffect(() => {
    if (step !== "editor") return;
    if (!placeholderFields.length) return;
    if (placeholderPromptedKey === placeholderDiscoveryKey) return;
    setPlaceholderPromptedKey(placeholderDiscoveryKey);
    setPlaceholderModalOpen(true);
  }, [
    step,
    placeholderFields.length,
    placeholderDiscoveryKey,
    placeholderPromptedKey,
  ]);

  const applyDetectedPlaceholders = useCallback(() => {
    const replacements = placeholderFields
      .map(({ key, token }) => ({
        key,
        token,
        value: String(placeholderValues[key] || "").trim(),
        enabled: placeholderEnabled[key] !== false,
      }))
      .filter((item) => item.enabled && item.value);
    const disabledTokens = placeholderFields
      .filter(({ key }) => placeholderEnabled[key] === false)
      .map(({ token }) => token);
    const disabledKeys = new Set(
      placeholderFields
        .filter(({ key }) => placeholderEnabled[key] === false)
        .map(({ key }) => key),
    );
    if (!replacements.length) {
      if (!disabledTokens.length) {
        setPlaceholderModalOpen(false);
        return;
      }
    }

    const replaceText = (value) => {
      const withValues = replacePlaceholderTokensInText(value, replacements);
      return removePlaceholderTokensInText(withValues, disabledTokens);
    };
    const hasDisabledToken = (value) =>
      extractPlaceholderTokensFromText(value).some((token) =>
        disabledKeys.has(normalizePlaceholderToken(token)),
      );
    const isEmptyText = (value) => !String(value || "").trim();
    const isLabelOnlyLine = (value) =>
      /^[A-Za-z][A-Za-z0-9 '&/()_-]{1,80}:\s*$/.test(String(value || "").trim());

    setDocTitle((prev) => replaceText(prev));
    setCompanyName((prev) => replaceText(prev));
    setEffectiveDate((prev) => replaceText(prev));
    setDocusignSignerName((prev) => replaceText(prev));
    setDocusignSignerEmail((prev) => replaceText(prev));
    setDocusignEmailSubject((prev) => replaceText(prev));
    const nextParties = (parties || []).map((party) => ({
        ...party,
        label: replaceText(party?.label),
        name: replaceText(party?.name),
        address: replaceText(party?.address),
        email: replaceText(party?.email),
      }));
    setParties(nextParties);
    const nextSignatures = (signatures || []).map((sig) => ({
        ...sig,
        role: replaceText(sig?.role),
        name: replaceText(sig?.name),
        title: replaceText(sig?.title),
        date: replaceText(sig?.date),
      }));
    setSignatures(nextSignatures);
    const nextSections = ((sections || [])
        .map((section) => ({
          ...section,
          heading: replaceText(section?.heading),
          paragraphs: (section?.paragraphs || [])
            .map((p) => replaceText(p))
            .filter((p) => String(p || "").trim())
            .filter((p) => !isLabelOnlyLine(p)),
          table: section?.table
            ? {
                ...section.table,
                headers: (section.table.headers || []).map((h) => replaceText(h)),
                rows: (section.table.rows || [])
                  .map((row) => {
                    const cells = normalizeTableRowCells(row);
                    const replaced = cells.map((cell) => replaceText(cell));
                    const disabledInValueColumns = cells
                      .slice(1)
                      .some((cell) => hasDisabledToken(cell));
                    const valueColumnsEmpty = replaced
                      .slice(1)
                      .every((cell) => isEmptyText(cell));
                    if (disabledInValueColumns && valueColumnsEmpty) return null;
                    if (replaced.every((cell) => isEmptyText(cell))) return null;
                    return replaced;
                  })
                  .filter(Boolean),
              }
            : section?.table,
        }))
        .filter(
          (section) =>
            String(section?.heading || "").trim() ||
            (section?.paragraphs || []).length ||
            (section?.table?.rows || []).length,
        ));
    setSections(
      upsertDualPartySignatureSection(nextSections, nextParties, docVariant),
    );
    setPlaceholderModalOpen(false);
    setSuccess("Document placeholders updated.");
  }, [
    placeholderFields,
    placeholderValues,
    placeholderEnabled,
    parties,
    signatures,
    sections,
    docVariant,
  ]);

  // ---------------- Loading ----------------
  if (planLoading) {
    const shellBg = dark ? "#141416" : "#f8fafc";
    const cardBg = dark ? "#1a1b1f" : "#ffffff";
    const cardBorder = dark ? "#2a2b31" : "#e5e7eb";
    const mutedBg = dark ? "#202127" : "#f1f5f9";
    const lineBg = dark ? "#30323a" : "#e5e7eb";
    return (
      <div className="min-h-screen" style={{ background: shellBg }}>
        <main
          className="max-w-6xl mx-auto pb-20 pt-6"
          style={{ paddingInline: isMobile ? 12 : 24 }}
        >
          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 296px" }}
          >
            <div>
              <div
                className="flex items-center justify-between mb-4 animate-pulse"
                style={{
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: isMobile ? "flex-start" : "center",
                  gap: isMobile ? 10 : 0,
                }}
              >
                <div className="space-y-2">
                  <div className="h-3 w-44 rounded-full" style={{ background: lineBg }} />
                  <div className="h-6 w-72 rounded-md" style={{ background: lineBg }} />
                  <div className="h-3 w-32 rounded-full" style={{ background: lineBg }} />
                </div>
                <div className="flex gap-2">
                  <div className="h-10 w-24 rounded-xl" style={{ background: mutedBg }} />
                  <div className="h-10 w-36 rounded-xl" style={{ background: mutedBg }} />
                </div>
              </div>

              <div
                className="h-11 rounded-xl mb-4 animate-pulse"
                style={{ background: mutedBg, border: `1px solid ${cardBorder}` }}
              />

              <div
                className="rounded-2xl overflow-hidden border"
                style={{ background: cardBg, borderColor: cardBorder }}
              >
                <div
                  className="px-4 py-2.5 flex items-center gap-2 border-b"
                  style={{ background: mutedBg, borderColor: cardBorder }}
                >
                  {["#fc5f57", "#febc2e", "#28c840"].map((c) => (
                    <div key={c} className="w-3 h-3 rounded-full" style={{ background: c }} />
                  ))}
                  <div className="h-3 w-44 rounded-full ml-2 animate-pulse" style={{ background: lineBg }} />
                </div>
                <div className="p-6" style={{ background: dark ? "#202127" : "#f1f5f9" }}>
                  <div
                    className="mx-auto rounded-sm border p-10 animate-pulse"
                    style={{
                      maxWidth: 640,
                      minHeight: 920,
                      background: "#ffffff",
                      borderColor: "#e5e7eb",
                    }}
                  >
                    <div className="h-2 w-24 rounded-full mb-6" style={{ background: "#e5e7eb" }} />
                    <div className="space-y-3">
                      <div className="h-3 rounded-full" style={{ background: "#e5e7eb" }} />
                      <div className="h-3 rounded-full w-[92%]" style={{ background: "#e5e7eb" }} />
                      <div className="h-3 rounded-full w-[88%]" style={{ background: "#e5e7eb" }} />
                      <div className="h-3 rounded-full" style={{ background: "#e5e7eb" }} />
                      <div className="h-3 rounded-full w-[94%]" style={{ background: "#e5e7eb" }} />
                      <div className="h-3 rounded-full w-[90%]" style={{ background: "#e5e7eb" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 animate-pulse">
              <div
                className="rounded-2xl p-4 border"
                style={{
                  background: dark
                    ? "linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #23324d 100%)"
                    : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                  borderColor: dark ? "#2e3d57" : "#cbd5e1",
                }}
              >
                <div className="h-3 w-32 rounded-full bg-white/25 mb-3" />
                <div className="h-5 w-44 rounded bg-white/25 mb-3" />
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-14 rounded-xl bg-white/20" />
                  <div className="h-14 rounded-xl bg-white/20" />
                </div>
              </div>
              <div
                className="rounded-2xl p-4 border"
                style={{
                  background: cardBg,
                  borderColor: cardBorder,
                }}
              >
                <div className="h-5 w-28 rounded mb-4" style={{ background: lineBg }} />
                <div className="space-y-3">
                  <div className="h-3 w-16 rounded" style={{ background: lineBg }} />
                  <div className="h-9 rounded-xl" style={{ background: mutedBg }} />
                  <div className="h-3 w-24 rounded" style={{ background: lineBg }} />
                  <div className="h-9 rounded-xl" style={{ background: mutedBg }} />
                  <div className="h-10 rounded-xl" style={{ background: mutedBg }} />
                </div>
              </div>
              <div
                className="rounded-2xl p-4 border"
                style={{ background: cardBg, borderColor: cardBorder }}
              >
                <div className="h-5 w-32 rounded mb-4" style={{ background: lineBg }} />
                <div className="space-y-3">
                  <div className="h-14 rounded-xl" style={{ background: mutedBg }} />
                  <div className="h-8 rounded-lg" style={{ background: mutedBg }} />
                  <div className="h-3 w-36 rounded" style={{ background: lineBg }} />
                  <div className="h-9 rounded-lg" style={{ background: mutedBg }} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ---------------- Paywall ----------------
  if (isStarterPlan) {
    return <DocumentGeneratorPaywall dark={dark} />;
  }

  return (
    <div
      className={`contract-root min-h-screen ${dark ? "dark bg-[#141416]" : "bg-[#f8fafc]"}`}
      style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .ant-input, .ant-input-affix-wrapper { border-color: #e8e8e8 !important; border-radius: 10px !important; }
        .ant-input:focus, .ant-input-affix-wrapper:focus, .ant-input-affix-wrapper-focused { border-color: #111 !important; box-shadow: 0 0 0 2px rgba(0,0,0,0.06) !important; }
        .ant-btn { border-radius: 10px !important; }
        .ant-modal-content { border-radius: 16px !important; }
        .tab-pill { transition: all 0.18s; }
        .tab-pill.active { background: white; box-shadow: 0 1px 4px rgba(0,0,0,0.1); color: #111; }
        .paper-scroll::-webkit-scrollbar { width: 6px; }
        .paper-scroll::-webkit-scrollbar-track { background: transparent; }
        .paper-scroll::-webkit-scrollbar-thumb { background: #d4d4d4; border-radius: 99px; }
        .doc-type-btn { transition: all 0.15s; cursor: pointer; border: 1.5px solid transparent; }
        .doc-type-btn:hover { transform: translateY(-1px); }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp 0.4s ease both; }
        .fade-up-1 { animation-delay: 0.05s; }
        .fade-up-2 { animation-delay: 0.12s; }
        .fade-up-3 { animation-delay: 0.2s; }

        .contract-root.dark { color: #f3f4f6; }
        .contract-root.dark .bg-white { background: #1a1b1f !important; }
        .contract-root.dark .bg-gray-50 { background: #17181c !important; }
        .contract-root.dark .bg-gray-100 { background: #202127 !important; }
        .contract-root.dark .border-gray-50,
        .contract-root.dark .border-gray-100,
        .contract-root.dark .border-gray-200,
        .contract-root.dark .border-gray-300 { border-color: #2a2b31 !important; }
        .contract-root.dark .text-gray-950,
        .contract-root.dark .text-gray-900,
        .contract-root.dark .text-gray-800,
        .contract-root.dark .text-gray-700,
        .contract-root.dark .text-gray-600,
        .contract-root.dark .text-gray-500,
        .contract-root.dark .text-gray-400,
        .contract-root.dark .text-gray-300 { color: #d1d5db !important; }
        .contract-root.dark .tab-pill.active { background: #202127 !important; box-shadow: none; color: #f3f4f6 !important; }
        .contract-root.dark .paper-scroll::-webkit-scrollbar-thumb { background: #2a2b31; }
        .contract-root.dark .cm-card { border-color: transparent !important; box-shadow: none !important; }

        .contract-root.dark .ant-input,
        .contract-root.dark .ant-input-affix-wrapper,
        .contract-root.dark .ant-select-selector,
        .contract-root.dark .ant-picker,
        .contract-root.dark .ant-input-textarea textarea {
          background: #17181c !important;
          border-color: #2a2b31 !important;
          color: #f3f4f6 !important;
        }
        .contract-root.dark .ant-input::placeholder,
        .contract-root.dark .ant-input-textarea textarea::placeholder,
        .contract-root.dark .ant-select-selection-placeholder,
        .contract-root.dark .ant-select-arrow,
        .contract-root.dark .ant-picker-suffix,
        .contract-root.dark .ant-picker-clear { color: #9ca3af !important; }
        .contract-root.dark .ant-modal-content,
        .contract-root.dark .ant-modal-header,
        .contract-root.dark .ant-modal-footer {
          background: #1a1b1f !important;
          border-color: #2a2b31 !important;
          color: #f3f4f6 !important;
        }
        .contract-root.dark .ant-modal-title { color: #f3f4f6 !important; }

        /* Placeholder modal is rendered in portal, so apply dark styles via modal class */
        .cm-placeholder-modal-dark .ant-modal-content {
          background: #1a1b1f !important;
          border: 1px solid #2a2b31 !important;
          color: #f3f4f6 !important;
        }
        .cm-placeholder-modal-dark .ant-modal-header {
          background: transparent !important;
          border-bottom-color: #2a2b31 !important;
        }
        .cm-placeholder-modal-dark .ant-modal-title {
          color: #f3f4f6 !important;
        }
        .cm-placeholder-modal-dark .ant-input,
        .cm-placeholder-modal-dark .ant-input-affix-wrapper,
        .cm-placeholder-modal-dark .ant-picker,
        .cm-placeholder-modal-dark .ant-select-selector,
        .cm-placeholder-modal-dark .ant-input-textarea textarea {
          background: #111318 !important;
          border-color: #303541 !important;
          color: #e5e7eb !important;
          box-shadow: none !important;
        }
        .cm-placeholder-modal-dark .ant-input::placeholder,
        .cm-placeholder-modal-dark .ant-input-textarea textarea::placeholder,
        .cm-placeholder-modal-dark .ant-select-selection-placeholder {
          color: #6b7280 !important;
        }
        .cm-placeholder-modal-dark .ant-btn-default {
          background: #111318 !important;
          border-color: #303541 !important;
          color: #e5e7eb !important;
        }

        /* Keep legal paper preview white for real-document editing */
        .contract-root.dark .contract-paper,
        .contract-root.dark .contract-paper * {
          color-scheme: light;
        }
        .contract-root.dark .contract-paper { background: #ffffff !important; color: #111111 !important; }
        .contract-root.dark .contract-paper .bg-white { background: #ffffff !important; }
      `}</style>

      {/* Setup Modal */}
      <Modal
        open={setupOpen}
        title={null}
        footer={null}
        closable={false}
        centered
        width={isMobile ? "92vw" : 520}
        styles={{
          content: {
            borderRadius: 20,
            padding: 0,
            overflow: "hidden",
            border: dark ? "1px solid #2a2b31" : "1px solid #e8e8e8",
          },
          mask: { backdropFilter: "blur(6px)" },
        }}
      >
        <div className="p-7">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 bg-gray-900 rounded-xl flex items-center justify-center">
              <FileTextOutlined className="text-white text-sm" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 m-0">
                Document Setup
              </h3>
              <p className="text-xs text-gray-400 m-0">
                A few details before opening the editor
              </p>
            </div>
          </div>
          <div className="h-px bg-gray-100 my-5" />
          <div className="flex flex-col gap-4">
            <div>
              <label className={inputLbl}>Document Title</label>
              <Input
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="e.g. SERVICE AGREEMENT"
                size="large"
                className="rounded-xl"
                style={{ fontSize: 14, borderColor: "#e8e8e8" }}
              />
            </div>
            <div>
              <label className={inputLbl}>Effective Date</label>
              <Input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                size="large"
                className="rounded-xl"
                style={{ fontSize: 14 }}
              />
            </div>
            <div
              className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer select-none"
              onClick={() => setConfidentiality((v) => !v)}
            >
              <div
                className={`w-4 h-4 rounded flex items-center justify-center transition-all ${confidentiality ? "bg-gray-900" : "border border-gray-300 bg-white"}`}
              >
                {confidentiality && (
                  <CheckOutlined style={{ fontSize: 9, color: "white" }} />
                )}
              </div>
              <div>
                <span className="text-sm font-medium text-gray-700">
                  Mark as Confidential
                </span>
                <span className="text-xs text-gray-400 block">
                  Adds a confidential stamp to the document
                </span>
              </div>
              <LockOutlined className="text-gray-300 ml-auto" />
            </div>
            <Button
              type="primary"
              size="large"
              block
              onClick={() => {
                setSetupOpen(false);
                setStep("editor");
              }}
              style={{
                height: 52,
                background: "#111",
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
              }}
              className="mt-1"
            >
              Open Document Editor
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={placeholderModalOpen}
        className={dark ? "cm-placeholder-modal-dark" : ""}
        title="Fill Document Fields"
        onCancel={() => setPlaceholderModalOpen(false)}
        onOk={applyDetectedPlaceholders}
        okText="Apply Values"
        cancelText="Skip"
        width={isMobile ? "94vw" : 920}
        styles={{
          content: {
            borderRadius: 14,
            border: dark ? "1px solid #2a2b31" : "1px solid #e5e7eb",
          },
        }}
      >
        <p className="text-xs text-gray-500 mb-3">
          We found placeholders in your draft. Fill them once and we will apply
          values across the document automatically.
        </p>
        <div className="max-h-[62vh] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-3">
          {placeholderFields.map(({ key, token, displayToken, type }) => (
            <div key={key} className={type === "textarea" ? "md:col-span-2" : ""}>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 block">
                  {displayToken}
                </label>
                <Checkbox
                  checked={placeholderEnabled[key] !== false}
                  onChange={(e) =>
                    setPlaceholderEnabled((prev) => ({
                      ...prev,
                      [key]: e.target.checked,
                    }))
                  }
                >
                  <span className="text-[11px] text-gray-500">Include</span>
                </Checkbox>
              </div>
              {placeholderEnabled[key] === false ? (
                <div className="rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-400">
                  This section will be hidden where this field appears.
                </div>
              ) : null}
              {placeholderEnabled[key] !== false &&
                (type === "country" ? (
                  <Select
                    showSearch
                    options={COUNTRY_OPTIONS}
                    value={placeholderValues[key] || undefined}
                    onChange={(value) =>
                      setPlaceholderValues((prev) => ({
                        ...prev,
                        [key]: value,
                      }))
                    }
                    placeholder={`Select ${token}`}
                    className="w-full"
                    optionFilterProp="label"
                  />
                ) : type === "date" ? (
                  <DatePicker
                    value={(() => {
                      const raw = String(placeholderValues[key] || "").trim();
                      if (!raw) return null;
                      const parsed = dayjs(raw);
                      return parsed.isValid() ? parsed : null;
                    })()}
                    onChange={(value) =>
                      setPlaceholderValues((prev) => ({
                        ...prev,
                        [key]: value ? value.format("YYYY-MM-DD") : "",
                      }))
                    }
                    format="YYYY-MM-DD"
                    className="w-full"
                  />
                ) : type === "time" ? (
                  <TimePicker
                    value={(() => {
                      const raw = String(placeholderValues[key] || "").trim();
                      if (!raw) return null;
                      const parsed = dayjs(`2000-01-01T${raw}`);
                      return parsed.isValid() ? parsed : null;
                    })()}
                    onChange={(value) =>
                      setPlaceholderValues((prev) => ({
                        ...prev,
                        [key]: value ? value.format("HH:mm") : "",
                      }))
                    }
                    format="HH:mm"
                    className="w-full"
                  />
                ) : type === "textarea" ? (
                  <TextArea
                    value={placeholderValues[key] || ""}
                    onChange={(e) =>
                      setPlaceholderValues((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    rows={3}
                    placeholder={`Enter ${token}`}
                    className="rounded-lg"
                  />
                ) : (
                  <Input
                    type={type === "email" ? "email" : "text"}
                    value={placeholderValues[key] || ""}
                    onChange={(e) =>
                      setPlaceholderValues((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    placeholder={`Enter ${token}`}
                    className="rounded-lg"
                  />
                ))}
            </div>
          ))}
        </div>
      </Modal>

      <main
        className="max-w-6xl mx-auto pb-20"
        style={{ paddingInline: isMobile ? 12 : 24 }}
      >
        {/* ---------------- INPUT STEP ---------------- */}
        {step === "input" && (
          <div className="pt-16 pb-8" style={{ paddingTop: isMobile ? 24 : 64 }}>
            <div className="text-center mb-10 fade-up">
              <h1
                className="text-5xl font-extrabold text-gray-950 tracking-tight leading-none mb-4 fade-up fade-up-1"
                style={{ letterSpacing: "-2px", fontSize: isMobile ? 34 : undefined }}
              >
                Legal documents,
                <br />
                <span className="text-gray-400">drafted in seconds</span>
              </h1>
              <p className="text-base text-gray-500 max-w-sm mx-auto leading-relaxed fade-up fade-up-2">
                Choose your document type, describe your agreement, and get a
                complete professional document ready to sign.
              </p>
            </div>

            {/* Doc Type Selector */}
            <div className="max-w-2xl mx-auto mb-6 fade-up fade-up-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 text-center">
                Choose Document Type
              </p>
              <div
                className="grid grid-cols-4 gap-2"
                style={{
                  gridTemplateColumns: isMobile
                    ? "repeat(2, minmax(0, 1fr))"
                    : "repeat(4, minmax(0, 1fr))",
                }}
              >
                {DOC_TYPES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDocType(d.key)}
                    className="doc-type-btn rounded-xl p-3 text-left bg-white"
                    style={{
                      border:
                        docType === d.key
                          ? `1.5px solid ${d.color}`
                          : dark
                            ? "1.5px solid #2a2b31"
                            : "1.5px solid #e2e8f0",
                      background:
                        docType === d.key
                          ? dark
                            ? "#17181c"
                            : d.bg
                          : dark
                            ? "#1a1b1f"
                            : "#fff",
                      boxShadow:
                        docType === d.key
                          ? dark
                            ? `0 0 0 2px ${d.color}30`
                            : `0 0 0 3px ${d.color}15`
                          : "none",
                    }}
                  >
                    <div style={{ color: d.color, marginBottom: 6 }}>
                      {d.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: dark ? "#f3f4f6" : "#0f172a",
                      }}
                    >
                      {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: dark ? "#9ca3af" : "#94a3b8",
                        lineHeight: 1.4,
                        marginTop: 2,
                      }}
                    >
                      {d.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Main card */}
            <div className="max-w-2xl mx-auto fade-up fade-up-3">
              <div className="cm-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Selected doc type indicator */}
                <div
                  style={{
                    background: dark ? "#17181c" : selectedDocType?.bg,
                    borderBottom: dark
                      ? "1px solid #2a2b31"
                      : `1px solid ${selectedDocType?.color}20`,
                    padding: "10px 20px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span style={{ color: selectedDocType?.color }}>
                    {selectedDocType?.icon}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: selectedDocType?.color,
                    }}
                  >
                    {selectedDocType?.label}
                  </span>
                  <span
                    style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}
                  >
                    - {selectedDocType?.desc}
                  </span>
                </div>

                {/* Tab switcher */}
                <div className="flex bg-gray-50 border-b border-gray-100 p-1 gap-1">
                  {[
                    ["text", <EditOutlined />, "Describe Document"],
                    ["upload", <InboxOutlined />, "Upload Document"],
                  ].map(([mode, icon, label]) => (
                    <button
                      key={mode}
                      onClick={() => {
                        setInputMode(mode);
                        setError("");
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer border-0 tab-pill ${inputMode === mode ? "active" : "text-gray-400 bg-transparent hover:text-gray-600"}`}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>

                <div className="p-6">
                  {inputMode === "text" && (
                    <>
                      <TextArea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        rows={6}
                        placeholder={`Describe your ${selectedDocType?.label.toLowerCase()} in detail. e.g. ${
                          docType === "nda"
                            ? "mutual NDA between two software companies, 2-year term, covers source code and client data."
                            : docType === "employment"
                              ? "job offer letter for a full-time frontend engineer, $85k salary, 3-month probation, remote work, London governing law."
                              : docType === "lease"
                                ? "office space lease, 12 months, $3,500/month, tenant responsible for utilities."
                                : "web development contract, 60 days, $5,500 in 3 milestones, React/Node.js, full IP transfer."
                        }`}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          borderColor: "#e8e8e8",
                          borderRadius: 12,
                          resize: "none",
                          padding: "14px 16px",
                        }}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
                            handleGenerate();
                        }}
                      />
                      <div className="flex justify-between mt-2">
                        <span
                          className={`text-xs ${promptLength >= MIN_PROMPT_CHARS ? "text-gray-300" : "text-amber-500"}`}
                        >
                          {promptLength}/{MIN_PROMPT_CHARS} characters minimum
                        </span>
                        <span className="text-xs text-gray-300">
                          Ctrl/Cmd + Enter to generate
                        </span>
                      </div>
                    </>
                  )}

                  {inputMode === "upload" && (
                    <div className="flex flex-col gap-4">
                      {!uploadedFile ? (
                        <Dragger
                          accept=".pdf,.docx,.txt,.md"
                          showUploadList={false}
                          beforeUpload={handleFileUpload}
                          style={{
                            borderRadius: 14,
                          }}
                        >
                          <div className="py-6">
                            <InboxOutlined className="text-4xl text-gray-300 block mb-3" />
                            <p className="text-sm font-semibold text-gray-500 mb-1">
                              Drop your document here
                            </p>
                            <p className="text-xs text-gray-300">
                              PDF, DOCX, TXT - proposals, briefs, SOWs
                            </p>
                          </div>
                        </Dragger>
                      ) : (
                        <div className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center flex-shrink-0">
                              <FileOutlined
                                className="text-white"
                                style={{ fontSize: 16 }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-gray-800 truncate">
                                {uploadedFile.name}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5">
                                {extracting
                                  ? "Extracting text..."
                                  : `${uploadedText.length.toLocaleString()} characters extracted`}
                              </div>
                            </div>
                            {extracting && (
                              <div className="w-6 h-6 rounded-full bg-gray-200 animate-pulse" />
                            )}
                            {!extracting && (
                              <CheckCircleFilled className="text-green-500" />
                            )}
                            <Button
                              size="small"
                              icon={<DeleteOutlined />}
                              onClick={() => {
                                setUploadedFile(null);
                                setUploadedText("");
                              }}
                              className="rounded-lg"
                            >
                              Remove
                            </Button>
                          </div>
                          {uploadedText && !extracting && (
                            <div className="mt-3 p-3 bg-gray-100 rounded-lg text-xs text-gray-400 leading-relaxed line-clamp-3">
                              {uploadedText.slice(0, 280)}...
                            </div>
                          )}
                        </div>
                      )}
                      <div>
                        <label className={inputLbl}>
                          Additional Instructions
                        </label>
                        <TextArea
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          rows={2}
                          placeholder="e.g. Add 6-month warranty, use UK governing law."
                          style={{
                            fontSize: 13.5,
                            borderColor: "#e8e8e8",
                            borderRadius: 12,
                            resize: "none",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <Alert
                      message={error}
                      type="error"
                      showIcon
                      className="mt-3 mb-1 rounded-xl"
                      style={{ fontSize: 13, borderRadius: 12 }}
                    />
                  )}
                  {success && (
                    <Alert
                      message={success}
                      type="success"
                      showIcon
                      className="mt-3 mb-1 rounded-xl"
                      style={{ fontSize: 13, borderRadius: 12 }}
                    />
                  )}

                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleGenerate}
                    loading={loading}
                    disabled={!canGen && !loading}
                    icon={loading ? null : <ThunderboltOutlined />}
                    style={{
                      height: 52,
                      background: selectedDocType?.color || "#111",
                      border: "none",
                      borderRadius: 14,
                      fontSize: 15,
                      fontWeight: 700,
                      marginTop: 18,
                    }}
                  >
                    {loading
                      ? `Drafting your ${selectedDocType?.label}...`
                      : `Generate ${selectedDocType?.label}`}
                  </Button>

                  {loading && (
                    <div className="mt-5 flex items-center gap-3">
                      {[
                        { label: "Ready", done: genStep > 0 },
                        {
                          label:
                            inputMode === "upload"
                              ? "Analysing document"
                              : "Drafting clauses",
                          active: genStep === 1,
                        },
                        { label: "Finalising", done: genStep === 2 },
                      ].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 flex-1">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs transition-all ${s.done ? "bg-gray-900 text-white" : s.active ? "bg-gray-100 ring-2 ring-gray-900 ring-offset-1" : "bg-gray-100 text-gray-300"}`}
                          >
                            {s.done ? (
                              <CheckOutlined style={{ fontSize: 9 }} />
                            ) : s.active ? (
                              <div className="w-3.5 h-3.5 rounded-full bg-gray-300 animate-pulse" />
                            ) : (
                              i + 1
                            )}
                          </div>
                          <span
                            className={`text-xs font-medium ${s.active ? "text-gray-900" : s.done ? "text-gray-500" : "text-gray-300"}`}
                          >
                            {s.label}
                          </span>
                          {i < 2 && <div className="flex-1 h-px bg-gray-100" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6 flex-wrap">
                {[
                  [LockOutlined, "End-to-end encrypted"],
                  [ClockCircleOutlined, "~15 sec generation"],
                  [CheckCircleFilled, "Not legal advice"],
                ].map(([Icon, label], i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 text-xs text-gray-400"
                  >
                    <Icon style={{ fontSize: 11 }} /> {label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ---------------- EDITOR STEP ---------------- */}
        {step === "editor" && (
          <div className="pt-6">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: isMobile ? "1fr" : "1fr 296px" }}
            >
              {/* Left: Document */}
              <div>
                <div
                  className="flex items-center justify-between mb-4"
                  style={{
                    flexDirection: isMobile ? "column" : "row",
                    alignItems: isMobile ? "flex-start" : "center",
                    gap: isMobile ? 10 : 0,
                  }}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border-0 bg-transparent cursor-pointer transition-colors"
                      >
                        <ArrowRight size={12} style={{ transform: "rotate(180deg)" }} />
                        New Document
                      </button>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>•</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: selectedDocType?.color,
                          background: dark
                            ? `${selectedDocType?.color || "#334155"}22`
                            : selectedDocType?.bg,
                          padding: "2px 8px",
                          borderRadius: 5,
                          border: dark
                            ? `1px solid ${(selectedDocType?.color || "#64748b")}55`
                            : "none",
                        }}
                      >
                        {selectedDocType?.label}
                      </span>
                    </div>
                    <h2
                      className="text-lg font-bold text-gray-900 leading-none mt-1"
                      style={{ letterSpacing: "-0.5px" }}
                    >
                      {docTitle || "Document"}
                    </h2>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date().toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}{" "}
                      • {sections.length} sections
                    </p>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    style={{ flexWrap: "wrap", width: isMobile ? "100%" : "auto" }}
                  >
                    {detectedPlaceholders.length > 0 && (
                      <Button
                        icon={<EditOutlined />}
                        onClick={() => setPlaceholderModalOpen(true)}
                        style={{
                          borderRadius: 12,
                          fontWeight: 600,
                          height: 40,
                          paddingInline: 14,
                          fontSize: 12,
                          borderColor: "#d1d5db",
                        }}
                      >
                        Fill Fields
                      </Button>
                    )}
                    <Button
                      type="primary"
                      icon={<DownloadOutlined />}
                      loading={downloading}
                      onClick={handleDownload}
                      style={{
                        background: "#111",
                        border: "none",
                        borderRadius: 12,
                        fontWeight: 600,
                        height: 40,
                        paddingInline: 20,
                        fontSize: 13,
                      }}
                    >
                      {downloading ? "Generating..." : "Download PDF"}
                    </Button>
                  </div>
                </div>

                <div
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 mb-4"
                  style={{
                    background: dark ? "rgba(251, 191, 36, 0.12)" : "#fffbeb",
                    border: `1px solid ${dark ? "rgba(251, 191, 36, 0.3)" : "#fde68a"}`,
                  }}
                >
                  <EditOutlined
                    className="flex-shrink-0"
                    style={{ color: dark ? "#fbbf24" : "#f59e0b", fontSize: 12 }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{ color: dark ? "#fcd34d" : "#b45309" }}
                  >
                    Click any text, heading, or table cell to edit inline
                  </span>
                </div>

                <div className="cm-card bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-2">
                    {["#fc5f57", "#febc2e", "#28c840"].map((c) => (
                      <div
                        key={c}
                        className="w-3 h-3 rounded-full"
                        style={{ background: c }}
                      />
                    ))}
                    <span className="text-xs text-gray-400 ml-2 font-medium">
                      {docTitle || "Document"}.pdf
                    </span>
                  </div>

                  <div
                    className="paper-scroll bg-gray-100 p-6"
                    style={{
                      maxHeight: isMobile ? "68vh" : "72vh",
                      overflowY: "auto",
                      padding: isMobile ? 10 : 24,
                    }}
                  >
                    <div
                      className="contract-paper bg-white mx-auto shadow-lg relative"
                      style={{
                        maxWidth: isMobile ? "100%" : 640,
                        padding: isMobile ? "26px 16px 32px" : "52px 56px 60px",
                        minHeight: isMobile ? 760 : 900,
                      }}
                    >
                      <div className="absolute inset-3 border border-gray-100 pointer-events-none rounded" />
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr auto",
                          alignItems: "start",
                          gap: 18,
                          marginBottom: 14,
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: TNR,
                              fontSize: 11,
                              color: "#737373",
                              lineHeight: 1.55,
                            }}
                          >
                            <div>
                              <strong style={{ color: "#444", marginRight: 8 }}>Date</strong>
                              {previewLetterDate}
                            </div>
                            <div style={{ marginTop: 10, color: "#444", fontWeight: 700 }}>
                              To
                            </div>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateRecipientNameInline(
                                  e.currentTarget.textContent,
                                )
                              }
                              style={{
                                marginTop: 4,
                                color: "#111",
                                fontWeight: 700,
                                outline: "none",
                                cursor: "text",
                              }}
                            >
                              {previewRecipientName}
                            </div>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateRecipientTitleInline(
                                  e.currentTarget.textContent,
                                )
                              }
                              style={{
                                color: "#6b7280",
                                outline: "none",
                                cursor: "text",
                              }}
                            >
                              {previewRecipientTitle}
                            </div>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateSenderCompanyInline(
                                  e.currentTarget.textContent,
                                )
                              }
                              style={{
                                marginTop: 14,
                                color: "#111",
                                fontWeight: 700,
                                outline: "none",
                                cursor: "text",
                              }}
                            >
                              {previewSenderName}
                            </div>
                            <div
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) =>
                                updateSenderAddressInline(
                                  e.currentTarget.textContent,
                                )
                              }
                              style={{
                                color: "#6b7280",
                                outline: "none",
                                cursor: "text",
                              }}
                            >
                              {previewSenderAddress}
                            </div>
                          </div>
                        </div>
                        {logoDataUrl ? (
                          <img
                            src={logoDataUrl}
                            alt="logo"
                            className="max-h-14 max-w-36 object-contain"
                            style={{ justifySelf: "end" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: 120,
                              height: 56,
                              border: "1px dashed #d1d5db",
                              borderRadius: 10,
                              color: "#9ca3af",
                              fontSize: 10,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                            }}
                          >
                            Company Logo
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          borderTop: "1px solid #dcdcdc",
                          marginBottom: 16,
                        }}
                      />
                      {confidentiality && (
                        <div className="text-center mb-2">
                          <span
                            style={{
                              fontSize: 8,
                              border: "0.5px solid #bbb",
                              padding: "2px 12px",
                              letterSpacing: "0.18em",
                              textTransform: "uppercase",
                              color: "#bbb",
                              fontFamily: TNR,
                            }}
                          >
                            CONFIDENTIAL
                          </span>
                        </div>
                      )}

                      {sections.map((section, si) => (
                        <div key={si} className="mb-3">
                          {showSectionHeadings && (
                            <EditableBlock
                              value={section.heading}
                              isHeading
                              onEdit={(v) => updateHeading(si, v)}
                              onDelete={() => deleteSection(si)}
                              onAddAfter={() => addSection(si)}
                            />
                          )}
                          {(section.paragraphs || []).map((para, pi) => (
                            <EditableBlock
                              key={pi}
                              value={para}
                              isHeading={false}
                              onEdit={(v) => updatePara(si, pi, v)}
                              onDelete={() => deletePara(si, pi)}
                              onAddAfter={() => addParaAfter(si, pi)}
                            />
                          ))}
                          {section.table?.headers &&
                            section.table?.rows?.length > 0 && (
                              <div className="mt-3 overflow-x-auto rounded-lg overflow-hidden border border-gray-200">
                                <table
                                  className="w-full border-collapse"
                                  style={{ fontFamily: TNR, fontSize: 12 }}
                                >
                                  <thead>
                                    <tr style={{ background: "#111" }}>
                                      {section.table.headers.map((h, hi) => (
                                        <th
                                          key={hi}
                                          className="text-left text-white font-bold"
                                          style={{
                                            padding: "8px 12px",
                                            fontSize: 10.5,
                                            letterSpacing: "0.03em",
                                          }}
                                        >
                                          {h}
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {section.table.rows.map((row, ri) => (
                                      <tr
                                        key={ri}
                                        style={{
                                          background:
                                            ri % 2 === 0 ? "white" : "#f9f9f9",
                                        }}
                                      >
                                        {row.map((cell, ci) => (
                                          <td
                                            key={ci}
                                            style={{
                                              padding: "7px 12px",
                                              borderBottom: "1px solid #ebebeb",
                                              color: "#222",
                                              verticalAlign: "top",
                                            }}
                                          >
                                            <div
                                              contentEditable
                                              suppressContentEditableWarning
                                              onBlur={(e) =>
                                                updateCell(
                                                  si,
                                                  ri,
                                                  ci,
                                                  e.currentTarget.textContent,
                                                )
                                              }
                                              style={{
                                                outline: "none",
                                                minWidth: 30,
                                                fontFamily: TNR,
                                                fontSize: 12,
                                                cursor: "text",
                                              }}
                                            >
                                              {cell}
                                            </div>
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                        </div>
                      ))}

                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div
                className="flex flex-col gap-4"
                style={{
                  position: isMobile ? "static" : "sticky",
                  top: isMobile ? "auto" : 80,
                  alignSelf: "start",
                }}
              >
                <div
                  className="cm-card rounded-2xl border text-white px-4 py-4 shadow-sm"
                  style={{
                    borderColor: dark ? "#2e3d57" : "#cbd5e1",
                    background: dark
                      ? "linear-gradient(135deg, #0f172a 0%, #1e293b 65%, #23324d 100%)"
                      : "linear-gradient(135deg, #0f172a 0%, #334155 100%)",
                  }}
                >
                  <div className="text-[11px] uppercase tracking-widest text-slate-200">
                    Contract Workspace
                  </div>
                  <div className="mt-1 text-base font-semibold leading-tight">
                    {docTitle || "Untitled Document"}
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div
                      className="rounded-xl px-2.5 py-2"
                      style={{
                        background: dark ? "rgba(148, 163, 184, 0.2)" : "rgba(255,255,255,0.18)",
                        border: `1px solid ${dark ? "rgba(148, 163, 184, 0.28)" : "rgba(255,255,255,0.22)"}`,
                      }}
                    >
                      <div className="text-[10px] text-slate-200">Sections</div>
                      <div className="text-sm font-semibold">{sections.length}</div>
                    </div>
                    <div
                      className="rounded-xl px-2.5 py-2"
                      style={{
                        background: dark ? "rgba(148, 163, 184, 0.2)" : "rgba(255,255,255,0.18)",
                        border: `1px solid ${dark ? "rgba(148, 163, 184, 0.28)" : "rgba(255,255,255,0.22)"}`,
                      }}
                    >
                      <div className="text-[10px] text-slate-200">Parties</div>
                      <div className="text-sm font-semibold">{parties.length}</div>
                    </div>
                  </div>
                </div>

                <SidePanel title="Document">
                  <div className="flex flex-col gap-3">
                    <div>
                      <label className={inputLbl}>Title</label>
                      <Input
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        placeholder="DOCUMENT TITLE"
                        className="rounded-xl"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div>
                      <label className={inputLbl}>Effective Date</label>
                      <Input
                        type="date"
                        value={effectiveDate}
                        onChange={(e) => setEffectiveDate(e.target.value)}
                        className="rounded-xl"
                        style={{ fontSize: 13 }}
                      />
                    </div>
                    <div
                      className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl cursor-pointer select-none border border-gray-100"
                      onClick={() => setConfidentiality((v) => !v)}
                    >
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all ${confidentiality ? "bg-gray-900" : "border border-gray-300"}`}
                      >
                        {confidentiality && (
                          <CheckOutlined
                            style={{ fontSize: 8, color: "white" }}
                          />
                        )}
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        Mark Confidential
                      </span>
                    </div>
                  </div>
                </SidePanel>

                <SidePanel title="DocuSign Signing">
                  <div className="flex flex-col gap-3">
                    <div
                      className="rounded-xl border px-3 py-2.5"
                      style={{
                        borderColor: docusignStatus?.connected
                          ? dark
                            ? "#166534"
                            : "#bbf7d0"
                          : dark
                            ? "#374151"
                            : "#e5e7eb",
                        background: docusignStatus?.connected
                          ? dark
                            ? "rgba(22, 101, 52, 0.28)"
                            : "#f0fdf4"
                          : dark
                            ? "#1f2937"
                            : "#f9fafb",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="text-xs font-semibold"
                          style={{ color: dark ? "#d1d5db" : "#374151" }}
                        >
                          Connection
                        </span>
                        <span
                          className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                          style={{
                            background: docusignStatus?.connected
                              ? dark
                                ? "#166534"
                                : "#dcfce7"
                              : dark
                                ? "#374151"
                                : "#e5e7eb",
                            color: docusignStatus?.connected
                              ? dark
                                ? "#dcfce7"
                                : "#166534"
                              : dark
                                ? "#e5e7eb"
                                : "#374151",
                          }}
                        >
                          {docusignLoading
                            ? "Checking..."
                            : docusignStatus?.connected
                              ? "Connected"
                              : "Not connected"}
                        </span>
                      </div>
                      {docusignAccount?.accountId && (
                        <div
                          className="mt-1.5 text-[11px] break-all"
                          style={{ color: dark ? "#cbd5e1" : "#4b5563" }}
                        >
                          Account: {docusignAccount.accountName || "DocuSign"} (
                          {docusignAccount.accountId})
                        </div>
                      )}
                    </div>

                    <div>
                      <Button
                        size="small"
                        onClick={handleConnectDocusign}
                        loading={docusignConnecting}
                        className="rounded-lg text-xs"
                        block
                      >
                        Connect DocuSign
                      </Button>
                    </div>

                    <div>
                      <label className={inputLbl}>Second Party Signer Name</label>
                      <Input
                        value={docusignSignerName}
                        onChange={(e) => setDocusignSignerName(e.target.value)}
                        placeholder="Counterparty full name"
                        className="rounded-lg"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label className={inputLbl}>Second Party Signer Email</label>
                      <Input
                        value={docusignSignerEmail}
                        onChange={(e) => {
                          setIsSignerEmailAutoFillEnabled(false);
                          setDocusignSignerEmail(e.target.value);
                        }}
                        placeholder="counterparty@email.com"
                        className="rounded-lg"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div>
                      <label className={inputLbl}>Email Subject</label>
                      <Input
                        value={docusignEmailSubject}
                        onChange={(e) => setDocusignEmailSubject(e.target.value)}
                        placeholder="Please sign this agreement"
                        className="rounded-lg"
                        style={{ fontSize: 12 }}
                      />
                    </div>

                    <div
                      className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5"
                      style={{ fontSize: 12, color: "#4b5563", lineHeight: 1.5 }}
                    >
                      DocuSign will use the currently generated document automatically.
                      No extra upload is required.
                    </div>
                    <div
                      className="rounded-xl border px-3 py-2.5"
                      style={{
                        fontSize: 12,
                        lineHeight: 1.5,
                        borderColor: dark ? "#334155" : "#dbeafe",
                        background: dark ? "rgba(37, 99, 235, 0.12)" : "#eff6ff",
                        color: dark ? "#dbeafe" : "#1e3a8a",
                      }}
                    >
                      Once both parties sign the contract, it will be available in
                      Documents &gt; Contracts folder.
                    </div>

                    {envelopeId && (
                      <div className="flex flex-col gap-2">
                        <div className="rounded-lg bg-gray-50 border border-gray-200 px-2.5 py-2 text-xs text-gray-600 break-all">
                          Envelope ID: {envelopeId}
                        </div>
                        <Button
                          size="small"
                          onClick={() => fetchSignedDocumentByEnvelope(envelopeId)}
                          loading={signedDocumentLoading}
                          className="rounded-lg text-xs"
                        >
                          {signedDocumentLoading
                            ? "Checking signed file..."
                            : "Load signed document"}
                        </Button>
                      </div>
                    )}

                    {signedDocumentUrl && (
                      <div className="rounded-xl border border-green-200 bg-green-50 p-3">
                        <div className="text-xs font-semibold text-green-800 mb-2">
                          Signed Document Ready
                        </div>
                        <a
                          href={signedDocumentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-medium"
                          style={{ color: "#166534" }}
                        >
                          View / Download signed PDF
                        </a>
                        <div className="mt-2 flex gap-2">
                          <Input
                            value={signedDocumentEmailTo}
                            onChange={(e) => {
                              setIsSignedEmailAutoFillEnabled(false);
                              setSignedDocumentEmailTo(e.target.value);
                            }}
                            placeholder="recipient@email.com"
                            className="rounded-lg"
                            style={{ fontSize: 12 }}
                          />
                          <Button
                            size="small"
                            onClick={handleSendSignedDocumentEmail}
                            loading={sendingSignedDocumentEmail}
                            className="rounded-lg text-xs"
                          >
                            Send Email
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </SidePanel>

                {error && step === "editor" && (
                  <Alert
                    message={error}
                    type="error"
                    showIcon
                    style={{ borderRadius: 12, fontSize: 12 }}
                  />
                )}
                {success && step === "editor" && (
                  <Alert
                    message={success}
                    type="success"
                    showIcon
                    style={{ borderRadius: 12, fontSize: 12 }}
                  />
                )}

                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<DownloadOutlined />}
                  loading={downloading}
                  onClick={handleDownload}
                  style={{
                    height: 48,
                    background: "#111",
                    border: "none",
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  {downloading ? "Generating PDF..." : "Download PDF"}
                </Button>
                <Button
                  size="large"
                  block
                  icon={<SignatureOutlined />}
                  loading={sendingToDocusign}
                  onClick={handleSendToDocusign}
                  style={{
                    height: 46,
                    borderRadius: 14,
                    fontWeight: 700,
                    fontSize: 13,
                    border: "1px solid #d1d5db",
                    background: "#fff",
                    color: "#111",
                  }}
                >
                  {sendingToDocusign
                    ? "Preparing DocuSign..."
                    : "Create & Sign via DocuSign"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


