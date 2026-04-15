import { Bot, Brain, CheckCircle2, Sparkles } from "lucide-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const aiCapabilities = [
  {
    title: "AI Contract Builder",
    desc: "Generate, refine, and standardize contract drafts quickly with AI-assisted structure and language suggestions.",
    points: ["Faster draft creation", "Consistent contract format", "Reduced manual legal prep time"],
    image: "/AI1.png",
  },
  {
    title: "AI Employee Training",
    desc: "Support onboarding and upskilling with AI-guided training recommendations, summaries, and progress insights.",
    points: ["Role-based learning guidance", "Faster onboarding readiness", "Smarter training follow-up"],
    image: "/AI2.png",
  },
  {
    title: "AI Employee Matching",
    desc: "Recommend best-fit team members for tasks based on skills, workload, and priorities.",
    points: ["Faster assignment decisions", "Balanced workloads", "Better delivery outcomes"],
    image: "/AI3.png",
  },
  {
    title: "Meeting Intelligence",
    desc: "Auto-generate meeting summaries, decisions, and next actions to improve follow-through.",
    points: ["AI notes in seconds", "Action extraction", "Owner-level accountability"],
    image: "/AI4.png",
  },
  {
    title: "CRM AI Analysis",
    desc: "Score leads, surface insights, and trigger reminders so follow-ups are never missed.",
    points: ["Lead quality insights", "Smart reminders", "Pipeline velocity support"],
    image: "/AI5.png",
  },
  {
    title: "REXA Agentic Interviews",
    desc: "Accelerate recruitment with AI-driven interview workflows and candidate signal summaries.",
    points: ["Consistent evaluation", "Faster shortlisting", "Structured decision support"],
    image: "/AI6.png",
  },
];

function VisualImage({ title, image }) {
  return (
    <figure className="overflow-hidden rounded-[18px] border border-[#d8e2f1] bg-white shadow-[0_10px_22px_rgba(15,23,42,0.08)]">
      <img src={image} alt={`${title} preview`} className="h-auto w-full object-cover" loading="lazy" />
    </figure>
  );
}

export default function AIPage() {
  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.72)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_34%,#dce7fb_72%,#c2d3f1_100%)] pb-14 pt-24 md:pb-18">
        <div className="mx-auto max-w-[1240px] px-6 text-center md:px-10">
          <p className="mx-auto mt-6 inline-flex items-center gap-1.5 rounded-full bg-[#e8effe] px-4 py-1 text-xs font-bold uppercase tracking-[.12em] text-[#194696]">
            <Sparkles size={12} />
            AI by Ryzent
          </p>
          <h1 className="mx-auto mt-4 max-w-4xl text-3xl font-bold leading-[1.1] tracking-tight text-[#0b1220] md:text-5xl">
            Practical AI for Real
            <br />
            <span className="text-[#194696]">Operational Work</span>
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-base text-slate-700 md:text-lg">
            Ryzent AI is built into projects, meetings, CRM, and recruitment so teams get measurable outcomes, not just automation demos.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-6 pb-20 pt-12 md:px-10 md:pb-24">
        <section className="border-y border-slate-200 py-8">
          <div className="flex items-center gap-2 text-[#194696]">
            <Brain size={16} />
            <p className="text-xs font-bold uppercase tracking-[.14em]">How AI is used</p>
          </div>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-700">
            Every AI capability is designed to reduce manual effort, improve decision quality, and keep teams moving faster with clearer context.
          </p>
        </section>

        <section className="mt-10 space-y-8">
          {aiCapabilities.map((item, idx) => (
            <div key={item.title} className={`grid items-center gap-6 border-b border-slate-200 pb-8 md:grid-cols-2 ${idx % 2 === 1 ? "md:[&>*:first-child]:order-2 md:[&>*:last-child]:order-1" : ""}`}>
              <div>
                <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] text-[#194696]">
                  <Bot size={13} />
                  AI Capability
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#0b1220] md:text-3xl">{item.title}</h2>
                <p className="mt-3 text-[15px] leading-7 text-slate-600">{item.desc}</p>
                <ul className="mt-4 space-y-2">
                  {item.points.map((point) => (
                    <li key={point} className="flex items-start gap-2 text-sm text-slate-700">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-[#194696]" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <VisualImage title={item.title} image={item.image} />
            </div>
          ))}
        </section>

        <section className="mt-10 border border-[#d6e0ef] bg-[linear-gradient(180deg,#f4f8ff_0%,#e6efff_100%)] px-6 py-8">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[.12em] text-[#194696]">
            <Sparkles size={13} />
            AI Principle
          </p>
          <p className="mt-3 max-w-4xl text-[15px] leading-7 text-slate-700">
            Ryzent AI prioritizes explainability, workflow relevance, and operational impact. We focus on AI that helps people execute better decisions every day.
          </p>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
