import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { Button, Card, Input, Select, Space, Tag } from "antd";
import {
  CheckCircle2,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  LogOut,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";
import {
  connectLinkedin,
  createLinkedinPost,
  disconnectLinkedin,
  getLinkedinStatus,
} from "./api";

const { TextArea } = Input;

const getIsDarkTheme = () => {
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

const makeLinkedInDraftCaption = ({ profileName }) => {
  const who = profileName ? `from ${profileName}` : "from our team";
  return `Excited to share an update ${who}. We are building better workflows, shipping consistently, and staying focused on quality. #productivity #teamwork #buildinpublic`;
};

const LINKEDIN_PERSONAL_TARGET = "__personal__";

const normalizeLinkedinOrganizationOption = (raw) => {
  if (!raw) return null;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith("urn:li:person:")) return null;
    if (trimmed.startsWith("urn:li:organization:")) {
      return {
        value: trimmed,
        label: "LinkedIn Company Page",
      };
    }
    if (!/^\d+$/.test(trimmed)) return null;
    return {
      value: `urn:li:organization:${trimmed}`,
      label: "LinkedIn Company Page",
    };
  }

  const keys = Object.keys(raw || {}).map((k) => String(k).toLowerCase());
  const hasOrgSignal =
    keys.some((k) =>
      ["organization", "company", "page", "administered", "entity"].some((w) =>
        k.includes(w),
      ),
    ) ||
    String(raw?.type || raw?.entityType || raw?.kind || "")
      .toLowerCase()
      .includes("organization");

  const rawUrn =
    raw.urn ||
    raw.entityUrn ||
    raw.pageUrn ||
    raw.organizationUrn ||
    raw.organization_urn ||
    raw.companyUrn ||
    raw.company_urn ||
    raw.authorUrn ||
    raw.organization?.urn ||
    raw.organization?.entityUrn ||
    raw.organization?.organizationUrn ||
    raw.company?.urn ||
    raw.id ||
    raw.organizationId ||
    raw.organization?.id ||
    raw.companyId ||
    "";
  const trimmedUrn = String(rawUrn || "").trim();
  if (!trimmedUrn) return null;
  if (trimmedUrn.startsWith("urn:li:person:")) return null;
  if (!trimmedUrn.startsWith("urn:li:organization:") && !hasOrgSignal) return null;

  return {
    value: trimmedUrn.startsWith("urn:li:organization:")
      ? trimmedUrn
      : `urn:li:organization:${trimmedUrn}`,
    label:
      raw.localizedName?.localized ||
      raw.localized_name ||
      raw.organization?.name ||
      raw.company?.name ||
      raw.name ||
      raw.localizedName ||
      raw.companyName ||
      raw.vanityName ||
      "LinkedIn Company Page",
  };
};

const extractLinkedinPageOptions = (statusPayload) => {
  const collectLikelyPageArrays = (node, depth = 0, out = []) => {
    if (!node || depth > 4) return out;
    if (Array.isArray(node)) {
      node.forEach((item) => collectLikelyPageArrays(item, depth + 1, out));
      return out;
    }
    if (typeof node !== "object") return out;

    Object.entries(node).forEach(([key, value]) => {
      const lk = String(key).toLowerCase();
      if (Array.isArray(value)) {
        if (
          ["organization", "company", "page", "admin", "managed", "entities"].some(
            (token) => lk.includes(token),
          )
        ) {
          out.push(...value);
        }
        value.forEach((item) => collectLikelyPageArrays(item, depth + 1, out));
      } else if (value && typeof value === "object") {
        collectLikelyPageArrays(value, depth + 1, out);
      }
    });
    return out;
  };

  const sources = [
    ...(Array.isArray(statusPayload?.organizations)
      ? statusPayload.organizations
      : []),
    ...(Array.isArray(statusPayload?.organizationPages)
      ? statusPayload.organizationPages
      : []),
    ...(Array.isArray(statusPayload?.companyPages) ? statusPayload.companyPages : []),
    ...(Array.isArray(statusPayload?.pages) ? statusPayload.pages : []),
    ...collectLikelyPageArrays(statusPayload),
  ];

  const seen = new Set();
  const options = [];
  sources.forEach((item) => {
    const normalized = normalizeLinkedinOrganizationOption(item);
    if (!normalized || seen.has(normalized.value)) return;
    seen.add(normalized.value);
    options.push(normalized);
  });
  return options;
};

const wrapText = (ctx, text, x, y, maxWidth, lineHeight) => {
  const words = String(text || "").split(" ");
  let line = "";
  let row = 0;
  words.forEach((word) => {
    const testLine = `${line}${word} `;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line.trim(), x, y + row * lineHeight);
      line = `${word} `;
      row += 1;
    } else {
      line = testLine;
    }
  });
  if (line.trim()) {
    ctx.fillText(line.trim(), x, y + row * lineHeight);
  }
};

const buildPostImage = ({ caption, profileName }) => {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 627;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const gradient = ctx.createLinearGradient(0, 0, 1200, 627);
  gradient.addColorStop(0, "#0f172a");
  gradient.addColorStop(1, "#3453b7");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.08)";
  ctx.fillRect(56, 56, canvas.width - 112, canvas.height - 112);

  ctx.fillStyle = "#ffffff";
  ctx.font = "700 52px Arial";
  ctx.fillText("LinkedIn Post Preview", 92, 160);

  ctx.font = "400 32px Arial";
  wrapText(ctx, caption, 92, 236, 1020, 46);

  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "600 28px Arial";
  ctx.fillText(profileName || "Your Organization", 92, 555);
  ctx.fillText(new Date().toLocaleDateString(), 935, 555);

  return canvas.toDataURL("image/png");
};

export default function LinkedInIntegrationConnect() {
  const location = useLocation();
  const [dark, setDark] = useState(getIsDarkTheme);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [status, setStatus] = useState({
    configured: false,
    connected: false,
    profileName: "",
  });
  const [pageOptions, setPageOptions] = useState([]);
  const [postAs, setPostAs] = useState(LINKEDIN_PERSONAL_TARGET);
  const [text, setText] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [imagePreview, setImagePreview] = useState("");
  const [responseMsg, setResponseMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const callbackState = location.state || {};

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("themeModeChanged", syncTheme);
    mq.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("themeModeChanged", syncTheme);
      mq.removeEventListener("change", syncTheme);
    };
  }, []);

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setErrorMsg(null);
    try {
      const data = await getLinkedinStatus();
      const pages = extractLinkedinPageOptions(data);
      const preferredOrganizationUrn =
        data?.defaultOrganizationUrn ||
        data?.organizationUrn ||
        data?.defaultAuthorUrn ||
        "";
      const preferredPostAs =
        preferredOrganizationUrn &&
        pages.some((option) => option.value === preferredOrganizationUrn)
          ? preferredOrganizationUrn
          : LINKEDIN_PERSONAL_TARGET;
      setStatus({
        configured:
          data?.configured != null ? Boolean(data.configured) : Boolean(data?.connected),
        connected: Boolean(data?.connected),
        profileName:
          String(
            data?.profileName ||
              data?.profile?.name ||
              data?.profile?.localizedFirstName ||
              data?.name ||
              "",
          ) || "",
      });
      setPageOptions(pages);
      setPostAs((prev) => {
        const currentStillValid =
          prev === LINKEDIN_PERSONAL_TARGET ||
          pages.some((option) => option.value === prev);
        return currentStillValid ? prev : preferredPostAs;
      });
    } catch (error) {
      setErrorMsg(
        error?.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error?.message || "Failed to fetch LinkedIn status.",
      );
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  const generateDraft = useCallback(
    (nameHint) => {
      const caption = makeLinkedInDraftCaption({
        profileName: nameHint || status.profileName,
      });
      setText(caption);
      setImagePreview(buildPostImage({ caption, profileName: nameHint || status.profileName }));
    },
    [status.profileName],
  );

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!text.trim()) {
      generateDraft(callbackState?.linkedinCallback === "connected" ? status.profileName : "");
    }
  }, [generateDraft, status.profileName, callbackState, text]);

  useEffect(() => {
    if (callbackState?.linkedinCallback === "connected") {
      setResponseMsg("LinkedIn connected successfully.");
    } else if (callbackState?.linkedinCallback === "error") {
      setErrorMsg(callbackState?.linkedinMessage || "LinkedIn callback returned an error.");
    }
  }, [callbackState]);

  const returnTo = useMemo(
    () =>
      import.meta.env.VITE_LINKEDIN_CALLBACK_URL ||
      "http://localhost:5173/integrations/linkedin/callback",
    [],
  );

  const onConnect = () => {
    connectLinkedin(returnTo);
  };

  const onDisconnect = async () => {
    setBusyAction("disconnect");
    setErrorMsg(null);
    setResponseMsg(null);
    try {
      await disconnectLinkedin();
      setResponseMsg("LinkedIn disconnected successfully.");
      await fetchStatus();
    } catch (error) {
      setErrorMsg(
        error?.details
          ? `${error.message} (${JSON.stringify(error.details)})`
          : error?.message || "Failed to disconnect LinkedIn.",
      );
    } finally {
      setBusyAction("");
    }
  };

  const onPost = async () => {
    setErrorMsg(null);
    setResponseMsg(null);
    if (!status.connected) {
      setErrorMsg("LinkedIn is not connected. Please connect your account first.");
      return;
    }
    if (!text.trim()) {
      setErrorMsg("Post content is required.");
      return;
    }
    setBusyAction("post");
    try {
      const res = await createLinkedinPost({
        text: text.trim(),
        visibility,
        authorUrn: postAs !== LINKEDIN_PERSONAL_TARGET ? postAs : "",
        organizationUrn: postAs !== LINKEDIN_PERSONAL_TARGET ? postAs : "",
      });
      setResponseMsg(
        res?.message || res?.status || "Post published successfully to LinkedIn.",
      );
    } catch (error) {
      const details = error?.details ? ` (${JSON.stringify(error.details)})` : "";
      setErrorMsg(`${error?.message || "Failed to publish post."}${details}`);
    } finally {
      setBusyAction("");
    }
  };

  const cardStyle = {
    background: dark ? "#17181c" : "#fff",
    border: `1px solid ${dark ? "#2a2a31" : "#e2e8f0"}`,
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "#f8fafc",
        padding: "20px 16px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gap: 14 }}>
        <div>
          <h1 style={{ margin: 0, color: dark ? "#f8fafc" : "#0f172a", fontSize: 26, fontWeight: 800 }}>
            LinkedIn Integration
          </h1>
          <p style={{ margin: "6px 0 0", color: dark ? "#94a3b8" : "#64748b" }}>
            Connect LinkedIn, generate a post draft, and publish directly.
          </p>
        </div>

        <Card style={cardStyle} bodyStyle={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a" }}>
              Connection Status
            </div>
            <Space>
              <Button
                icon={<RefreshCw size={16} />}
                onClick={fetchStatus}
                loading={loadingStatus}
              >
                Refresh
              </Button>
              {!status.connected ? (
                <Button type="primary" icon={<LinkIcon size={16} />} onClick={onConnect}>
                  Connect LinkedIn
                </Button>
              ) : (
                <Button
                  danger
                  icon={<LogOut size={16} />}
                  onClick={onDisconnect}
                  loading={busyAction === "disconnect"}
                >
                  Disconnect
                </Button>
              )}
            </Space>
          </div>

          <Space size={[8, 8]} wrap>
            <Tag color={status.configured ? "blue" : "default"}>
              Configured: {status.configured ? "Yes" : "No"}
            </Tag>
            <Tag color={status.connected ? "green" : "default"}>
              Connected: {status.connected ? "Yes" : "No"}
            </Tag>
            <Tag color={status.profileName ? "purple" : "default"}>
              Profile: {status.profileName || "Not available"}
            </Tag>
          </Space>
        </Card>

        <Card style={cardStyle} bodyStyle={{ display: "grid", gap: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: dark ? "#f8fafc" : "#0f172a" }}>
              Create Post
            </div>
            <Button
              icon={<Sparkles size={16} />}
              onClick={() => generateDraft(status.profileName)}
            >
              Regenerate Draft
            </Button>
          </div>

          <TextArea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write your LinkedIn post..."
          />

          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 13, fontWeight: 600 }}>Post As</div>
            <Select
              value={postAs}
              onChange={setPostAs}
              options={[
                {
                  value: LINKEDIN_PERSONAL_TARGET,
                  label: `Personal Profile${status.profileName ? ` (${status.profileName})` : ""}`,
                },
                ...pageOptions.map((option) => ({
                  value: option.value,
                  label: `Company Page (${option.label})`,
                })),
              ]}
            />
          </div>
          {status.connected && pageOptions.length === 0 && (
            <div
              style={{
                fontSize: 12,
                color: dark ? "#94a3b8" : "#64748b",
                background: dark ? "rgba(255,255,255,0.03)" : "#f8fafc",
                border: `1px solid ${dark ? "#2a2a31" : "#dbe4f0"}`,
                borderRadius: 10,
                padding: "8px 10px",
              }}
            >
              No LinkedIn Company Pages were returned for this account. This usually means
              company-page scopes/permissions are missing in the LinkedIn backend auth.
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: 10, alignItems: "center" }}>
            <div style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 13, fontWeight: 600 }}>Visibility</div>
            <Select
              value={visibility}
              onChange={setVisibility}
              options={[
                { value: "PUBLIC", label: "PUBLIC" },
                { value: "CONNECTIONS", label: "CONNECTIONS" },
              ]}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ color: dark ? "#cbd5e1" : "#334155", fontSize: 13, fontWeight: 600 }}>
              Generated Post Image
            </div>
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="LinkedIn post preview"
                style={{
                  width: "100%",
                  maxWidth: 820,
                  borderRadius: 10,
                  border: `1px solid ${dark ? "#2a2a31" : "#dbe4f0"}`,
                }}
              />
            ) : (
              <div style={{ color: dark ? "#94a3b8" : "#64748b", fontSize: 13 }}>
                No preview generated yet.
              </div>
            )}
            <Space>
              <Button icon={<ImagePlus size={16} />} onClick={() => setImagePreview(buildPostImage({ caption: text, profileName: status.profileName }))}>
                Refresh Image
              </Button>
              {imagePreview && (
                <Button
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => {
                    const a = document.createElement("a");
                    a.href = imagePreview;
                    a.download = "linkedin-post.png";
                    a.click();
                  }}
                >
                  Download Image
                </Button>
              )}
            </Space>
          </div>

          <Button
            type="primary"
            icon={busyAction === "post" ? <Loader2 size={16} /> : <Send size={16} />}
            onClick={onPost}
            loading={busyAction === "post"}
          >
            Post to LinkedIn
          </Button>
        </Card>

        {(responseMsg || errorMsg) && (
          <Card style={cardStyle} bodyStyle={{ display: "grid", gap: 8 }}>
            {responseMsg && (
              <div style={{ color: "#22c55e", fontWeight: 600 }}>{responseMsg}</div>
            )}
            {errorMsg && (
              <div style={{ color: "#ef4444", whiteSpace: "pre-wrap", fontWeight: 600 }}>{errorMsg}</div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
