const SUBTYPE_COMMENT_RE = /^<!--\s*resource-subtype:(blog|update)\s*-->\s*/i;
const UPDATE_META_COMMENT_RE =
  /^<!--\s*resource-update:version=([^;>]*);date=([^;>]*?)\s*-->\s*/i;
const META_COMMENTS_RE =
  /^(?:<!--\s*resource-subtype:(?:blog|update)\s*-->\s*|<!--\s*resource-update:version=[^;>]*;date=[^;>]*\s*-->\s*)+/i;

export const stripResourceSubtypeComment = (html) =>
  String(html || "").replace(SUBTYPE_COMMENT_RE, "");

export const stripResourceMetaComments = (html) =>
  String(html || "").replace(META_COMMENTS_RE, "");

export const extractResourceSubtype = (html) => {
  const match = String(html || "").match(SUBTYPE_COMMENT_RE);
  return match?.[1]?.toLowerCase() || null;
};

export const applyResourceSubtype = (html, subtype) => {
  const base = stripResourceMetaComments(html);
  const normalized = subtype === "update" ? "update" : "blog";
  return `<!--resource-subtype:${normalized}-->${base}`;
};

export const extractResourceUpdateMeta = (html) => {
  const match = String(html || "").match(UPDATE_META_COMMENT_RE);
  if (!match) return null;
  return {
    version: (match[1] || "").trim(),
    releaseDate: (match[2] || "").trim(),
  };
};

export const applyResourceUpdateMeta = (html, { version, releaseDate }) => {
  const base = stripResourceMetaComments(html);
  const safeVersion = String(version || "").trim();
  const safeDate = String(releaseDate || "").trim();
  return `<!--resource-update:version=${safeVersion};date=${safeDate}-->${base}`;
};
