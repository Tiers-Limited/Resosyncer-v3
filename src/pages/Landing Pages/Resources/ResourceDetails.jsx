import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink } from "lucide-react";
import LandingNavbar from "../../../components/Landing/LandingNavbar";
import ProductCtaFooterSection from "../../../components/Landing/ProductCtaFooterSection";
import { supabase } from "../../../lib/supabase";
import RichHtmlRenderer from "../../../components/common/RichHtmlRenderer";
import { toYouTubeEmbedUrl } from "../../../lib/youtube";

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export default function ResourceDetailsPage() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [item, setItem] = useState(null);

  useEffect(() => {
    let mounted = true;

    const fetchItem = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("platform_resources")
        .select(
          "id, category, title, summary, content_html, external_url, cover_image_url, created_at",
        )
        .eq("id", id)
        .eq("is_published", true)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        console.error("Failed to load resource detail:", error);
        setItem(null);
      } else {
        setItem(data || null);
      }
      setLoading(false);
    };

    fetchItem();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <div
      className="min-h-screen bg-white text-slate-900"
      style={{ fontFamily: "'Manrope', 'Segoe UI', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        .rs-rich-content { padding: 0 !important; }
        .rs-rich-content p { margin: 0 0 12px; }
        .rs-rich-content ul, .rs-rich-content ol { margin: 0 0 12px 18px; }
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

      <main className="mx-auto max-w-[1100px] px-6 pt-[110px] pb-16">
        <Link
          to="/resources"
          className="inline-flex items-center gap-2 text-[#194696] text-sm font-semibold no-underline"
        >
          <ArrowLeft size={15} />
          Back to Resources
        </Link>

        {loading ? (
          <div className="mt-8">
            <div className="rs-skeleton h-[280px] md:h-[380px] rounded-2xl mb-6" />
            <div className="rs-skeleton h-10 w-3/4 rounded mb-4" />
            <div className="rs-skeleton h-4 w-full rounded mb-2" />
            <div className="rs-skeleton h-4 w-11/12 rounded mb-2" />
            <div className="rs-skeleton h-4 w-2/3 rounded mb-6" />
            <div className="rs-skeleton h-4 w-full rounded mb-3" />
            <div className="rs-skeleton h-4 w-full rounded mb-3" />
            <div className="rs-skeleton h-4 w-10/12 rounded" />
          </div>
        ) : !item ? (
          <div className="mt-8 border border-slate-200 rounded-xl px-5 py-8 text-sm text-slate-500 bg-slate-50">
            Resource not found.
          </div>
        ) : (
          <>
            {item.category === "tutorials" && toYouTubeEmbedUrl(item.external_url) ? (
              <section className="mt-5 rounded-2xl overflow-hidden border border-slate-200">
                <div className="w-full aspect-video bg-slate-100">
                  <iframe
                    src={toYouTubeEmbedUrl(item.external_url)}
                    title={item.title || "Tutorial video"}
                    className="w-full h-full"
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  />
                </div>
              </section>
            ) : null}

            <section className="mt-5 rounded-2xl overflow-hidden border border-slate-200">
              {item.cover_image_url ? (
                <img
                  src={item.cover_image_url}
                  alt={item.title}
                  className="w-full h-[280px] md:h-[380px] object-cover"
                />
              ) : (
                <div className="h-[220px] md:h-[280px] bg-[linear-gradient(145deg,#dce7fb,#c5d6f5)]" />
              )}
            </section>

            <section className="mt-6">
              <h1 className="text-[clamp(26px,4vw,40px)] font-extrabold leading-[1.12] tracking-[-0.02em] text-[#0b1220]">
                {item.title}
              </h1>
              <p className="mt-3 text-[15px] text-slate-600 leading-[1.75] max-w-[900px]">
                {item.summary || stripHtml(item.content_html || "").slice(0, 240)}
              </p>

                {item.external_url ? (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-1 text-[#194696] text-[13px] font-semibold no-underline"
                  >
                  {item.category === "tutorials" ? "Open YouTube" : "Open external resource"}{" "}
                  <ExternalLink size={13} />
                  </a>
                ) : null}

              <RichHtmlRenderer
                html={item.content_html || ""}
                className="mt-7 rs-rich-content text-[15px] leading-[1.85] text-slate-700"
              />
            </section>
          </>
        )}
      </main>

      <ProductCtaFooterSection />
    </div>
  );
}
