import { useState, useRef, useEffect } from "react";
import {
  Button,
  Input,
  Typography,
  Spin,
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
  PictureOutlined,
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

const { TextArea } = Input;
const { Dragger } = Upload;

const GROQ_API_KEY = import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const TNR = "'Times New Roman', Times, serif";

// ─── Document Types ─────────────────────────────────────────────────────────
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
5. COMPENSATION AND BENEFITS — use table: Benefit | Details
6. WORKING HOURS AND LOCATION
7. LEAVE ENTITLEMENTS
8. CONFIDENTIALITY AND NON-DISCLOSURE
9. INTELLECTUAL PROPERTY
10. NON-COMPETE AND NON-SOLICITATION
11. TERMINATION
12. GOVERNING LAW AND DISPUTE RESOLUTION
13. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

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
4. CAPITAL CONTRIBUTIONS — use table: Partner | Contribution | Percentage
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
4. RENT AND PAYMENT TERMS — use table: Item | Amount | Due Date
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
4. ROLES AND RESPONSIBILITIES — use table: Party | Responsibilities
5. TIMELINE AND MILESTONES — use table: Milestone | Target Date
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
5. PROJECT TIMELINE — use table: Milestone | Deadline | Deliverable
6. FEES AND PAYMENT — use table: Item | Rate/Amount
7. INDEPENDENT CONTRACTOR STATUS
8. INTELLECTUAL PROPERTY
9. CONFIDENTIALITY
10. WARRANTIES
11. LIMITATION OF LIABILITY
12. TERMINATION
13. GOVERNING LAW
14. GENERAL PROVISIONS

RULES: paragraphs are plain text arrays, no markdown, return ONLY JSON.`,

  contract: `You are a professional legal contract drafting assistant. Return ONLY a raw JSON object — no markdown, no code fences, no explanation.

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
5. PROJECT TIMELINE AND MILESTONES — use table: Phase | Duration | Deliverable
6. PAYMENT TERMS — use table if milestone-based
7. TECHNOLOGY STACK — use table: Layer | Technology
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

async function callGroq(userContent, docType) {
  if (!GROQ_API_KEY) throw new Error("VITE_GROK_API_KEY not set in .env");
  const systemPrompt = DOC_SYSTEM_PROMPTS[docType] || DOC_SYSTEM_PROMPTS.custom;
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

async function downloadDocumentPDF({
  docTitle,
  effectiveDate,
  companyName,
  confidentiality,
  logoDataUrl,
  contractData,
  signatures,
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
    doc.setFont("times", "italic");
    doc.setFontSize(7.5);
    doc.setTextColor(...C.light);
    doc.text((docTitle || "DOCUMENT").toUpperCase(), ML, 36);
    doc.text(companyName ? companyName.toUpperCase() : "", PW - MR, 36, {
      align: "right",
    });
    const fy = PH - 28;
    doc.setDrawColor(...C.rule);
    doc.line(ML, fy - 8, PW - MR, fy - 8);
    doc.setFont("times", "italic");
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
  if (logoDataUrl && logoDataUrl.startsWith("data:image")) {
    try {
      await new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          try {
            const maxW = 180,
              maxH = 60;
            let lw = img.naturalWidth || img.width,
              lh = img.naturalHeight || img.height,
              ratio = lw / lh;
            if (lw > maxW) {
              lw = maxW;
              lh = lw / ratio;
            }
            if (lh > maxH) {
              lh = maxH;
              lw = lh * ratio;
            }
            const cvs = document.createElement("canvas");
            cvs.width = Math.round(lw * 3);
            cvs.height = Math.round(lh * 3);
            const ctx = cvs.getContext("2d");
            ctx.drawImage(img, 0, 0, cvs.width, cvs.height);
            doc.addImage(
              cvs.toDataURL("image/png"),
              "PNG",
              PW / 2 - lw / 2,
              y,
              lw,
              lh,
            );
            y += lh + 14;
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
  if (companyName) {
    doc.setFont("times", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...C.mid);
    doc.text(companyName.toUpperCase(), PW / 2, y, {
      align: "center",
      charSpace: 2.2,
    });
    y += 16;
  }
  if (confidentiality) {
    doc.setFont("times", "normal");
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
  sp(16);
  doc.setDrawColor(...C.black);
  doc.setLineWidth(3);
  doc.line(ML, y, PW - MR, y);
  y += 20;
  doc.setFont("times", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...C.black);
  const titleText = (docTitle || "LEGAL DOCUMENT").toUpperCase();
  const titleLines = doc.splitTextToSize(titleText, CW);
  titleLines.forEach((line) => {
    doc.text(line, PW / 2, y, { align: "center" });
    y += 26;
  });
  y += 6;
  doc.setDrawColor(...C.rule);
  doc.setLineWidth(0.75);
  doc.line(ML, y, PW - MR, y);
  y += 14;
  if (effectiveDate) {
    const d = new Date(effectiveDate + "T00:00:00");
    const fmt = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    doc.setFont("times", "italic");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.mid);
    doc.text(`Effective Date: ${fmt}`, PW / 2, y, { align: "center" });
    y += 26;
  }
  const parties = contractData?.parties || [];
  if (parties.length > 0) {
    let totalH = 18;
    parties.forEach(() => {
      totalH += 14 + 18 + 8;
    });
    need(totalH + 12);
    doc.setFillColor(...C.boxBg);
    doc.setDrawColor(...C.rule);
    doc.setLineWidth(0.5);
    doc.roundedRect(ML, y, CW, totalH, 4, 4, "FD");
    y += 14;
    parties.forEach((p, pi) => {
      doc.setFont("times", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...C.mid);
      doc.text((p.label || `Party ${pi + 1}`).toUpperCase(), ML + 16, y, {
        charSpace: 0.8,
      });
      y += 14;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...C.dark);
      const info = [p.name, p.address, p.email].filter(Boolean).join("   ·   ");
      const infoLines = doc.splitTextToSize(info, CW - 32);
      infoLines.forEach((l) => {
        doc.text(l, ML + 16, y);
        y += 16;
      });
      y += 8;
    });
    y += 6;
  }
  sp(20);
  const sections = contractData?.sections || [];
  sections.forEach((section) => {
    need(50);
    doc.setFont("times", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...C.black);
    const headingLines = doc.splitTextToSize(
      (section.heading || "").toUpperCase(),
      CW,
    );
    headingLines.forEach((hl) => {
      need(18);
      doc.text(hl, ML, y);
      y += 18;
    });
    y += 6;
    const paras = Array.isArray(section.paragraphs)
      ? section.paragraphs
      : section.content
        ? [section.content]
        : [];
    paras.forEach((para) => {
      if (!para?.trim()) return;
      doc.setFont("times", "normal");
      doc.setFontSize(10.5);
      doc.setTextColor(...C.dark);
      const lines = doc.splitTextToSize(para.trim(), CW);
      need(lines.length * 16 + 8);
      lines.forEach((l) => {
        doc.text(l, ML, y);
        y += 16;
      });
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
          font: "times",
          fontSize: 10,
          cellPadding: { top: 7, right: 12, bottom: 7, left: 12 },
          lineColor: [210, 210, 210],
          lineWidth: 0.4,
          textColor: C.dark,
          valign: "middle",
          overflow: "linebreak",
        },
        headStyles: {
          font: "times",
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
  if (signatures?.length > 0) {
    need(100);
    sp(8);
    doc.setDrawColor(...C.black);
    doc.setLineWidth(2);
    doc.line(ML, y, PW - MR, y);
    y += 16;
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...C.black);
    doc.text("IN WITNESS WHEREOF", ML, y);
    y += 18;
    doc.setFont("times", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(...C.dark);
    const wt = doc.splitTextToSize(
      "The parties have executed this Agreement as of the Effective Date first written above.",
      CW,
    );
    wt.forEach((l) => {
      doc.text(l, ML, y);
      y += 16;
    });
    sp(24);
    const colW = CW / Math.min(signatures.length, 2);
    const pairs = [];
    for (let i = 0; i < signatures.length; i += 2)
      pairs.push(signatures.slice(i, i + 2));
    for (const group of pairs) {
      need(120);
      const startY = y;
      for (let gi = 0; gi < group.length; gi++) {
        const sig = group[gi];
        const x = ML + gi * colW;
        let sy = startY;
        doc.setFont("times", "bold");
        doc.setFontSize(9);
        doc.setTextColor(...C.mid);
        doc.text((sig.role || `Party ${gi + 1}`).toUpperCase(), x, sy, {
          charSpace: 0.8,
        });
        sy += 16;
        if (sig.signatureImage) {
          try {
            doc.addImage(sig.signatureImage, "PNG", x, sy, colW - 20, 38);
            sy += 42;
          } catch {
            doc.setDrawColor(...C.dark);
            doc.setLineWidth(0.6);
            doc.line(x, sy + 24, x + colW - 20, sy + 24);
            sy += 32;
          }
        } else {
          doc.setDrawColor(...C.dark);
          doc.setLineWidth(0.6);
          doc.line(x, sy + 24, x + colW - 20, sy + 24);
          sy += 32;
        }
        doc.setFont("times", "italic");
        doc.setFontSize(8);
        doc.setTextColor(...C.light);
        doc.text("Authorized Signature", x, sy);
        sy += 20;
        [
          ["Printed Name", sig.name],
          ["Title / Position", sig.title],
          ["Date", sig.date],
        ].forEach(([label, val]) => {
          doc.setFont("times", "normal");
          doc.setFontSize(10.5);
          doc.setTextColor(...C.dark);
          if (val) doc.text(String(val), x, sy);
          doc.setDrawColor(...C.rule);
          doc.setLineWidth(0.4);
          doc.line(x, sy + 3, x + colW - 20, sy + 3);
          doc.setFont("times", "italic");
          doc.setFontSize(7.5);
          doc.setTextColor(...C.light);
          doc.text(label, x, sy + 12);
          sy += 24;
        });
      }
      y = startY + 130;
    }
  }
  drawPageChrome();
  const filename =
    (docTitle || "Document").replace(/[^a-zA-Z0-9 _-]/g, "").trim() + ".pdf";
  doc.save(filename);
}

// ─── Paywall ──────────────────────────────────────────────────────────────────
function DocumentGeneratorPaywall() {
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
      name: "Service Agreement — Acme Corp",
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
      name: "Employment Contract — J. Smith",
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
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      {/* Header */}
      <div
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
            <h1
              style={{
                margin: "0 0 4px",
                fontSize: 26,
                fontWeight: 800,
                color: "#0f172a",
                letterSpacing: "-0.04em",
                lineHeight: 1,
              }}
            >
              Document Generator
            </h1>
            <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>
              AI-powered · 8 document types · PDF export · Digital signatures
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
                }}
              >
                <FileText size={18} />
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
                  {val}
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
          ))}
        </div>

        {/* Main paywall card */}
        <div
          style={{
            position: "relative",
            background: "#fff",
            border: "1px solid #e2e8f0",
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
                borderBottom: "1px solid #e2e8f0",
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
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
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
                          color: "#0f172a",
                        }}
                      >
                        {d.name}
                      </div>
                      <div
                        style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}
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
                        background: "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#94a3b8",
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
                background: "linear-gradient(135deg, #eff6ff 0%, #f5f3ff 100%)",
                border: "1px solid #ddd6fe",
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
                Pro Feature
              </span>
            </div>
          </div>

          {/* Paywall content */}
          <div
            style={{
              position: "relative",
              padding: "48px 40px 44px",
              marginTop: -290,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0) 0%, #fff 8%)",
            }}
          >
            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 30,
                  fontWeight: 900,
                  color: "#0f172a",
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
                color: "#64748b",
                maxWidth: 480,
                margin: "0 auto 36px",
                lineHeight: 1.6,
              }}
            >
              From NDAs to employment contracts, lease agreements to
              partnerships — describe your document and get a complete,
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
                    background: d.bg,
                    border: `1px solid ${d.color}25`,
                    borderRadius: 12,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ color: d.color, flexShrink: 0 }}>{d.icon}</div>
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#64748b",
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
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
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
                      background: "#fff",
                      border: "1px solid #e2e8f0",
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
                        color: "#0f172a",
                        marginBottom: 3,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "#64748b",
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
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 14,
                padding: "20px 24px",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#94a3b8",
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
                          color: "#0f172a",
                          marginBottom: 2,
                        }}
                      >
                        {s.label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
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
                          color: "#d1d5db",
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
              <p style={{ margin: "12px 0 0", fontSize: 12, color: "#94a3b8" }}>
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

// ─── Signature Modal ──────────────────────────────────────────────────────────
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

// ─── Editable Block ───────────────────────────────────────────────────────────
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
            fontFamily: isHeading ? "inherit" : TNR,
            fontSize: isHeading ? 11 : 13,
            fontWeight: isHeading ? 700 : 400,
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
          ✕
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
          fontFamily: isHeading ? "inherit" : TNR,
          fontSize: isHeading ? 11 : 13,
          fontWeight: isHeading ? 700 : 400,
          textTransform: isHeading ? "uppercase" : "none",
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

// ─── Signature Card ───────────────────────────────────────────────────────────
function SignatureCard({ sig, idx, onChange, onRemove }) {
  const [sigModalOpen, setSigModalOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl p-4 bg-white relative">
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
            placeholder: "Role (Client, Vendor…)",
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
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3.5 border-b border-gray-50 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">{title}</span>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DocumentGenerator() {
  const [orgPlan, setOrgPlan] = useState(null);
  const [planLoading, setPlanLoading] = useState(true);

  const [docType, setDocType] = useState("contract");
  const [inputMode, setInputMode] = useState("text");
  const [prompt, setPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadedText, setUploadedText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");
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
  const [signatures, setSignatures] = useState([
    {
      role: "Party A",
      name: "",
      title: "",
      date: "",
      witness: false,
      signatureImage: null,
    },
    {
      role: "Party B",
      name: "",
      title: "",
      date: "",
      witness: false,
      signatureImage: null,
    },
  ]);
  const [setupOpen, setSetupOpen] = useState(false);

  // ── Fetch plan ──
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
        const { data: profile } = await supabase
          .from("profiles")
          .select("tenant_id")
          .eq("id", user.id)
          .single();
        if (profile?.tenant_id) {
          const { data: org } = await supabase
            .from("tenants")
            .select("plan")
            .eq("id", profile.tenant_id)
            .single();
          setOrgPlan(org?.plan ?? null);
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
    if (inputMode === "text" && !prompt.trim()) {
      setError("Please describe the document.");
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
          ? buildPrompt(uploadedText, prompt, docType)
          : prompt.trim();
      const result = await callGroq(userContent, docType);
      setContractData(result);
      setSections(result.sections || []);
      setParties(result.parties || []);
      setDocTitle(
        (
          result.title ||
          DOC_TYPES.find((d) => d.key === docType)?.label.toUpperCase() ||
          "DOCUMENT"
        )
          .replace(/[^a-zA-Z0-9 &,\-]/g, "")
          .slice(0, 80),
      );
      // Set default signature roles from parties
      if (result.parties?.length >= 2) {
        setSignatures(
          result.parties.map((p) => ({
            role: p.label || "Party",
            name: p.name || "",
            title: "",
            date: "",
            witness: false,
            signatureImage: null,
          })),
        );
      }
      setGenStep(2);
      setSetupOpen(true);
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
        heading: "NEW SECTION",
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
  const logoUpload = (file) => {
    const r = new FileReader();
    r.onload = (e) => setLogoDataUrl(e.target.result);
    r.readAsDataURL(file);
    return false;
  };

  const handleReset = () => {
    setStep("input");
    setSections([]);
    setContractData(null);
    setPrompt("");
    setError("");
    setGenStep(0);
    setDocTitle("");
    setCompanyName("");
    setEffectiveDate("");
    setConfidentiality(false);
    setLogoDataUrl(null);
    setUploadedFile(null);
    setUploadedText("");
    setParties([]);
    setSignatures([
      {
        role: "Party A",
        name: "",
        title: "",
        date: "",
        witness: false,
        signatureImage: null,
      },
      {
        role: "Party B",
        name: "",
        title: "",
        date: "",
        witness: false,
        signatureImage: null,
      },
    ]);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setError("");
    try {
      await downloadDocumentPDF({
        docTitle,
        effectiveDate,
        companyName,
        confidentiality,
        logoDataUrl,
        contractData: { ...contractData, sections, parties },
        signatures,
      });
    } catch (e) {
      setError("PDF error: " + e.message);
    } finally {
      setDownloading(false);
    }
  };

  const canGen = inputMode === "text" ? !!prompt.trim() : !!uploadedText;
  const inputLbl =
    "text-[10px] font-semibold uppercase tracking-widest text-gray-400 block mb-1.5";
  const selectedDocType = DOC_TYPES.find((d) => d.key === docType);

  // ── Loading ──
  if (planLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "60vh",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // ── Paywall ──
  if (orgPlan === "Free") {
    return <DocumentGeneratorPaywall />;
  }

  return (
    <div
      className="min-h-screen bg-[#f8fafc]"
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
      `}</style>

      {/* Setup Modal */}
      <Modal
        open={setupOpen}
        title={null}
        footer={null}
        closable={false}
        centered
        width={520}
        styles={{
          content: {
            borderRadius: 20,
            padding: 0,
            overflow: "hidden",
            border: "1px solid #e8e8e8",
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
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={inputLbl}>Company / Firm</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Acme Corp"
                  size="large"
                  className="rounded-xl"
                  style={{ fontSize: 14 }}
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
            <div>
              <label className={inputLbl}>Logo (optional)</label>
              {logoDataUrl ? (
                <div className="flex items-center gap-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
                  <img
                    src={logoDataUrl}
                    alt="logo"
                    className="max-h-10 max-w-36 object-contain"
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setLogoDataUrl(null)}
                    size="small"
                    className="ml-auto rounded-lg"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <Upload
                  accept="image/*"
                  showUploadList={false}
                  beforeUpload={logoUpload}
                >
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 text-center cursor-pointer transition-all bg-white">
                    <PictureOutlined className="text-2xl text-gray-300 block mb-1" />
                    <span className="text-xs text-gray-400">
                      PNG, JPG or SVG
                    </span>
                  </div>
                </Upload>
              )}
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
              Open Document Editor →
            </Button>
          </div>
        </div>
      </Modal>

      <main className="max-w-6xl mx-auto px-6 pb-20">
        {/* ── INPUT STEP ── */}
        {step === "input" && (
          <div className="pt-16 pb-8">
            <div className="text-center mb-10 fade-up">
              <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-1.5 mb-8 text-xs font-medium text-gray-500 shadow-sm">
                <ThunderboltOutlined
                  className="text-amber-500"
                  style={{ fontSize: 11 }}
                />
                Powered by Llama 3.3 · 8 document types · Legal grade output
              </div>
              <h1
                className="text-5xl font-extrabold text-gray-950 tracking-tight leading-none mb-4 fade-up fade-up-1"
                style={{ letterSpacing: "-2px" }}
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
              <div className="grid grid-cols-4 gap-2">
                {DOC_TYPES.map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setDocType(d.key)}
                    className="doc-type-btn rounded-xl p-3 text-left bg-white"
                    style={{
                      border:
                        docType === d.key
                          ? `1.5px solid ${d.color}`
                          : "1.5px solid #e2e8f0",
                      background: docType === d.key ? d.bg : "#fff",
                      boxShadow:
                        docType === d.key ? `0 0 0 3px ${d.color}15` : "none",
                    }}
                  >
                    <div style={{ color: d.color, marginBottom: 6 }}>
                      {d.icon}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: "#0f172a",
                      }}
                    >
                      {d.label}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: "#94a3b8",
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
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Selected doc type indicator */}
                <div
                  style={{
                    background: selectedDocType?.bg,
                    borderBottom: `1px solid ${selectedDocType?.color}20`,
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
                    — {selectedDocType?.desc}
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
                        placeholder={`Describe your ${selectedDocType?.label.toLowerCase()}… e.g. ${
                          docType === "nda"
                            ? "mutual NDA between two software companies, 2-year term, covers source code and client data…"
                            : docType === "employment"
                              ? "full-time frontend engineer, $85k salary, 3-month probation, remote work, London governing law…"
                              : docType === "lease"
                                ? "office space lease, 12 months, $3,500/month, tenant responsible for utilities…"
                                : "web development contract, 60 days, $5,500 in 3 milestones, React/Node.js, full IP transfer…"
                        }`}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.7,
                          borderColor: "#e8e8e8",
                          borderRadius: 12,
                          resize: "none",
                          color: "#111",
                          padding: "14px 16px",
                        }}
                        onKeyDown={(e) => {
                          if ((e.ctrlKey || e.metaKey) && e.key === "Enter")
                            handleGenerate();
                        }}
                      />
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-gray-300">
                          {prompt.length} characters
                        </span>
                        <span className="text-xs text-gray-300">
                          ⌘ Enter to generate
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
                            borderColor: "#e0e0e0",
                            borderRadius: 14,
                            background: "#fafafa",
                          }}
                        >
                          <div className="py-6">
                            <InboxOutlined className="text-4xl text-gray-300 block mb-3" />
                            <p className="text-sm font-semibold text-gray-500 mb-1">
                              Drop your document here
                            </p>
                            <p className="text-xs text-gray-300">
                              PDF, DOCX, TXT — proposals, briefs, SOWs
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
                                  ? "Extracting text…"
                                  : `${uploadedText.length.toLocaleString()} characters extracted`}
                              </div>
                            </div>
                            {extracting && <Spin size="small" />}
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
                              {uploadedText.slice(0, 280)}…
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
                          placeholder="e.g. Add 6-month warranty, use UK governing law…"
                          style={{
                            fontSize: 13.5,
                            borderColor: "#e8e8e8",
                            borderRadius: 12,
                            resize: "none",
                            color: "#111",
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
                      ? `Drafting your ${selectedDocType?.label}…`
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
                              <Spin size="small" />
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

              <div className="flex items-center justify-center gap-6 mt-6">
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

        {/* ── EDITOR STEP ── */}
        {step === "editor" && (
          <div className="pt-6">
            <div
              className="grid gap-6"
              style={{ gridTemplateColumns: "1fr 296px" }}
            >
              {/* Left: Document */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleReset}
                        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 border-0 bg-transparent cursor-pointer transition-colors"
                      >
                        ← New Document
                      </button>
                      <span style={{ fontSize: 10, color: "#94a3b8" }}>·</span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: selectedDocType?.color,
                          background: selectedDocType?.bg,
                          padding: "2px 8px",
                          borderRadius: 5,
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
                      · {sections.length} sections
                    </p>
                  </div>
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
                    {downloading ? "Generating…" : "Download PDF"}
                  </Button>
                </div>

                <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 mb-4">
                  <EditOutlined
                    className="text-amber-500 flex-shrink-0"
                    style={{ fontSize: 12 }}
                  />
                  <span className="text-xs text-amber-700 font-medium">
                    Click any text, heading, or table cell to edit inline
                  </span>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
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
                    style={{ maxHeight: "72vh", overflowY: "auto" }}
                  >
                    <div
                      className="bg-white mx-auto shadow-lg relative"
                      style={{
                        maxWidth: 640,
                        padding: "52px 56px 60px",
                        minHeight: 900,
                      }}
                    >
                      <div className="absolute inset-3 border border-gray-100 pointer-events-none rounded" />
                      {logoDataUrl && (
                        <div className="text-center mb-3">
                          <img
                            src={logoDataUrl}
                            alt="logo"
                            className="max-h-12 max-w-40 object-contain mx-auto"
                          />
                        </div>
                      )}
                      {companyName && (
                        <div
                          className="text-center mb-1"
                          style={{
                            fontFamily: TNR,
                            fontWeight: 700,
                            fontSize: 10,
                            letterSpacing: "0.12em",
                            textTransform: "uppercase",
                            color: "#555",
                          }}
                        >
                          {companyName}
                        </div>
                      )}
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

                      <div
                        style={{
                          borderTop: "2.5px solid #111",
                          marginTop: 8,
                          paddingTop: 14,
                          paddingBottom: 12,
                          textAlign: "center",
                          borderBottom: "0.75px solid #ddd",
                          marginBottom: 22,
                        }}
                      >
                        <div
                          contentEditable
                          suppressContentEditableWarning
                          onBlur={(e) =>
                            setDocTitle(e.currentTarget.textContent.trim())
                          }
                          style={{
                            fontFamily: TNR,
                            fontSize: 17,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: "#000",
                            outline: "none",
                            cursor: "text",
                            display: "inline-block",
                          }}
                        >
                          {docTitle || "LEGAL DOCUMENT"}
                        </div>
                        {effectiveDate && (
                          <div
                            style={{
                              fontFamily: TNR,
                              fontStyle: "italic",
                              fontSize: 10,
                              color: "#999",
                              marginTop: 5,
                            }}
                          >
                            Effective Date:{" "}
                            {new Date(
                              effectiveDate + "T00:00:00",
                            ).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                        )}
                      </div>

                      {parties.length > 0 && (
                        <div className="relative mb-6 px-4 py-3 bg-gray-50 border border-gray-100 rounded">
                          <div
                            className="absolute top-2 right-2 text-gray-300 flex items-center gap-1"
                            style={{ fontSize: 9, letterSpacing: "0.05em" }}
                          >
                            <EditOutlined style={{ fontSize: 8 }} /> editable
                          </div>
                          {parties.map((p, pi) => (
                            <div
                              key={pi}
                              className={
                                pi < parties.length - 1
                                  ? "mb-3 pb-3 border-b border-gray-100"
                                  : ""
                              }
                            >
                              <div
                                style={{
                                  fontFamily: TNR,
                                  fontWeight: 700,
                                  fontSize: 9,
                                  textTransform: "uppercase",
                                  letterSpacing: "0.1em",
                                  color: "#888",
                                  marginBottom: 6,
                                }}
                              >
                                {p.label}
                              </div>
                              <div
                                className="grid gap-1"
                                style={{ gridTemplateColumns: "1fr 1fr 1fr" }}
                              >
                                {[
                                  ["name", "Full Name"],
                                  ["address", "Address"],
                                  ["email", "Email"],
                                ].map(([key, ph]) => (
                                  <input
                                    key={key}
                                    value={p[key] || ""}
                                    onChange={(e) =>
                                      updateParty(pi, key, e.target.value)
                                    }
                                    placeholder={ph}
                                    className="border-0 border-b border-transparent hover:border-gray-200 focus:border-gray-400 outline-none bg-transparent transition-all"
                                    style={{
                                      fontFamily: TNR,
                                      fontSize: 11,
                                      color: "#333",
                                      padding: "2px 4px",
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {sections.map((section, si) => (
                        <div key={si} className="mb-5">
                          <EditableBlock
                            value={section.heading}
                            isHeading
                            onEdit={(v) => updateHeading(si, v)}
                            onDelete={() => deleteSection(si)}
                            onAddAfter={() => addSection(si)}
                          />
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

                      {signatures.length > 0 && (
                        <div
                          className="mt-10 pt-4"
                          style={{ borderTop: "2px solid #111" }}
                        >
                          <div
                            style={{
                              fontFamily: TNR,
                              fontWeight: 700,
                              fontSize: 11,
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                              marginBottom: 6,
                            }}
                          >
                            IN WITNESS WHEREOF
                          </div>
                          <p
                            style={{
                              fontFamily: TNR,
                              fontSize: 12,
                              color: "#555",
                              marginBottom: 20,
                              lineHeight: 1.7,
                            }}
                          >
                            The parties have executed this Agreement as of the
                            Effective Date first written above.
                          </p>
                          <div
                            className="grid gap-6"
                            style={{
                              gridTemplateColumns: `repeat(${Math.min(signatures.length, 2)}, 1fr)`,
                            }}
                          >
                            {signatures.map((sig, i) => (
                              <div key={i}>
                                <div
                                  style={{
                                    fontFamily: TNR,
                                    fontWeight: 700,
                                    fontSize: 9.5,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.08em",
                                    color: "#555",
                                    marginBottom: 8,
                                  }}
                                >
                                  {sig.role || `Party ${i + 1}`}
                                </div>
                                {sig.signatureImage ? (
                                  <div
                                    style={{
                                      marginBottom: 4,
                                      height: 40,
                                      display: "flex",
                                      alignItems: "flex-end",
                                    }}
                                  >
                                    <img
                                      src={sig.signatureImage}
                                      alt="sig"
                                      style={{
                                        maxHeight: 40,
                                        maxWidth: "90%",
                                        objectFit: "contain",
                                      }}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    style={{
                                      borderBottom: "1px solid #555",
                                      height: 36,
                                      marginBottom: 4,
                                    }}
                                  />
                                )}
                                <div
                                  style={{
                                    fontSize: 8,
                                    color: "#bbb",
                                    fontFamily: TNR,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    marginBottom: 12,
                                  }}
                                >
                                  Authorized Signature
                                </div>
                                {[
                                  ["name", "Printed Name"],
                                  ["title", "Title / Position"],
                                  ["date", "Date"],
                                ].map(([k, label]) => (
                                  <div key={k} className="mb-2">
                                    <div
                                      style={{
                                        fontFamily: TNR,
                                        fontSize: 12,
                                        borderBottom: "0.5px solid #d0d0d0",
                                        paddingBottom: 2,
                                        marginBottom: 2,
                                        minHeight: 18,
                                        color: "#222",
                                      }}
                                    >
                                      {sig[k] || ""}
                                    </div>
                                    <div
                                      style={{
                                        fontSize: 7.5,
                                        color: "#bbb",
                                        fontFamily: TNR,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.09em",
                                      }}
                                    >
                                      {label}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Controls */}
              <div className="flex flex-col gap-4 sticky top-20">
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
                      <label className={inputLbl}>Company / Firm</label>
                      <Input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Acme Corp"
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

                <SidePanel title="Logo">
                  {logoDataUrl ? (
                    <div>
                      <div className="flex items-center justify-center p-3 bg-gray-50 rounded-xl mb-2 border border-gray-100">
                        <img
                          src={logoDataUrl}
                          alt="logo"
                          className="max-h-10 max-w-32 object-contain"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Upload
                          accept="image/*"
                          showUploadList={false}
                          beforeUpload={logoUpload}
                          className="flex-1"
                        >
                          <Button
                            icon={<UploadOutlined />}
                            size="small"
                            className="w-full rounded-xl text-xs"
                          >
                            Replace
                          </Button>
                        </Upload>
                        <Button
                          danger
                          icon={<DeleteOutlined />}
                          size="small"
                          onClick={() => setLogoDataUrl(null)}
                          className="rounded-xl text-xs"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Upload
                      accept="image/*"
                      showUploadList={false}
                      beforeUpload={logoUpload}
                    >
                      <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer transition-all">
                        <PictureOutlined className="text-xl text-gray-300 block mb-1" />
                        <span className="text-xs text-gray-400">
                          Upload logo
                        </span>
                      </div>
                    </Upload>
                  )}
                </SidePanel>

                <SidePanel
                  title="Signatures"
                  action={
                    <button
                      onClick={addSig}
                      className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center border-0 cursor-pointer transition-colors"
                    >
                      <PlusOutlined style={{ fontSize: 11, color: "#555" }} />
                    </button>
                  }
                >
                  <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto">
                    {signatures.map((sig, idx) => (
                      <SignatureCard
                        key={idx}
                        sig={sig}
                        idx={idx}
                        onChange={updateSig}
                        onRemove={removeSig}
                      />
                    ))}
                    {signatures.length === 0 && (
                      <div className="text-center py-4">
                        <span className="text-xs text-gray-300">
                          No signatories.{" "}
                        </span>
                        <button
                          onClick={addSig}
                          className="text-xs text-gray-700 underline border-0 bg-transparent cursor-pointer"
                        >
                          Add one
                        </button>
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
                  {downloading ? "Generating PDF…" : "Download PDF"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
