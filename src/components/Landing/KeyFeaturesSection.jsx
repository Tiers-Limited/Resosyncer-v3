const keyFeatures = [
  {
    id: "01",
    title: "Unified workspace",
    description:
      "Bring projects, teams, hiring, attendance, and communication into one source of truth.",
    imageSrc: "/KF1.png",
    imageAlt: "Unified workspace preview",
    label: "Operations Core",
  },
  {
    id: "02",
    title: "AI-powered automation",
    description:
      "Automate repetitive workflows, capture updates instantly, and keep execution moving without manual friction.",
    imageSrc: "/KF2.png",
      imageAlt: "AI automation preview",
    label: "Automation Layer",
  },
  {
    id: "03",
    title: "Rexa Interviewing Agent",
    description:
      "Streamline candidate screening with AI-driven interviews, real-time insights, and consistent evaluation across every applicant.",
    imageSrc: "/KF3.png",
      imageAlt: "AI interviewing agent in action",
    label: "Smart Interviewing",
  },
];

export default function KeyFeaturesSection() {
  return (
    <section className="relative mt-16 overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#f8fbff_0%,#eef4ff_100%)] px-6 py-14 md:mt-20 md:px-10 md:py-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-16 h-48 w-48 rounded-full bg-cyan-200/30 blur-3xl" />
        <div className="absolute -right-10 bottom-12 h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
            Ryzent Platform
          </p>
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 md:text-5xl">
            One platform. Total control.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-600 md:text-xl">
            Ryzent brings all your company operations into one powerful system -
            so your team can move faster, stay aligned, and scale without chaos.
          </p>
        </div>

        <div className="relative mt-12 space-y-8 md:mt-14 md:space-y-10">
          <div className="absolute left-5 top-8 hidden h-[calc(100%-4rem)] w-px bg-gradient-to-b from-blue-200 via-indigo-200 to-cyan-200 md:block" />

          {keyFeatures.map((feature, index) => {
            const reverse = index % 2 === 1;
            return (
              <article
                key={feature.title}
                className={`relative grid items-center gap-6 rounded-3xl border border-white/80 bg-white/90 p-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-12 md:gap-8 md:p-7 ${reverse ? "md:[&>*:first-child]:order-2" : ""}`}
              >
                <div className="absolute left-[1.1rem] top-7 hidden h-3.5 w-3.5 rounded-full border-2 border-blue-500 bg-white md:block" />

                <div className="md:col-span-5">
                  <div className="inline-flex items-center gap-3">
                    <span className="text-sm font-semibold text-blue-700">
                      {feature.id}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                      {feature.label}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600 md:text-base">
                    {feature.description}
                  </p>
                </div>

                <div className="md:col-span-7">
                  <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="aspect-[16/9] w-full rounded-xl border-2 border-dashed border-slate-300 bg-white">
                      {feature.imageSrc ? (
                        <img
                          src={feature.imageSrc}
                          alt={feature.imageAlt}
                          className="h-full w-full rounded-[0.65rem] object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-slate-500">
                          Add image here
                        </div>
                      )}
                    </div>
                    <span className="sr-only">{feature.imageAlt}</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
