const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "www.youtu.be",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);

export const getYouTubeVideoId = (inputUrl) => {
  const raw = String(inputUrl || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (!YT_HOSTS.has(host)) return null;

    if (host.includes("youtu.be")) {
      const id = url.pathname.replace(/\//g, "");
      return id || null;
    }

    if (url.pathname.startsWith("/shorts/")) {
      return url.pathname.split("/")[2] || null;
    }

    if (url.pathname.startsWith("/embed/")) {
      return url.pathname.split("/")[2] || null;
    }

    return url.searchParams.get("v");
  } catch {
    return null;
  }
};

export const toYouTubeEmbedUrl = (inputUrl) => {
  const id = getYouTubeVideoId(inputUrl);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}`;
};
