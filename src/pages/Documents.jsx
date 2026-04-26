import { useState, useEffect, useRef } from "react";
import { message, Modal, Form, Input, Upload } from "antd";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

// Icons as SVG components
const FolderIcon = ({ color = "#5f6368" }) => (
  <svg viewBox="0 0 24 24" fill={color} width="100%" height="100%">
    <path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
  </svg>
);

const FileIcon = ({ ext = "" }) => {
  const colors = {
    pdf: "#e53935",
    doc: "#1e88e5",
    docx: "#1e88e5",
    xls: "#43a047",
    xlsx: "#43a047",
    png: "#fb8c00",
    jpg: "#fb8c00",
    jpeg: "#fb8c00",
    gif: "#fb8c00",
    mp4: "#8e24aa",
    zip: "#6d4c41",
    txt: "#546e7a",
  };
  const color = colors[ext.toLowerCase()] || "#5f6368";
  return (
    <svg viewBox="0 0 24 24" fill={color} width="100%" height="100%">
      <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  );
};

const GridIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
  </svg>
);
const ListIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);
const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
  </svg>
);
const NewFolderIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
    <path d="M20 6h-8l-2-2H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-1 8h-3v3h-2v-3h-3v-2h3V9h2v3h3v2z" />
  </svg>
);
const MoreIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
  </svg>
);
const ChevronRight = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);
const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
);
const EditIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
  </svg>
);
const TrashIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
  </svg>
);
const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
  </svg>
);
const ChevronLeftIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
  </svg>
);
const ChevronRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
  </svg>
);

// ------------------------ Previewable file types ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const PREVIEWABLE = {
  image: ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp"],
  pdf: ["pdf"],
  text: ["txt", "md", "csv", "json", "xml", "html", "js", "ts", "css"],
  video: ["mp4", "webm", "ogg", "mov"],
};

const getPreviewType = (name = "") => {
  const ext = name.split(".").pop().toLowerCase();
  if (PREVIEWABLE.image.includes(ext)) return "image";
  if (PREVIEWABLE.pdf.includes(ext)) return "pdf";
  if (PREVIEWABLE.text.includes(ext)) return "text";
  if (PREVIEWABLE.video.includes(ext)) return "video";
  return null;
};

const getIsDarkTheme = () => {
  if (typeof window === "undefined") return false;
  const mode = localStorage.getItem("themeMode") || "light";
  if (mode === "dark") return true;
  if (mode === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

// ------------------------ File Preview Overlay ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const FilePreview = ({
  file,
  onClose,
  onDownload,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}) => {
  const [blobUrl, setBlobUrl] = useState(null);
  const [textContent, setTextContent] = useState("");
  const [loadError, setLoadError] = useState(false);
  const [loading, setLoading] = useState(true);
  const previewType = getPreviewType(file?.name);

  useEffect(() => {
    if (!file) return;
    setBlobUrl(null);
    setTextContent("");
    setLoadError(false);
    setLoading(true);

    supabase.storage
      .from("documents")
      .download(file.file_url)
      .then(({ data, error }) => {
        if (error) throw error;
        const url = URL.createObjectURL(data);
        if (previewType === "text") {
          data.text().then((t) => {
            setTextContent(t);
            setLoading(false);
          });
        } else {
          setBlobUrl(url);
          setLoading(false);
        }
      })
      .catch(() => {
        setLoadError(true);
        setLoading(false);
      });

    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [file?.id]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [hasPrev, hasNext]);

  if (!file) return null;

  const ext = file.name.split(".").pop().toUpperCase();

  return (
    <div
      style={overlayStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={previewHeaderStyle}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minWidth: 0,
          }}
        >
          <div style={{ width: 20, height: 20, flexShrink: 0, opacity: 0.8 }}>
            <FileIcon ext={file.name.split(".").pop()} />
          </div>
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: "white",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {file.name}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: "2px 8px",
              background: "rgba(255,255,255,0.15)",
              borderRadius: 12,
              color: "rgba(255,255,255,0.75)",
              flexShrink: 0,
            }}
          >
            {ext}
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexShrink: 0,
          }}
        >
          <button
            onClick={() => onDownload(file)}
            style={previewActionBtn}
            title="Download"
          >
            <DownloadIcon />
            <span style={{ fontSize: 13 }}>Download</span>
          </button>
          <button
            onClick={onClose}
            style={{ ...previewIconBtn, marginLeft: 4 }}
            title="Close (Esc)"
          >
            <CloseIcon />
          </button>
        </div>
      </div>

      {hasPrev && (
        <button
          onClick={onPrev}
          style={{ ...navArrowStyle, left: 16 }}
          title="Previous (Left Arrow)"
        >
          <ChevronLeftIcon />
        </button>
      )}
      {hasNext && (
        <button
          onClick={onNext}
          style={{ ...navArrowStyle, right: 16 }}
          title="Next (Right Arrow)"
        >
          <ChevronRightIcon />
        </button>
      )}

      <div style={previewContentStyle}>
        {loading && (
          <div style={centeredMsg}>
            <div style={spinnerStyle} />
            <span
              style={{
                color: "rgba(255,255,255,0.6)",
                marginTop: 16,
                fontSize: 14,
              }}
            >
              Loading preview...
            </span>
          </div>
        )}
        {!loading && loadError && (
          <div style={centeredMsg}>
            <div
              style={{
                width: 52,
                height: 52,
                margin: "0 auto 12px",
                opacity: 0.75,
              }}
            >
              <FileIcon ext={file?.name?.split(".").pop() || ""} />
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.7)",
                fontSize: 15,
                marginBottom: 8,
              }}
            >
              Preview unavailable
            </div>
            <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>
              Could not load the file.
            </div>
            <button
              onClick={() => onDownload(file)}
              style={{
                ...previewActionBtn,
                marginTop: 20,
                padding: "10px 20px",
              }}
            >
              <DownloadIcon /> Download instead
            </button>
          </div>
        )}
        {!loading && !loadError && previewType === "image" && (
          <img
            src={blobUrl}
            alt={file.name}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              objectFit: "contain",
              borderRadius: 4,
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          />
        )}
        {!loading && !loadError && previewType === "pdf" && (
          <iframe
            src={blobUrl}
            title={file.name}
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: 4,
              background: "white",
            }}
          />
        )}
        {!loading && !loadError && previewType === "video" && (
          <video
            src={blobUrl}
            controls
            autoPlay={false}
            style={{
              maxWidth: "100%",
              maxHeight: "100%",
              borderRadius: 4,
              boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            }}
          />
        )}
        {!loading && !loadError && previewType === "text" && (
          <div style={textPreviewStyle}>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 13,
                lineHeight: 1.7,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                color: "#e2e8f0",
              }}
            >
              {textContent}
            </pre>
          </div>
        )}
        {!loading && !loadError && previewType === null && (
          <div style={centeredMsg}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>
              <div style={{ width: 56, height: 68, margin: "0 auto" }}>
                <FileIcon ext={file.name.split(".").pop()} />
              </div>
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 16,
                fontWeight: 500,
                marginBottom: 6,
              }}
            >
              {file.name}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: 13,
                marginBottom: 24,
              }}
            >
              This file type cannot be previewed in the browser.
            </div>
            <button
              onClick={() => onDownload(file)}
              style={{
                ...previewActionBtn,
                padding: "10px 24px",
                fontSize: 14,
              }}
            >
              <DownloadIcon /> Download file
            </button>
          </div>
        )}
      </div>

      {!loading && !loadError && (
        <div style={previewFooterStyle}>
          <span>{formatSize(file.file_size)}</span>
          <span>•</span>
          <span>{formatDate(file.created_at)}</span>
        </div>
      )}
    </div>
  );
};

// ------------------------ Context Menu --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const ContextMenu = ({
  x,
  y,
  record,
  dark,
  onEdit,
  onDelete,
  onDownload,
  onPreview,
  onClose,
}) => {
  const ref = useRef();
  const previewType = getPreviewType(record?.name);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      ref={ref}
      style={{
        position: "fixed",
        left: x,
        top: y,
        zIndex: 1000,
        background: dark ? "#1a1b1f" : "white",
        borderRadius: 8,
        boxShadow: dark
          ? "0 8px 24px rgba(0,0,0,0.45)"
          : "0 4px 20px rgba(0,0,0,0.15)",
        minWidth: 200,
        padding: "6px 0",
        border: dark ? "1px solid #2a2b31" : "1px solid #e0e0e0",
      }}
    >
      {record.type === "file" && (
        <>
          {previewType && (
            <button
              onClick={() => {
                onPreview(record);
                onClose();
              }}
              style={{
                ...menuItemStyle,
                color: dark ? "#e5e7eb" : menuItemStyle.color,
              }}
            >
              <EyeIcon /> Preview
            </button>
          )}
          <button
            onClick={() => {
              onDownload(record);
              onClose();
            }}
            style={{
              ...menuItemStyle,
              color: dark ? "#e5e7eb" : menuItemStyle.color,
            }}
          >
            <DownloadIcon /> Download
          </button>
        </>
      )}
      {record.type === "folder" && (
        <button
          onClick={() => {
            onEdit(record);
            onClose();
          }}
          style={{
            ...menuItemStyle,
            color: dark ? "#e5e7eb" : menuItemStyle.color,
          }}
        >
          <EditIcon /> Rename
        </button>
      )}
      <div
        style={{
          height: 1,
          background: dark ? "#2a2b31" : "#e0e0e0",
          margin: "6px 0",
        }}
      />
      <button
        onClick={() => {
          onClose();
          setTimeout(() => onDelete(record), 50);
        }}
        style={{
          ...menuItemStyle,
          color: "#d32f2f",
          ...(dark ? { color: "#ef5350" } : {}),
        }}
      >
        <TrashIcon /> Delete
      </button>
    </div>
  );
};

const menuItemStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  width: "100%",
  padding: "9px 16px",
  background: "none",
  border: "none",
  cursor: "pointer",
  fontSize: 14,
  color: "#202124",
  textAlign: "left",
  transition: "background 0.15s",
};

const FOLDER_COLORS = [
  "#1967d2",
  "#137333",
  "#b06000",
  "#6a1b9a",
  "#c62828",
  "#00695c",
];

const formatSize = (bytes) => {
  if (!bytes) return "--";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};
const formatDate = (d) =>
  new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

// ------------------------ Main Component ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const Documents = () => {
  const [dark, setDark] = useState(getIsDarkTheme);
  const [documents, setDocuments] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [folderPath, setFolderPath] = useState([]);
  const [loading, setLoading] = useState(false);
  const [folderModal, setFolderModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [editingFolder, setEditingFolder] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [contextMenu, setContextMenu] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  // ---------------- Tenant state --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  const [currentTenantId, setCurrentTenantId] = useState(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [form] = Form.useForm();
  const { profile } = useAuth();

  // ---------------- Fetch tenant on mount --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    fetchCurrentTenant();
  }, []);

  useEffect(() => {
    const syncTheme = () => setDark(getIsDarkTheme());
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    window.addEventListener("storage", syncTheme);
    window.addEventListener("themeModeChanged", syncTheme);
    mediaQuery.addEventListener("change", syncTheme);
    return () => {
      window.removeEventListener("storage", syncTheme);
      window.removeEventListener("themeModeChanged", syncTheme);
      mediaQuery.removeEventListener("change", syncTheme);
    };
  }, []);

  const fetchCurrentTenant = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("profiles")
        .select("tenant_id")
        .eq("id", user.id)
        .single();
      if (error) throw error;
      setCurrentTenantId(data?.tenant_id);
    } catch {
      message.error("Failed to load tenant");
    } finally {
      setTenantLoading(false);
    }
  };

  // ---------------- Fetch documents only after tenant is resolved --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  useEffect(() => {
    if (!tenantLoading && currentTenantId) {
      fetchDocuments();
    }
  }, [currentFolder, currentTenantId, tenantLoading]);

  const fetchDocuments = async () => {
    if (!currentTenantId) return;
    setLoading(true);
    try {
      let query = supabase
        .from("documents")
        .select("*")
        .eq("tenant_id", currentTenantId) // ------- tenant filter
        .order("type", { ascending: false })
        .order("name");
      if (currentFolder) query = query.eq("parent_id", currentFolder);
      else query = query.is("parent_id", null);
      const { data, error } = await query;
      if (error) throw error;
      setDocuments(data || []);
    } catch {
      message.error("Failed to fetch documents");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFolder = async (values) => {
    if (!profile?.id) return message.error("Please wait for profile to load");
    if (!currentTenantId) return message.error("Tenant not loaded yet");
    setLoading(true);
    try {
      if (editingFolder) {
        const { error } = await supabase
          .from("documents")
          .update({ name: values.name })
          .eq("id", editingFolder.id)
          .eq("tenant_id", currentTenantId); // ------- tenant guard
        if (error) throw error;
        message.success("Folder renamed");
      } else {
        const { error } = await supabase.from("documents").insert([
          {
            name: values.name,
            type: "folder",
            parent_id: currentFolder,
            uploaded_by: profile.id,
            tenant_id: currentTenantId, // ------- stamp tenant
          },
        ]);
        if (error) throw error;
        message.success("Folder created");
      }
      setFolderModal(false);
      setEditingFolder(null);
      form.resetFields();
      fetchDocuments();
    } catch {
      message.error("Failed");
    } finally {
      setLoading(false);
    }
  };

  const handleFolderClick = (folder) => {
    setFolderPath([...folderPath, { id: folder.id, name: folder.name }]);
    setCurrentFolder(folder.id);
    setSelectedItem(null);
  };

  const navigateTo = (index) => {
    if (index === -1) {
      setCurrentFolder(null);
      setFolderPath([]);
    } else {
      const newPath = folderPath.slice(0, index + 1);
      setFolderPath(newPath);
      setCurrentFolder(newPath[newPath.length - 1].id);
    }
    setSelectedItem(null);
  };

  const handleUpload = async () => {
    if (!profile?.id) return message.error("Please wait for profile to load");
    if (!currentTenantId) return message.error("Tenant not loaded yet");
    if (fileList.length === 0) return message.error("Please select a file");
    setUploading(true);
    try {
      const file = fileList[0];
      const fileExt = file.name.split(".").pop();
      // Namespace storage path by tenant so files are naturally isolated
      const fileName = `${currentTenantId}/${profile.id}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, file);
      if (uploadError) throw uploadError;
      const { error: dbError } = await supabase.from("documents").insert([
        {
          name: file.name,
          type: "file",
          file_url: fileName,
          file_size: file.size,
          parent_id: currentFolder,
          uploaded_by: profile.id,
          tenant_id: currentTenantId, // ------- stamp tenant
        },
      ]);
      if (dbError) throw dbError;
      message.success("File uploaded");
      setUploadModal(false);
      setFileList([]);
      fetchDocuments();
    } catch (error) {
      message.error(error.message || "Failed to upload");
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(record.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      message.error("Failed to download");
    }
  };

  const handleDeleteDocument = async (record) => {
    setLoading(true);
    try {
      if (record.type === "file" && record.file_url) {
        const { error } = await supabase.storage
          .from("documents")
          .remove([record.file_url]);
        if (error) throw error;
      }
      const { error } = await supabase
        .from("documents")
        .delete()
        .eq("id", record.id)
        .eq("tenant_id", currentTenantId); // ------- tenant guard
      if (error) throw error;
      message.success("Deleted");
      setDeleteConfirm(null);
      if (previewFile?.id === record.id) setPreviewFile(null);
      fetchDocuments();
    } catch {
      message.error("Failed to delete");
    } finally {
      setLoading(false);
    }
  };

  const handleContextMenu = (e, record) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, record });
    setSelectedItem(record.id);
  };

  const handleFileOpen = (file) => {
    if (getPreviewType(file.name)) {
      setPreviewFile(file);
    } else {
      handleDownload(file);
    }
  };

  const filtered = documents.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const folders = filtered.filter((d) => d.type === "folder");
  const files = filtered.filter((d) => d.type === "file");

  const previewIdx = files.findIndex((f) => f.id === previewFile?.id);
  const hasPrev = previewIdx > 0;
  const hasNext = previewIdx < files.length - 1;

  const getFileExt = (name) => name?.split(".").pop() || "";
  const getFolderColor = (id) =>
    FOLDER_COLORS[id?.charCodeAt(0) % FOLDER_COLORS.length] || FOLDER_COLORS[0];
  const modalStyles = dark
    ? {
        content: {
          background: "#1a1b1f",
          border: "1px solid #2a2b31",
        },
        header: {
          background: "#1a1b1f",
          borderBottom: "1px solid #2a2b31",
        },
        body: {
          background: "#1a1b1f",
          color: "#e5e7eb",
        },
      }
    : undefined;

  // ---------------- Show a loading state while tenant resolves --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
  if (tenantLoading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: dark ? "#141416" : "#f8f9fa",
        }}
      >
        <div
          style={{ textAlign: "center", color: dark ? "#9ca3af" : "#5f6368" }}
        >
          <div
            style={{
              ...spinnerStyle,
              margin: "0 auto 16px",
              borderTopColor: "#1a73e8",
            }}
          />
          <div style={{ fontSize: 14 }}>Loading workspace...</div>
        </div>
      </div>
    );
  }

  if (!currentTenantId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: dark ? "#141416" : "#f8f9fa",
        }}
      >
        <div
          style={{ textAlign: "center", color: dark ? "#9ca3af" : "#5f6368" }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              margin: "0 auto 12px",
              opacity: 0.7,
            }}
          >
            <FolderIcon color={dark ? "#9ca3af" : "#5f6368"} />
          </div>
          <div
            style={{
              fontSize: 16,
              color: dark ? "#f3f4f6" : "#202124",
              marginBottom: 8,
            }}
          >
            No tenant found
          </div>
          <div style={{ fontSize: 14 }}>
            Your account is not associated with a workspace.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={dark ? "docs-root docs-dark" : "docs-root"}
      style={{
        minHeight: "100vh",
        background: dark ? "#141416" : "#f8f9fa",
        fontFamily:
          'Geist, "SF Pro Display", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <style>{`
        .docs-dark .ant-modal-title { color: #f3f4f6 !important; }
        .docs-dark .ant-form-item-label > label { color: #d1d5db !important; }
        .docs-dark .ant-input,
        .docs-dark .ant-input-affix-wrapper,
        .docs-dark .ant-input-textarea textarea {
          background: #17181c !important;
          color: #f3f4f6 !important;
          border-color: #2a2b31 !important;
        }
        .docs-dark .ant-input::placeholder,
        .docs-dark .ant-input-textarea textarea::placeholder {
          color: #9ca3af !important;
        }
        .docs-dark .ant-upload.ant-upload-drag {
          background: #17181c !important;
          border-color: #2a2b31 !important;
        }
      `}</style>
      <div style={{ padding: "18px 24px 4px" }}>
        <h1
          style={{
            margin: 0,
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1,
            marginBottom: 4,
          }}
        >
          Documents
        </h1>
        <p style={{ margin: 0, color: "var(--rec-text-2)", fontSize: 13 }}>
          Store, organize, and access your files in one place
        </p>
      </div>

      {/* Header / Search */}
      <div
        style={{
          background: dark ? "#1a1b1f" : "white",
          borderBottom: `1px solid ${dark ? "#2a2b31" : "#e0e0e0"}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div
          style={{
            flex: 1,
            maxWidth: 720,
            background: dark ? "#17181c" : "#f1f3f4",
            border: dark ? "1px solid #2a2b31" : "none",
            borderRadius: 24,
            display: "flex",
            alignItems: "center",
            padding: "0 16px",
            gap: 12,
            height: 46,
          }}
        >
          <div style={{ color: dark ? "#9ca3af" : "#5f6368" }}>
            <SearchIcon />
          </div>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search in Drive"
            style={{
              border: "none",
              background: "none",
              outline: "none",
              fontSize: 16,
              color: dark ? "#f3f4f6" : "#202124",
              width: "100%",
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flex: "0 0 auto" }}>
          <button
            onClick={() => setFolderModal(true)}
            style={{
              ...actionBtnStyle,
              background: dark ? "rgba(255,255,255,0.06)" : "#eef2ff",
              color: dark ? "#ffffff" : "#3453b7",
              border: dark ? "1px solid #3a3b43" : "1px solid #c7d2fe",
            }}
          >
            <NewFolderIcon /> New folder
          </button>
          <button
            onClick={() => setUploadModal(true)}
            style={{
              ...actionBtnStyle,
              background: dark ? "#ffffff" : "#3453b7",
              color: dark ? "#111827" : "#ffffff",
              border: dark ? "1px solid #ffffff" : "1px solid #3453b7",
            }}
          >
            <UploadIcon /> Upload
          </button>
        </div>
      </div>

      <div style={{ padding: "0 24px 24px" }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "16px 0 8px",
            color: dark ? "#9ca3af" : "#5f6368",
            fontSize: 14,
          }}
        >
          <button
            onClick={() => navigateTo(-1)}
            style={{
              ...breadcrumbBtnStyle,
              color: dark ? "#9ca3af" : breadcrumbBtnStyle.color,
            }}
          >
            <HomeIcon /> My Drive
          </button>
          {folderPath.map((folder, idx) => (
            <span
              key={folder.id}
              style={{ display: "flex", alignItems: "center", gap: 4 }}
            >
              <ChevronRight />
              <button
                onClick={() => navigateTo(idx)}
                style={{
                  ...breadcrumbBtnStyle,
                  color: dark ? "#9ca3af" : breadcrumbBtnStyle.color,
                }}
              >
                {folder.name}
              </button>
            </span>
          ))}
        </div>

        {/* Toolbar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ fontSize: 13, color: dark ? "#9ca3af" : "#5f6368" }}>
            {loading
              ? "Loading..."
              : `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button
              onClick={() => setViewMode("grid")}
              style={{
                ...viewToggleStyle,
                color:
                  viewMode === "grid"
                    ? "#1a73e8"
                    : dark
                      ? "#9ca3af"
                      : "#5f6368",
                background:
                  viewMode === "grid"
                    ? dark
                      ? "rgba(26,115,232,0.18)"
                      : "#e8f0fe"
                    : "transparent",
              }}
            >
              <GridIcon />
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                ...viewToggleStyle,
                color:
                  viewMode === "list"
                    ? "#1a73e8"
                    : dark
                      ? "#9ca3af"
                      : "#5f6368",
                background:
                  viewMode === "list"
                    ? dark
                      ? "rgba(26,115,232,0.18)"
                      : "#e8f0fe"
                    : "transparent",
              }}
            >
              <ListIcon />
            </button>
          </div>
        </div>

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "80px 0",
              color: dark ? "#9ca3af" : "#5f6368",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                margin: "0 auto 16px",
                opacity: 0.75,
              }}
            >
              <FolderIcon color={dark ? "#9ca3af" : "#5f6368"} />
            </div>
            <div
              style={{
                fontSize: 18,
                marginBottom: 8,
                color: dark ? "#f3f4f6" : "#202124",
              }}
            >
              {searchQuery ? "No results found" : "This folder is empty"}
            </div>
            <div style={{ fontSize: 14 }}>
              {searchQuery
                ? "Try a different search term"
                : "Upload files or create folders to get started"}
            </div>
          </div>
        )}

        {/* Grid View */}
        {viewMode === "grid" && !loading && (
          <div>
            {folders.length > 0 && (
              <>
                <div
                  style={{
                    ...sectionLabel,
                    color: dark ? "#9ca3af" : sectionLabel.color,
                  }}
                >
                  Folders
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(200px, 1fr))",
                    gap: 12,
                    marginBottom: 32,
                  }}
                >
                  {folders.map((folder) => (
                    <div
                      key={folder.id}
                      onDoubleClick={() => handleFolderClick(folder)}
                      onClick={() =>
                        setSelectedItem(
                          folder.id === selectedItem ? null : folder.id,
                        )
                      }
                      onContextMenu={(e) => handleContextMenu(e, folder)}
                      style={{
                        ...gridCardStyle,
                        background:
                          selectedItem === folder.id
                            ? dark
                              ? "rgba(26,115,232,0.18)"
                              : "#e8f0fe"
                            : dark
                              ? "#1a1b1f"
                              : "white",
                        border: `1px solid ${selectedItem === folder.id ? "#1a73e8" : dark ? "#2a2b31" : "#e0e0e0"}`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                        }}
                      >
                        <div style={{ width: 24, height: 20, flexShrink: 0 }}>
                          <FolderIcon color={getFolderColor(folder.id)} />
                        </div>
                        <span
                          style={{
                            fontSize: 14,
                            color: dark ? "#f3f4f6" : "#202124",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            flex: 1,
                          }}
                        >
                          {folder.name}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleContextMenu(e, folder);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: dark ? "#9ca3af" : "#5f6368",
                            padding: 2,
                            borderRadius: 4,
                            display: "flex",
                            alignItems: "center",
                            flexShrink: 0,
                          }}
                        >
                          <MoreIcon />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {files.length > 0 && (
              <>
                <div
                  style={{
                    ...sectionLabel,
                    color: dark ? "#9ca3af" : sectionLabel.color,
                  }}
                >
                  Files
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                    gap: 12,
                  }}
                >
                  {files.map((file) => {
                    const canPreview = !!getPreviewType(file.name);
                    return (
                      <div
                        key={file.id}
                        onDoubleClick={() => handleFileOpen(file)}
                        onClick={() =>
                          setSelectedItem(
                            file.id === selectedItem ? null : file.id,
                          )
                        }
                        onContextMenu={(e) => handleContextMenu(e, file)}
                        style={{
                          ...fileCardStyle,
                          background:
                            selectedItem === file.id
                              ? dark
                                ? "rgba(26,115,232,0.18)"
                                : "#e8f0fe"
                              : dark
                                ? "#1a1b1f"
                                : "white",
                          border: `1px solid ${selectedItem === file.id ? "#1a73e8" : dark ? "#2a2b31" : "#e0e0e0"}`,
                          position: "relative",
                        }}
                      >
                        {canPreview && (
                          <div
                            style={{ position: "absolute", top: 8, right: 8 }}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                              style={{
                                background: "rgba(26,115,232,0.1)",
                                border: "none",
                                borderRadius: 4,
                                padding: "3px 5px",
                                cursor: "pointer",
                                color: "#1a73e8",
                                display: "flex",
                                alignItems: "center",
                              }}
                              title="Preview"
                            >
                              <EyeIcon />
                            </button>
                          </div>
                        )}
                        <div
                          style={{
                            width: 40,
                            height: 48,
                            margin: "0 auto 12px",
                          }}
                        >
                          <FileIcon ext={getFileExt(file.name)} />
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: dark ? "#f3f4f6" : "#202124",
                            textAlign: "center",
                            wordBreak: "break-word",
                            lineHeight: 1.3,
                            marginBottom: 4,
                          }}
                        >
                          {file.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: dark ? "#9ca3af" : "#9aa0a6",
                            textAlign: "center",
                            marginBottom: 12,
                          }}
                        >
                          {formatSize(file.file_size)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* List View */}
        {viewMode === "list" && !loading && filtered.length > 0 && (
          <div
            style={{
              background: dark ? "#1a1b1f" : "white",
              borderRadius: 8,
              border: `1px solid ${dark ? "#2a2b31" : "#e0e0e0"}`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                ...listHeaderStyle,
                borderBottom: `1px solid ${dark ? "#2a2b31" : "#e0e0e0"}`,
                color: dark ? "#9ca3af" : listHeaderStyle.color,
              }}
            >
              <span style={{ flex: 3 }}>Name</span>
              <span style={{ flex: 1 }}>Size</span>
              <span style={{ flex: 1.5 }}>Modified</span>
              <span style={{ width: 100 }}></span>
            </div>
            {filtered.map((item, idx) => (
              <div
                key={item.id}
                onDoubleClick={() =>
                  item.type === "folder"
                    ? handleFolderClick(item)
                    : handleFileOpen(item)
                }
                onClick={() =>
                  setSelectedItem(item.id === selectedItem ? null : item.id)
                }
                onContextMenu={(e) => handleContextMenu(e, item)}
                style={{
                  ...listRowStyle,
                  background:
                    selectedItem === item.id
                      ? dark
                        ? "rgba(26,115,232,0.18)"
                        : "#e8f0fe"
                      : idx % 2 === 0
                        ? dark
                          ? "#1a1b1f"
                          : "white"
                        : dark
                          ? "#17181c"
                          : "#fafafa",
                  borderTop:
                    idx > 0
                      ? `1px solid ${dark ? "#2a2b31" : "#f1f3f4"}`
                      : "none",
                }}
              >
                <div
                  style={{
                    flex: 3,
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    minWidth: 0,
                  }}
                >
                  <div style={{ width: 20, height: 18, flexShrink: 0 }}>
                    {item.type === "folder" ? (
                      <FolderIcon color={getFolderColor(item.id)} />
                    ) : (
                      <FileIcon ext={getFileExt(item.name)} />
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: 14,
                      color: dark ? "#f3f4f6" : "#202124",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.name}
                  </span>
                </div>
                <span
                  style={{
                    flex: 1,
                    fontSize: 13,
                    color: dark ? "#9ca3af" : "#5f6368",
                  }}
                >
                  {formatSize(item.file_size)}
                </span>
                <span
                  style={{
                    flex: 1.5,
                    fontSize: 13,
                    color: dark ? "#9ca3af" : "#5f6368",
                  }}
                >
                  {formatDate(item.created_at)}
                </span>
                <div
                  style={{
                    width: 132,
                    display: "flex",
                    gap: 4,
                    justifyContent: "flex-end",
                  }}
                >
                  {item.type === "file" && getPreviewType(item.name) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(item);
                      }}
                      style={iconBtnStyle}
                      title="Preview"
                    >
                      <EyeIcon />
                    </button>
                  )}
                  {item.type === "folder" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingFolder(item);
                        form.setFieldsValue({ name: item.name });
                        setFolderModal(true);
                      }}
                      style={iconBtnStyle}
                      title="Rename"
                    >
                      <EditIcon />
                    </button>
                  )}
                  {item.type === "file" && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(item);
                      }}
                      style={iconBtnStyle}
                      title="Download"
                    >
                      <DownloadIcon />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirm(item);
                    }}
                    style={{ ...iconBtnStyle, color: "#d32f2f" }}
                    title="Delete"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* File Preview Overlay */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
          onDownload={handleDownload}
          onPrev={() => hasPrev && setPreviewFile(files[previewIdx - 1])}
          onNext={() => hasNext && setPreviewFile(files[previewIdx + 1])}
          hasPrev={hasPrev}
          hasNext={hasNext}
        />
      )}

      {/* Context Menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          record={contextMenu.record}
          dark={dark}
          onEdit={(r) => {
            setEditingFolder(r);
            form.setFieldsValue({ name: r.name });
            setFolderModal(true);
          }}
          onDelete={(r) => setDeleteConfirm(r)}
          onDownload={handleDownload}
          onPreview={(r) => setPreviewFile(r)}
          onClose={() => setContextMenu(null)}
        />
      )}

      {/* Delete Confirm Modal */}
      <Modal
        title={null}
        open={!!deleteConfirm}
        rootClassName={dark ? "docs-dark" : undefined}
        styles={modalStyles}
        onCancel={() => setDeleteConfirm(null)}
        footer={null}
        width={400}
        centered
      >
        {deleteConfirm && (
          <div style={{ padding: "8px 0" }}>
            <div
              style={{
                fontSize: 18,
                fontWeight: 500,
                marginBottom: 12,
                color: dark ? "#f3f4f6" : "#202124",
              }}
            >
              Delete "{deleteConfirm.name}"?
            </div>
            <div
              style={{
                fontSize: 14,
                color: dark ? "#9ca3af" : "#5f6368",
                marginBottom: 24,
              }}
            >
              {deleteConfirm.type === "folder"
                ? "This will permanently delete the folder and all its contents."
                : "This file will be permanently deleted."}
            </div>
            <div
              style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}
            >
              <button
                onClick={() => setDeleteConfirm(null)}
                style={cancelBtnStyle}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirm)}
                style={deleteBtnStyle}
              >
                Delete forever
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* New Folder Modal */}
      <Modal
        title={editingFolder ? "Rename folder" : "New folder"}
        open={folderModal}
        rootClassName={dark ? "docs-dark" : undefined}
        styles={modalStyles}
        onCancel={() => {
          setFolderModal(false);
          setEditingFolder(null);
          form.resetFields();
        }}
        footer={null}
        centered
        width={380}
      >
        <Form
          form={form}
          onFinish={handleCreateFolder}
          style={{ marginTop: 16 }}
        >
          <Form.Item
            name="name"
            rules={[{ required: true, message: "Enter a folder name" }]}
          >
            <input
              autoFocus
              placeholder="Untitled folder"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 15,
                border: `1px solid ${dark ? "#2a2b31" : "#e0e0e0"}`,
                borderRadius: 6,
                outline: "none",
                fontFamily: "inherit",
                color: dark ? "#f3f4f6" : "#202124",
                background: dark ? "#17181c" : "#ffffff",
              }}
              onChange={(e) => form.setFieldsValue({ name: e.target.value })}
              defaultValue={editingFolder?.name || ""}
            />
          </Form.Item>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setFolderModal(false);
                setEditingFolder(null);
                form.resetFields();
              }}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button type="submit" style={primaryBtnStyle} disabled={loading}>
              {editingFolder ? "Rename" : "Create"}
            </button>
          </div>
        </Form>
      </Modal>

      {/* Upload Modal */}
      <Modal
        title="Upload files"
        open={uploadModal}
        rootClassName={dark ? "docs-dark" : undefined}
        styles={modalStyles}
        onCancel={() => {
          setUploadModal(false);
          setFileList([]);
        }}
        footer={null}
        centered
        width={400}
      >
        <div style={{ marginTop: 16 }}>
          <Upload.Dragger
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            onRemove={() => setFileList([])}
            fileList={fileList}
            maxCount={1}
            style={{
              background: dark ? "#17181c" : "#f8f9fa",
              borderColor: dark ? "#2a2b31" : "#1a73e8",
            }}
          >
            <div style={{ padding: 24 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  margin: "0 auto 8px",
                  opacity: 0.75,
                }}
              >
                <UploadIcon />
              </div>
              <p
                style={{
                  fontSize: 14,
                  color: dark ? "#f3f4f6" : "#202124",
                  marginBottom: 4,
                }}
              >
                Drag files here or{" "}
                <span
                  style={{
                    color: "#1a73e8",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  browse
                </span>
              </p>
              <p style={{ fontSize: 12, color: dark ? "#9ca3af" : "#9aa0a6" }}>
                Select a file to upload
              </p>
            </div>
          </Upload.Dragger>
          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "flex-end",
              marginTop: 20,
            }}
          >
            <button
              onClick={() => {
                setUploadModal(false);
                setFileList([]);
              }}
              style={cancelBtnStyle}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              style={primaryBtnStyle}
              disabled={uploading || fileList.length === 0}
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ------------------------ Shared Styles ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
const actionBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "0 16px",
  height: 36,
  border: "1px solid #dadce0",
  borderRadius: 20,
  background: "white",
  cursor: "pointer",
  fontSize: 14,
  color: "#202124",
  fontWeight: 500,
  transition: "all 0.15s",
  fontFamily: "inherit",
};
const breadcrumbBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  background: "none",
  border: "none",
  cursor: "pointer",
  color: "#5f6368",
  fontSize: 14,
  padding: "4px 8px",
  borderRadius: 4,
  fontFamily: "inherit",
};
const viewToggleStyle = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  cursor: "pointer",
  borderRadius: 4,
};
const gridCardStyle = {
  borderRadius: 8,
  padding: "12px 14px",
  cursor: "pointer",
  transition: "all 0.15s",
  userSelect: "none",
};
const fileCardStyle = {
  borderRadius: 8,
  padding: "20px 12px 14px",
  cursor: "pointer",
  transition: "all 0.15s",
  userSelect: "none",
};
const listHeaderStyle = {
  display: "flex",
  alignItems: "center",
  padding: "10px 16px",
  borderBottom: "1px solid #e0e0e0",
  fontSize: 12,
  fontWeight: 600,
  color: "#5f6368",
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
const listRowStyle = {
  display: "flex",
  alignItems: "center",
  padding: "10px 16px",
  cursor: "pointer",
  transition: "background 0.1s",
  userSelect: "none",
};
const sectionLabel = {
  fontSize: 13,
  fontWeight: 500,
  color: "#5f6368",
  marginBottom: 10,
  letterSpacing: 0.2,
};
const iconBtnStyle = {
  width: 30,
  height: 30,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "none",
  cursor: "pointer",
  borderRadius: 4,
  color: "#5f6368",
};
const primaryBtnStyle = {
  padding: "8px 20px",
  background: "#1a73e8",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
};
const cancelBtnStyle = {
  padding: "8px 20px",
  background: "none",
  color: "#1a73e8",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
};
const deleteBtnStyle = {
  padding: "8px 20px",
  background: "#d32f2f",
  color: "white",
  border: "none",
  borderRadius: 4,
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 500,
  fontFamily: "inherit",
};

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 2000,
  background: "rgba(15,15,20,0.95)",
  display: "flex",
  flexDirection: "column",
  backdropFilter: "blur(4px)",
};
const previewHeaderStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "12px 20px",
  background: "rgba(255,255,255,0.06)",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  flexShrink: 0,
  gap: 16,
};
const previewContentStyle = {
  flex: 1,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px 80px",
  overflow: "hidden",
  position: "relative",
};
const previewFooterStyle = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  justifyContent: "center",
  padding: "10px 20px",
  color: "rgba(255,255,255,0.4)",
  fontSize: 12,
  borderTop: "1px solid rgba(255,255,255,0.08)",
  flexShrink: 0,
};
const previewActionBtn = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 14px",
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 6,
  color: "white",
  cursor: "pointer",
  fontSize: 13,
  fontFamily: "inherit",
};
const previewIconBtn = {
  width: 36,
  height: 36,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.08)",
  border: "none",
  borderRadius: 6,
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
};
const navArrowStyle = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  zIndex: 10,
  width: 44,
  height: 44,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: "50%",
  color: "white",
  cursor: "pointer",
};
const centeredMsg = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
};
const textPreviewStyle = {
  width: "100%",
  maxWidth: 900,
  height: "100%",
  overflow: "auto",
  background: "rgba(15,20,30,0.9)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "24px 28px",
};
const spinnerStyle = {
  width: 36,
  height: 36,
  border: "3px solid rgba(255,255,255,0.1)",
  borderTop: "3px solid #1a73e8",
  borderRadius: "50%",
  animation: "spin 0.8s linear infinite",
};

export default Documents;
