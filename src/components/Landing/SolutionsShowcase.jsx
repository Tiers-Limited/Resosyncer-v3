import { Layers, Zap, Briefcase, BarChart3 } from "lucide-react";

const toneColors = {
  gold: "#8c5a09",
  rose: "#8c2859",
  sky: "#0f5fa8",
  mint: "#0c6f68",
};

const toneBg = {
  gold: "linear-gradient(to bottom, #fdf0c2, #f7d97a)",
  rose: "linear-gradient(to bottom, #fdd0e4, #f7a1c4)",
  sky: "linear-gradient(to bottom, #c8e4fa, #90c4f5)",
  mint: "linear-gradient(to bottom, #b8eeea, #72d9d0)",
};

const solutions = [
  {
    title: "All-in-One",
    tone: "gold",
    icon: Layers,
    image: "/Solution1.png",
    items: [
      "Projects & tasks managed in one shared workspace",
      "Teams & employees organized with full visibility",
      "Documents & workflows connected without extra tools",
    ],
  },
  {
    title: "AI Automation",
    tone: "rose",
    icon: Zap,
    image: "/Solution2.png",
    items: [
      "AI hiring & interviews to speed up screening",
      "Smart workflows that reduce repetitive manual work",
      "Automated standups & tasks that keep teams aligned",
    ],
  },
  {
    title: "Hiring & Growth",
    tone: "sky",
    icon: Briefcase,
    image: "/Solution3.png",
    description:
      "Handle recruitment pipelines, contracts, and internal coordination in one place as your company scales.",
    metrics: ["Pipeline", "Interviews", "Contracts"],
  },
  {
    title: "Insights & Reports",
    tone: "mint",
    icon: BarChart3,
    image: "/Solution4.png",
    items: [
      "Analytics dashboard for company-wide visibility",
      "Productivity tracking across projects and teams",
      "Business insights that support better decisions",
    ],
  },
];

export default function SolutionsShowcase() {
  return (
    <section className="lp-solutions-section">
      <div className="lp-solutions-head">
        <div>
          <p className="lp-solutions-eyebrow">Solutions</p>
          <h2 className="lp-solutions-title">
            One platform for <span>every core part of your company</span>
          </h2>
        </div>
      </div>

      <div className="lp-solutions-grid">
        {solutions.map((solution) => (
          <article
            key={solution.title}
            className={`lp-solution-card lp-solution-card-${solution.tone}`}
            style={{
              borderRadius: 20,
              background: toneBg[solution.tone],
            }}
          >
            <div className="lp-solution-card-default">
              <div
                className="lp-solution-icon-wrapper"
                style={{ color: toneColors[solution.tone] }}
              >
                <solution.icon size={24} strokeWidth={1.8} />
              </div>
              {solution.image && (
                <div
                  className="lp-solution-card-image-wrap"
                  style={{
                    borderRadius: 6,
                    overflow: "hidden",
                    background: "#fff", 
                  }}
                >
                  <img
                    className="lp-solution-card-image"
                    src={solution.image}
                    alt={solution.title}
                    loading="lazy"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              )}
              <h3
                className="lp-solution-title"
                style={{ color: toneColors[solution.tone] }}
              >
                {solution.title}
              </h3>
            </div>

            <div className="lp-solution-hover">
              <p className="lp-solution-detail-eyebrow">{solution.title}</p>
              {solution.description ? (
                <p
                  style={{
                    margin: 0,
                    color: "inherit",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    flex: 1,
                  }}
                >
                  {solution.description}
                </p>
              ) : (
                <ul className="lp-solution-detail-list">
                  {solution.items.map((item) => (
                    <li key={item} className="lp-solution-detail-item">
                      <span className="lp-solution-check">✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
