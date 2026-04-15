import { useMemo, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

const plans = [
  {
    name: "Starter",
    seats: "Up to 20 employees",
    monthly: 99,
    annual: 1069,
    freeTrialAvailable: true,
    features: [
      "Executive dashboard",
      "Project management",
      "Team management",
      "Basic workforce management",
      "Meeting management",
      "Time & attendance tracking",
      "Basic attendance analytics",
    ],
  },
  {
    name: "Growth",
    seats: "Up to 50 employees",
    monthly: 149,
    annual: 1609,
    freeTrialAvailable: false,
    free_trial_available: false,
    featured: true,
    features: [
      "Everything in Starter",
      "Advanced attendance analytics",
      "Standup reporting",
      "Request management",
      "AI lead management (basic CRM)",
      "Internal communications",
      "AI contract builder",
      "Basic recruitment system",
    ],
  },
  {
    name: "Pro",
    seats: "Up to 100 employees",
    monthly: 249,
    annual: 2689,
    freeTrialAvailable: false,
    features: [
      "Everything in Growth",
      "Advanced analytics dashboard",
      "Full workforce management suite",
      "AI recruitment module",
      "Learning & development",
      "Payment management",
      "Priority chat support",
    ],
  },
  {
    name: "Enterprise",
    seats: "100+ employees (unlimited scaling)",
    freeTrialAvailable: false,
    features: [
      "Everything in Pro",
      "Unlimited storage",
      "Dedicated account manager",
      "24/7 priority support (chat + phone)",
      "Custom integrations",
      "Advanced security & compliance",
    ],
  },
];

const comparisonRows = [
  {
    feature: "Employee capacity",
    starter: "Up to 20",
    growth: "Up to 50",
    pro: "Up to 100",
    enterprise: "Unlimited",
  },
  {
    feature: "Project management",
    starter: "Yes",
    growth: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Attendance analytics",
    starter: "Basic",
    growth: "Advanced",
    pro: "Advanced",
    enterprise: "Advanced",
  },
  {
    feature: "Standup reporting",
    starter: "No",
    growth: "Yes",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "AI lead management",
    starter: "No",
    growth: "Basic CRM",
    pro: "Advanced",
    enterprise: "Custom",
  },
  {
    feature: "AI recruitment module",
    starter: "No",
    growth: "Basic",
    pro: "Full",
    enterprise: "Full + custom workflow",
  },
  {
    feature: "Learning & development",
    starter: "No",
    growth: "No",
    pro: "Yes",
    enterprise: "Yes",
  },
  {
    feature: "Support level",
    starter: "Standard",
    growth: "Priority email",
    pro: "Priority chat",
    enterprise: "24/7 chat + phone",
  },
  {
    feature: "Integrations",
    starter: "Standard",
    growth: "Standard",
    pro: "Standard",
    enterprise: "Custom",
  },
  {
    feature: "Account manager",
    starter: "No",
    growth: "No",
    pro: "No",
    enterprise: "Dedicated",
  },
];

function CorePlanCard({ plan, cycle, onFreeTrialClick }) {
  const isAnnual = cycle === "annual";
  const unitPrice = isAnnual ? plan.annual : plan.monthly;
  const hasFreeTrialRaw =
    plan.free_trial_available !== undefined ? plan.free_trial_available : plan.freeTrialAvailable;
  const hasFreeTrial =
    typeof hasFreeTrialRaw === "string"
      ? hasFreeTrialRaw.toLowerCase() === "true"
      : hasFreeTrialRaw === true;
  const cardTheme =
    plan.name === "Starter"
      ? {
          border: "border-[#9fb1cd]",
          heading: "text-[#11284f]",
          button: "bg-[linear-gradient(90deg,#18345f,#0e2140)]",
          topBar: "bg-[linear-gradient(90deg,#1f3e70,#132d56)]",
          icon: "text-[#153463]",
        }
      : plan.name === "Growth"
      ? {
          border: "border-[#7f9fc7]",
          heading: "text-[#0f2952]",
          button: "bg-[linear-gradient(90deg,#1d457b,#0f2851)]",
          topBar: "bg-[linear-gradient(90deg,#285590,#153a6f)]",
          icon: "text-[#19447b]",
        }
      : {
          border: "border-[#96abc9]",
          heading: "text-[#10274d]",
          button: "bg-[linear-gradient(90deg,#1b3c6d,#102a50)]",
          topBar: "bg-[linear-gradient(90deg,#1f467d,#16345f)]",
          icon: "text-[#1a3f72]",
        };

  return (
    <article
      onClick={onFreeTrialClick}
      className={`relative flex h-full flex-col rounded-[24px] border px-6 pb-6 pt-6 shadow-[0_8px_18px_rgba(15,23,42,0.08)] ${
        plan.featured
          ? `${cardTheme.border} bg-transparent`
          : `${cardTheme.border} bg-transparent`
      } ${onFreeTrialClick ? "cursor-pointer" : ""}`}
    >
      {plan.featured ? (
        <div className={`absolute inset-x-0 top-0 h-9 rounded-t-[22px] ${cardTheme.topBar}`}>
          <p className="pt-2.5 text-center text-[10px] font-bold uppercase tracking-[0.12em] text-white">
            Recommended
          </p>
        </div>
      ) : null}

      <div className={plan.featured ? "pt-7" : "pt-0"}>
        <p className={`text-[1.5rem] font-bold tracking-tight ${cardTheme.heading}`}>{plan.name}</p>
        <p className="mt-1 text-[13px] text-slate-600">{plan.seats}</p>

        <div className="mt-4 flex items-end gap-1.5">
          <span className="text-[2.4rem] font-semibold tracking-tight text-slate-900">€{unitPrice}</span>
          <span className="pb-1 text-xl text-slate-500">/{isAnnual ? "year" : "month"}</span>
        </div>

        <p className="mt-2 text-[1.05rem] font-semibold text-slate-900">total €{unitPrice}/{isAnnual ? "year" : "month"}</p>
        <p className="mt-1 text-[0.95rem] text-slate-600">billed {isAnnual ? "annually" : "monthly"}</p>

        <button
          onClick={onFreeTrialClick}
          className={`mt-5 w-full rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 ${cardTheme.button}`}
        >
          {hasFreeTrial ? "Free trials available" : "Get started"}
        </button>

        <ul className="mt-5 space-y-2.5">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[13px] text-slate-700">
              <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${cardTheme.icon}`} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}

function EnterpriseCard() {
  return (
    <article className="flex h-full flex-col rounded-[24px] border border-[#9ab0cf] bg-transparent px-6 pb-6 pt-6 shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
      <p className="text-[1.5rem] font-bold tracking-tight text-[#0f2952]">Enterprise</p>
      <p className="mt-1 text-[13px] text-slate-600">100+ employees (unlimited scaling)</p>

      <div className="mt-4">
        <p className="text-[2.4rem] font-semibold tracking-tight text-slate-900">Let's talk</p>
        <p className="mt-2 text-[1.05rem] font-semibold text-slate-900">custom plan for growing teams</p>
        <p className="mt-1 text-[0.95rem] text-slate-600">annual or monthly billing available</p>
      </div>

      <button className="mt-5 w-full rounded-full border border-[#173865] bg-white px-5 py-2.5 text-sm font-semibold text-[#173865] transition hover:bg-[#eef4ff]">
        Talk to sales
      </button>

      <ul className="mt-5 space-y-2.5">
        {plans[3].features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-[13px] text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#19447b]" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function PricingPage() {
  const [cycle, setCycle] = useState("monthly");
  const navigate = useNavigate();

  const savingsLabel = useMemo(() => {
    const monthlyYear = plans[1].monthly * 12;
    const annual = plans[1].annual;
    const save = Math.round(((monthlyYear - annual) / monthlyYear) * 100);
    return `save up to ${save}%`;
  }, []);

  return (
    <div
      className='min-h-screen bg-white text-slate-900'
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

      <section className="bg-[linear-gradient(180deg,#ffffff_0%,#f4f8ff_34%,#dce7fb_72%,#c2d3f1_100%)] pb-14 pt-24 md:pb-16">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10">
          <h1 className="mx-auto mt-6 max-w-4xl text-center text-3xl font-bold leading-[1.12] tracking-tight text-[#0b1220] md:mt-10 md:text-5xl">
            Choose the Right Plan
            <br />
            <span className="text-[#194696]">for Your Business</span>
          </h1>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <div className="inline-flex rounded-full border border-[#2c4e81] bg-[#f4f8ff] p-1">
              <button
                onClick={() => setCycle("monthly")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                  cycle === "monthly" ? "bg-[#163764] text-white" : "text-slate-700"
                }`}
              >
                MONTHLY
              </button>
              <button
                onClick={() => setCycle("annual")}
                className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
                  cycle === "annual" ? "bg-[#163764] text-white" : "text-slate-700"
                }`}
              >
                YEARLY
              </button>
            </div>

            <p className="text-base font-semibold text-[#194696]">{savingsLabel}</p>
          </div>

          <div className="mt-10 rounded-[24px] bg-transparent">
            <div className="grid gap-4 lg:grid-cols-4">
              <div>
                <CorePlanCard plan={plans[0]} cycle={cycle} onFreeTrialClick={() => navigate("/register")} />
              </div>
              <div>
                <CorePlanCard plan={plans[1]} cycle={cycle} onFreeTrialClick={() => navigate("/register")} />
              </div>
              <div>
                <CorePlanCard plan={plans[2]} cycle={cycle} onFreeTrialClick={() => navigate("/register")} />
              </div>
              <div>
                <EnterpriseCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1280px] px-6 pb-16 pt-16 md:px-10 md:pb-24">
        <div className="overflow-hidden rounded-[24px] border border-slate-300 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200 bg-[linear-gradient(180deg,#eff4ff_0%,#e5eeff_100%)] px-5 py-6 md:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#163865]">Package Comparison</p>
            <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950 md:text-2xl">
              Compare plans side by side
            </h2>
            <p className="mt-2 text-sm text-slate-600 md:text-base">
              Full feature matrix to help your team choose confidently.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500 md:px-8">
                    Features
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Starter</th>
                  <th className="bg-[#eaf1ff] px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-[#193e72]">Growth</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Pro</th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, idx) => (
                  <tr key={row.feature} className={idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"}>
                    <td className="px-6 py-4 text-sm font-semibold text-slate-900 md:px-8">{row.feature}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{row.starter}</td>
                    <td className="bg-[#f3f7ff] px-5 py-4 text-sm font-semibold text-[#193e72]">{row.growth}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{row.pro}</td>
                    <td className="px-5 py-4 text-sm text-slate-700">{row.enterprise}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <ProductCtaFooterSection />
    </div>
  );
}
