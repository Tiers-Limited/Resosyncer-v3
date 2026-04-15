import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { platformLinks, productGroups } from "../../../components/Landing/productCatalog";

function ProductCard({ item }) {
  return (
    <Link
      to={item.href}
      className="group relative overflow-hidden rounded-[20px] border border-[#d9e5f9] bg-white p-5 text-slate-900 no-underline shadow-[0_16px_30px_rgba(24,39,75,0.08)] transition hover:-translate-y-1 hover:shadow-[0_22px_42px_rgba(24,39,75,0.13)]"
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full opacity-35 blur-2xl"
        style={{ background: item.sectionAccent }}
      />
      <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-slate-500">
        {item.section}
      </p>
      <h3 className="mt-2 text-[22px] font-bold leading-tight text-[#13284f]">{item.label}</h3>
      <p className="mt-2 text-[14px] leading-6 text-slate-600">{item.summary}</p>
      <div className="mt-4 inline-flex items-center gap-1 text-[13px] font-bold text-[#1a4da7]">
        Explore module
        <ArrowRight size={14} className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export default function ProductPage() {
  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
      `}</style>
      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.76)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section className="bg-[linear-gradient(172deg,#f9fcff_0%,#eaf2ff_54%,#d9e7ff_100%)] pb-20 pt-32 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#1a4da7]">
            <Sparkles size={12} />
            Product ecosystem
          </p>
          <h1
            className="mt-4 max-w-4xl text-[clamp(34px,6vw,62px)] font-bold leading-[1.02] tracking-[-0.04em] text-[#0d1b34]"
          >
            Every Product Module,
            <br />
            Built to Work Together
          </h1>
          <p className="mt-5 max-w-3xl text-[16px] leading-7 text-slate-600 md:text-[18px]">
            Choose any module and go deeper. Operations, workflows, growth, and platform tools all connect in one
            clean operating system.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] space-y-10 px-6 pb-20 pt-10 md:px-10 md:pb-24">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_310px]">
          <div className="grid gap-6">
            {productGroups.map((group) => {
              const GroupIcon = group.icon;
              return (
                <article key={group.key} className="rounded-[26px] border border-[#dce6f9] bg-[#fbfdff] p-6">
                  <div className="mb-5 flex items-center gap-3">
                    <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${group.iconClass}`}>
                      <GroupIcon size={18} />
                    </span>
                    <h2 className="text-[27px] font-bold tracking-[-0.03em] text-[#13284f]">{group.title}</h2>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {group.links.map((item) => (
                      <ProductCard key={item.slug} item={item} />
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-[24px] border border-[#dee8fb] bg-[linear-gradient(180deg,#f5f8ff_0%,#eff4ff_100%)] p-5">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#5a6f95]">Platform</p>
            <div className="mt-3 space-y-2">
              {platformLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.slug}
                    to={item.href}
                    className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-[13px] font-bold text-slate-700 no-underline transition hover:text-[#1a4da7]"
                  >
                    <span className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${item.iconClass}`}>
                      <Icon size={15} />
                    </span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </aside>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
