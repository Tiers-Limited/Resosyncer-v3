export default function ProblemSection({ pains }) {
  return (
    <section className="lp-problem-section">
      <div className="lp-problem-intro">
        <p className="lp-problem-eyebrow">Problems</p>
        <h2 className="lp-problem-title">
          Managing a company shouldn&apos;t feel chaotic
        </h2>
        <p className="lp-problem-copy">
          Too many disconnected workflows create friction across execution,
          communication, and decision-making. What should feel clear starts to
          feel fragmented.
        </p>
      </div>

      <div className="lp-problem-stage">
        <div className="lp-problem-list">
        {pains.map((pain, index) => (
          <article
            key={pain}
            className="lp-problem-row"
            style={{ animationDelay: `${index * 70}ms` }}
          >
            <span className="lp-problem-index">
              {(index + 1).toString().padStart(2, "0")}
            </span>
            <div className="lp-problem-row-body">
              <h3 className="lp-problem-card-title">{pain}</h3>
              <p className="lp-problem-card-copy">
              This slows teams down, breaks context, and adds more manual work
              than a growing company should have to carry.
              </p>
            </div>
          </article>
        ))}
        </div>
        <div className="lp-problem-note">
          <p className="lp-problem-note-label">Why it matters</p>
          <p className="lp-problem-note-copy">
            The result is slower execution, weaker visibility, and a company
            that becomes harder to run as it grows.
          </p>
        </div>
      </div>
    </section>
  );
}
