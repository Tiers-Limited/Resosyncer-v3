const GROQ_API_KEY =
  import.meta.env.VITE_GROQ_API_KEY || import.meta.env.VITE_GROK_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PUBLIC_DOMAIN =
  import.meta.env.VITE_PUBLIC_DOMAIN || window.location.origin;

const MAX_RESUME_CHARS = 14000;

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensurePdfJs() {
  if (window.pdfjsLib) return;
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  );
  window.pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

async function ensureMammoth() {
  if (window.mammoth) return;
  await loadScript(
    "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
  );
}

function readAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ""));
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target?.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function cleanJson(raw) {
  return String(raw || "")
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
}

function coerceToSingleObject(parsed) {
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    return parsed;
  }

  if (Array.isArray(parsed)) {
    const firstObject = parsed.find(
      (item) => item && typeof item === "object" && !Array.isArray(item),
    );
    if (firstObject) return firstObject;
  }

  throw new Error("AI returned JSON, but not as a single object.");
}

function parseJsonResponse(raw) {
  const cleaned = cleanJson(raw);
  try {
    return coerceToSingleObject(JSON.parse(cleaned));
  } catch {
    const objectMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objectMatch) return coerceToSingleObject(JSON.parse(objectMatch[0]));

    const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
    if (arrayMatch) return coerceToSingleObject(JSON.parse(arrayMatch[0]));

    throw new Error("AI returned invalid JSON.");
  }
}

async function callGroqJson(systemPrompt, userContent) {
  if (!GROQ_API_KEY) {
    throw new Error("VITE_GROQ_API_KEY not set in environment");
  }

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

  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    const apiMessage = payload?.error?.message || "Groq API error";
    if (/Cannot coerce the result to a single JSON object/i.test(apiMessage)) {
      throw new Error(
        "The AI provider returned JSON in an unexpected shape. Please try again.",
      );
    }
    throw new Error(apiMessage);
  }

  return parseJsonResponse(payload?.choices?.[0]?.message?.content || "");
}

export async function extractTextFromUploadedFile(file) {
  if (!file) return "";

  const fileName = file.name.toLowerCase();

  if (fileName.endsWith(".txt") || fileName.endsWith(".md")) {
    return readAsText(file);
  }

  if (fileName.endsWith(".pdf")) {
    try {
      await ensurePdfJs();
      const buffer = await readAsArrayBuffer(file);
      const pdf = await window.pdfjsLib.getDocument({ data: buffer }).promise;
      let text = "";

      for (let index = 1; index <= Math.min(pdf.numPages, 20); index += 1) {
        const page = await pdf.getPage(index);
        const content = await page.getTextContent();
        text += `${content.items.map((item) => item.str).join(" ")}\n`;
      }

      return text.trim();
    } catch {
      return "";
    }
  }

  if (fileName.endsWith(".docx")) {
    try {
      await ensureMammoth();
      const buffer = await readAsArrayBuffer(file);
      const result = await window.mammoth.extractRawText({ arrayBuffer: buffer });
      return result.value || "";
    } catch {
      return "";
    }
  }

  return "";
}

export async function analyzeResumeAgainstJob({ job, answers, resumeText }) {
  const systemPrompt = `You are an expert ATS and talent screening assistant. Return ONLY raw JSON.

Required JSON shape:
{
  "confidenceScore": 0.0,
  "atsScore": 0,
  "recommendation": "shortlist" | "review" | "reject",
  "summary": "Short paragraph",
  "matchedSkills": ["skill"],
  "missingSkills": ["skill"],
  "strengths": ["point"],
  "concerns": ["point"],
  "screeningQuestions": ["question"],
  "reasoning": "Short explanation"
}

Rules:
- confidenceScore must be between 0 and 1
- atsScore must be between 0 and 100
- matchedSkills and missingSkills should be concise
- screeningQuestions should contain 3 to 5 targeted interview questions
- Be strict but fair
- Prefer recommendation "shortlist" only when confidenceScore > 0.7`;

  const safeAnswers = Object.entries(answers || {})
    .filter(([key]) => !key.startsWith("__"))
    .slice(0, 25);

  const userContent = JSON.stringify(
    {
      jobTitle: job?.title || "",
      department: job?.department || "",
      deadline: job?.deadline || null,
      desiredSkills: Array.isArray(job?.aiDesiredSkills)
        ? job.aiDesiredSkills.slice(0, 20)
        : [],
      customInterviewQuestions: Array.isArray(job?.aiCustomQuestions)
        ? job.aiCustomQuestions.slice(0, 20)
        : [],
      applicationAnswers: Object.fromEntries(safeAnswers),
      formFields: (job?.fields || []).map((field) => ({
        label: field.label,
        type: field.type,
        required: !!field.required,
      })),
      resumeText: (resumeText || "").slice(0, MAX_RESUME_CHARS),
    },
    null,
    2,
  );

  const result = await callGroqJson(systemPrompt, userContent);
  const confidenceScore = Math.max(
    0,
    Math.min(1, Number(result.confidenceScore) || 0),
  );
  const atsScore = Math.max(0, Math.min(100, Number(result.atsScore) || 0));
  const recommendation =
    confidenceScore > 0.7 ? "shortlist" : result.recommendation || "review";

  return {
    confidenceScore,
    atsScore,
    recommendation,
    summary: result.summary || "",
    matchedSkills: Array.isArray(result.matchedSkills)
      ? result.matchedSkills.slice(0, 8)
      : [],
    missingSkills: Array.isArray(result.missingSkills)
      ? result.missingSkills.slice(0, 8)
      : [],
    strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
    concerns: Array.isArray(result.concerns) ? result.concerns.slice(0, 5) : [],
    screeningQuestions: Array.isArray(result.screeningQuestions)
      ? result.screeningQuestions.slice(0, 5)
      : [],
    reasoning: result.reasoning || "",
  };
}

export function createAiInterviewLink(accessToken) {
  return `${PUBLIC_DOMAIN}/ai-interview/${accessToken}`;
}

export function createApplicationTrackingLink(accessToken) {
  return `${PUBLIC_DOMAIN}/track/${accessToken}`;
}

export function buildScreeningNote(screening) {
  if (!screening) return "";

  return [
    "AI Screening Summary",
    `Confidence: ${Math.round((screening.confidenceScore || 0) * 100)}%`,
    `ATS Score: ${screening.atsScore ?? 0}/100`,
    `Recommendation: ${screening.recommendation || "review"}`,
    screening.summary ? `Summary: ${screening.summary}` : null,
    screening.matchedSkills?.length
      ? `Matched skills: ${screening.matchedSkills.join(", ")}`
      : null,
    screening.missingSkills?.length
      ? `Missing skills: ${screening.missingSkills.join(", ")}`
      : null,
    screening.concerns?.length
      ? `Concerns: ${screening.concerns.join(", ")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export async function generateInterviewTurn({
  job,
  candidate,
  screening,
  desiredSkills,
  customQuestions,
  transcript,
  lastAnswer,
  requiredSection,
  coveredSections,
}) {
  const systemPrompt = `You are a professional AI interviewer. Return ONLY raw JSON.

Required JSON shape:
{
  "shouldEnd": false,
  "section": "Section name",
  "nextQuestion": "Question text",
  "focusAreas": ["topic"],
  "evaluationNote": "Short internal note",
  "provisionalScore": 0
}

Rules:
- Ask one concise voice-friendly question at a time
- The interview must progress through these sections: Introduction Questions, Background / Experience Questions, Technical / Skill-Based Questions, Problem-Solving Questions, Behavioral Questions, Situational Questions, Role-Specific / Case Study Questions
- Ask the next question from the requiredSection provided in context
- section must exactly match the requiredSection unless you are intentionally doing a sharper follow-up within that same section
- Use the resume screening context, candidate application details, and prior answers to personalize every question
- Do not use a fixed interview script and do not ask the same generic questions for every candidate
- Ask questions that are specifically relevant to this person's background, claimed experience, strengths, missing skills, concerns, and the target role
- Use recruiter desiredSkills and customQuestions from context as hard guidance
- Prioritize asking recruiter customQuestions in the first turns, one at a time, if they have not already been covered
- Ensure technical depth around desiredSkills, including practical examples, tradeoffs, and debugging/decision-making
- Gradually deepen based on the last answer and avoid repeating the same question style or topic unless you are intentionally probing deeper
- Use screeningQuestions from context when they are relevant, but adapt them naturally instead of reading them verbatim
- If the candidate answer is weak, vague, suspiciously generic, or incomplete, ask a sharper follow-up
- If the candidate gives strong, specific evidence early, you may end sooner
- If the candidate gives vague or incomplete answers, continue with more targeted follow-ups
- End only after enough evidence is collected; do not force a fixed number of questions
- provisionalScore is 0 to 100`;

  const applicationAnswers = Object.fromEntries(
    Object.entries(candidate?.answers || {})
      .filter(([key, value]) => !key.startsWith("__") && value != null && value !== "")
      .slice(0, 20),
  );

  const userContent = JSON.stringify(
    {
      jobTitle: job?.title || "",
      department: job?.department || "",
      candidateName: candidate?.name || "",
      desiredSkills: Array.isArray(desiredSkills)
        ? desiredSkills.slice(0, 20)
        : Array.isArray(job?.aiDesiredSkills)
          ? job.aiDesiredSkills.slice(0, 20)
          : [],
      customQuestions: Array.isArray(customQuestions)
        ? customQuestions.slice(0, 20)
        : Array.isArray(job?.aiCustomQuestions)
          ? job.aiCustomQuestions.slice(0, 20)
          : [],
      candidateApplication: applicationAnswers,
      screening,
      requiredSection: requiredSection || "Background / Experience Questions",
      coveredSections: Array.isArray(coveredSections) ? coveredSections : [],
      transcript: transcript.slice(-8),
      lastAnswer: lastAnswer || null,
    },
    null,
    2,
  );

  const result = await callGroqJson(systemPrompt, userContent);

  return {
    shouldEnd: !!result.shouldEnd,
    section: result.section || requiredSection || "Background / Experience Questions",
    nextQuestion: result.nextQuestion || "Tell me about the most relevant work you have done for this role.",
    focusAreas: Array.isArray(result.focusAreas) ? result.focusAreas.slice(0, 4) : [],
    evaluationNote: result.evaluationNote || "",
    provisionalScore: Math.max(
      0,
      Math.min(100, Number(result.provisionalScore) || 0),
    ),
  };
}

export async function evaluateInterview({
  job,
  candidate,
  screening,
  transcript,
  suspiciousEvents,
}) {
  const candidateAnswers = (transcript || []).filter(
    (entry) => entry.role === "user" && entry.content?.trim(),
  );
  const totalAnswerWords = candidateAnswers.reduce(
    (sum, entry) => sum + entry.content.trim().split(/\s+/).filter(Boolean).length,
    0,
  );

  if (candidateAnswers.length === 0 || totalAnswerWords < 12) {
    return {
      overallScore: 0,
      recommendation: "reject",
      summary:
        "The interview did not contain enough candidate responses to evaluate fit for the role.",
      strengths: [],
      concerns: [
        "Insufficient interview evidence",
        "Candidate did not meaningfully answer the interview questions",
      ],
      cheatingRisk: suspiciousEvents?.length ? "medium" : "low",
      nextStep: "Reschedule only if there was a technical issue; otherwise do not advance.",
    };
  }

  const systemPrompt = `You are a hiring evaluator. Return ONLY raw JSON.

Required JSON shape:
{
  "overallScore": 0,
  "recommendation": "advance" | "hold" | "reject",
  "summary": "Short summary",
  "strengths": ["point"],
  "concerns": ["point"],
  "cheatingRisk": "low" | "medium" | "high",
  "nextStep": "Short recommendation"
}

Rules:
- overallScore is 0 to 100
- give a very low score when answers are missing, extremely short, evasive, or unsupported
- consider suspiciousEvents as risk signals, not proof
- be balanced and evidence-based`;

  const userContent = JSON.stringify(
    {
      jobTitle: job?.title || "",
      department: job?.department || "",
      candidateName: candidate?.name || "",
      screening,
      suspiciousEvents,
      transcript,
    },
    null,
    2,
  );

  const result = await callGroqJson(systemPrompt, userContent);

  return {
    overallScore: Math.max(0, Math.min(100, Number(result.overallScore) || 0)),
    recommendation: result.recommendation || "hold",
    summary: result.summary || "",
    strengths: Array.isArray(result.strengths) ? result.strengths.slice(0, 5) : [],
    concerns: Array.isArray(result.concerns) ? result.concerns.slice(0, 5) : [],
    cheatingRisk: result.cheatingRisk || "medium",
    nextStep: result.nextStep || "",
  };
}
