import {
  ArrowUpRight,
  Briefcase,
  Clock3,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const principles = [
  {
    title: "Craft with accountability",
    body: "We focus on outcomes, not activity. Every decision should move customer value and operational clarity forward.",
    Icon: ShieldCheck,
  },
  {
    title: "Move quickly, communicate clearly",
    body: "We operate with urgency and keep context visible across the team so execution stays aligned.",
    Icon: Sparkles,
  },
  {
    title: "Build for growing teams",
    body: "Our users run lean teams with big goals. We obsess over usability, speed, and practical impact.",
    Icon: Users,
  },
];

const benefits = [
  "Remote-first collaboration with async-friendly workflows",
  "Direct exposure to customer feedback and product strategy",
  "Fast learning loops across engineering, product, and operations",
];

const hiringSteps = [
  "Intro call to align on role expectations and impact",
  "Skills and problem-solving interview with the relevant team",
  "Collaboration round focused on communication and execution",
  "Final conversation on ownership, growth, and team fit",
];

export default function CareersPage() {
  const [careerAnimation, setCareerAnimation] = useState(null);

  useEffect(() => {
    fetch("/career.json")
      .then((res) => res.json())
      .then((data) => setCareerAnimation(data))
      .catch(() => setCareerAnimation(null));
  }, []);

  return (
    <div
      className="min-h-screen bg-[#f7f9fc] text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/40 bg-[rgba(255,255,255,.72)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section className="w-full bg-[linear-gradient(180deg,#f2f6ff_0%,#e6eefc_55%,#dae6f9_100%)] pb-14 pt-[86px] md:pt-[94px]">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 md:grid-cols-[1fr_420px] md:px-10">
          <div>
            <p className="inline-flex items-center rounded-full bg-[#dbe7fb] px-4 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#2156a8]">
              Careers at Ryzent
            </p>
            <h1 className="mt-5 text-[clamp(34px,5.2vw,62px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0b1220]">
              Build the Operating Layer
              <br />
              <span className="text-[#194696]">Growing Teams Rely On</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-8 text-slate-600">
              We are building software that unifies how companies execute, hire,
              communicate, and scale. If you love solving real operational
              problems with thoughtful product work, we would love to connect.
            </p>
            <div className="mt-9 grid max-w-[760px] gap-4 sm:grid-cols-3">
              {[
                ["Remote-first", Globe2],
                ["High ownership", Briefcase],
                ["Long-term impact", HeartHandshake],
              ].map(([label, Icon]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-[#cfddf5] bg-white/75 p-4"
                >
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7efff] text-[#194696]">
                    <Icon size={17} />
                  </span>
                  <p className="mt-3 text-[14px] font-semibold text-[#17315d]">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            {careerAnimation ? (
              <Lottie
                animationData={careerAnimation}
                loop
                autoplay
                style={{ width: "100%", height: 320 }}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm font-semibold text-slate-400">
                Career animation preview
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 md:px-8 md:pb-24">
        <section className="grid gap-5 md:grid-cols-3">
          {principles.map(({ title, body, Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-[#dfE7f8] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#1a4da7]">
                <Icon size={17} />
              </span>
              <h2 className="mt-4 text-[22px] font-bold leading-[1.1] tracking-[-0.02em] text-[#12284e]">
                {title}
              </h2>
              <p className="mt-3 text-[14px] leading-7 text-slate-600">{body}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 grid gap-5 md:grid-cols-2">
          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Why people join
            </p>
            <h3 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[#13284f]">
              Team Benefits
            </h3>
            <div className="mt-4 space-y-3">
              {benefits.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-[#e8eefb] bg-[#f8fbff] px-4 py-3 text-[14px] leading-6 text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Hiring process
            </p>
            <h3 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[#13284f]">
              What to Expect
            </h3>
            <div className="mt-4 space-y-3">
              {hiringSteps.map((item, idx) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-[#e8eefb] bg-[#f8fbff] p-3"
                >
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[12px] font-bold text-[#1a4da7]">
                    {idx + 1}
                  </span>
                  <p className="text-[14px] leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="mt-10 rounded-[26px] border border-[#d8e6ff] bg-[linear-gradient(150deg,#f7fbff_0%,#edf4ff_100%)] p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)] md:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Open roles
              </p>
              <h3 className="mt-2 text-[34px] font-bold leading-[1.02] tracking-[-0.03em] text-[#13284f]">
                No Openings Right Now
              </h3>
              <p className="mt-3 max-w-2xl text-[15px] leading-7 text-slate-600">
                We are not actively hiring at this moment. You can still share
                your profile and we will reach out when a relevant role opens.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d2e1fb] bg-white px-4 py-2 text-[12px] font-bold text-[#1a4da7]">
              <Clock3 size={14} />
              Updated for current hiring cycle
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="https://www.linkedin.com/company/sia-ryzent/?viewAsMember=true"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[#1a4da7] bg-white px-5 py-2.5 text-[12px] font-bold text-[#1a4da7] no-underline"
            >
              Follow on LinkedIn
              <ArrowUpRight size={14} />
            </a>
            <Link
              to="/company"
              className="rounded-full border border-[#d5e3fb] bg-white px-5 py-2.5 text-[12px] font-bold text-[#334155] no-underline"
            >
              Learn About Ryzent
            </Link>
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
