import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Bot,
  Bug,
  Compass,
  Layers,
  Rocket,
  Sparkles,
  Star,
  Tag,
  Target,
  Users,
  Zap,
} from "lucide-react";
import Lottie from "lottie-react";
import { useEffect, useRef, useState } from "react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";

/* ─────────────────────── data ─────────────────────── */

const coreValues = [
  {
    title: "Simplicity is a superpower",
    text: "Complexity is the enemy of growth. We build for clarity - in our product, our pricing, and our communication. If it's not simple, we haven't finished building it yet.",
    Icon: Zap,
    color: "#e8f0fd",
    accent: "#194696",
  },
  {
    title: "One team, one truth",
    text: "Silos kill companies. We believe every person in your business deserves access to the same information, in the same place, at the same time.",
    Icon: Users,
    color: "#edf7f1",
    accent: "#0f6e56",
  },
  {
    title: "Built by operators, for operators",
    text: "We didn't build Ryzent from a whiteboard. We built it from frustration - from living the pain of too many tabs, too many tools, and too many monthly invoices. That experience lives in every feature we ship.",
    Icon: Layers,
    color: "#fef3e8",
    accent: "#854f0b",
  },
  {
    title: "AI should work for you - not confuse you",
    text: "We believe AI is only valuable when it's invisible - quietly making your operations smarter without adding a new learning curve. No gimmicks. Just intelligence that earns its place.",
    Icon: Bot,
    color: "#f3effe",
    accent: "#534ab7",
  },
  {
    title: "Flat pricing. Zero games.",
    text: "Hidden fees and per-seat pricing that punishes growth are relics of the old SaaS playbook. We're rewriting it. Your price stays flat because your success shouldn't cost you more.",
    Icon: Tag,
    color: "#e8f7fd",
    accent: "#0f6e7e",
  },
  {
    title: "Progress over perfection",
    text: "Growing businesses move fast. We move faster. We ship, we listen, we improve - because standing still in a moving market is the same as going backwards.",
    Icon: Rocket,
    color: "#fdeaea",
    accent: "#a32d2d",
  },
];

const founderMessage = [
  "I didn't set out to build another SaaS platform.",
  "I set out to fix a problem that was quietly costing us - time, money, and sanity.",
  "Like most growing businesses, we were running on a patchwork of tools. Project management over here. HR over there. Recruitment in one tab, contracts in another, team communications somewhere in between. Each tool made sense on its own. Together, they created chaos.",
  "We were paying for ten platforms that didn't talk to each other - and spending as much time managing our software stack as we were actually running the business.",
  "So we built Ryzent.",
  "Not because the market needed another all-in-one platform with a slick landing page - but because SMBs deserve better than duct tape and workarounds.",
  "Ryzent is everything your business needs to operate, hire, communicate, and grow - unified, intelligent, and priced so it actually makes sense for teams like yours.",
  "We're just getting started. And if you're tired of the chaos too - you're exactly who we built this for.",
  "Welcome to Ryzent.",
  "Founder & CEO, RYZENT",
];

/* Pills — static, no animation, exact layout from screenshot */
const pillsLeft = [
  {
    label: "New Features",
    Icon: Sparkles,
    rotate: "-7deg",
    style: { left: "2%", top: "16px" },
  },
  {
    label: "Release Notes",
    Icon: BookOpen,
    rotate: "-4deg",
    style: { left: "8%", top: "56px" },
  },
  {
    label: "Updates",
    Icon: Zap,
    rotate: "5deg",
    style: { left: "22%", top: "62px" },
  },
];
const pillsRight = [
  {
    label: "Monthly Updates",
    Icon: Bell,
    rotate: "6deg",
    style: { right: "4%", top: "20px" },
  },
  {
    label: "Highlights",
    Icon: Star,
    rotate: "-5deg",
    style: { right: "16%", top: "56px" },
  },
  {
    label: "Bug Fixes",
    Icon: Bug,
    rotate: "7deg",
    style: { right: "2%", top: "60px" },
  },
];

/* ─────────────── Lottie component (lottie-react) ─────────────── */
function LottieSearch() {
  const [animData, setAnimData] = useState(null);

  useEffect(() => {
    // lottie-react expects JSON animation data.
    // .lottie is a zipped binary — we attempt to fetch and parse it.
    // If the file is actually JSON rename it or export as JSON from LottieFiles.
    fetch("/Search.json")
      .then((r) => {
        const ct = r.headers.get("content-type") || "";
        // If served as JSON / text, parse directly
        if (ct.includes("json") || ct.includes("text")) return r.json();
        // Otherwise try reading as text first (some .lottie files ARE JSON)
        return r.text().then((t) => {
          try {
            return JSON.parse(t);
          } catch {
            return null;
          }
        });
      })
      .then((data) => {
        if (data) setAnimData(data);
      })
      .catch(() => {});
  }, []);

  if (!animData) return null;

  return (
    <Lottie
      animationData={animData}
      loop
      autoplay
      style={{ width: "100%", height: "100%" }}
    />
  );
}

/* ─────────────────────────── page ─────────────────────────────── */

export default function CompanyPage() {
  return (
    <div
      className="min-h-screen bg-[#f7f9fc] text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(22px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          from { background-position:-600px 0; }
          to   { background-position: 600px 0; }
        }
        @keyframes scalePop {
          from { transform:scale(.95); opacity:0; }
          to   { transform:scale(1);   opacity:1; }
        }
        @keyframes pulseGreen {
          0%   { box-shadow:0 0 0 0    rgba(34,216,120,.45); }
          70%  { box-shadow:0 0 0 14px rgba(34,216,120,0);   }
          100% { box-shadow:0 0 0 0    rgba(34,216,120,0);   }
        }
        @keyframes gradShift {
          0%,100% { background-position:0% 50%; }
          50%     { background-position:100% 50%; }
        }

        .hf  { animation:fadeUp .7s ease both; }
        .hf1 { animation-delay:.05s; }
        .hf2 { animation-delay:.14s; }
        .hf3 { animation-delay:.22s; }
        .hf4 { animation-delay:.30s; }

        .stat-card { transition:transform .22s ease,box-shadow .22s ease; }
        .stat-card:hover { transform:translateY(-4px); box-shadow:0 10px 32px rgba(25,70,150,.12); }

        .vc { transition:transform .22s ease,box-shadow .22s ease; }
        .vc:hover { transform:translateY(-4px); box-shadow:0 14px 40px rgba(0,0,0,.07); }
        .vc:hover .vc-icon { transform:scale(1.1); }
        .vc-icon { transition:transform .22s ease; display:flex; align-items:center; justify-content:center; }

        .cta-wrap {
          background:linear-gradient(135deg,#111d4a 0%,#1b3593 45%,#2452cc 100%);
          background-size:200% 200%;
          animation:gradShift 8s ease infinite, scalePop .55s ease both;
          border-radius:28px; position:relative; overflow:hidden;
        }
        .cta-wrap::before {
          content:''; position:absolute; inset:0; pointer-events:none;
          background:radial-gradient(ellipse at 72% 40%,rgba(120,160,255,.16) 0%,transparent 60%);
        }
        .cta-ring { position:absolute; border-radius:50%; pointer-events:none; border:1px solid rgba(255,255,255,.06); }

        .btn-green {
          background:#22d878; color:#fff; font-weight:700;
          border-radius:9999px; padding:13px 28px; font-size:14px;
          display:inline-flex; align-items:center; gap:6px;
          text-decoration:none; border:none; cursor:pointer;
          animation:pulseGreen 2.6s ease-out infinite;
          transition:background .18s,transform .18s;
        }
        .btn-green:hover { background:#17c264; transform:translateY(-1px); }

        .shimmer-badge {
          background:linear-gradient(90deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.20) 48%,rgba(255,255,255,.06) 100%);
          background-size:600px 100%; animation:shimmer 3s linear infinite;
        }

        .sl { display:inline-flex; align-items:center; gap:6px; font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:#194696; }

        .fq::before {
          content:'"'; position:absolute; top:-4px; left:-2px;
          font-size:110px; line-height:1; color:#e3eaf7;
          font-family:Georgia,serif; pointer-events:none; z-index:0;
        }
      `}</style>

      {/* Navbar */}
      <div className="fixed left-0 right-0 top-0 z-50 border-b border-white/40 bg-[rgba(255,255,255,.72)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      {/* ── Hero ── */}
      <section className="w-full bg-[linear-gradient(180deg,#f2f5fb_0%,#e7eefb_55%,#d9e5f8_100%)] pb-14 pt-[84px] text-center md:pt-[92px]">
        <div className="mx-auto max-w-[1240px] px-6 md:px-10">
          <p className="hf hf1 mx-auto inline-flex items-center rounded-full bg-[#dfe7f4] px-4 py-1 text-[11px] font-bold uppercase tracking-[.14em] text-[#2156a8]">
            Company
          </p>
          <h1 className="hf hf2 mx-auto mt-5 max-w-4xl text-[clamp(36px,5.4vw,64px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-[#0b1220]">
            Building the operating
            <br />
            <span className="text-[#194696]">layer teams actually use</span>
          </h1>
          <p className="hf hf3 mx-auto mt-5 max-w-3xl text-[16px] leading-8 text-slate-600">
            Ryzent AI unifies execution, people operations, communication, and
            growth workflows so teams can move with clarity and speed.
          </p>
          <div className="hf hf4 mx-auto mt-10 grid max-w-[560px] grid-cols-3 gap-5">
            {[
              ["6", "Core values"],
              ["1", "Unified platform"],
              ["24/7", "Operational visibility"],
            ].map(([v, l]) => (
              <div
                key={l}
                className="stat-card rounded-2xl border border-[#ccd8ef] bg-white/60 px-4 py-5 backdrop-blur-sm"
              >
                <p className="text-[42px] font-extrabold leading-none tracking-[-0.02em] text-[#194696]">
                  {v}
                </p>
                <p className="mt-2 text-[13px] text-slate-500">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1240px] px-4 pb-20 pt-8 md:px-8 md:pb-24">
        {/* ── Mission + Vision ── */}
        <section className="mt-8 grid gap-8 border-y border-slate-200 py-10 md:grid-cols-2">
          <article>
            <div className="sl">
              <Target size={14} />
              Our Mission
            </div>
            <p className="mt-4 text-[15px] leading-7 text-slate-700">
              To eliminate operational chaos for growing businesses by unifying
              their entire work stack under one intelligent roof.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-slate-700">
              Every day, thousands of SMBs lose time, money, and momentum
              switching between disconnected tools. We're on a mission to end
              that — by building the platform that thinks, connects, and grows
              with your business from day one.
            </p>
          </article>
          <article>
            <div className="sl">
              <Compass size={14} />
              Our Vision
            </div>
            <p className="mt-4 text-[15px] leading-7 text-slate-700">
              A world where growing businesses run on one platform — not twenty.
            </p>
            <p className="mt-3 text-[15px] leading-7 text-slate-700">
              We believe the future of work isn't more tools. It's smarter ones.
              Ryzent exists to give every SMB the operational clarity and
              AI-powered intelligence that was once only available to
              enterprises with million-dollar tech stacks — packaged into one
              platform, at a price that makes sense.
            </p>
          </article>
        </section>

        {/* ── Core Values ── */}
        <section className="mt-12 border-b border-slate-200 pb-14">
          <div className="flex items-end justify-between">
            <div>
              <div className="sl">
                <Users size={14} />
                Core Values
              </div>
              <h2 className="mt-2 text-[clamp(22px,2.6vw,32px)] font-extrabold tracking-[-0.025em] text-[#0b1220]">
                What we stand for
              </h2>
            </div>
            <p className="hidden text-[13px] text-slate-400 md:block">
              6 principles that guide every decision
            </p>
          </div>
          <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {coreValues.map(({ title, text, Icon, color, accent }, idx) => (
              <article
                key={title}
                className="vc group relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6"
              >
                <div
                  className="absolute left-0 right-0 top-0 h-[3px] rounded-t-2xl"
                  style={{ background: accent }}
                />
                <div className="mb-4 flex items-center justify-between">
                  <div
                    className="vc-icon h-11 w-11 rounded-xl"
                    style={{ background: color }}
                  >
                    <Icon size={20} color={accent} strokeWidth={1.8} />
                  </div>
                  <span
                    className="text-[30px] font-extrabold leading-none tracking-[-0.04em]"
                    style={{ color: accent, opacity: 0.08 }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                </div>
                <p
                  className="text-[12.5px] font-bold uppercase tracking-[.08em]"
                  style={{ color: accent }}
                >
                  {title}
                </p>
                <p className="mt-2 text-[14px] leading-[1.75] text-slate-500">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Founder Message ── */}
        <section className="mt-12 border-b border-slate-200 pb-14">
          <p className="sl">Founder message</p>
          <div className="mt-6 grid gap-8 md:grid-cols-[300px_minmax(0,1fr)]">
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
              <img
                src="/Founder.png"
                alt="Founder"
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="fq relative space-y-3 pt-8">
              {founderMessage.map((line, idx) => (
                <p
                  key={`${line}-${idx}`}
                  className={`relative z-10 text-[15px] leading-7 ${
                    idx === founderMessage.length - 1
                      ? "font-bold text-[#194696]"
                      : "text-slate-700"
                  }`}
                >
                  {idx === founderMessage.length - 1 ? `— ${line}` : line}
                </p>
              ))}
            </div>
          </div>
        </section>

        {/* ── Careers / Lookout CTA ── */}
        <section className="mt-12">
          <div className="cta-wrap px-8 py-12 md:px-14 md:py-16">
            <div
              className="cta-ring"
              style={{ width: 480, height: 480, top: -180, right: -110 }}
            />
            <div
              className="cta-ring"
              style={{ width: 280, height: 280, bottom: -100, left: -70 }}
            />
            <div className="relative z-10 grid items-center gap-10 md:grid-cols-[1fr_300px]">
              <div>
                <h2 className="mt-2 text-[clamp(26px,3.8vw,46px)] font-extrabold leading-[1.06] tracking-[-0.03em] text-white">
                  We're Always on the
                  <br />
                  <span className="text-[#22d878]">
                    Lookout for More Talent
                  </span>
                </h2>
                <p className="mt-4 max-w-md text-[15px] leading-7 text-white/60">
                  Check out our Careers page to see if we have a position open
                  for you. We move fast, build in the open, and love people who
                  care deeply about craft.
                </p>
                <div className="mt-8">
                  <a
                    href="https://www.linkedin.com/company/sia-ryzent/?viewAsMember=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-green"
                  >
                    See Open Positions <ArrowUpRight size={15} />
                  </a>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {["Remote-first", "Flat hierarchy"].map(
                    (label) => (
                      <span
                        key={label}
                        className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-white/75"
                      >
                        {label}
                      </span>
                    ),
                  )}
                </div>
              </div>
              {/* Lottie */}
              <div className="flex items-center justify-center">
                <div
                  style={{
                    width: "300px",
                    height: "300px",
                    filter: "drop-shadow(0 12px 48px rgba(80,120,255,.3))",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle,rgba(120,160,255,.18) 0%,transparent 70%)",
                    }}
                  />
                  <LottieSearch />
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
