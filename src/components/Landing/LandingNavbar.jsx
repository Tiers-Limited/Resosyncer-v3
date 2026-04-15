import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, Menu, Sparkles, X } from "lucide-react";
import { platformLinks, productGroups } from "./productCatalog";
import { useAuth } from "../../contexts/AuthContext";

const navItems = [
  { label: "Pricing", href: "/pricing" },
  { label: "Solutions", href: "/solutions" },
  { label: "Resources", href: "/resources" },
  { label: "Company", href: "/company" },
  { label: "AI", href: "/ai", icon: true },
];

const TRANSLATE_LANGUAGES = [
  { value: "es", label: "Spanish", native: "Spanish", code: "ES", country: "es" },
  { value: "pt", label: "Portuguese", native: "Portuguese", code: "PT", country: "pt" },
  { value: "ru", label: "Russian", native: "Russian", code: "RU", country: "ru" },
  { value: "lv", label: "Latvian", native: "Latvian", code: "LV", country: "lv" },
  { value: "en", label: "English", native: "English", code: "EN", country: "us" },
  { value: "de", label: "German", native: "German", code: "DE", country: "de" },
  { value: "ar", label: "Arabic", native: "Arabic", code: "AR", country: "sa" },
  { value: "fr", label: "French", native: "French", code: "FR", country: "fr" },
  { value: "zh-CN", label: "Chinese", native: "Chinese", code: "ZH", country: "cn" },
];

export default function LandingNavbar() {
  const { profile, signOut } = useAuth();
  const [openProducts, setOpenProducts] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const closeTimerRef = useRef(null);

  const selectedLanguageObj =
    TRANSLATE_LANGUAGES.find((lang) => lang.value === selectedLanguage) ||
    TRANSLATE_LANGUAGES.find((lang) => lang.value === "en") ||
    TRANSLATE_LANGUAGES[0];
  const isLoggedIn = !!profile?.id;
  const companyOrName = profile?.company_name || profile?.full_name || "Account";
  const roleLabel = (profile?.role || "Member")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
  const avatarLetter = (companyOrName || "A").trim().charAt(0).toUpperCase();
  const accountImage =
    profile?.user_photo || profile?.company_logo_url || profile?.logo_url || null;

  const handleLogout = async () => {
    await signOut();
    setMobileOpen(false);
    window.location.href = "/";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initGoogleTranslate = () => {
      if (!window.google?.translate?.TranslateElement) return;
      if (document.querySelector(".goog-te-combo")) return;

      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          autoDisplay: false,
          includedLanguages: TRANSLATE_LANGUAGES.map((lang) => lang.value).join(","),
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
        },
        "google_translate_element"
      );
    };

    window.googleTranslateElementInit = initGoogleTranslate;

    if (window.google?.translate?.TranslateElement) {
      initGoogleTranslate();
      return;
    }

    const scriptId = "google-translate-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const match = document.cookie.match(/(?:^|;\s*)googtrans=\/en\/([^;]+)/);
    if (!match?.[1]) return;
    const cookieLang = decodeURIComponent(match[1]);
    if (TRANSLATE_LANGUAGES.some((lang) => lang.value === cookieLang)) {
      setSelectedLanguage(cookieLang);
    }
  }, []);

  const applyGoogleLanguage = (value, attempt = 0) => {
    const langValue = value || "en";
    const googValue = `/en/${langValue}`;
    document.cookie = `googtrans=${googValue}; path=/`;
    document.cookie = `googtrans=${googValue}; path=/; domain=${window.location.hostname}`;

    const combo = document.querySelector(".goog-te-combo");
    if (combo) {
      combo.value = langValue;
      combo.dispatchEvent(new Event("change", { bubbles: true }));
      return;
    }

    if (attempt < 10) {
      setTimeout(() => applyGoogleLanguage(langValue, attempt + 1), 200);
      return;
    }

    window.location.reload();
  };

  const openMenu = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setOpenProducts(true);
  };

  const closeMenuWithDelay = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    closeTimerRef.current = setTimeout(() => {
      setOpenProducts(false);
      closeTimerRef.current = null;
    }, 180);
  };

  const handleLangSelect = (value) => {
    setSelectedLanguage(value);
    setLanguageOpen(false);
    applyGoogleLanguage(value);
  };

  return (
    <>
      <nav className="lp-nav relative z-50 flex items-center justify-between gap-4 bg-transparent px-0 py-3">
        <Link to="/" className="lp-brand flex items-center gap-2 font-extrabold text-2xl text-slate-900 no-underline">
          Ryzent AI
        </Link>

        <ul className="lp-menu hidden items-center gap-5 text-slate-700 md:flex">
          <li className="lp-menu-item" onMouseEnter={openMenu} onMouseLeave={closeMenuWithDelay}>
            <button
              className="inline-flex items-center gap-1 bg-transparent text-base font-semibold"
              onClick={() => setOpenProducts((v) => !v)}
              onFocus={openMenu}
              aria-expanded={openProducts}
            >
              Products <ChevronDown size={14} />
            </button>
          </li>

          {navItems.map((n) => (
            <li key={n.label}>
              <Link to={n.href} className={`text-base font-semibold no-underline ${n.icon ? "inline-flex items-center gap-1.5 text-slate-700" : "text-slate-700"}`}>
                {n.icon ? <Sparkles size={14} /> : null}
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <div className="relative">
            <button
              onClick={() => setLanguageOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d3def1] bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700"
            >
              <img
                src={`https://flagcdn.com/w20/${selectedLanguageObj.country}.png`}
                alt={`${selectedLanguageObj.label} flag`}
                className="h-3.5 w-5 rounded-[2px] object-cover"
                loading="lazy"
              />
              <span>{selectedLanguageObj.code}</span>
            </button>
            {languageOpen && (
              <div className="absolute right-0 top-11 z-[80] w-[230px] rounded-xl border border-[#dbe7ff] bg-white p-2 shadow-[0_18px_40px_rgba(40,67,118,0.16)]">
                {TRANSLATE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLangSelect(lang.value)}
                    className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${selectedLanguage === lang.value ? "bg-[#edf4ff] text-[#194696]" : "text-slate-700 hover:bg-slate-50"}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <img
                        src={`https://flagcdn.com/w20/${lang.country}.png`}
                        alt={`${lang.label} flag`}
                        className="h-3.5 w-5 rounded-[2px] object-cover"
                        loading="lazy"
                      />
                      <span>{lang.native}</span>
                    </span>
                    <span className="text-[10px] font-bold">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          {isLoggedIn ? (
            <details className="relative">
              <summary className="list-none rounded-xl border border-[rgba(196,206,221,0.62)] bg-[rgba(255,255,255,0.58)] px-2.5 py-1.5 backdrop-blur-xl">
                <span className="flex cursor-pointer items-center gap-2">
                  {accountImage ? (
                    <img
                      src={accountImage}
                      alt={companyOrName}
                      className="h-7 w-7 rounded-full border border-[rgba(196,206,221,0.55)] bg-[rgba(255,255,255,0.82)] object-cover"
                    />
                  ) : (
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(196,206,221,0.55)] bg-[rgba(255,255,255,0.82)] text-xs font-bold text-[#8191a7]">
                      {avatarLetter}
                    </span>
                  )}
                  <span className="leading-tight">
                    <span className="block max-w-[160px] truncate text-[11px] font-bold text-slate-900">
                      {companyOrName}
                    </span>
                    <span className="block text-[11px] text-slate-500">{roleLabel}</span>
                  </span>
                </span>
              </summary>
              <div className="absolute right-0 top-11 z-[90] w-[180px] rounded-xl border border-[#dbe3f3] bg-white/95 p-1.5 shadow-[0_16px_35px_rgba(22,38,64,0.18)] backdrop-blur-md">
                <Link
                  to="/dashboard"
                  className="block rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 no-underline hover:bg-[#f3f7ff]"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="block w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-xs font-semibold text-[#b13f3f] hover:bg-[#fff4f4]"
                >
                  Log Out
                </button>
              </div>
            </details>
          ) : (
            <>
              <a
                href="https://calendly.com/shahbazrafique101/ryzent-demo"
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-[#7093d8] bg-white px-4 py-1.5 text-xs font-bold text-[#0f3ea8] no-underline"
              >
                Book a Demo
              </a>
              <Link to="/signin" className="rounded-xl bg-gradient-to-br from-[#0f2f6e] to-[#194696] px-4 py-1.5 text-xs font-bold text-white no-underline">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center bg-transparent text-slate-700 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </nav>

      {openProducts && (
        <div
          className="fixed left-0 right-0 top-[60px] z-40 hidden border-y border-[#dbe7ff] bg-white md:block"
          onMouseEnter={openMenu}
          onMouseLeave={closeMenuWithDelay}
        >
          <div className="mx-auto w-full max-w-[1240px] px-6 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_260px] gap-5">
              <div className="grid grid-cols-3 gap-5">
                {productGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.title} className="px-1 py-0.5">
                      <div className="mb-2.5 flex items-center gap-2 text-lg font-bold text-slate-900">
                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${group.iconClass}`}>
                          <Icon size={17} />
                        </span>
                        <span>{group.title}</span>
                      </div>
                      <div className="flex flex-col gap-1 border-l border-[#e8eef9] pl-3">
                        {group.links.map((link) => (
                          <Link key={link.label} to={link.href} className="text-[15px] leading-6 font-medium text-slate-700 no-underline transition hover:translate-x-1 hover:text-[#0f4ca3]">
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="rounded-2xl border border-[#e3eaf6] bg-[#f5f7fb] px-3 py-3.5">
                <p className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">Platform</p>
                <div className="flex flex-col gap-2">
                  {platformLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.label}
                        to={link.href}
                        className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-[13px] font-bold text-slate-700 no-underline transition hover:bg-white hover:text-[#0f4ca3]"
                      >
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${link.iconClass}`}>
                          <Icon size={14} />
                        </span>
                        <span>{link.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-[120] md:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 z-[120] bg-black/35"
          />
          <aside className="absolute left-0 top-0 z-[121] h-screen w-[320px] max-w-[88vw] overflow-auto border-r border-[#dbe7ff] bg-white p-4 shadow-[0_20px_44px_rgba(16,24,40,0.24)]">
            <p className="mb-3 text-lg font-extrabold tracking-[-0.01em] text-slate-900">
              Ryzent AI
            </p>
            <button
              onClick={() => setMobileProductsOpen((v) => !v)}
              className="mb-2 flex w-full items-center justify-between border-b border-[#e4ebf8] px-1 py-2.5 text-left text-sm font-bold text-slate-800"
            >
              <span>Products</span>
              <ChevronDown size={16} className={`transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`} />
            </button>

            {mobileProductsOpen && (
              <div className="mb-4 space-y-4 border border-[#e9eef8] bg-[#f9fbff] p-3">
                {productGroups.map((group) => {
                  const Icon = group.icon;
                  return (
                    <div key={group.title}>
                      <p className="mb-2 inline-flex items-center gap-1.5 text-sm font-bold text-slate-900">
                        <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${group.iconClass}`}>
                          <Icon size={13} />
                        </span>
                        {group.title}
                      </p>
                      <div className="space-y-1 pl-4">
                        {group.links.map((link) => (
                          <Link
                            key={link.label}
                            to={link.href}
                            onClick={() => setMobileOpen(false)}
                            className="block text-sm text-slate-700 no-underline"
                          >
                            {link.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-[#e4ebf8] pt-3">
                  <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.08em] text-slate-500">
                    Platform
                  </p>
                  <div className="space-y-1">
                    {platformLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.label}
                          to={link.href}
                          onClick={() => setMobileOpen(false)}
                          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-white"
                        >
                          <span className={`inline-flex h-6 w-6 items-center justify-center rounded-md ${link.iconClass}`}>
                            <Icon size={13} />
                          </span>
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            <div className="mb-4 space-y-2">
              {navItems.map((n) => (
                <Link
                  key={n.label}
                  to={n.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 border-b border-[#edf2fb] px-1 py-2.5 text-sm font-semibold text-slate-800 no-underline"
                >
                  {n.icon ? <Sparkles size={14} /> : null}
                  {n.label}
                </Link>
              ))}
            </div>

            <div className="mb-4 border border-[#e6edf9] p-3">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#194696]">Languages</p>
              <div className="grid grid-cols-2 gap-2">
                {TRANSLATE_LANGUAGES.map((lang) => (
                  <button
                    key={lang.value}
                    onClick={() => handleLangSelect(lang.value)}
                    className={`rounded-lg border px-2 py-2 text-left text-xs ${selectedLanguage === lang.value ? "border-[#194696] bg-[#edf4ff] text-[#194696]" : "border-[#e4ebf8] text-slate-700"}`}
                  >
                    <div className="inline-flex items-center gap-1.5 font-semibold">
                      <img
                        src={`https://flagcdn.com/w20/${lang.country}.png`}
                        alt={`${lang.label} flag`}
                        className="h-3.5 w-5 rounded-[2px] object-cover"
                        loading="lazy"
                      />
                      <span>{lang.native}</span>
                    </div>
                    <div className="text-[10px] text-slate-500">{lang.code}</div>
                  </button>
                ))}
              </div>
            </div>

            {isLoggedIn ? (
              <details className="rounded-xl border border-[rgba(196,206,221,0.62)] bg-[rgba(255,255,255,0.58)] p-2 backdrop-blur-xl">
                <summary className="list-none">
                  <span className="flex cursor-pointer items-center gap-2">
                    {accountImage ? (
                      <img
                        src={accountImage}
                        alt={companyOrName}
                        className="h-7 w-7 rounded-full border border-[rgba(196,206,221,0.55)] bg-[rgba(255,255,255,0.82)] object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[rgba(196,206,221,0.55)] bg-[rgba(255,255,255,0.82)] text-xs font-bold text-[#8191a7]">
                        {avatarLetter}
                      </span>
                    )}
                    <span className="leading-tight">
                      <span className="block max-w-[180px] truncate text-[11px] font-bold text-slate-900">
                        {companyOrName}
                      </span>
                      <span className="block text-[11px] text-slate-500">{roleLabel}</span>
                    </span>
                  </span>
                </summary>
                <div className="mt-2 space-y-1">
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 no-underline hover:bg-[#f3f7ff]"
                  >
                    Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="block w-full rounded-lg border-none bg-transparent px-3 py-2 text-left text-sm font-semibold text-[#b13f3f] hover:bg-[#fff4f4]"
                  >
                    Log Out
                  </button>
                </div>
              </details>
            ) : (
              <div className="flex gap-2">
                <a
                  href="https://calendly.com/shahbazrafique101/ryzent-demo"
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 rounded-xl border border-[#7093d8] bg-white px-4 py-2 text-center text-sm font-bold text-[#0f3ea8] no-underline"
                >
                  Book a Demo
                </a>
                <Link
                  to="/signin"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-xl bg-gradient-to-br from-[#0f2f6e] to-[#194696] px-4 py-2 text-center text-sm font-bold text-white no-underline"
                >
                  Get Started
                </Link>
              </div>
            )}
          </aside>
        </div>
      )}
      <div id="google_translate_element" className="absolute -left-[9999px] top-0 h-0 w-0 overflow-hidden" />
      <style>{`
        iframe.goog-te-banner-frame,
        .goog-te-banner-frame.skiptranslate,
        body > .skiptranslate {
          display: none !important;
        }
        html,
        body {
          top: 0 !important;
          margin-top: 0 !important;
        }
        #goog-gt-tt,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
      `}</style>
    </>
  );
}


