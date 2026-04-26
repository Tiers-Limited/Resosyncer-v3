import { useMemo } from "react";
import "react-quill/dist/quill.snow.css";

const BLOCKED_TAGS = [
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "textarea",
  "select",
  "link",
  "meta",
];

const sanitizeHtml = (rawHtml) => {
  const html = String(rawHtml || "");
  if (typeof window === "undefined" || !html) return html;

  const parser = new window.DOMParser();
  const doc = parser.parseFromString(`<div id="rs-root">${html}</div>`, "text/html");
  const root = doc.getElementById("rs-root");
  if (!root) return "";

  root.querySelectorAll(BLOCKED_TAGS.join(",")).forEach((node) => node.remove());

  root.querySelectorAll("*").forEach((node) => {
    [...node.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = String(attr.value || "");
      const lower = value.toLowerCase();

      if (name.startsWith("on")) {
        node.removeAttribute(attr.name);
        return;
      }

      if ((name === "href" || name === "src") && lower.trim().startsWith("javascript:")) {
        node.removeAttribute(attr.name);
        return;
      }

      if (name === "style" && (lower.includes("expression(") || lower.includes("javascript:"))) {
        node.removeAttribute(attr.name);
      }
    });
  });

  return root.innerHTML;
};

export function htmlFormatter(html) {
  if (typeof document === "undefined" || typeof Node === "undefined") {
    return String(html || "");
  }

  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const nodes = Array.from(template.content.childNodes);
  const newBody = document.createElement("div");

  let buffer = [];

  const applyTailwindClasses = (node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    switch (node.tagName) {
      case "H1":
        node.classList.add("text-3xl", "font-bold", "my-4");
        break;
      case "H2":
        node.classList.add("text-2xl", "font-semibold", "my-4");
        break;
      case "H3":
        node.classList.add("text-xl", "font-medium", "my-3");
        break;
      case "UL":
        node.classList.add("list-disc", "ml-6", "my-2");
        break;
      case "OL":
        node.classList.add("list-decimal", "ml-6", "my-2");
        break;
      case "LI":
        node.classList.add("mb-1");
        break;
      case "P":
        node.classList.add("my-2", "text-base");
        break;
      case "STRONG":
        node.classList.add("font-semibold");
        break;
      default:
        break;
    }

    // Recursively apply to children
    for (const child of node.childNodes) {
      applyTailwindClasses(child);
    }
  };

  const flushBuffer = () => {
    if (buffer.length > 1) {
      const wrapper = document.createElement("div");
      wrapper.className = "inline-image-group flex gap-2 flex-wrap my-4";
      buffer.forEach((p) => {
        applyTailwindClasses(p);
        wrapper.appendChild(p.cloneNode(true));
      });
      newBody.appendChild(wrapper);
    } else if (buffer.length === 1) {
      applyTailwindClasses(buffer[0]);
      newBody.appendChild(buffer[0].cloneNode(true));
    }
    buffer = [];
  };

  nodes.forEach((node) => {
    if (
      node.nodeType === Node.ELEMENT_NODE &&
      node.tagName === "P" &&
      node.children.length === 1 &&
      node.children[0].tagName === "IMG"
    ) {
      buffer.push(node);
    } else {
      flushBuffer();
      applyTailwindClasses(node);
      newBody.appendChild(node.cloneNode(true));
    }
  });

  flushBuffer();

  return newBody.innerHTML;
}

export default function RichHtmlRenderer({ html, className = "" }) {
  const safeHtml = useMemo(() => sanitizeHtml(html), [html]);
  const formattedHtml = useMemo(() => htmlFormatter(safeHtml), [safeHtml]);
  return (
    <div
      className={`ql-editor rs-rich-html ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: formattedHtml }}
    />
  );
}
