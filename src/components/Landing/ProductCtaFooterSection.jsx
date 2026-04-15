import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

export default function ProductCtaFooterSection() {
  const footerLinkMap = {
    "About Ryzent AI": "/company",
    Careers: "/careers",
    "Project Management": "/product/project-management",
    "Leads CRM": "/product/leads-crm",
    "AI Automations": "/ai",
    "Activity Monitor": "/product/activity-monitor",
    Communication: "/product/communication",
    Attendance: "/product/attendance",
    "Ryzent vs Asana": "/compare/asana",
    "Ryzent vs Monday.com": "/compare/monday",
    "Ryzent vs ClickUp": "/compare/clickup",
    "Ryzent vs Notion": "/compare/notion",
    "Ryzent vs Jira": "/compare/jira",
    "Help Center": "/product/support",
    "Trust Center": "/trust-center",
    "System Status": "/status",
  };

  const socialLinks = [
    { label: "LinkedIn", href: "https://lnkd.in/dWqK_R-z", icon: Linkedin },
    { label: "Facebook", href: "https://facebook.com/sia.ryzent", icon: Facebook },
    { label: "Instagram", href: "https://instagram.com/sia.ryzent", icon: Instagram },
    { label: "X", href: "https://x.com/siaryzent", icon: null },
    { label: "YouTube", href: "https://youtube.com/@siaryzent", icon: Youtube },
  ];

  const navigate = useNavigate();
  const footerColumns = [
    {
      title: "Company",
      items: ["About Ryzent AI", "Careers"],
      extraTitle: "Support",
      extraItems: ["Help Center", "Trust Center", "System Status"],
    },
    {
      title: "Platform",
      items: [
        "Project Management",
        "Leads CRM",
        "AI Automations",
        "Activity Monitor",
        "Communication",
        "Attendance",
      ],
    },
    {
      title: "Industry",
      items: [
        "Tech Startups",
        "Professional Services",
        "Marketing Teams",
        "Operations & HR",
        "Finance Teams",
        "Product Organizations",
      ],
    },
    {
      title: "Resources",
      items: [
        "Ryzent Academy",
        "Blog",
        "Documentation",
        "Implementation Guides",
        "Release Notes",
        "Community",
      ],
    },
    {
      title: "Compare",
      items: [
        "Ryzent vs Asana",
        "Ryzent vs Monday.com",
        "Ryzent vs ClickUp",
        "Ryzent vs Notion",
        "Ryzent vs Jira",
      ],
    },
    {
      title: "Guides & Tools",
      items: [
        "Operational Playbook",
        "AI Workflow Templates",
        "Capacity Planning Guide",
        "Hiring Pipeline Guide",
        "Project Health Dashboard Guide",
        "ROI Calculator",
        "Automation Readiness Checklist",
      ],
    },
  ];

  return (
    <section className="mt-16 w-full overflow-hidden bg-[#c8d7f3] md:mt-20">
      <div className="mx-auto max-w-[1400px] px-6 py-14 md:px-12 md:py-16">
        <div className="grid items-start gap-10 md:grid-cols-[minmax(0,1fr),minmax(0,470px)]">
          <div>
            <h2 className="max-w-3xl text-2xl font-bold leading-[1.1] tracking-tight text-slate-950 md:text-5xl">
              <span className="text-[#113477]">Reach Operational</span>
              <br />
              <span className="text-[#113477]">Excellence</span> With Ryzent
            </h2>
          </div>

          <div className="pt-1">
            <form
              className="flex flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                navigate("/register");
              }}
            >
              <input
                type="email"
                placeholder="Enter your work email"
                className="h-12 w-full rounded-full border border-slate-300 bg-white/90 px-5 text-base text-slate-700 outline-none placeholder:text-slate-500 focus:border-[#4a32e4]"
              />
              <button
                type="submit"
                className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#4a32e4] px-6 text-sm font-semibold text-white transition hover:bg-[#3f2acc]"
              >
                Start free trial
              </button>
            </form>
            <p className="mt-4 text-sm text-slate-900">
              Free 14-day trial. Cancel anytime.
            </p>
          </div>
        </div>
      </div>

      <footer className="bg-[#06080d] text-white">
        <div className="mx-auto max-w-[1400px] px-6 pb-8 pt-12 md:px-12 md:pt-14">
          <div className="grid gap-10 md:grid-cols-3 xl:grid-cols-6">
            {footerColumns.map((column) => (
              <div key={column.title}>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-white/90">
                  {column.title}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-white/90">
                  {column.items.map((item) => (
                    <li key={item}>
                      {footerLinkMap[item] ? (
                        <Link to={footerLinkMap[item]} className="text-white/90 no-underline hover:text-white">
                          {item}
                        </Link>
                      ) : (
                        item
                      )}
                    </li>
                  ))}
                </ul>
                {column.extraTitle ? (
                  <>
                    <p className="mt-7 text-xs font-bold uppercase tracking-[0.12em] text-white/90">
                      {column.extraTitle}
                    </p>
                    <ul className="mt-4 space-y-2 text-sm leading-6 text-white/90">
                      {column.extraItems?.map((item) => (
                        <li key={item}>
                          {footerLinkMap[item] ? (
                            <Link to={footerLinkMap[item]} className="text-white/90 no-underline hover:text-white">
                              {item}
                            </Link>
                          ) : (
                            item
                          )}
                        </li>
                      ))}
                    </ul>
                  </>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-14 flex flex-col gap-6 border-t border-white/10 pt-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {socialLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <a
                    key={item.label}
                    href={item.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={item.label}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#113477] text-white no-underline"
                  >
                    {Icon ? (
                      <Icon size={18} />
                    ) : (
                      <span className="text-[14px] font-bold leading-none">X</span>
                    )}
                  </a>
                );
              })}
            </div>

            <p className="text-sm text-white/85 md:text-base">
              © Ryzent AI
            </p>

            <div className="flex items-center gap-3 text-xs text-white/85 md:text-sm">
              <span>Privacy policy</span>
              <span>•</span>
              <span>Terms & conditions</span>
            </div>
          </div>
        </div>
      </footer>
    </section>
  );
}
