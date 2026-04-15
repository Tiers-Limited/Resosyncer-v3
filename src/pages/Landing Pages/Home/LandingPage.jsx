import { useState } from "react";
import { Link } from "react-router-dom";
import ConnectedToolsSection from "../../../components/Landing/ConnectedToolsSection";
import KeyFeaturesSection from "../../../components/Landing/KeyFeaturesSection";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProblemSection from "../../../components/Landing/ProblemSection";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import SolutionsShowcase from "../../../components/Landing/SolutionsShowcase";
import SupportFeedbackSection from "../../../components/Landing/SupportFeedbackSection";

const pains = [
  "Too many tools, no central system",
  "Poor team visibility",
  "Scattered communication",
  "Manual processes slowing growth",
  "No real insights for decision making",
];

const heroTabs = [
  {
    label: "Project Management",
    title: "Website Redesign Budget",
    image: "/PM.png",
    imageAlt: "Project management overview",
    rows: [
      ["Paid Media Strategy", "00:00h / 00:00h", "10,000 / pc"],
      ["Campaign Development", "13:00h / 30:00h", "180 / pc"],
      ["Website & SEO refresh", "07:00h / 10:00h", "1,300 total"],
    ],
    sideTitle: "New expense",
  },
  {
    label: "Meeting Intelligence",
    title: "Q2 Leadership Meetings",
    image: "/Meeting.png",
    imageAlt: "Meeting Intelligence overview",
    rows: [
      ["Weekly Standup", "4 meetings", "AI notes ready"],
      ["Client Sync", "2 meetings", "3 actions captured"],
      ["Sprint Review", "1 meeting", "Decisions shared"],
    ],
    sideTitle: "Meeting summary",
  },
  {
    label: "Attendance",
    title: "Attendance Operations",
    image: "/Attendance.png",
    imageAlt: "Attendance overview",
    rows: [
      ["Design Team", "92% present", "2 late check-ins"],
      ["Engineering", "96% present", "1 missing log"],
      ["Support", "89% present", "3 shift updates"],
    ],
    sideTitle: "Attendance update",
  },
  {
    label: "Recruitment",
    title: "Hiring Pipeline",
    image: "/Recruitment.png",
    imageAlt: "Recruitment overview",
    rows: [
      ["Frontend Engineer", "12 applicants", "4 shortlisted"],
      ["HR Specialist", "7 applicants", "2 interviews"],
      ["QA Analyst", "9 applicants", "3 assessments"],
    ],
    sideTitle: "Candidate note",
  },
  {
    label: "Contract Builder",
    title: "Contract Workflow",
    image: "/AI1.png",
    imageAlt: "Contract Builder overview",
    rows: [
      ["NDA Draft", "Legal review", "Pending sign"],
      ["Service Agreement", "Client review", "Version 2"],
      ["Offer Letter", "Ready", "Send today"],
    ],
    sideTitle: "Contract details",
  },
  {
    label: "Communication",
    title: "Team Communications",
    image: "/Communication.png",
    imageAlt: "Communication overview",
    rows: [
      ["Announcements", "6 updates", "98% seen"],
      ["Project Channel", "34 messages", "5 unresolved"],
      ["Support Inbox", "11 threads", "3 urgent"],
    ],
    sideTitle: "Quick message",
  },
];

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState(heroTabs[0].label);
  const activeTabData =
    heroTabs.find((tab) => tab.label === activeTab) || heroTabs[0];
  const isImageTab = Boolean(activeTabData.image);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        color: "#0b1220",
        fontFamily: "'Manrope', 'Segoe UI', sans-serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');
        .lp-wrap { max-width: 1220px; margin: 0 auto; padding: 24px 20px 72px; }
        .lp-hero-shell {
          background: linear-gradient(180deg, #ffffff 0%, #f4f8ff 34%, #dce7fb 72%, #c2d3f1 100%);
        }
        .lp-nav-shell {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 60;
          background: rgba(255,255,255,.72);
          backdrop-filter: blur(12px);
        }
        .lp-nav {
          display:flex; align-items:center; justify-content:space-between; gap:16px;
          background: transparent; border:none;
          border-radius:0; padding: 14px 2px 14px;
          box-shadow:none;
        }
        .lp-brand { display:flex; align-items:center; gap:8px; font-weight:800; font-size:24px; font-family:'Sora', sans-serif; }
        .lp-menu { display:flex; align-items:center; gap:20px; list-style:none; margin:0; padding:0; font-weight:600; color:#24324d; }
        .lp-menu button, .lp-menu span { background:none; border:none; cursor:pointer; font:inherit; color:inherit; display:flex; align-items:center; gap:4px; }
        .lp-actions { display:flex; align-items:center; gap:10px; }
        .lp-btn { border:none; border-radius:12px; padding:10px 16px; font-weight:700; cursor:pointer; }
        .lp-btn-demo { background:#fff; color:#0f3ea8; border:1px solid #7093d8; }
        .lp-btn-start { background:linear-gradient(135deg,#0f2f6e,#194696); color:#fff; }
        .lp-products {
          position:absolute; top:44px; left:50%; transform:translateX(-18%);
          width:min(1040px, 88vw); background:#fff; border:1px solid #dbe7ff;
          border-radius:28px; box-shadow:0 28px 70px rgba(40,67,118,.16); padding:18px; z-index:30;
          display:grid; grid-template-columns:minmax(0, 1fr) 260px; gap:18px;
        }
        .lp-products-main {
          display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:18px;
        }
        .lp-products-group {
          padding:10px 10px 6px;
        }
        .lp-products-heading {
          display:flex; align-items:center; gap:10px; margin-bottom:18px;
          font-family:'Sora', sans-serif; font-size:18px; font-weight:700; color:#172338;
        }
        .lp-products-icon {
          width:38px; height:38px; border-radius:12px; display:inline-flex; align-items:center; justify-content:center;
          background:linear-gradient(180deg,#edf4ff,#dfeaff); color:#1450a8;
        }
        .lp-products-links {
          display:flex; flex-direction:column; gap:10px; padding-left:18px; border-left:1px solid #e8eef9;
        }
        .lp-products-links a {
          display:block; padding:4px 0; color:#2b3850; text-decoration:none; font-weight:600; transition:color .18s ease, transform .18s ease;
        }
        .lp-products-links a:hover {
          color:#0f4ca3; transform:translateX(4px);
        }
        .lp-products-side {
          background:linear-gradient(180deg,#f6f8fd,#eef3fb); border-radius:22px; padding:22px 18px;
          border:1px solid #e3eaf6;
        }
        .lp-products-side-label {
          margin:0 0 18px; font-size:12px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#7584a0;
        }
        .lp-products-side-links {
          display:flex; flex-direction:column; gap:10px;
        }
        .lp-products-side-links a {
          display:flex; align-items:center; gap:10px; padding:10px 12px; border-radius:14px; color:#223149;
          text-decoration:none; font-weight:700; transition:background .18s ease, color .18s ease;
        }
        .lp-products-side-links a:hover {
          background:#ffffff; color:#0f4ca3;
        }
        .lp-hero {
          margin-top:0; border-radius:0; padding:58px 46px 0;
          background: transparent;
          position:relative; overflow:hidden;
          width:100%;
        }
        .lp-hero::before {
          content:""; position:absolute; inset:0;
          background:radial-gradient(580px 270px at 10% 30%, rgba(255,255,255,.55), transparent 80%),
            radial-gradient(800px 360px at 92% 96%, rgba(129,170,235,.22), transparent 72%);
          pointer-events:none;
        }
        .lp-headline {
          text-align:center; font-size:56px; line-height:1.1; font-family:'Sora', sans-serif;
          letter-spacing:-0.03em; margin:0 0 14px; position:relative; z-index:2; font-weight:700;
        }
        .lp-headline-accent { color:#0f4ca3; }
        .lp-sub {
          text-align:center; margin:0 auto 28px; max-width:820px; color:#3c4f70; font-size:20px; font-weight:500;
          position:relative; z-index:2;
        }
        .lp-eyebrow {
          text-align:center; margin:0 0 16px; position:relative; z-index:2;
          font-size:12px; letter-spacing:.07em; font-weight:800; color:#1d4e95; text-transform:uppercase;
        }
        .lp-hero-actions { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
        .lp-btn-hero-primary {
          background:linear-gradient(135deg,#0f2f6e,#194696); color:#fff; border:none; border-radius:999px;
          padding:12px 24px; font-weight:800; font-size:18px; cursor:pointer;
        }
        .lp-btn-hero-secondary {
          background:#eef3ff; color:#0f3ea8; border:1px solid #c3d7ff; border-radius:999px;
          padding:12px 24px; font-weight:700; font-size:18px; cursor:pointer;
        }
        .lp-hero-tabs {
          position:relative; z-index:2; margin:36px auto 24px; max-width:1100px; display:flex; gap:10px;
          flex-wrap:nowrap; justify-content:center; overflow-x:auto; white-space:nowrap;
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .lp-hero-tabs::-webkit-scrollbar { display: none; }
        .lp-hero-tab {
          border:none; background:transparent; color:#2d3551; font-weight:700; border-radius:999px; padding:10px 14px; cursor:pointer;
        }
        .lp-hero-tab.active { background:#ffffff; box-shadow:none; color:#1f4fa0; }
        .lp-preview {
          position:relative; z-index:2; margin:26px auto 0; max-width:980px; border:1px solid #d8deef; border-radius:18px;
          background:#fff; padding:20px; box-shadow:0 16px 34px rgba(67,62,112,.12);
        }
        .lp-preview.is-image {
          border:none;
          background:transparent;
          box-shadow:none;
          padding:0;
          border-radius:0;
          margin-bottom:0;
        }
        .lp-preview-header { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:12px; }
        .lp-preview.is-image .lp-preview-header { display:none; }
        .lp-preview-title { display:flex; align-items:center; gap:10px; font-weight:800; color:#23263d; }
        .lp-dot { width:18px; height:18px; border-radius:6px; background:#4fa3ff; display:inline-block; }
        .lp-status { display:flex; gap:8px; }
        .lp-status span { padding:5px 9px; border-radius:8px; font-size:11px; font-weight:700; }
        .lp-open { background:#eaf1ff; color:#1f4fa0; }
        .lp-delivered { background:#f1f3f8; color:#63708b; }
        .lp-preview-body { display:grid; grid-template-columns:1.4fr 1fr; gap:16px; }
        .lp-preview.is-image .lp-preview-body {
          display: block;
          grid-template-columns: none;
          gap: 0;
        }
        .lp-image-crop {
          width: 100%;
          border-radius: 18px 18px 0 0;
          overflow: hidden;
          aspect-ratio: 16 / 7.6;
          box-shadow: 0 18px 34px rgba(67,62,112,.14);
          background: #f5f8ff;
        }
        .lp-preview-image {
          width: 100%;
          height: 100%;
          display: block;
          border-radius: 0;
          border: none;
          box-shadow: none;
          object-fit: contain;
          object-position: center center;
        }
        .lp-table { border:1px solid #ebedf5; border-radius:12px; overflow:hidden; }
        .lp-row { display:grid; grid-template-columns:1fr 1fr 1fr; padding:9px 12px; border-bottom:1px solid #f0f2f8; font-size:12px; color:#44506b; }
        .lp-row.head { background:#f9faff; font-weight:800; color:#5d6883; text-transform:uppercase; font-size:10px; letter-spacing:.03em; }
        .lp-row:last-child { border-bottom:none; }
        .lp-side {
          border-radius:12px; border:1px solid #eceafd; padding:12px; background:linear-gradient(145deg,#fbf9ff,#f4f5ff);
          box-shadow: inset 0 0 0 2px rgba(120,156,219,.24);
        }
        .lp-side h4 { margin:0 0 8px; font-size:13px; color:#242848; }
        .lp-field { margin-bottom:8px; }
        .lp-field label { display:block; margin-bottom:4px; font-size:10px; color:#6e7595; font-weight:700; text-transform:uppercase; }
        .lp-field div { border:1px solid #dfe3f3; border-radius:8px; padding:7px 8px; font-size:12px; color:#34405e; background:#fff; }
        .lp-problem-section {
          display:grid; grid-template-columns:minmax(0, 340px) minmax(0, 1fr); gap:40px; align-items:start;
          padding:48px 0 0;
        }
        .lp-problem-intro {
          padding:8px 0 0;
        }
        .lp-problem-eyebrow {
          margin:0 0 12px; font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#667085;
        }
        .lp-problem-title {
          margin:0 0 16px; font-family:'Sora', sans-serif; font-size:42px; line-height:1.04; letter-spacing:-.05em; color:#101828;
        }
        .lp-problem-copy {
          margin:0; font-size:16px; line-height:1.78; color:#667085; max-width:310px;
        }
        .lp-problem-stage {
          padding:8px 0 0;
        }
        .lp-problem-list {
          border-top:1px solid #e9edf5;
        }
        .lp-problem-row {
          display:grid; grid-template-columns:72px minmax(0, 1fr); gap:18px;
          align-items:start;
          padding:22px 0;
          border-bottom:1px solid #e9edf5;
          animation: lpRiseIn .55s cubic-bezier(.22,1,.36,1) both;
        }
        .lp-problem-index {
          display:inline-flex; align-items:center; justify-content:center;
          width:52px; height:52px; border-radius:16px;
          background:#f8fafc; color:#475467; font-size:13px; font-weight:800; letter-spacing:.08em;
          border:1px solid #e7ecf3;
        }
        .lp-problem-card-title {
          margin:0 0 8px; font-size:24px; line-height:1.14; letter-spacing:-.03em; color:#101828;
          font-family:'Sora', sans-serif;
        }
        .lp-problem-card-copy {
          margin:0; color:#667085; line-height:1.75; font-size:15px; max-width:620px;
        }
        .lp-problem-row-body {
          padding-top:4px;
        }
        .lp-problem-note {
          margin-top:18px;
          padding-top:8px;
        }
        .lp-problem-note-label {
          margin:0 0 8px;
          font-size:12px;
          font-weight:800;
          letter-spacing:.1em;
          text-transform:uppercase;
          color:#667085;
        }
        .lp-problem-note-copy {
          margin:0;
          color:#475467;
          line-height:1.75;
          font-size:16px;
          max-width:680px;
        }
        .lp-connected {
          padding-top: 56px;
        }
        .lp-connected-head {
          margin-bottom: 26px;
        }
        .lp-connected-title {
          margin:0;
          max-width: 980px;
          font-family:'Sora', sans-serif;
          font-size: 58px;
          line-height: 1.02;
          letter-spacing: -.05em;
          color:#101828;
        }
        .lp-connected-title span {
          color:#5a3df0;
        }
        .lp-connected-flow-wrap {
          position:relative;
          overflow:hidden;
          border-radius: 36px;
          padding: 18px 18px 22px;
          background:
            linear-gradient(180deg, rgba(255,255,255,.96), rgba(249,251,255,.96)),
            radial-gradient(420px 220px at 20% 24%, rgba(176,232,214,.18), transparent 70%),
            radial-gradient(420px 220px at 84% 26%, rgba(198,211,255,.24), transparent 70%);
          border:1px solid #e5ebf6;
          box-shadow:0 28px 54px rgba(23,35,67,.08);
        }
        .lp-connected-glow {
          position:absolute;
          width:260px;
          height:260px;
          border-radius:999px;
          filter:blur(40px);
          opacity:.4;
          pointer-events:none;
        }
        .lp-connected-glow-left {
          left:-60px;
          top:90px;
          background:radial-gradient(circle, rgba(164,232,211,.75), rgba(164,232,211,0) 70%);
        }
        .lp-connected-glow-right {
          right:-60px;
          top:88px;
          background:radial-gradient(circle, rgba(212,195,255,.8), rgba(212,195,255,0) 70%);
        }
        .lp-connected-flow {
          height: 380px;
          border-radius: 26px;
          overflow:hidden;
          position:relative;
          z-index:1;
        }
        .lp-connected-flow .react-flow__renderer,
        .lp-connected-flow .react-flow__viewport {
          background: transparent;
        }
        .lp-flow-handle {
          opacity:0;
          pointer-events:none;
          width:6px;
          height:6px;
          border:none;
          background:transparent;
        }
        .lp-flow-tool {
          width: 168px;
          min-height: 92px;
          border-radius: 26px;
          padding: 14px 16px;
          background: linear-gradient(180deg, #ffffff, #fbfdff);
          box-shadow:
            0 16px 28px rgba(17,24,39,.08),
            inset 0 1px 0 rgba(255,255,255,.9);
          border:1px solid rgba(220,229,242,.9);
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          transform: rotate(-8deg);
        }
        .lp-flow-tool-copy {
          display:flex;
          flex-direction:column;
          gap:4px;
        }
        .lp-flow-tool-copy span {
          font-family:'Sora', sans-serif;
          font-size: 17px;
          line-height:1.06;
          letter-spacing:-.03em;
          color:#182230;
        }
        .lp-flow-tool-copy small {
          font-size:12px;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:.06em;
          color:#6b7280;
        }
        .lp-flow-tool-icon {
          width: 34px;
          height: 34px;
          border-radius: 12px;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:13px;
          font-weight:800;
          color:#fff;
          box-shadow:0 8px 16px rgba(31,79,160,.18);
        }
        .lp-flow-tool-green .lp-flow-tool-icon { background:linear-gradient(180deg,#84d631,#68b61f); }
        .lp-flow-tool-violet .lp-flow-tool-icon { background:linear-gradient(180deg,#7a4dff,#5a3df0); }
        .lp-flow-tool-cyan .lp-flow-tool-icon { background:linear-gradient(180deg,#76e0f7,#33c4db); }
        .lp-flow-tool-orange .lp-flow-tool-icon { background:linear-gradient(180deg,#ff934d,#f46a19); }
        .lp-flow-tool-blue .lp-flow-tool-icon { background:linear-gradient(180deg,#2da3ff,#0f7ae5); }
        .lp-flow-tool-yellow .lp-flow-tool-icon { background:linear-gradient(180deg,#ffd24d,#f3b800); }
        .lp-flow-tool-rose .lp-flow-tool-icon { background:linear-gradient(180deg,#ff7a86,#f55b6a); }
        .lp-flow-tool-mint .lp-flow-tool-icon { background:linear-gradient(180deg,#5fe2d1,#1ac4b0); }
        .lp-flow-center {
          width: 260px;
          height: 184px;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .lp-flow-center-disc {
          width: 220px;
          height: 220px;
          border-radius: 999px;
          background:
            linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
          box-shadow:
            0 20px 44px rgba(37,37,44,.14),
            inset 0 -18px 0 rgba(15,23,42,.92),
            inset 0 -18px 0 24px #5a3df0;
          display:flex;
          align-items:center;
          justify-content:center;
          position:relative;
        }
        .lp-flow-center-disc::after {
          content:"";
          position:absolute;
          inset:16px;
          border-radius:999px;
          background: radial-gradient(circle at 30% 24%, rgba(255,255,255,.95), rgba(240,244,255,.75));
        }
        .lp-flow-center-mark {
          position:relative;
          z-index:1;
          font-family:'Sora', sans-serif;
          font-size:92px;
          line-height:1;
          font-weight:800;
          letter-spacing:-.08em;
          color:#5a3df0;
        }
        .lp-connected-benefits {
          display:grid;
          grid-template-columns:repeat(4, minmax(0, 1fr));
          gap:22px;
          margin-top:22px;
        }
        .lp-connected-benefit {
          border-radius:22px;
          padding:22px 20px;
          background:#eef2ff;
          border:1px solid #e1e7f5;
          box-shadow:0 14px 28px rgba(17,24,39,.05);
        }
        .lp-connected-benefit-mark {
          display:inline-flex;
          align-items:center;
          justify-content:center;
          width:28px;
          height:28px;
          border-radius:10px;
          background:linear-gradient(135deg,#7a4dff,#5a3df0);
          color:#fff;
          font-family:'Sora', sans-serif;
          font-size:15px;
          font-weight:800;
          margin-bottom:14px;
        }
        .lp-connected-benefit p {
          margin:0;
          color:#101828;
          font-size:16px;
          line-height:1.55;
          max-width:240px;
        }
        .lp-solutions-section {
          padding-top: 54px;
        }
        .lp-solutions-head {
          display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:26px;
        }
        .lp-solutions-eyebrow {
          margin:0 0 10px; font-size:11px; font-weight:800; letter-spacing:.14em; text-transform:uppercase; color:#667085;
        }
        .lp-solutions-title {
          margin:0; font-family:'Sora', sans-serif; font-size:50px; line-height:1.02; letter-spacing:-.05em; color:#101828;
          max-width:780px;
        }
        .lp-solutions-title span {
          color:#0f4ca3;
        }
        .lp-solutions-arrows {
          display:flex; align-items:center; gap:12px;
        }
        .lp-solutions-arrow {
          width:42px; height:42px; border-radius:999px; display:inline-flex; align-items:center; justify-content:center;
          border:1px solid #cfd8e8; color:#6b7280; background:#fff; font-size:20px; line-height:1;
        }
        .lp-solutions-arrow-dark {
          border-color:#101828; color:#101828;
        }
        .lp-solutions-grid {
          display:grid; grid-template-columns:repeat(4, minmax(0, 1fr)); gap:22px;
        }
        .lp-solution-card {
          min-height:300px; border-radius:0; padding:22px 20px 150px; position:relative; overflow:hidden;
          box-shadow:0 18px 34px rgba(29,41,57,.08);
          border:1px solid rgba(255,255,255,.72);
          transition:transform .22s ease, box-shadow .22s ease;
          display:flex; flex-direction:column; justify-content:flex-start;
        }
        .lp-solution-card:hover {
          transform:translateY(-3px);
          box-shadow:0 22px 46px rgba(29,41,57,.12);
        }
        .lp-solution-card-gold {
          background:linear-gradient(180deg,#fff6dc 0%, #ffedb0 100%);
        }
        .lp-solution-card-rose {
          background:linear-gradient(180deg,#fce8f1 0%, #f7d6e6 100%);
        }
        .lp-solution-card-sky {
          background:linear-gradient(180deg,#e7f4ff 0%, #d0e8ff 100%);
        }
        .lp-solution-card-mint {
          background:linear-gradient(180deg,#e6fbf5 0%, #caf3e6 100%);
        }
        .lp-solution-card-default,
        .lp-solution-hover {
          position:absolute;
          inset:0;
          transition:opacity .28s ease, transform .28s ease;
        }
        .lp-solution-card-default {
          opacity:1;
          transform:translateY(0);
          padding:22px 20px 170px;
        }
        .lp-solution-hover {
          opacity:0;
          transform:translateY(8px);
          pointer-events:none;
          padding:20px;
          background:rgba(255,255,255,.12);
          backdrop-filter:blur(10px);
          border-radius:0;
          display:flex;
          flex-direction:column;
          justify-content:flex-start;
        }
        .lp-solution-card:hover .lp-solution-card-default {
          opacity:0;
          transform:translateY(-8px);
          pointer-events:none;
        }
        .lp-solution-card:hover .lp-solution-hover {
          opacity:1;
          transform:translateY(0);
          pointer-events:auto;
        }
        .lp-solution-detail-eyebrow {
          margin:0 0 16px;
          font-size:12px;
          font-weight:800;
          letter-spacing:.08em;
          text-transform:uppercase;
          color:#8c5a09;
        }
        .lp-solution-card-rose .lp-solution-detail-eyebrow { color:#8c2859; }
        .lp-solution-card-sky .lp-solution-detail-eyebrow { color:#0f5fa8; }
        .lp-solution-card-mint .lp-solution-detail-eyebrow { color:#0c6f68; }
        .lp-solution-icon-wrapper {
          width:32px;
          height:32px;
          display:flex;
          align-items:center;
          justify-content:center;
          margin-bottom:12px;
          color:#8c5a09;
        }
        .lp-solution-card-rose .lp-solution-icon-wrapper { color:#8c2859; }
        .lp-solution-card-sky .lp-solution-icon-wrapper { color:#0f5fa8; }
        .lp-solution-card-mint .lp-solution-icon-wrapper { color:#0c6f68; }
        .lp-solution-title {
          margin:0;
          font-family:'Sora', sans-serif;
          font-size:24px;
          line-height:1.1;
          letter-spacing:-.03em;
          color:#8c5a09;
          font-weight:700;
        }
        .lp-solution-card-rose .lp-solution-title { color:#8c2859; }
        .lp-solution-card-sky .lp-solution-title { color:#0f5fa8; }
        .lp-solution-card-mint .lp-solution-title { color:#0c6f68; }
        .lp-solution-card-image-wrap {
          position:absolute;
          left:20px;
          right:20px;
          bottom:-12%;
          height:200px;
          overflow:hidden;
          border-radius:0;
          padding:6px;
          box-sizing:border-box;
          background:transparent;
          z-index:0;
        }
        .lp-solution-card-image {
          width:100%;
          height:100%;
          object-fit:contain;
          object-position:center center;
          display:block;
          border-radius:10px;
          background:transparent;
        }
        .lp-solution-detail-list {
          list-style:none;
          margin:0;
          padding:0;
          display:flex;
          flex-direction:column;
          gap:12px;
          flex:1;
        }
        .lp-solution-detail-item {
          display:flex;
          align-items:flex-start;
          gap:10px;
          color:#8c5a09;
          font-size:13px;
          line-height:1.4;
          font-weight:500;
        }
        .lp-solution-card-rose .lp-solution-detail-item { color:#8c2859; }
        .lp-solution-card-sky .lp-solution-detail-item { color:#0f5fa8; }
        .lp-solution-card-mint .lp-solution-detail-item { color:#0c6f68; }
        .lp-solution-check {
          width:18px;
          height:18px;
          border-radius:50%;
          flex:0 0 18px;
          display:inline-flex;
          align-items:center;
          justify-content:center;
          background:#d9a20a;
          color:#fff;
          font-size:11px;
          font-weight:800;
          margin-top:3px;
        }
        .lp-solution-card-rose .lp-solution-check { background:#c44b84; }
        .lp-solution-card-sky .lp-solution-check { background:#1686d9; }
        .lp-solution-card-mint .lp-solution-check { background:#139980; }
        .lp-solution-cta {
          margin-top:auto;
          align-self:flex-start;
          border:none;
          border-radius:8px;
          padding:10px 18px;
          background:linear-gradient(135deg,#592ff1,#7a4dff);
          color:#fff;
          font-size:14px;
          font-weight:700;
          cursor:pointer;
          transition:transform .18s ease;
        }
        .lp-solution-cta:hover {
          transform:scale(1.04);
        }
        .lp-solution-preview {
          width:100%; border-radius:24px; overflow:hidden; background:transparent;
          box-shadow:none;
          margin-top:18px;
          position:relative;
          z-index:0;
        }
        .lp-solution-preview-top {
          display:flex; gap:8px; flex-wrap:wrap; margin-bottom:14px;
        }
        .lp-solution-preview-top span {
          display:inline-flex; align-items:center; height:26px; padding:0 10px; border-radius:999px;
          background:#ffffff; border:1px solid #e6ebf3; color:#475467; font-size:11px; font-weight:700;
        }
        .lp-solution-preview-body {
          display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:8px; align-items:end;
        }
        .lp-solution-bar {
          border-radius:10px 10px 4px 4px; background:linear-gradient(180deg,#7bb0ff,#1f4fa0);
          min-height:84px;
        }
        .lp-solution-bar-a { height:74px; opacity:.82; }
        .lp-solution-bar-b { height:104px; }
        .lp-solution-bar-c { height:58px; opacity:.68; }
        .lp-solution-chart {
          grid-column:1 / -1; height:10px; margin-top:10px; border-radius:999px;
          background:linear-gradient(90deg, rgba(31,79,160,.12), rgba(31,79,160,.52), rgba(31,79,160,.18));
        }
        .lp-problem-wrap { padding-top: 36px; }
        @keyframes lpRiseIn {
          from {
            opacity:0;
            transform:translateY(18px);
          }
          to {
            opacity:1;
            transform:translateY(0);
          }
        }
        @media (max-width: 980px) {
          .lp-menu { display:none; }
          .lp-headline { font-size:42px; }
          .lp-sub { font-size:17px; }
          .lp-preview-body { grid-template-columns:1fr; }
          .lp-hero-tab { padding:7px 10px; font-size:13px; }
          .lp-hero-tabs { justify-content:flex-start; }
          .lp-btn-hero-primary, .lp-btn-hero-secondary { font-size:14px; padding:10px 14px; }
          .lp-problem-section { grid-template-columns:1fr; }
          .lp-problem-row { grid-template-columns:56px minmax(0, 1fr); gap:14px; }
          .lp-problem-title { font-size:28px; }
          .lp-problem-card-title { font-size:20px; }
          .lp-connected-title { font-size:36px; }
          .lp-connected-flow { height: 560px; }
          .lp-connected-benefits { grid-template-columns:1fr; }
          .lp-solutions-head { align-items:flex-start; }
          .lp-solutions-title { font-size:34px; }
          .lp-solutions-grid { grid-template-columns:1fr; }
          .lp-solution-card { min-height:340px; }
          .lp-hero { padding:40px 22px 0; }
          .lp-nav { padding-top: 2px; }
          .lp-image-crop { aspect-ratio: 16 / 9; }
          .lp-products { display:none; }
        }
      `}</style>

      <section className="lp-hero-shell">
        <div className="lp-nav-shell">
          <div className="lp-wrap" style={{ paddingTop: 0, paddingBottom: 0 }}>
            <LandingNavbar />
          </div>
        </div>
        <div className="lp-wrap" style={{ paddingBottom: 0, paddingTop: 84 }} />
        <section style={{ width: "100%" }}>
          <div style={{ paddingTop: 0 }}>
            <section className="lp-hero" style={{ textAlign: "center" }}>
              <p className="lp-eyebrow">
                All-In-One Company Operating Platform
              </p>
              <h1 className="lp-headline">
                Run Your Entire Company
                <br />
                <span className="lp-headline-accent">on One Platform</span>
              </h1>
              <p className="lp-sub">
                Manage projects, teams, hiring, communication, and operations -
                all powered by AI, all in one unified platform.
              </p>
              <div className="lp-hero-actions">
                <Link to="/register" className="lp-btn-hero-primary" style={{ textDecoration: "none" }}>
                  Start Free Trial
                </Link>
                <a
                  href="https://calendly.com/shahbazrafique101/ryzent-demo"
                  target="_blank"
                  rel="noreferrer"
                  className="lp-btn-hero-secondary"
                  style={{ textDecoration: "none" }}
                >
                  Book Demo
                </a>
              </div>
              <div className="lp-hero-tabs">
                {heroTabs.map((tab) => (
                  <button
                    key={tab.label}
                    className={`lp-hero-tab ${activeTab === tab.label ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.label)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
              <div className={`lp-preview ${isImageTab ? "is-image" : ""}`}>
                <div className="lp-preview-header">
                  <div className="lp-preview-title">
                    <span className="lp-dot" />
                    {activeTabData.title}
                  </div>
                  <div className="lp-status">
                    <span className="lp-open">Open</span>
                    <span className="lp-delivered">Delivered</span>
                  </div>
                </div>
                <div className="lp-preview-body">
                  {isImageTab ? (
                    <div className="lp-image-crop">
                      <img
                        src={activeTabData.image}
                        alt={activeTabData.imageAlt || activeTabData.title}
                        className="lp-preview-image"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="lp-table">
                        <div className="lp-row head">
                          <span>Service</span>
                          <span>Budgeted Time Usage</span>
                          <span>Price</span>
                        </div>
                        {activeTabData.rows.map((row) => (
                          <div className="lp-row" key={row[0]}>
                            <span>{row[0]}</span>
                            <span>{row[1]}</span>
                            <span>{row[2]}</span>
                          </div>
                        ))}
                      </div>
                      <aside className="lp-side">
                        <h4>{activeTabData.sideTitle}</h4>
                        <div className="lp-field">
                          <label>Date</label>
                          <div>22 Nov</div>
                        </div>
                        <div className="lp-field">
                          <label>Person</label>
                          <div>John Smith</div>
                        </div>
                        <div className="lp-field">
                          <label>Service</label>
                          <div>Software license</div>
                        </div>
                        <div className="lp-field">
                          <label>Cost</label>
                          <div>10,000</div>
                        </div>
                      </aside>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>
        </section>
      </section>

      <div className="lp-wrap lp-problem-wrap">
        <ProblemSection pains={pains} />
      </div>

      <div className="lp-wrap">
        <SolutionsShowcase />
      </div>

      <div className="lp-wrap lp-problem-wrap">
        <ConnectedToolsSection />
      </div>

      <div className="lp-wrap">
        <KeyFeaturesSection />
        <SupportFeedbackSection />
      </div>
      <ProductCtaFooterSection />
    </div>
  );
}
