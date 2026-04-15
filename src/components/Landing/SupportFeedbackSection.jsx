import { useEffect, useRef, useState } from "react";
import { Pause, RotateCcw } from "lucide-react";

const feedbackItems = [
  {
    quote:
      "Working with the Ryzent support team feels completely different. Fast replies, clear ownership, and follow-through every time.",
    name: "Bryan Casler",
    company: "4Site Interactive Studios",
    emphasis: false,
  },
  {
    quote:
      "As always, Ryzent support responses are exceptional, practical, and appreciated.",
    name: "Ben de Jong",
    company: "The Cut",
    emphasis: false,
  },
  {
    quote:
      "Every time Ryzent writes to me, I wonder why the other systems we use cannot deliver service anywhere near this level.",
    name: "Grace Nelson",
    company: "Northline Group",
    emphasis: true,
  },
  {
    quote:
      "Fast, clear, and reliable. We never feel blocked when something urgent comes up because Ryzent support is already one step ahead.",
    name: "Elliot Adams",
    company: "Bright Ops",
    emphasis: false,
  },
];

export default function SupportFeedbackSection() {
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef(null);
  const listRef = useRef(null);
  const offsetRef = useRef(0);
  const heightRef = useRef(0);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    const updateHeight = () => {
      if (!listRef.current) return;
      heightRef.current = listRef.current.offsetHeight;
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const speed = 32; // px/sec

    const tick = (ts) => {
      if (!trackRef.current || !heightRef.current) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (!lastTsRef.current) {
        lastTsRef.current = ts;
      }

      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!isPaused) {
        offsetRef.current += speed * dt;
        if (offsetRef.current >= heightRef.current) {
          offsetRef.current -= heightRef.current;
        }
      }

      trackRef.current.style.transform = `translateY(-${offsetRef.current}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
  }, [isPaused]);

  const restartTicker = () => {
    offsetRef.current = 0;
    if (trackRef.current) {
      trackRef.current.style.transform = "translateY(0px)";
    }
    setIsPaused(false);
  };

  return (
    <section className="mt-16 px-1 py-8 md:mt-20 md:py-10">
      <div className="grid gap-10 md:grid-cols-[320px,minmax(0,1fr)] md:gap-10">
        <aside className="md:sticky md:top-24 md:self-start">
          <h2 className="whitespace-nowrap text-[2rem] font-bold tracking-tight text-slate-900 md:text-[2.2rem] md:leading-[1.05]">
            Rely on{" "}
            <span className="text-[#0f4ca3]">
              Our Support
            </span>
          </h2>
          <p className="mt-3 max-w-[30ch] text-sm leading-6 text-slate-600">
            Real people, real ownership, and fast help whenever your team needs
            it.
          </p>

          <div className="mt-10 space-y-8">
            <div>
              <p className="text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
                24/7
              </p>
              <p className="mt-2 text-sm font-semibold uppercase tracking-[0.12em] text-indigo-500">
                Support
              </p>
            </div>
          </div>
        </aside>

        <div className="min-h-[25rem] rounded-2xl bg-transparent p-4 md:-mt-4 md:justify-self-end md:w-[640px] md:p-5">
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              aria-label={isPaused ? "Resume autoplay" : "Pause autoplay"}
              onClick={() => setIsPaused((prev) => !prev)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-300 text-indigo-500 transition hover:bg-indigo-50"
            >
              <Pause size={18} />
            </button>
            <button
              type="button"
              aria-label="Restart autoplay"
              onClick={restartTicker}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-indigo-300 text-indigo-500 transition hover:bg-indigo-50"
            >
              <RotateCcw size={18} />
            </button>
          </div>

          <div className="relative mt-6 h-[460px] overflow-hidden">
            <div ref={trackRef} className="will-change-transform">
              <div ref={listRef} className="space-y-6">
                {feedbackItems.map((item) => (
                  <article
                    key={`${item.name}-${item.company}`}
                    className="pb-6"
                  >
                    <p
                      className={`text-base leading-7 text-slate-800 md:text-xl md:leading-8 ${item.emphasis ? "font-semibold" : "font-normal"}`}
                    >
                      "{item.quote}"
                    </p>
                    <p className="mt-4 text-sm font-bold uppercase tracking-tight text-slate-900 md:text-base">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-700 md:text-sm">
                      {item.company}
                    </p>
                  </article>
                ))}
              </div>

              <div className="mt-6 space-y-6" aria-hidden="true">
                {feedbackItems.map((item) => (
                  <article
                    key={`${item.name}-${item.company}-clone`}
                    className="pb-6"
                  >
                    <p
                      className={`text-base leading-7 text-slate-800 md:text-xl md:leading-8 ${item.emphasis ? "font-semibold" : "font-normal"}`}
                    >
                      "{item.quote}"
                    </p>
                    <p className="mt-4 text-sm font-bold uppercase tracking-tight text-slate-900 md:text-base">
                      {item.name}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-wide text-slate-700 md:text-sm">
                      {item.company}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-white/90 to-transparent" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/90 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
