import { useEffect } from "react";

/**
 * Trello redirects here with #token=... after user authorizes in the browser.
 * Add this exact URL to your Trello Power-Up / API key allowed origins.
 */
export default function TrelloOAuthCallback() {
  useEffect(() => {
    const hash = (window.location.hash || "").replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    if (window.opener && token) {
      window.opener.postMessage(
        { type: "RESOSYNCER_TRELLO_TOKEN", token },
        window.location.origin,
      );
    }
    window.close();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Sans',sans-serif",
        color: "#64748b",
        fontSize: 14,
      }}
    >
      Closing window…
    </div>
  );
}
