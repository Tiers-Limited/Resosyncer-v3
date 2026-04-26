import { useEffect, useMemo, useState } from "react";
import {
  Button,
  Form,
  Image,
  Input,
  Modal,
  Popconfirm,
  Space,
  Switch,
  Tabs,
  Tag,
  Upload,
  message,
} from "antd";
import {
  DeleteOutlined,
  EditOutlined,
  MenuOutlined,
  PlusOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { supabase } from "../../../lib/supabase";
import { useAuth } from "../../../contexts/AuthContext";
import { getYouTubeVideoId } from "../../../lib/youtube";
import {
  applyResourceSubtype,
  extractResourceSubtype,
  stripResourceMetaComments,
} from "../../../lib/resourceContentMeta";

const RESOURCE_CATEGORIES = [
  { value: "documentation", label: "Documentation" },
  { value: "tutorials", label: "Tutorials" },
  { value: "blogs_updates", label: "Blogs" },
  { value: "faqs", label: "FAQs" },
];

const EMPTY_FORM = {
  title: "",
  summary: "",
  content_html: "",
  external_url: "",
  cover_image_url: "",
  is_published: true,
};

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const stripHtml = (value) =>
  String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isMeaningfulHtml = (html) => stripHtml(html).length > 0;

const sanitizeFilename = (name = "") =>
  name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 90);

function SortableResourceRow({ row, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: row.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: "12px 14px",
        marginBottom: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          style={{
            border: "none",
            background: "transparent",
            cursor: "grab",
            color: "#64748b",
            padding: 2,
          }}
          aria-label="Drag to reorder"
          title="Drag to reorder"
        >
          <MenuOutlined />
        </button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <div style={{ fontWeight: 600, color: "#111827" }}>{row.title || "Untitled"}</div>
            <Tag color={row.is_published ? "green" : "default"}>
              {row.is_published ? "Published" : "Draft"}
            </Tag>
          </div>
          <div style={{ marginTop: 4, color: "#6b7280", fontSize: 12 }}>
            {(row.summary || stripHtml(row.content_html || "")).slice(0, 160) || "No preview"}
          </div>
        </div>

        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(row)}>
            Edit
          </Button>
          <Popconfirm
            title="Delete this item?"
            description="This cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={() => onDelete(row.id)}
          >
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
}

export default function SuperadminResourcesPage() {
  const { user } = useAuth();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = Form.useForm();

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editingSortOrder, setEditingSortOrder] = useState(0);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("documentation");

  const selectedCategory = activeCategory;

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const loadRows = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("platform_resources")
      .select(
        "id, category, title, summary, content_html, external_url, cover_image_url, sort_order, is_published, updated_at, created_at",
      )
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      messageApi.error(`Failed to load resources: ${error.message}`);
      setRows([]);
    } else {
      setRows(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRows();
  }, []);

  const categoryRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows
      .filter((row) => row.category === activeCategory)
      .filter((row) =>
        activeCategory === "blogs_updates"
          ? extractResourceSubtype(row.content_html) !== "update"
          : true,
      )
      .filter((row) => {
        if (!q) return true;
        return (
          String(row.title || "").toLowerCase().includes(q) ||
          String(row.summary || "").toLowerCase().includes(q) ||
          stripHtml(row.content_html || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aOrder = Number(a.sort_order || 0);
        const bOrder = Number(b.sort_order || 0);
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      });
  }, [rows, activeCategory, search]);

  const getNextSortOrder = (category) => {
    const max = rows
      .filter((r) => r.category === category)
      .reduce((m, r) => Math.max(m, Number(r.sort_order || 0)), 0);
    return max + 1;
  };

  const openCreate = () => {
    setEditingId(null);
    setEditingSortOrder(getNextSortOrder(activeCategory));
    form.setFieldsValue({ ...EMPTY_FORM });
    setOpen(true);
  };

  const openEdit = (row) => {
    setEditingId(row.id);
    setEditingSortOrder(Number(row.sort_order || 0));
    form.setFieldsValue({
      title: row.title || "",
      summary: row.summary || "",
      content_html: stripResourceMetaComments(row.content_html || ""),
      external_url: row.external_url || "",
      cover_image_url: row.cover_image_url || "",
      is_published: !!row.is_published,
    });
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEditingId(null);
    setEditingSortOrder(0);
    form.resetFields();
  };

  const handleCoverUpload = async ({ file, onSuccess, onError }) => {
    try {
      setCoverUploading(true);
      const ext = file?.name?.split(".").pop() || "jpg";
      const filename = sanitizeFilename(file?.name || `cover.${ext}`);
      const path = `resources/covers/${Date.now()}-${filename}`;

      const { error } = await supabase.storage
        .from("attachments")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
      if (error) throw error;

      const { data } = supabase.storage.from("attachments").getPublicUrl(path);
      const url = data?.publicUrl || "";
      if (!url) throw new Error("Failed to generate image URL.");

      form.setFieldValue("cover_image_url", url);
      messageApi.success("Cover image uploaded.");
      onSuccess?.("ok");
    } catch (err) {
      messageApi.error(err?.message || "Cover upload failed.");
      onError?.(err);
    } finally {
      setCoverUploading(false);
    }
  };

  const persistCategorySort = async (orderedIds) => {
    const updates = orderedIds.map((id, idx) =>
      supabase.from("platform_resources").update({ sort_order: idx + 1 }).eq("id", id),
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
  };

  const onDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return;

    const ids = categoryRows.map((r) => r.id);
    const oldIndex = ids.indexOf(active.id);
    const newIndex = ids.indexOf(over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const reordered = arrayMove(categoryRows, oldIndex, newIndex);
    const reorderedIds = reordered.map((r) => r.id);

    const updatedRows = rows.map((row) => {
      if (row.category !== activeCategory) return row;
      const idx = reorderedIds.indexOf(row.id);
      return idx >= 0 ? { ...row, sort_order: idx + 1 } : row;
    });
    setRows(updatedRows);

    try {
      await persistCategorySort(reorderedIds);
      messageApi.success("Order updated.");
    } catch (err) {
      messageApi.error(`Failed to save order: ${err.message}`);
      loadRows();
    }
  };

  const onDelete = async (id) => {
    const { error } = await supabase.from("platform_resources").delete().eq("id", id);
    if (error) {
      messageApi.error(`Delete failed: ${error.message}`);
      return;
    }
    messageApi.success("Deleted.");
    loadRows();
  };

  const onSave = async () => {
    try {
      const values = await form.validateFields();
      const category = activeCategory;
      const isDocumentation = category === "documentation";
      const isTutorial = category === "tutorials";
      const isFaq = category === "faqs";
      const isBlogUpdate = category === "blogs_updates";
      const isBlog = isBlogUpdate;

      if ((isDocumentation || isBlog) && !isMeaningfulHtml(values.content_html)) {
        messageApi.error("Content is required.");
        return;
      }
      if (isFaq && !isMeaningfulHtml(values.content_html)) {
        messageApi.error("Answer is required.");
        return;
      }
      if (isTutorial && !getYouTubeVideoId(values.external_url)) {
        messageApi.error("Tutorial requires a valid YouTube URL.");
        return;
      }

      setSaving(true);

      let payload = {
        category,
        is_published: !!values.is_published,
        sort_order: editingSortOrder || getNextSortOrder(category),
        title: "",
        summary: null,
        content_html: "<p></p>",
        external_url: null,
        cover_image_url: null,
      };

      if (isDocumentation) {
        payload = {
          ...payload,
          title: values.title.trim(),
          summary: values.summary.trim(),
          cover_image_url: values.cover_image_url.trim(),
          content_html: stripResourceMetaComments(values.content_html),
        };
      } else if (isTutorial) {
        payload = {
          ...payload,
          title: values.title.trim(),
          cover_image_url: values.cover_image_url.trim(),
          external_url: values.external_url.trim(),
          content_html: "<p></p>",
        };
      } else if (isFaq) {
        payload = {
          ...payload,
          title: values.title.trim(),
          content_html: stripResourceMetaComments(values.content_html),
        };
      } else if (isBlog) {
        payload = {
          ...payload,
          title: values.title.trim(),
          summary: values.summary.trim(),
          cover_image_url: values.cover_image_url.trim(),
          content_html: applyResourceSubtype(values.content_html, "blog"),
        };
      }

      let error;
      if (editingId) {
        const { error: updateError } = await supabase
          .from("platform_resources")
          .update(payload)
          .eq("id", editingId);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from("platform_resources")
          .insert({ ...payload, created_by: user?.id || null });
        error = insertError;
      }

      if (error) {
        messageApi.error(`Save failed: ${error.message}`);
      } else {
        messageApi.success(editingId ? "Updated." : "Created.");
        closeModal();
        loadRows();
      }
    } catch {
      // Form validation handles errors
    } finally {
      setSaving(false);
    }
  };

  const coverPreview = form.getFieldValue("cover_image_url");
  const isDocumentation = selectedCategory === "documentation";
  const isTutorial = selectedCategory === "tutorials";
  const isFaq = selectedCategory === "faqs";
  const isBlogUpdate = selectedCategory === "blogs_updates";
  const isBlog = isBlogUpdate;

  return (
    <div style={{ padding: 20 }}>
      {contextHolder}

      <div style={{ marginBottom: 16 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: "#0f172a" }}>Resources</h1>
        <p style={{ margin: "6px 0 0", color: "#64748b", fontSize: 14 }}>
          Manage public resources by section. Drag items to reorder.
        </p>
      </div>

      <Tabs
        activeKey={activeCategory}
        onChange={setActiveCategory}
        items={RESOURCE_CATEGORIES.map((item) => ({
          key: item.value,
          label: item.label,
        }))}
        style={{ marginBottom: 12 }}
      />

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
        <Input
          placeholder={`Search ${RESOURCE_CATEGORIES.find((c) => c.value === activeCategory)?.label || ""}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 340 }}
        />
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Add
        </Button>
      </div>

      {loading ? (
        <div style={{ color: "#64748b", fontSize: 14 }}>Loading...</div>
      ) : categoryRows.length === 0 ? (
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: "18px 16px",
            color: "#64748b",
            background: "#f8fafc",
          }}
        >
          No items found.
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={categoryRows.map((r) => r.id)} strategy={verticalListSortingStrategy}>
            <div>
              {categoryRows.map((row) => (
                <SortableResourceRow key={row.id} row={row} onEdit={openEdit} onDelete={onDelete} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Modal
        title={editingId ? "Edit Resource" : "Create Resource"}
        open={open}
        onCancel={closeModal}
        onOk={onSave}
        okText={editingId ? "Update" : "Create"}
        confirmLoading={saving}
        width={980}
        destroyOnClose
      >
        <Form layout="vertical" form={form} initialValues={{ ...EMPTY_FORM, category: activeCategory }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 12 }}>
            {(isDocumentation || isTutorial || isBlog || isFaq) && (
              <Form.Item
                label={isFaq ? "Question" : "Title"}
                name="title"
                rules={[{ required: true, message: isFaq ? "Question is required" : "Title is required" }]}
              >
                <Input maxLength={220} />
              </Form.Item>
            )}

            <Form.Item label="Published" name="is_published" valuePropName="checked">
              <Switch />
            </Form.Item>
          </div>

          {(isDocumentation || isBlog) && (
            <>
              <Form.Item
                label="Summary"
                name="summary"
                rules={[{ required: true, message: "Summary is required" }]}
              >
                <Input.TextArea rows={3} maxLength={500} />
              </Form.Item>
              <Form.Item
                label="Content"
                name="content_html"
                rules={[
                  {
                    validator: (_, value) =>
                      isMeaningfulHtml(value)
                        ? Promise.resolve()
                        : Promise.reject(new Error("Content is required")),
                  },
                ]}
              >
                <ReactQuill theme="snow" modules={quillModules} />
              </Form.Item>
            </>
          )}

          {isTutorial && (
            <Form.Item
              label="Video URL"
              name="external_url"
              rules={[
                { required: true, message: "Video URL is required" },
                {
                  validator: (_, value) =>
                    value && getYouTubeVideoId(value)
                      ? Promise.resolve()
                      : Promise.reject(new Error("Enter a valid YouTube URL")),
                },
              ]}
            >
              <Input placeholder="https://www.youtube.com/watch?v=..." />
            </Form.Item>
          )}

          {isFaq && (
            <Form.Item
              label="Answer"
              name="content_html"
              rules={[
                {
                  validator: (_, value) =>
                    isMeaningfulHtml(value)
                      ? Promise.resolve()
                      : Promise.reject(new Error("Answer is required")),
                },
              ]}
            >
              <ReactQuill theme="snow" modules={quillModules} />
            </Form.Item>
          )}

          {(isDocumentation || isTutorial || isBlog) && (
            <>
              <Form.Item
                label="Cover Image URL"
                name="cover_image_url"
                rules={[{ required: true, message: "Cover image is required" }]}
              >
                <Input placeholder="https://..." />
              </Form.Item>
              <div style={{ marginBottom: 16 }}>
                <Space wrap>
                  <Upload
                    accept="image/*"
                    maxCount={1}
                    showUploadList={false}
                    customRequest={handleCoverUpload}
                  >
                    <Button icon={<UploadOutlined />} loading={coverUploading}>
                      Pick Cover Image
                    </Button>
                  </Upload>
                  {coverPreview && (
                    <Button onClick={() => form.setFieldValue("cover_image_url", "")} disabled={coverUploading}>
                      Remove Image
                    </Button>
                  )}
                </Space>
                {coverPreview && (
                  <div style={{ marginTop: 10 }}>
                    <Image
                      src={coverPreview}
                      alt="Cover preview"
                      width={220}
                      height={120}
                      style={{ objectFit: "cover", borderRadius: 8 }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </Form>
      </Modal>
    </div>
  );
}
