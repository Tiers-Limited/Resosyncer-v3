import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  ChevronDown,
  HelpCircle,
  MessageSquareText,
  PlayCircle,
  Search,
} from "lucide-react";
import { Modal } from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { supabase } from "../../../lib/supabase";
import RichHtmlRenderer from "../../../components/common/RichHtmlRenderer";
import { toYouTubeEmbedUrl } from "../../../lib/youtube";
import { extractResourceSubtype } from "../../../lib/resourceContentMeta";

const TABS = [
  { key: "documentation", label: "Documentation", icon: BookOpen },
  { key: "tutorials", label: "Tutorials", icon: PlayCircle },
  { key: "blogs_updates", label: "Blogs", icon: MessageSquareText },
  { key: "faqs", label: "FAQs", icon: HelpCircle },
];

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

function FaqItem({ title, answerHtml, summary }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-slate-200 rounded-xl overflow-hidden bg-white transition-shadow duration-200"
      style={{ boxShadow: open ? "0 2px 14px rgba(25,70,150,0.07)" : "none" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left group"
        style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
      >
        <span className="text-sm font-700 text-slate-900 font-bold">{title}</span>
        <ChevronDown
          size={16}
          className="text-[#7aaae8] flex-shrink-0 ml-3 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div className="px-5 pb-4">
          {answerHtml ? (
            <RichHtmlRenderer
              html={answerHtml}
              className="text-[13px] leading-[1.7] text-slate-500 rs-rich-content"
            />
          ) : (
            <p className="text-[13px] leading-[1.7] text-slate-500">
              {summary || "No answer yet."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ResourceCardsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white">
          <div className="rs-skeleton h-5 w-3/4 rounded mb-3" />
          <div className="rs-skeleton h-3 w-full rounded mb-2" />
          <div className="rs-skeleton h-3 w-11/12 rounded mb-2" />
          <div className="rs-skeleton h-3 w-2/3 rounded mb-4" />
          <div className="rs-skeleton h-4 w-28 rounded" />
        </div>
      ))}
    </div>
  );
}

function ResourceFaqSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="border border-slate-200 rounded-xl bg-white px-5 py-4">
          <div className="rs-skeleton h-4 w-4/5 rounded mb-2" />
          <div className="rs-skeleton h-3 w-full rounded" />
        </div>
      ))}
    </div>
  );
}

export default function ResourcesPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("documentation");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoTitle, setVideoTitle] = useState("");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState("");

  useEffect(() => {
    let mounted = true;

    const fetchResources = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_resources")
        .select(
          "id, category, title, summary, content_html, external_url, cover_image_url, sort_order, created_at",
        )
        .eq("is_published", true)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        console.error("Failed to load resources:", error);
        setItems([]);
      } else {
        setItems(data || []);
      }
      setLoading(false);
    };

    fetchResources();
    return () => {
      mounted = false;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (items || []).filter((item) => {
      if (item.category !== activeTab) return false;
      if (!q) return true;
      const haystack = `${item.title || ""} ${item.summary || ""} ${stripHtml(
        item.content_html || "",
      )}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, activeTab, search]);

  const activeTabMeta = TABS.find((t) => t.key === activeTab) || TABS[0];
  const ActiveIcon = activeTabMeta.icon;

  useEffect(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    const allowed = new Set(TABS.map((t) => t.key));
    if (tab && allowed.has(tab) && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [location.search, activeTab]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    const params = new URLSearchParams(location.search);
    params.set("tab", tabKey);
    navigate({ pathname: "/resources", search: params.toString() }, { replace: true });
  };

  const openTutorialVideo = (item) => {
    const embed = toYouTubeEmbedUrl(item.external_url);
    if (!embed) return;
    setVideoTitle(item.title || "Tutorial");
    setVideoEmbedUrl(embed);
    setVideoOpen(true);
  };

  const closeTutorialVideo = () => {
    setVideoOpen(false);
    setVideoTitle("");
    setVideoEmbedUrl("");
  };

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .tab-active { color: #194696 !important; border-bottom-color: #194696 !important; }
        .rs-card:hover { border-color: #7aaae8 !important; box-shadow: 0 4px 18px rgba(25,70,150,0.09); }
        .rs-rich-content { padding: 0 !important; }
        .rs-rich-content p { margin: 0 0 10px; }
        .rs-rich-content ul, .rs-rich-content ol { margin: 0 0 10px 18px; }
        .rs-rich-content a { color: #194696; text-decoration: underline; }
        @keyframes rsShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .rs-skeleton {
          background: linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 37%, #e2e8f0 63%);
          background-size: 400% 100%;
          animation: rsShimmer 1.3s ease-in-out infinite;
        }
      `}</style>

      <div className="fixed left-0 right-0 top-0 z-50 bg-[rgba(255,255,255,.72)] backdrop-blur-[12px]">
        <div className="mx-auto w-full max-w-[1220px] px-5">
          <LandingNavbar />
        </div>
      </div>

      <section
        className="pt-[100px] pb-14"
        style={{
          background: "linear-gradient(160deg, #f0f5ff 0%, #dce7fb 55%, #c5d6f5 100%)",
        }}
      >
        <div className="mx-auto max-w-[860px] px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/60 border border-[rgba(25,70,150,.18)] rounded-full px-4 py-[5px] mb-5">
            <BookOpen size={11} className="text-[#194696]" />
            <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#194696]">
              Resources
            </span>
          </div>
          <h1 className="text-[clamp(28px,5vw,46px)] font-extrabold leading-[1.08] tracking-[-0.025em] text-[#0b1220] mb-4">
            Learn faster with <span className="text-[#194696]">Ryzent AI Resources</span>
          </h1>
          <p className="text-[15px] text-slate-600 max-w-[540px] mx-auto leading-[1.7] mb-8">
            Documentation, tutorials, blogs, and FAQs managed directly by your platform admins.
          </p>
          <div className="flex items-center max-w-[460px] mx-auto bg-white border border-[#b0c4e8] rounded-xl overflow-hidden shadow-[0_2px_16px_rgba(25,70,150,0.10)]">
            <Search size={14} className="ml-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search resources..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border-none outline-none px-3 py-3 text-sm bg-transparent placeholder-slate-400"
            />
          </div>
        </div>
      </section>

      <div className="sticky top-[64px] z-40 bg-white/90 backdrop-blur-[10px] border-b border-slate-200">
        <div className="mx-auto max-w-[1100px] px-6 flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`px-5 py-4 text-[13px] font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "tab-active border-[#194696] text-[#194696]"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1100px] px-6 py-12 pb-24">
        <div className="flex items-center gap-2 mb-5">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-[#e8f0fc] flex items-center justify-center flex-shrink-0">
            <ActiveIcon size={13} className="text-[#194696]" />
          </div>
          <span className="text-[10.5px] font-bold uppercase tracking-[0.13em] text-[#194696]">
            {activeTabMeta.label}
          </span>
        </div>

        {loading ? (
          activeTab === "faqs" ? <ResourceFaqSkeleton /> : <ResourceCardsSkeleton />
        ) : visibleItems.length === 0 ? (
          <div className="border border-slate-200 bg-slate-50 rounded-xl px-5 py-8 text-sm text-slate-500">
            No resources found in this section yet.
          </div>
        ) : activeTab === "faqs" ? (
          <div className="space-y-2">
            {visibleItems.map((item) => (
              <FaqItem
                key={item.id}
                title={item.title}
                answerHtml={item.content_html}
                summary={item.summary}
              />
            ))}
          </div>
        ) : activeTab === "blogs_updates" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleItems
              .filter((item) => extractResourceSubtype(item.content_html) !== "update")
              .map((item) => {
                const excerpt = item.summary || stripHtml(item.content_html).slice(0, 180);
                return (
                  <article
                    key={item.id}
                    className="rs-card rounded-2xl overflow-hidden bg-white transition-all duration-200"
                    style={{ border: "1px solid #e8edf5" }}
                  >
                    <div className="w-full h-[210px] bg-slate-100 rounded-t-2xl overflow-hidden">
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title || "Blog cover"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[linear-gradient(145deg,#dce7fb,#c5d6f5)]" />
                      )}
                    </div>

                    <div className="p-5">
                      <h3 className="text-[24px] font-bold text-slate-900 leading-[1.25] mb-2">
                        {item.title}
                      </h3>
                      <p
                        className="text-[14px] text-slate-500 leading-[1.7] mb-3"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {excerpt || "No summary available."}
                      </p>

                      <Link
                        to={`/resources/${item.id}`}
                        className="inline-flex items-center rounded-md bg-[#194696] px-3 py-2 text-[12px] font-semibold text-white no-underline hover:bg-[#163f84]"
                      >
                        Read more
                      </Link>
                    </div>
                  </article>
                );
              })}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {visibleItems.map((item) => {
              if (activeTab === "tutorials") {
                return (
                  <article
                    key={item.id}
                    className="rs-card border border-slate-200 rounded-xl overflow-hidden bg-white transition-all duration-200"
                  >
                    <button
                      type="button"
                      onClick={() => openTutorialVideo(item)}
                      className="block relative aspect-video bg-slate-100 no-underline border-none p-0 w-full cursor-pointer"
                    >
                      {item.cover_image_url ? (
                        <img
                          src={item.cover_image_url}
                          alt={item.title || "Tutorial cover"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[linear-gradient(145deg,#dce7fb,#c5d6f5)]" />
                      )}

                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="h-16 w-16 rounded-full flex items-center justify-center shadow-lg"
                          style={{ background: "#173a78" }}
                        >
                          <span style={{ color: "#ffffff", fontSize: 22, marginLeft: 2 }}>▶</span>
                        </div>
                      </div>
                    </button>
                  </article>
                );
              }

              const excerpt = item.summary || stripHtml(item.content_html).slice(0, 180);
              return (
                <article
                  key={item.id}
                  className="rs-card border border-slate-200 rounded-xl overflow-hidden bg-white transition-all duration-200"
                >
                  <div className="p-5">
                    <h3 className="text-[16px] font-bold text-slate-900 leading-[1.35] mb-2">
                      {item.title}
                    </h3>
                    <p className="text-[13px] text-slate-500 leading-[1.7] mb-3">
                      {excerpt || "No summary available."}
                    </p>
                    <Link
                      to={`/resources/${item.id}`}
                      className="inline-flex items-center rounded-md bg-[#194696] px-3 py-2 text-[12px] font-semibold text-white no-underline hover:bg-[#163f84]"
                    >
                      Read more
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      <Modal
        open={videoOpen}
        title={null}
        onCancel={closeTutorialVideo}
        footer={null}
        width={960}
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        {videoEmbedUrl ? (
          <div className="w-full aspect-video bg-black overflow-hidden">
            <iframe
              src={videoEmbedUrl}
              title={videoTitle || "Tutorial video"}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        ) : null}
      </Modal>

      <ProductCtaFooterSection />
    </div>
  );
}
