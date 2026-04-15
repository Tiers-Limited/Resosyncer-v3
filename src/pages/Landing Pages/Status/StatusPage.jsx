import {
  Activity,
  CheckCircle2,
  Clock3,
  Globe2,
  ShieldCheck,
} from "lucide-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const systems = [
  { name: "Web App", status: "Operational", uptime: "99.99%" },
  { name: "API Services", status: "Operational", uptime: "99.98%" },
  { name: "Authentication", status: "Operational", uptime: "99.99%" },
  { name: "Realtime Sync", status: "Operational", uptime: "99.97%" },
  { name: "Support Services", status: "Operational", uptime: "99.95%" },
  { name: "Data Backups", status: "Operational", uptime: "100%" },
];

export default function StatusPage() {
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

      <section className="w-full bg-[linear-gradient(180deg,#edf7f3_0%,#e6f3ee_55%,#d8ece4_100%)] pb-14 pt-[86px] md:pt-[94px]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10">
          <p className="inline-flex items-center rounded-full bg-[#d4ebe2] px-4 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#0f6e56]">
            System Status
          </p>
          <h1 className="mt-5 text-[clamp(34px,5.2vw,62px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0b1220]">
            Ryzent Platform
            <br />
            <span className="text-[#0f6e56]">Operational</span>
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-8 text-slate-600">
            Live health overview for core systems at{" "}
            <span className="font-semibold text-[#0f6e56]">ryzent.co</span>.
            Check uptime, maintenance activity, and recent incidents in one
            place.
          </p>
          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-[#cfe6dc] bg-white/85 px-4 py-2 text-[12px] font-bold text-[#0f6e56]">
            <Activity size={14} />
            All monitored systems are currently operational
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 md:px-8 md:pb-24">
        <section className="grid gap-5 md:grid-cols-3">
          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecf9f4] text-[#0f6e56]">
              <CheckCircle2 size={17} />
            </span>
            <p className="mt-4 text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[#102a43]">
              100% Operational
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Core system availability in the current monitoring window.
            </p>
          </article>
          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecf9f4] text-[#0f6e56]">
              <Clock3 size={17} />
            </span>
            <p className="mt-4 text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[#102a43]">
              30-Day Uptime
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Overall platform uptime remains above service targets.
            </p>
          </article>
          <article className="rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecf9f4] text-[#0f6e56]">
              <ShieldCheck size={17} />
            </span>
            <p className="mt-4 text-[26px] font-bold leading-[1.05] tracking-[-0.02em] text-[#102a43]">
              Active Monitoring
            </p>
            <p className="mt-2 text-[13px] leading-6 text-slate-600">
              Security and infrastructure signals are continuously observed.
            </p>
          </article>
        </section>

        <section className="mt-10 rounded-2xl border border-[#dce7fb] bg-white p-6 shadow-[0_16px_30px_rgba(21,51,101,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500">
                Components
              </p>
              <h2 className="mt-1 text-[32px] font-bold leading-[1.04] tracking-[-0.03em] text-[#13284f]">
                Service Health
              </h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#d2e1fb] bg-[#f8fbff] px-3 py-1.5 text-[11px] font-semibold text-slate-600">
              <Globe2 size={13} />
              Updated in near real-time
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {systems.map((item) => (
              <article
                key={item.name}
                className="flex items-center justify-between rounded-xl border border-[#e8eefb] bg-[#f8fbff] px-4 py-3"
              >
                <div>
                  <p className="text-[15px] font-bold text-[#13284f]">{item.name}</p>
                  <p className="text-[12px] text-slate-500">Uptime: {item.uptime}</p>
                </div>
                <span className="rounded-full border border-[#bfe8d7] bg-[#ecf9f4] px-3 py-1 text-[11px] font-bold text-[#0f6e56]">
                  {item.status}
                </span>
              </article>
            ))}
          </div>
        </section>

      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
