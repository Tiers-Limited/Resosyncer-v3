import {
  CheckCircle2,
  Database,
  FileCheck2,
  Globe2,
  LockKeyhole,
  Server,
  Shield,
} from "lucide-react";
import Lottie from "lottie-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const trustPillars = [
  {
    title: "Security by design",
    body: "Platform features are designed with layered access controls and continuous hardening practices.",
    Icon: LockKeyhole,
  },
  {
    title: "Data governance",
    body: "Data handling follows least-privilege principles with clear controls for access and retention.",
    Icon: Database,
  },
  {
    title: "Reliable infrastructure",
    body: "Operational monitoring and resilient architecture support business-critical uptime.",
    Icon: Server,
  },
];

const controls = [
  "Role-based access control across organization workspaces",
  "Encrypted transport for platform data in motion",
  "Audit-friendly workflows for support and issue handling",
  "Incident response process with clear escalation paths",
  "Structured backup and recovery safeguards",
  "Ongoing monitoring for suspicious access patterns",
];

const faq = [
  {
    q: "Where can I check service availability?",
    a: "Use the public status page from the footer link to monitor ongoing incidents and uptime updates.",
  },
  {
    q: "How can my team request security details?",
    a: "Reach out through support and request trust or security documentation for your review process.",
  },
  {
    q: "Does Ryzent support secure operational workflows?",
    a: "Yes. Access controls, process visibility, and support escalation are designed for accountable team operations.",
  },
];

export default function TrustCenterPage() {
  const [trustAnimation, setTrustAnimation] = useState(null);

  useEffect(() => {
    fetch("/TrustCenter.json")
      .then((res) => res.json())
      .then((data) => setTrustAnimation(data))
      .catch(() => setTrustAnimation(null));
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

      <section className="w-full bg-[linear-gradient(180deg,#edf4ff_0%,#e2ecff_58%,#d8e5fb_100%)] pb-14 pt-[86px] md:pt-[94px]">
        <div className="mx-auto grid max-w-[1240px] items-center gap-8 px-6 md:grid-cols-[1fr_420px] md:px-10">
          <div>
            <p className="inline-flex items-center rounded-full bg-[#dae7ff] px-4 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#2156a8]">
              Trust Center
            </p>
            <h1 className="mt-5 text-[clamp(34px,5.2vw,62px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0b1220]">
              Security, Privacy, and
              <br />
              <span className="text-[#194696]">Operational Reliability</span>
            </h1>
            <p className="mt-5 max-w-3xl text-[16px] leading-8 text-slate-600">
              This page outlines how Ryzent approaches security controls, platform
              reliability, and responsible data practices for modern teams.
            </p>
            <div className="mt-8 grid max-w-[760px] gap-4 sm:grid-cols-3">
              {[
                ["Secure access", Shield],
                ["Clear controls", FileCheck2],
                ["Global usage", Globe2],
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
            {trustAnimation ? (
              <Lottie
                animationData={trustAnimation}
                loop
                autoplay
                style={{ width: "100%", height: 320 }}
              />
            ) : (
              <div className="flex h-[320px] items-center justify-center text-sm font-semibold text-slate-400">
                Trust Center animation preview
              </div>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 md:px-8 md:pb-24">
        <section className="grid gap-5 md:grid-cols-3">
          {trustPillars.map(({ title, body, Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-[#dfe7f8] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]"
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

        <section className="mt-10 grid gap-5 md:grid-cols-[1.2fr_1fr]">
          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Core controls
            </p>
            <h3 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[#13284f]">
              Trust Safeguards Across the Platform
            </h3>
            <div className="mt-4 space-y-3">
              {controls.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-2 rounded-xl border border-[#e8eefb] bg-[#f8fbff] p-3"
                >
                  <CheckCircle2 size={15} className="mt-1 text-[#1a4da7]" />
                  <p className="text-[14px] leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
          </article>

          <aside className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
              Contact
            </p>
            <h3 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[#13284f]">
              Security and Trust Requests
            </h3>
            <p className="mt-3 text-[14px] leading-7 text-slate-600">
              Need documentation for procurement, legal review, or security
              validation? Our team can help route your request quickly.
            </p>
            <div className="mt-5 space-y-3">
              <a
                href="mailto:security@ryzent.co"
                className="block rounded-xl border border-[#d7e6ff] bg-[#f8fbff] px-4 py-3 text-[13px] font-semibold text-[#1a4da7] no-underline"
              >
                security@ryzent.co
              </a>
              <Link
                to="/product/support"
                className="block rounded-xl border border-[#d7e6ff] bg-white px-4 py-3 text-[13px] font-semibold text-[#334155] no-underline"
              >
                Open Support Center
              </Link>
            </div>
          </aside>
        </section>

        <section className="mt-10 rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
            FAQs
          </p>
          <h3 className="mt-2 text-[30px] font-bold leading-[1.08] tracking-[-0.03em] text-[#13284f]">
            Common Trust Questions
          </h3>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {faq.map((item) => (
              <article
                key={item.q}
                className="rounded-xl border border-[#e8eefb] bg-[#f8fbff] p-4"
              >
                <p className="text-[15px] font-bold leading-6 text-[#13284f]">
                  {item.q}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-slate-600">
                  {item.a}
                </p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
