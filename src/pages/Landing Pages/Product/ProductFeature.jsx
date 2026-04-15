import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Gauge,
  HelpCircle,
  Layers3,
  Sparkles,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { getProductBySlug } from "../../../components/Landing/productCatalog";

const sectionHeroBackground = {
  Operations: "linear-gradient(172deg,#f8fbff 0%,#ebf3ff 54%,#d8e8ff 100%)",
  Workflows: "linear-gradient(172deg,#f7fbff 0%,#e7f0ff 54%,#d4e4ff 100%)",
  Growth: "linear-gradient(172deg,#f5faff 0%,#e6efff 54%,#d1e1ff 100%)",
  Platform: "linear-gradient(172deg,#f7faff 0%,#eaf0fb 54%,#dbe5f6 100%)",
};

const heroBackgroundBySlug = {
  "activity-monitor":
    "linear-gradient(172deg,#fff7f8 0%,#ffe8ee 56%,#ffd8e5 100%)",
  attendance: "linear-gradient(172deg,#f6fffb 0%,#dcfff2 56%,#c6fbe8 100%)",
  payroll: "linear-gradient(172deg,#fff9f1 0%,#ffefda 56%,#ffe2be 100%)",
  "project-management":
    "linear-gradient(172deg,#f5f8ff 0%,#dfe8ff 56%,#c8d8ff 100%)",
  meetings: "linear-gradient(172deg,#f8f6ff 0%,#e7e0ff 56%,#d5c9ff 100%)",
  communication: "linear-gradient(172deg,#f4fcff 0%,#daf5ff 56%,#c0ebff 100%)",
  recruitment: "linear-gradient(172deg,#fff8f2 0%,#ffe9d9 56%,#ffd9bc 100%)",
  "contract-builder":
    "linear-gradient(172deg,#f7f7ff 0%,#e4e5ff 56%,#d0d3ff 100%)",
  requests: "linear-gradient(172deg,#f9fff5 0%,#e7ffd8 56%,#d4f8be 100%)",
  documents: "linear-gradient(172deg,#fff6fb 0%,#ffe1f2 56%,#ffd0ea 100%)",
  "leads-crm": "linear-gradient(172deg,#f5fff9 0%,#e1fff1 56%,#caf9e4 100%)",
  payments: "linear-gradient(172deg,#f5fffa 0%,#dffff0 56%,#c7f8e2 100%)",
  subscriptions: "linear-gradient(172deg,#fff7f5 0%,#ffe5df 56%,#ffd4ca 100%)",
  teams: "linear-gradient(172deg,#f6fffd 0%,#ddfdf7 56%,#c4f4ea 100%)",
  standups: "linear-gradient(172deg,#fffef5 0%,#fff6d9 56%,#ffeebf 100%)",
  support: "linear-gradient(172deg,#f7fbff 0%,#e2f0ff 56%,#cde4ff 100%)",
};

const heroImageBySlug = {
  "activity-monitor": "/product/ActivityMonitor.png",
  attendance: "/product/Attendance.png",
  payroll: "/product/Payroll.png",
  "project-management": "/product/ProjectManagement.png",
  communication: "/product/Communication.png",
  meetings: "/product/Meetings.png",
  recruitment: "/product/Recruitment.png",
  "contract-builder": "/product/ContractBuilder.png",
  requests: "/product/Requests.png",
  documents: "/product/Documents.png",
  "leads-crm": "/product/LeadsCRM.png",
  teams: "/product/Teams.png",
  standups: "/product/Standups.png",
};

const secondaryImageBySlug = {
  "activity-monitor": "/product/appusage.png",
  attendance: "/product/Attendance.png",
  "project-management": "/product/ProjectManagement.png",
  meetings: "/product/Meetings.png",
  communication: "/product/Communication.png",
  recruitment: "/product/Opening.png",
  "contract-builder": "/product/ContractBuilder.png",
  requests: "/product/Requests.png",
  documents: "/product/Documents1.png",
  "leads-crm": "/product/Leads.png",
  teams: "/product/Teams.png",
  standups: "/product/Standups.png",
};

const getDynamicHeroBackground = (slug) => {
  if (!slug) return sectionHeroBackground.Workflows;
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = slug.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  const c1 = `hsl(${hue} 85% 97%)`;
  const c2 = `hsl(${(hue + 28) % 360} 82% 92%)`;
  const c3 = `hsl(${(hue + 52) % 360} 78% 86%)`;
  return `linear-gradient(172deg,${c1} 0%,${c2} 56%,${c3} 100%)`;
};

const contentBySlug = {
  "activity-monitor": {
    kicker: "Operational visibility",
    title: "Spot Work Patterns Early and Improve Team Focus",
    heroBody:
      "Understand productive windows, distraction patterns, and execution consistency across teams before delays affect delivery.",
    secondaryTitle: "Optimize App Activity for Better Workload Balance",
    secondaryBody:
      "Balance workload with clear app-usage signals. Identify overbooked members, idle time, and opportunities to reassign work earlier.",
    secondaryNote:
      "Teams use app activity insights to review focus time, reduce tool-switching friction, and resolve bottlenecks before escalation.",
    autoViews: [
      {
        title: "Time Tracking",
        desc: "Monitor logged work hours across teams.",
      },
      {
        title: "App Usage Breakdown",
        desc: "See where productive app time is spent.",
      },
      {
        title: "Manual Time Requests",
        desc: "Review and approve manual time submissions.",
      },
      {
        title: "Active vs Idle time",
        desc: "Compare focus windows against idle patterns.",
      },
    ],
    previewImages: [
      "/product/TimeTracking.png",
      "/product/AppsBreakage.png",
      "/product/ManualTime.png",
      "/product/ActivevsIdle.png",
    ],
    faqs: [
      {
        q: "What does Time Tracking cover in Activity Monitor?",
        a: "Time Tracking captures logged work hours, shift-level time distribution, and day-by-day time trends so managers can validate effort against delivery plans.",
      },
      {
        q: "How does App Usage Breakdown help operations teams?",
        a: "It shows where productive app time is spent, helping teams reduce tool-switching overhead and identify apps that support focus versus distraction.",
      },
      {
        q: "Can we handle Manual Time Requests in this module?",
        a: "Yes. Manual Time Requests are reviewed and approved in a structured flow, so corrections are auditable and payroll-impacting changes stay controlled.",
      },
      {
        q: "How is Active vs Idle Time used for workload decisions?",
        a: "Active vs Idle Time highlights capacity imbalance and low-focus windows, so managers can reassign tasks earlier and prevent overbooking or idle waste.",
      },
    ],
  },
  attendance: {
    kicker: "Attendance intelligence",
    title: "Run Attendance with Real-Time Clarity",
    heroBody:
      "Monitor check-ins, absences, and exceptions in one place. Resolve attendance issues quickly without chasing manual records.",
    secondaryTitle: "Automate Attendance and Control Workspace Policies",
    secondaryBody:
      "Use Automatic Attendance, Workspace Custom Settings, Late Tracker, and Overtime Tracker to keep daily attendance accurate and policy-compliant.",
    secondaryNote:
      "Attendance teams use these controls to reduce manual corrections, catch lateness patterns earlier, and keep records payroll-ready.",
    autoViews: [
      {
        title: "Automatic Attendance",
        desc: "Capture attendance logs automatically across workspace users.",
      },
      {
        title: "Workspace Custom Settings",
        desc: "Configure attendance rules, shifts, and policy controls by workspace.",
      },
      {
        title: "Late Tracker",
        desc: "Monitor recurring late check-ins and identify attendance risk patterns.",
      },
      {
        title: "Overtime Tracker",
        desc: "Track overtime hours clearly for approvals and payroll alignment.",
      },
    ],
    previewImages: [
      "/product/Attendance.png",
      "/product/WorkspaceSettings.png",
      "/product/LateTracker.png",
      "/product/OvertimeTracker.png",
    ],
    faqs: [
      {
        q: "How does Automatic Attendance help daily operations?",
        a: "It captures attendance logs consistently with less manual effort, so managers get a reliable real-time attendance view across teams.",
      },
      {
        q: "What can we configure in Workspace Custom Settings?",
        a: "You can set attendance rules such as shift timings, grace windows, and workspace-specific policy controls to match your operations.",
      },
      {
        q: "How do Late Tracker and Overtime Tracker support team management?",
        a: "Late Tracker surfaces repeated lateness trends, while Overtime Tracker highlights extra hours for approvals, planning, and payroll alignment.",
      },
      {
        q: "Can this improve payroll accuracy?",
        a: "Yes. With structured attendance and overtime records, teams reduce reconciliation errors and keep payroll inputs more accurate.",
      },
    ],
  },
  payroll: {
    kicker: "Payroll readiness",
    title: "Convert Time Data into Payroll Confidence",
    heroBody:
      "Connect attendance and compensation context to reduce payroll errors, improve transparency, and speed up monthly closure.",
    autoViews: [
      { title: "Payroll board", desc: "Track payroll cycle progress by team." },
      { title: "Adjustment list", desc: "Review pending exceptions quickly." },
      { title: "Comp table", desc: "Validate salary and attendance sync." },
      { title: "Monthly run", desc: "Visualize payroll completion stages." },
      { title: "Approval queue", desc: "Keep sign-offs structured and fast." },
      {
        title: "Audit timeline",
        desc: "Retain clean payment history records.",
      },
    ],
  },
  "project-management": {
    kicker: "Delivery workflows",
    title: "Drive Daily Execution with Better Project Visibility",
    heroBody:
      "Map priorities, assign owners, and balance workload with clear execution views so projects move forward without confusion.",
    secondaryTitle: "Give Managers and Leadership Clear Delivery Signals",
    secondaryBody:
      "Switch between Project Management, Board View, and Timeline View to manage execution from strategy to daily delivery. Use AI Employee Matching and AI Sprints to assign people better and plan sprints faster.",
    secondaryNote:
      "Project teams use Sprints and Progress Link to keep internal execution organized and share real-time delivery visibility with clients.",
    autoViews: [
      { title: "Table View", desc: "Get a complete overview of tasks, owners, and delivery status." },
      { title: "Board View", desc: "Track work stages visually with kanban-style flow." },
      { title: "Timeline View", desc: "Plan schedules and dependencies across project phases." },
      { title: "AI Employee Matching", desc: "Match tasks with the best-fit team members using AI." },
      { title: "Sprints", desc: "Manage sprint goals, tickets, and team workload in one place." },
      { title: "AI Sprints", desc: "Generate smarter sprint plans and task breakdowns with AI." },
      { title: "Progress Link", desc: "Share secure live project progress updates with clients." },
    ],
    previewImages: [
      "/product/ProjectManagement.png",
      "/product/BoardView.png",
      "/product/TimelineView.png",
      "/product/AIEmployeeMatching.png",
      "/product/Sprints.png",
      "/product/AISprints.png",
      "/product/ProgressLink.png",
    ],
    useCases: [
      {
        title: "Project Execution Control",
        body: "Run project management with less manual follow-up and clearer accountability across teams.",
      },
      {
        title: "Blocker & Load Visibility",
        body: "See who is overloaded, where tasks are blocked, and what needs intervention before delays grow.",
      },
      {
        title: "Decision-Ready Insights",
        body: "Turn operational signals into decisions with clean trends, measurable progress, and clearer ownership.",
      },
    ],
    faqs: [
      {
        q: "How do Project Management, Board View, and Timeline View work together?",
        a: "They are connected views of the same workflow. Plan at a high level, manage stage-by-stage in board format, and track schedules and dependencies on timeline.",
      },
      {
        q: "What does AI Employee Matching do?",
        a: "It recommends suitable team members for tasks based on role fit and workload context, helping managers assign work faster and more accurately.",
      },
      {
        q: "How are Sprints and AI Sprints different?",
        a: "Sprints help you run and track sprint cycles manually, while AI Sprints assists with generating sprint structures, task breakdowns, and planning suggestions.",
      },
      {
        q: "Can clients track progress without full workspace access?",
        a: "Yes. Progress Link provides a controlled way to share live project progress updates with clients.",
      },
    ],
  },
  meetings: {
    kicker: "Meeting intelligence",
    title: "Run Meetings That Create Real Follow-Through",
    heroBody:
      "Plan, collaborate, and document meetings in one flow so decisions are clear and next actions never get lost.",
    secondaryTitle: "Host Better Meetings with Structure and AI Support",
    secondaryBody:
      "Use Calendar View, Screen Sharing, Meeting Recording, and in-meeting chat to keep discussions productive. Capture agenda context, personalize camera background, and close every meeting with AI Summarizer.",
    secondaryNote:
      "Teams use this workflow to reduce meeting chaos, improve collaboration quality, and keep decisions visible after calls end.",
    autoViews: [
      { title: "Calander View", desc: "Schedule and track meeting timelines from one organized calendar." },
      { title: "Screen Sharing", desc: "Present documents and updates live during meetings." },
      { title: "Meeting Recording", desc: "Record sessions for accountability and later review." },
      { title: "Chat during meeting", desc: "Keep side discussions and quick notes inside the meeting flow." },
      { title: "Meeting Agenda", desc: "Set structure before meetings so conversations stay focused." },
      { title: "Change Camera Background", desc: "Adjust visual background for a cleaner and more professional call presence." },
      { title: "AI Summarizer", desc: "Generate instant summaries with key points and action items." },
    ],
    previewImages: [
      "/product/Meetings.png",
      "/product/ScreenSharing.png",
      "/product/MeetingRecording.png",
      "/product/MeetingChat.png",
      "/product/MeetingAgenda.png",
      "/product/Background.png",
      "/product/MI.png",
    ],
    useCases: [
      {
        title: "Structured Meeting Flow",
        body: "Use agenda-first meetings with calendar visibility so every session starts with clear purpose and expected outcomes.",
      },
      {
        title: "Live Collaboration Control",
        body: "Screen share, chat, and record discussions in one place so teams can collaborate without losing context.",
      },
      {
        title: "Post-Meeting Clarity",
        body: "Use AI Summarizer to convert conversations into key takeaways and trackable follow-up actions.",
      },
    ],
    faqs: [
      {
        q: "How does Calendar View improve meeting planning?",
        a: "Calendar View helps teams organize schedules, avoid overlaps, and keep all meeting timelines visible in one place.",
      },
      {
        q: "Can we capture complete context during meetings?",
        a: "Yes. Screen Sharing, Meeting Recording, and in-meeting chat work together to preserve discussion context and references.",
      },
      {
        q: "What is the benefit of Meeting Agenda in daily operations?",
        a: "Meeting Agenda keeps sessions focused by defining topics in advance, reducing off-track discussion and saving team time.",
      },
      {
        q: "What does AI Summarizer provide after meetings?",
        a: "AI Summarizer generates concise recaps with key points and action items so teams can move quickly from discussion to execution.",
      },
    ],
  },
  communication: {
    kicker: "Team communication",
    title: "Unify Team Communication with AI and Real-Time Collaboration",
    heroBody:
      "Bring chats, calls, and collaboration tools into one workspace so teams can communicate faster with clear context.",
    secondaryTitle: "Communicate Faster Across Channels, Calls, and AI Support",
    secondaryBody:
      "Use Ryzent AI Assistant, Channels Creation, Video Call, and Audio Call to keep teams connected. Add Message Reactions and Polls Creation to drive faster decisions inside conversations.",
    secondaryNote:
      "Communication teams use this flow to reduce response delays, improve alignment, and keep discussions action-oriented.",
    autoViews: [
      { title: "Ryzent AI Assistant", desc: "Get AI-powered support for replies, summaries, and conversation clarity." },
      { title: "Channels Creation", desc: "Create focused channels for teams, projects, and departments." },
      { title: "Video Call", desc: "Start instant face-to-face collaboration with your team." },
      { title: "Audio Call", desc: "Run quick voice calls when video is not needed." },
      { title: "Message Reactions", desc: "Capture quick feedback and status signals directly in chats." },
      { title: "Polls Creation", desc: "Launch polls to gather team decisions and preferences quickly." },
      { title: "Join as Guest", desc: "Anyone can join meeting as guest, with host approval" },
    ],
    previewImages: [
      "/product/RyzentAssistant.png",
      "/product/Communication.png",
      "/product/VideoCalls.png",
      "/product/AudioCalls.png",
      "/product/MessageReaction.png",
      "/product/PollsCreation.png",
      "/product/Guest.png",
    ],
    useCases: [
      {
        title: "AI-Guided Communication",
        body: "Use Ryzent AI Assistant to draft responses, summarize discussions, and keep communication clear across teams.",
      },
      {
        title: "Real-Time Team Collaboration",
        body: "Switch between channels, video calls, and audio calls to coordinate work faster without context switching across tools.",
      },
      {
        title: "Faster Team Decisions",
        body: "Use message reactions and polls to collect feedback quickly and move from discussion to decision with less delay.",
      },
    ],
    faqs: [
      {
        q: "How does Ryzent AI Assistant help communication workflows?",
        a: "It supports faster communication by assisting with responses, summaries, and clearer context across ongoing team discussions.",
      },
      {
        q: "Can teams use both channels and calls in one place?",
        a: "Yes. Teams can create channels for structured discussions and instantly start video or audio calls from the same communication flow.",
      },
      {
        q: "What are Message Reactions useful for?",
        a: "Message Reactions provide quick feedback signals, helping teams acknowledge updates and align status without extra messages.",
      },
      {
        q: "Why use Polls Creation in team communication?",
        a: "Polls help teams make decisions quickly by collecting structured input from members in real time.",
      },
    ],
  },
  recruitment: {
    kicker: "Hiring operations",
    title: "Scale Recruitment with AI-Driven Hiring Workflows",
    heroBody:
      "Run complete hiring operations from opening creation to interviews and pipeline movement in one structured workspace.",
    secondaryTitle: "Manage Openings, Interviews, and Pipeline in One Flow",
    secondaryBody:
      "Create openings quickly, customize your hiring brand and forms, run Rexa Agentic Interviews, and move candidates through a clear hiring pipeline with faster communication.",
    secondaryNote:
      "Recruitment teams use this flow to reduce hiring delays, improve candidate experience, and make decisions with better visibility.",
    autoViews: [
      { title: "Rexa Agentic Interviews", desc: "Run AI-assisted interviews for faster candidate evaluation." },
      { title: "Opening Creation", desc: "Create and publish hiring openings with structured role details." },
      { title: "Brand Customization", desc: "Customize hiring pages to match your company identity." },
      { title: "Customized Hiring Forms", desc: "Build role-specific forms to capture better candidate data." },
      { title: "Hiring Pipeline", desc: "Track candidates through every stage of the hiring journey." },
      { title: "Emails Sending", desc: "Send hiring updates and communication directly from the workflow." },
    ],
    previewImages: [
      "/product/AI6.png",
      "/product/Opening.png",
      "/product/BrandCustomizations.png",
      "/product/FormCustomization.png",
      "/product/Pipeline.png",
      "/product/Emails.png",
    ],
    useCases: [
      {
        title: "Faster Opening Launch",
        body: "Use Opening Creation with brand and form customization to publish hiring roles faster and more consistently.",
      },
      {
        title: "Smarter Candidate Evaluation",
        body: "Use Rexa Agentic Interviews and pipeline tracking to evaluate candidates with clearer signals at each stage.",
      },
      {
        title: "Continuous Hiring Communication",
        body: "Use Emails Sending to keep candidates informed and reduce drop-offs during the recruitment process.",
      },
    ],
    faqs: [
      {
        q: "How does Rexa Agentic Interviews improve hiring?",
        a: "It helps teams evaluate candidates faster with AI-assisted interview workflows and structured assessment signals.",
      },
      {
        q: "Can we customize hiring flows for different roles?",
        a: "Yes. Opening Creation, Brand Customization, and Customized Hiring Forms allow you to tailor the experience by role.",
      },
      {
        q: "How does Hiring Pipeline support recruitment teams?",
        a: "Hiring Pipeline provides clear stage-by-stage visibility so recruiters can track progress, identify bottlenecks, and prioritize follow-ups.",
      },
      {
        q: "Can we send candidate updates from the same system?",
        a: "Yes. Emails Sending lets teams communicate directly with candidates without switching tools.",
      },
    ],
  },
  "contract-builder": {
    kicker: "Contract workflows",
    title: "Create, Edit, and Sign Contracts in One Workflow With AI",
    heroBody:
      "Manage the full contract lifecycle from drafting to electronic signatures with structured and reusable workflows.",
    secondaryTitle: "Build Contracts Faster with Flexible Creation Options",
    secondaryBody:
      "Choose from 7 Types of Contracts, generate contracts by text or document input, and refine terms with inline editing before signature collection.",
    secondaryNote:
      "Legal and operations teams use this flow to reduce turnaround time, improve contract consistency, and accelerate execution.",
    autoViews: [
      { title: "7 Types of Contracts", desc: "Start with the right contract type for your business need." },
      { title: "Create Contract By Text", desc: "Generate contracts using text prompts and structured details." },
      { title: "Create Contract By Document", desc: "Build contracts from uploaded source documents." },
      { title: "Inline editing", desc: "Edit clauses and terms directly within the contract workflow." },
      { title: "Electronic Signtatures", desc: "Collect secure electronic signatures to finalize agreements faster." },
    ],
    previewImages: [
      "/product/ContractBuilder.png",
      "/product/TextBased.png",
      "/product/DocumentBased.png",
      "/product/InlineEditing.png",
      "/product/ElectronicSignature.png",
    ],
    useCases: [
      {
        title: "Faster Contract Creation",
        body: "Use predefined contract types and text/document-based generation to produce drafts quickly with fewer manual steps.",
      },
      {
        title: "Accurate Legal Refinement",
        body: "Use inline editing to update clauses and terms in context so legal and business teams stay aligned during review.",
      },
      {
        title: "Quicker Agreement Closure",
        body: "Use electronic signatures to complete approvals faster and reduce delays in final contract execution.",
      },
    ],
    faqs: [
      {
        q: "What does 7 Types of Contracts help with?",
        a: "It helps teams select the correct contract structure quickly, reducing drafting errors and setup time.",
      },
      {
        q: "Can we create contracts from both text and documents?",
        a: "Yes. You can generate contracts from text inputs or source documents depending on your workflow needs.",
      },
      {
        q: "How does inline editing improve contract review?",
        a: "Inline editing allows teams to update terms directly in the draft, making revisions faster and easier to track.",
      },
      {
        q: "Are electronic signatures supported for final approval?",
        a: "Yes. Electronic Signtatures support secure signing so agreements can be finalized without manual paperwork.",
      },
    ],
  },
  requests: {
    kicker: "Request management",
    title: "Manage Employee Requests with Faster Response Cycles",
    heroBody:
      "Capture employee requests in one system, respond quickly, and keep progress visible across every request lifecycle stage.",
    secondaryTitle: "Track Requests from Creation to Resolution",
    secondaryBody:
      "Let employees create requests easily, enable teams to respond in one workflow, and maintain status visibility so no request is lost or delayed.",
    secondaryNote:
      "Operations and support teams use this flow to improve accountability, shorten response time, and deliver consistent request handling.",
    autoViews: [
      { title: "Employees Request Creation", desc: "Allow employees to create requests with clear details and context." },
      { title: "Respond to Requests", desc: "Handle and reply to incoming requests from one centralized flow." },
      { title: "Status Visibility", desc: "Track request status updates clearly from open to resolved." },
    ],
    previewImages: [
      "/product/RequestCreation.png",
      "/product/Respond.png",
      "/product/StatusVisiblity.png",
    ],
    useCases: [
      {
        title: "Structured Request Intake",
        body: "Use Employees Request Creation to capture complete request details and reduce missing context at submission time.",
      },
      {
        title: "Faster Team Response",
        body: "Use Respond to Requests to resolve issues quickly with clear ownership and communication.",
      },
      {
        title: "Transparent Progress Tracking",
        body: "Use Status Visibility to keep employees and managers updated on request progress without manual follow-ups.",
      },
    ],
    faqs: [
      {
        q: "How does Employees Request Creation help operations?",
        a: "It standardizes request submissions so teams receive complete information and can act faster without back-and-forth clarification.",
      },
      {
        q: "Can teams respond to requests from one place?",
        a: "Yes. Respond to Requests keeps communication and handling in one flow so teams can manage workload more efficiently.",
      },
      {
        q: "What does Status Visibility provide?",
        a: "Status Visibility gives a clear view of each request stage, helping everyone track progress from open to resolved.",
      },
      {
        q: "Can this reduce manual follow-up on pending requests?",
        a: "Yes. With centralized responses and visible status updates, teams spend less time on manual tracking and reminder loops.",
      },
    ],
  },
  documents: {
    kicker: "Document management",
    title: "Keep Business Documents Secure, Structured, and Easy to Access",
    heroBody:
      "Store company documents in one protected workspace with role-based access, cleaner organization, and faster retrieval.",
    secondaryTitle: "Manage Every File with Secure Storage and Clear Workspace Views",
    secondaryBody:
      "Use secure storage to protect sensitive files, then switch between list and folder views to organize teams, projects, and records with less friction.",
    secondaryNote:
      "Document teams use built-in viewing to review files instantly, reduce tool switching, and keep decisions aligned around one trusted source.",
    secondaryAudience: "Document operations",
    autoViews: [
      { title: "Secure Document Storage", desc: "Protect critical files with role-based access and controlled visibility." },
      { title: "List View", desc: "Scan documents quickly with sortable rows and structured metadata." },
      { title: "Folder View", desc: "Organize records by team, project, or department in clean folder hierarchies." },
      { title: "Document Viewer", desc: "Open and review files instantly without leaving your workspace." },
    ],
    previewImages: [
      "/product/Documents.png",
      "/product/ListView.png",
      "/product/Folder View.png",
      "/product/DocumentViewer.png",
    ],
    useCases: [
      {
        title: "Secure Storage Control",
        body: "Protect sensitive documents with role-based access and keep business files centralized in one secure workspace.",
      },
      {
        title: "List and Folder Navigation",
        body: "Switch between list and folder views to organize records by team, project, or function with less search time.",
      },
      {
        title: "Fast In-App Reviewing",
        body: "Use the document viewer to open and review files instantly without downloading or jumping between tools.",
      },
    ],
    faqs: [
      {
        q: "How does Secure Document Storage protect our files?",
        a: "It applies role-based access controls so only authorized users can view or edit sensitive documents.",
      },
      {
        q: "When should teams use List View vs Folder View?",
        a: "Use List View for quick scanning and sorting, and Folder View for structured organization by department, project, or workflow.",
      },
      {
        q: "What is the advantage of the built-in Document Viewer?",
        a: "Teams can open and review files directly in the workspace, which reduces tool switching and speeds up document decisions.",
      },
      {
        q: "Can Documents scale for multiple departments?",
        a: "Yes. Centralized storage with access controls and organized views supports cross-department document operations at scale.",
      },
    ],
  },
  "leads-crm": {
    kicker: "Leads CRM",
    title: "Capture, Analyze, and Follow Up on Leads Without Missing Momentum",
    heroBody:
      "Run lead intake, AI-assisted analysis, and follow-up execution in one CRM workflow designed to improve response speed and conversion clarity.",
    secondaryTitle: "Turn New Leads into Structured Follow-Up Pipelines",
    secondaryBody:
      "Create leads quickly, analyze quality with AI, generate follow-up drafts, and keep reminders visible so opportunities do not go cold.",
    secondaryNote:
      "Sales and growth teams use Leads CRM to reduce manual tracking and keep every lead moving through a consistent conversion process.",
    secondaryAudience: "Sales operations",
    autoViews: [
      { title: "Create new Leads", desc: "Add incoming prospects with essential details in a structured lead form." },
      { title: "AI Leads Analyzer", desc: "Use AI scoring and insights to prioritize leads with stronger conversion potential." },
      { title: "Draft Followup with AI", desc: "Generate contextual follow-up messages quickly to save response time." },
      { title: "Followup Reminders", desc: "Track upcoming follow-ups so no lead is missed or delayed." },
    ],
    previewImages: [
      "/product/Leads.png",
      "/product/LeadsAI.png",
      "/product/AIDraft.png",
      "/product/FollowupReminders.png",
    ],
    useCases: [
      {
        title: "Faster Lead Capture",
        body: "Create and organize leads in one workflow so teams can start engagement faster with complete context.",
      },
      {
        title: "AI-Prioritized Pipeline",
        body: "Use AI lead analysis to identify high-potential opportunities first and improve conversion focus.",
      },
      {
        title: "Consistent Follow-Up Execution",
        body: "Combine AI draft messages and reminder tracking to keep outreach timely and reduce dropped opportunities.",
      },
    ],
    faqs: [
      {
        q: "How does Create new Leads improve sales workflows?",
        a: "It standardizes lead intake so teams capture clean details up front and can route opportunities faster.",
      },
      {
        q: "What does AI Leads Analyzer provide?",
        a: "It helps teams prioritize leads by quality signals so effort is focused on prospects with higher conversion potential.",
      },
      {
        q: "How is Draft Followup with AI used day to day?",
        a: "Teams can generate quick, contextual outreach drafts and personalize them before sending, reducing manual writing time.",
      },
      {
        q: "Why are Followup Reminders important in Leads CRM?",
        a: "Reminders keep outreach schedules visible so leads are not forgotten and pipeline momentum stays consistent.",
      },
    ],
  },
  payments: {
    kicker: "Payment visibility",
    title: "Track Payments with Complete Operational Context",
    heroBody:
      "Monitor pending approvals, completed transactions, and payment risks from one structured finance workflow.",
    autoViews: [
      { title: "Payment board", desc: "See pending and completed payments." },
      { title: "Approval queue", desc: "Review transactions by priority." },
      { title: "Vendor table", desc: "Track external payout obligations." },
      { title: "Timeline view", desc: "Monitor scheduled payment windows." },
      { title: "Risk view", desc: "Spot delays and missing approvals." },
      { title: "Finance recap", desc: "Summarize cycle-level payment status." },
    ],
  },
  subscriptions: {
    kicker: "Subscription control",
    title: "Manage Plans, Renewals, and Billing Health",
    heroBody:
      "Keep subscription status transparent with clear renewal milestones, billing events, and upgrade planning.",
    autoViews: [
      { title: "Plan view", desc: "Track current plan and feature access." },
      { title: "Renewal timeline", desc: "See upcoming billing checkpoints." },
      { title: "Billing table", desc: "Review invoices and payment status." },
      { title: "Usage board", desc: "Compare consumption against limits." },
      { title: "Upgrade view", desc: "Plan tier changes with confidence." },
      { title: "Health dashboard", desc: "Monitor subscription stability." },
    ],
  },
  teams: {
    kicker: "Team structure",
    title: "Build Teams with Clear Ownership and Member Alignment",
    heroBody:
      "Create team structures, assign members confidently, and keep accountability visible across departments as your organization grows.",
    secondaryTitle: "Organize Team Structures and Assign Members Without Confusion",
    secondaryBody:
      "Set up teams quickly, define responsibilities, and assign the right members to the right groups to improve collaboration and execution flow.",
    secondaryNote:
      "Operations and HR teams use this workflow to maintain clean team mapping, reduce role ambiguity, and improve cross-team coordination.",
    secondaryAudience: "People operations",
    autoViews: [
      { title: "Create teams", desc: "Build team groups with clear names, ownership, and functional purpose." },
      { title: "Assign Members", desc: "Add members to teams with the right structure for collaboration and accountability." },
    ],
    previewImages: [
      "/product/CreateTeams.png",
      "/product/AssignMembers.png",
    ],
    useCases: [
      {
        title: "Structured Team Creation",
        body: "Create teams with clear boundaries and responsibilities so work ownership stays transparent from day one.",
      },
      {
        title: "Accurate Member Assignment",
        body: "Assign members to the right teams quickly to reduce overlap, improve accountability, and strengthen delivery alignment.",
      },
      {
        title: "Scalable Team Operations",
        body: "Maintain clean team structures as the company grows so managers can coordinate cross-functional work with less friction.",
      },
    ],
    faqs: [
      {
        q: "How does Create teams help organizational clarity?",
        a: "It lets you define team structures with clear ownership, making responsibilities visible and reducing coordination confusion.",
      },
      {
        q: "What is the benefit of Assign Members?",
        a: "Assign Members ensures people are mapped to the right teams so collaboration is organized and accountability is easier to manage.",
      },
      {
        q: "Can Teams support growth across multiple departments?",
        a: "Yes. Teams is designed to scale with your organization while preserving clear structure, visibility, and role alignment.",
      },
      {
        q: "Will this reduce role and ownership overlap?",
        a: "Yes. With structured team setup and deliberate member assignment, teams can avoid duplicate ownership and unclear responsibility lines.",
      },
    ],
  },
  standups: {
    kicker: "Standup rhythm",
    title: "Run Standups that Surface Progress and Blockers",
    heroBody:
      "Keep daily momentum high with structured updates, blocker visibility, and clean progress snapshots for managers.",
    secondaryTitle: "Track Team Standups with Better Daily Visibility",
    secondaryBody:
      "Run manager-led standups, mark attendance, add summaries, and review standup stats in one consistent daily workflow.",
    secondaryNote:
      "Teams use this flow to keep updates structured, improve accountability, and maintain clear momentum across projects.",
    secondaryAudience: "Project operations",
    autoViews: [
      { title: "Project manager Standups with Employees", desc: "Run structured manager-employee standups with clear daily updates." },
      { title: "Mark Attendance", desc: "Track standup participation and attendance status each day." },
      { title: "Add Sumamry", desc: "Capture key updates and blockers in one standup summary." },
      { title: "Standup Stats", desc: "Review trends and participation performance from standup data." },
    ],
    previewImages: [
      "/product/PMStandups.png",
      "/product/StandupAttendance.png",
      "/product/StandupSummary.png",
      "/product/Standups.png",
    ],
    useCases: [
      {
        title: "Manager-Led Daily Alignment",
        body: "Run project manager standups with employees in a consistent format so updates and blockers stay visible every day.",
      },
      {
        title: "Attendance and Participation Tracking",
        body: "Mark attendance during standups to ensure participation accountability and identify follow-up needs quickly.",
      },
      {
        title: "Summary and Performance Visibility",
        body: "Capture standup summaries and review stats to monitor team momentum, recurring blockers, and execution consistency.",
      },
    ],
    faqs: [
      {
        q: "How do Project manager Standups with Employees improve team execution?",
        a: "They create a structured daily checkpoint where managers and employees align on priorities, blockers, and next actions.",
      },
      {
        q: "Why is Mark Attendance important in standups?",
        a: "Attendance tracking improves accountability and helps teams identify participation gaps that can affect execution flow.",
      },
      {
        q: "What should teams include in Add Sumamry?",
        a: "Teams should capture key updates, blockers, decisions, and follow-up actions so progress remains clear after the standup ends.",
      },
      {
        q: "How can Standup Stats help managers?",
        a: "Standup Stats reveal participation and update trends, helping managers spot recurring issues and maintain team momentum.",
      },
    ],
  },
  support: {
    kicker: "Support workflows",
    title: "Resolve Issues Faster with Structured Support",
    heroBody:
      "Capture every issue, prioritize by urgency, and keep stakeholders updated with transparent support lifecycle tracking.",
    autoViews: [
      { title: "Ticket board", desc: "Track open, active, and resolved." },
      { title: "Priority list", desc: "Handle urgent issues first." },
      { title: "SLA timeline", desc: "Measure response and resolution speed." },
      { title: "Owner view", desc: "Assign accountable responders." },
      { title: "Customer recap", desc: "Share clean progress updates." },
      { title: "Ops dashboard", desc: "Analyze support workload trends." },
    ],
  },
};

function AutoViewShowcase({ views, previewImages }) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!views?.length) return undefined;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % views.length);
    }, 3800);
    return () => clearInterval(timer);
  }, [views.length]);

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[370px_minmax(0,1fr)]">
      <div className="space-y-0 bg-white">
        {views.map((view, index) => {
          const active = index === activeIndex;
          return (
            <div
              key={view.title}
              className={`relative flex cursor-pointer items-center justify-between border-b border-[#e8eefb] px-4 py-4 last:border-b-0 ${
                active ? "bg-[#f3f7ff]" : "bg-white"
              }`}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveIndex(index);
                }
              }}
              role="button"
              tabIndex={0}
              aria-pressed={active}
            >
              <div>
                <p
                  className={`text-[13px] font-extrabold ${active ? "text-[#194696]" : "text-[#1a1f2e]"}`}
                >
                  {view.title}
                </p>
                {active ? (
                  <p className="mt-1 text-[11px] text-slate-500">{view.desc}</p>
                ) : null}
              </div>
              <span
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-[14px] font-bold ${
                  active
                    ? "bg-[#e8f0ff] text-[#194696]"
                    : "bg-[#f1f4fa] text-slate-500"
                }`}
              >
                <ChevronDown size={15} />
              </span>
              <div
                className={`pointer-events-none absolute bottom-0 left-0 h-[4px] bg-[#5e36ef] transition-all duration-500 ${
                  active ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  width: active ? "100%" : "0%",
                  animation: active
                    ? "lineGrow 3800ms linear forwards"
                    : "none",
                }}
              />
            </div>
          );
        })}
      </div>

      {previewImages?.length ? (
        <div className="w-full rounded-[38px] p-[16px] backdrop-blur-md bg-white/20 ring-1 ring-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.2)]">
          <img
            src={previewImages[activeIndex % previewImages.length]}
            alt={`${views[activeIndex % views.length]?.title || "Preview"} image`}
            className="block w-full h-auto object-cover rounded-[22px] transition-opacity duration-500 shadow-[0_8px_32px_rgba(0,0,0,0.12)]"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="bg-[#e8ebf2] p-3 md:p-4">
          <div className="bg-[#f7f8fb] p-4">
            <p className="mb-2 text-[13px] font-bold text-[#1b1d24]">
              Live workflow preview
            </p>
            <div className="mb-2 flex justify-between text-[11px] text-slate-600">
              <span>Week 38</span>
              <span>Week 40</span>
            </div>
            <div className="relative h-[260px] overflow-hidden bg-white p-3">
              <div className="absolute inset-0 bg-[repeating-linear-gradient(90deg,#f6f8fc_0,#f6f8fc_56px,#edf2fb_56px,#edf2fb_57px)]" />
              <div className="relative z-10 space-y-3">
                {views.slice(0, 5).map((view, index) => {
                  const active = index === activeIndex % 5;
                  return (
                    <div
                      key={view.title}
                      className={`rounded-lg px-3 py-2 text-[12px] font-semibold transition-all duration-500 ${
                        active
                          ? "translate-x-0 bg-[#8ecaf033] text-[#12375e]"
                          : "translate-x-2 bg-[#dbe8ff] text-[#234a7f]"
                      }`}
                      style={{
                        width: `${72 + ((index + activeIndex) % 3) * 8}%`,
                        animation: active
                          ? "slidePulse 1.2s ease-in-out infinite"
                          : "none",
                      }}
                    >
                      {view.title}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
function TimelineMock() {
  return (
    <div className="rounded-[30px] border border-[#d8dbe5] bg-[#e8ebf2] p-3 md:p-4">
      <div className="rounded-[22px] border border-[#d6d9e1] bg-[#f7f8fb] p-4">
        <p className="mb-3 text-[14px] font-bold text-[#1b1d24]">
          Resource Planning
        </p>
        <div className="space-y-2.5">
          {[0, 1, 2].map((r) => (
            <div key={r} className="grid grid-cols-[130px_minmax(0,1fr)] gap-2">
              <div className="rounded-lg bg-white p-2 text-[11px] font-semibold text-slate-700">
                Team {r + 1}
              </div>
              <div className="rounded-lg bg-white p-2">
                <div className="relative h-5 rounded bg-[#f0f2f7]">
                  <div
                    className="absolute left-[6%] top-0 h-5 rounded"
                    style={{ width: `${58 - r * 8}%`, background: "#19469633" }}
                  />
                  <div className="absolute left-[58%] top-0 h-5 w-[18%] rounded bg-[#4fd08f66]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CapacityMock() {
  return (
    <div className="rounded-[30px] border border-[#d8dbe5] bg-[#e8ebf2] p-3 md:p-4">
      <div className="rounded-[22px] border border-[#d6d9e1] bg-[#f7f8fb] p-4">
        <p className="mb-3 text-[14px] font-bold text-[#1b1d24]">
          Team Scheduling
        </p>
        <div className="space-y-3">
          {[0, 1].map((row) => (
            <div key={row} className="rounded-xl bg-white p-3">
              <p className="mb-2 text-[11px] font-semibold text-slate-700">
                Member {row + 1}
              </p>
              <div className="h-3 rounded bg-[#eef1f6]">
                <div
                  className={`h-3 rounded ${row === 0 ? "bg-[#71cf9f]" : "bg-[#f67575]"}`}
                  style={{ width: row === 0 ? "66%" : "54%" }}
                />
              </div>
              <p className="mt-2 text-[10px] text-slate-500">
                {row === 0 ? "Balanced capacity" : "Overbooked this week"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function ProductFeaturePage() {
  const { slug } = useParams();
  const product = getProductBySlug(slug || "");
  const safeProduct = product || {
    label: "Module",
    section: "Workflows",
    highlights: [],
  };
  const content = contentBySlug[slug || ""] || {};
  const heroImageSrc = heroImageBySlug[slug || ""];
  const secondaryImageSrc = secondaryImageBySlug[slug || ""];
  const autoViews = content.autoViews || [
    { title: "Timeline view", desc: "Drag and rebalance execution quickly." },
    { title: "Board view", desc: "Move work through each stage." },
    { title: "Table view", desc: "Sort by effort and priority." },
    { title: "List view", desc: "Track owner-level progress." },
    { title: "Calendar view", desc: "Align deadlines with capacity." },
    { title: "Workload view", desc: "See available and overloaded teams." },
  ];
  const heroBackground = useMemo(
    () =>
      heroBackgroundBySlug[slug || ""] ||
      getDynamicHeroBackground(slug || "") ||
      sectionHeroBackground[safeProduct.section] ||
      sectionHeroBackground.Workflows,
    [safeProduct.section, slug],
  );
  const capabilities = useMemo(
    () => [
      ...safeProduct.highlights,
      `${safeProduct.label} dashboards tailored for daily team decisions`,
      `Operational intelligence to spot risks before delivery slips`,
      `Connected visibility across projects, people, and communication`,
    ],
    [safeProduct],
  );
  const useCases = useMemo(
    () =>
      content.useCases || [
        {
          title: "Daily execution",
          body: `Run ${safeProduct.label.toLowerCase()} with less manual follow-up and clearer accountability across teams.`,
        },
        {
          title: "Manager visibility",
          body: "See who is overloaded, where tasks are blocked, and what needs intervention before delays grow.",
        },
        {
          title: "Leadership outcomes",
          body: "Turn operational signals into decisions with clean trends, measurable progress, and clearer ownership.",
        },
      ],
    [content.useCases, safeProduct],
  );
  const faqs = useMemo(
    () =>
      content.faqs || [
        {
          q: `How quickly can we launch ${safeProduct.label}?`,
          a: "Most teams can set up core workflows in the first day and start using the module with production-ready visibility.",
        },
        {
          q: `Does ${safeProduct.label} connect with other modules?`,
          a: "Yes. It is built to work with projects, teams, communication, and platform modules so data stays connected.",
        },
        {
          q: "Can this scale for multiple departments?",
          a: "Yes. Role-based views and structured workflows support both small teams and multi-department operations.",
        },
      ],
    [content.faqs, safeProduct],
  );

  if (!product) {
    return <Navigate to="/product" replace />;
  }

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes slidePulse {
          0% { transform: translateX(0); }
          50% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
        @keyframes lineGrow {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.76)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section
        className="pb-20 pt-32 md:pb-24 md:pt-36"
        style={{ background: heroBackground }}
      >
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 px-6 md:grid-cols-[minmax(0,1fr)_580px] md:px-8">
          <div>
            <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.13em] text-[#194696]">
              {content.kicker || product.label}
            </p>
            <h1 className="max-w-[660px] text-[clamp(34px,5.5vw,56px)] font-bold leading-[1.03] tracking-[-0.04em] text-[#14161d]">
              {content.title ? (
                content.title
              ) : (
                <React.Fragment>
                  <span className="text-[#194696]">Allocate Work</span> Smarter
                  for Better Business Results
                </React.Fragment>
              )}
            </h1>
            <p className="mt-5 max-w-[620px] text-[14px] leading-7 text-slate-600">
              {content.heroBody || product.summary}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-1 rounded-full bg-[#194696] px-5 py-2.5 text-[12px] font-bold text-white no-underline"
              >
                Start free trial
                <ArrowRight size={13} />
              </Link>
              <a
                href="https://calendly.com/shahbazrafique101/ryzent-demo"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#194696] bg-white px-5 py-2.5 text-[12px] font-bold text-[#194696] no-underline"
              >
                Book a Demo
              </a>
            </div>
          </div>
          {heroImageSrc ? (
            <div className="flex w-full items-center justify-center">
              <div className="w-full rounded-[38px] p-[14px] backdrop-blur-md bg-white/15 ring-1 ring-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                <img
                  src={heroImageSrc}
                  alt={`${product.label} preview`}
                  className="block w-full rounded-[22px] object-contain"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <TimelineMock />
          )}
        </div>
      </section>

      <section className="bg-[#f3f7ff] py-14">
        <div className="mx-auto grid w-full max-w-[1140px] items-center gap-10 px-6 md:grid-cols-[minmax(0,1fr)_460px] md:px-8">
          <div className="p-0">
            <div className="mb-4 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#194696] text-white">
              <Sparkles size={13} />
            </div>
            <h2 className="text-[clamp(30px,4.2vw,46px)] font-bold leading-[1.06] tracking-[-0.04em] text-[#16181f]">
              {content.secondaryTitle || (
                <>
                  Optimize{" "}
                  <span className="font-extrabold">{product.label}</span>{" "}
                  Capacity with Better Workload Balance
                </>
              )}
            </h2>
            <p className="mt-4 max-w-[620px] text-[14px] leading-7 text-slate-600">
              {content.secondaryBody ||
                `Balance team workload with clarity inside ${product.label}. See who is overbooked, who has available capacity, and where to reassign tasks quickly to protect delivery.`}
            </p>
            <div className="my-6 h-px bg-[#dde2ea]" />
            <p className="text-[12px] leading-6 text-slate-600">
              {content.secondaryNote ||
                `Our teams use ${product.label.toLowerCase()} to monitor project load across active streams and resolve resource conflicts before they become escalations.`}
            </p>
            <p className="mt-4 text-[10px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
              {content.secondaryAudience || "Operations leadership"}
            </p>
            <Link
              to="/register"
              className="mt-5 inline-flex items-center gap-1 rounded-full bg-[#194696] px-5 py-2.5 text-[12px] font-bold text-white no-underline"
            >
              Start free trial
              <ArrowRight size={13} />
            </Link>
          </div>
          {secondaryImageSrc ? (
            <div className="flex h-[390px] w-full items-center justify-center p-1 md:h-[520px] md:p-2">
              <div className="rounded-[38px] p-[4px] backdrop-blur-md bg-white/15 ring-1 ring-white/50 shadow-[inset_0_1px_1px_rgba(255,255,255,0.35),inset_0_0_0_1px_rgba(255,255,255,0.2)]">
                <img
                  src={secondaryImageSrc}
                  alt={`${product.label} app activity preview`}
                  className="block aspect-video h-full w-full rounded-[22px] object-contain object-center"
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <CapacityMock />
          )}
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1140px] px-6 pb-20 pt-14 md:px-8 md:pb-24">
        <section>
          <AutoViewShowcase
            views={autoViews}
            previewImages={content.previewImages}
          />
        </section>

        <section>
          <p className="mt-12 text-[11px] font-extrabold uppercase tracking-[0.13em] text-[#194696]">
            Comprehensive overview
          </p>
          <h3 className="mt-2 text-[clamp(30px,4.4vw,48px)] font-bold leading-[1.05] tracking-[-0.04em] text-[#15171d]">
            Everything your team needs in {product.label}
          </h3>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {capabilities.map((item) => (
              <div
                key={item}
                className="flex items-start gap-2 rounded-xl border border-[#e5e8ef] bg-white px-4 py-3"
              >
                <CheckCircle2 size={16} className="mt-0.5 text-[#194696]" />
                <p className="m-0 text-[14px] leading-6 text-slate-700">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          {useCases.map((item, idx) => {
            const icon = idx === 0 ? Layers3 : idx === 1 ? Gauge : Target;
            const Icon = icon;
            return (
              <article
                key={item.title}
                className="rounded-2xl border border-[#e2e6ef] bg-[#fafbfd] p-5"
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white text-[#194696]">
                  <Icon size={16} />
                </span>
                <h4 className="mt-3 text-[18px] font-bold text-[#171922]">
                  {item.title}
                </h4>
                <p className="mt-2 text-[14px] leading-6 text-slate-600">
                  {item.body}
                </p>
              </article>
            );
          })}
        </section>

        <section className="mt-12 rounded-[22px] border border-[#dfe4ee] bg-white p-6">
          <div className="mb-4 flex items-center gap-2">
            <HelpCircle size={15} className="text-[#194696]" />
            <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#194696]">
              FAQ
            </p>
          </div>
          <div className="space-y-3">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[#e5e8ef] bg-[#fafbfd] px-4 py-3"
              >
                <summary className="cursor-pointer list-none text-[14px] font-bold text-[#15171d]">
                  <span className="inline-flex items-start gap-1.5">
                    <ChevronRight size={15} className="mt-0.5 text-[#194696]" />
                    {item.q}
                  </span>
                </summary>
                <p className="mt-2 pl-6 text-[13px] leading-6 text-slate-600">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#ebeef5] bg-[#f8f9fc] p-4">
            <div>
              <p className="m-0 text-[11px] font-extrabold uppercase tracking-[0.12em] text-slate-500">
                Next step
              </p>
              <p className="mt-1 text-[14px] font-semibold text-slate-700">
                Explore all modules or start your free trial now.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to="/product"
                className="rounded-full border border-[#d8dce6] bg-white px-4 py-2 text-[12px] font-bold text-slate-700 no-underline"
              >
                All Products
              </Link>
              <Link
                to="/register"
                className="rounded-full bg-[#194696] px-4 py-2 text-[12px] font-bold text-white no-underline"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
