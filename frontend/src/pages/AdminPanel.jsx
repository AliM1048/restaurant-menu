import { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  LogOut,
  Star,
  ChefHat,
  ImageIcon,
  X,
  Upload,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import api from "../api/client";
import { resolveImage } from "../utils/helpers";

const CATEGORIES_OPTS = [
  "starters",
  "mains",
  "pasta",
  "pizza",
  "seafood",
  "desserts",
  "drinks",
];
const FALLBACK =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=100&auto=format&fit=crop";

/* ─── SweetAlert2 dark theme ─────────────────────────────────────── */
const swalDark = Swal.mixin({
  background: "#1a1208",
  color: "#e8d5aa",
  confirmButtonColor: "#c9a84c",
  cancelButtonColor: "#3d3020",
  customClass: {
    popup: "swal-dark-popup",
    confirmButton: "swal-confirm",
    cancelButton: "swal-cancel",
  },
});

/* ─── Image Upload Field ────────────────────────────────────────── */
function ImageUploadField({ currentImageId, currentImageUrl, onUploaded }) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);

  const existingSrc = currentImageId
    ? `/api/images/${currentImageId}`
    : currentImageUrl || null;

  const handleFile = async (file) => {
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);
    try {
      const { data } = await api.post("/images/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onUploaded(data.fileId);
      toast.success("Image uploaded to MongoDB!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Upload failed.");
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };
  const clearPreview = () => {
    setPreview(null);
    onUploaded(null);
    if (inputRef.current) inputRef.current.value = "";
  };
  const thumb = preview || existingSrc;

  return (
    <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
      <label className="form-label">Dish Image</label>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => !uploading && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        id="image-drop-zone"
        style={{
          border: "2px dashed var(--border-hover)",
          borderRadius: "var(--radius-md)",
          padding: thumb ? "0" : "28px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          cursor: uploading ? "wait" : "pointer",
          overflow: "hidden",
          position: "relative",
          minHeight: 120,
          background: "var(--bg-primary)",
          transition: "border-color 0.2s",
        }}
      >
        {thumb ? (
          <>
            <img
              src={thumb}
              alt="Preview"
              onError={(e) => (e.target.src = FALLBACK)}
              style={{
                width: "100%",
                maxHeight: 240,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              className="img-hover-overlay"
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.55)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                opacity: 0,
                transition: "opacity 0.2s",
              }}
            >
              <button
                type="button"
                className="btn-primary"
                id="change-image-btn"
                style={{ fontSize: "0.78rem", padding: "8px 16px" }}
                onClick={(e) => {
                  e.stopPropagation();
                  inputRef.current?.click();
                }}
              >
                <Upload size={14} /> Change
              </button>
              <button
                type="button"
                className="btn-outline"
                id="remove-image-btn"
                style={{
                  fontSize: "0.78rem",
                  padding: "7px 14px",
                  color: "#fff",
                  borderColor: "rgba(255,255,255,0.5)",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  clearPreview();
                }}
              >
                <X size={14} /> Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <ImageIcon size={32} color="var(--text-muted)" />
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-muted)",
                textAlign: "center",
              }}
            >
              {uploading
                ? "Uploading to MongoDB…"
                : "Click or drag & drop image here"}
            </p>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
              JPEG, PNG, WebP · max 8 MB
            </p>
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
        id="image-file-input"
      />
      <style>{`[id="image-drop-zone"]:hover .img-hover-overlay { opacity: 1 !important; }`}</style>
    </div>
  );
}

/* ─── Item Form ─────────────────────────────────────────────────── */
function ItemForm({ initial = {}, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: "mains",
    tags: "",
    allergens: "",
    prepTime: 15,
    calories: 0,
    featured: false,
    imageId: null,
    image: null,
    ...initial,
    tags: (initial.tags || []).join(", "),
    allergens: (initial.allergens || []).join(", "),
    imageId: initial.imageId || null,
    image: initial.image || null,
  });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      price: parseFloat(form.price),
      prepTime: parseInt(form.prepTime),
      calories: parseInt(form.calories),
      tags: form.tags
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      allergens: form.allergens
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  };

  const fields = [
    { label: "Name *", key: "name", type: "text", required: true },
    {
      label: "Price ($) *",
      key: "price",
      type: "number",
      step: "0.01",
      required: true,
    },
    { label: "Prep Time (min)", key: "prepTime", type: "number" },
    { label: "Calories", key: "calories", type: "number" },
    { label: "Tags (comma sep)", key: "tags", type: "text" },
    { label: "Allergens (comma sep)", key: "allergens", type: "text" },
  ];

  return (
    <motion.form
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: "24px",
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "12px",
      }}
    >
      <ImageUploadField
        currentImageId={form.imageId}
        currentImageUrl={form.image}
        onUploaded={(id) => set("imageId", id)}
      />
      {fields.map(({ label, key, ...rest }) => (
        <div key={key} className="form-group" style={{ margin: 0 }}>
          <label className="form-label">{label}</label>
          <input
            className="form-input"
            value={form[key]}
            onChange={(e) => set(key, e.target.value)}
            style={{ width: "100%" }}
            {...rest}
          />
        </div>
      ))}
      <div className="form-group" style={{ margin: 0 }}>
        <label className="form-label">Category *</label>
        <select
          className="form-select"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          required
        >
          {CATEGORIES_OPTS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group" style={{ margin: 0, gridColumn: "1/-1" }}>
        <label className="form-label">Description</label>
        <textarea
          className="form-input"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          style={{ width: "100%", resize: "vertical" }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          gridColumn: "1/-1",
        }}
      >
        <input
          type="checkbox"
          id="featured-check"
          checked={form.featured}
          onChange={(e) => set("featured", e.target.checked)}
        />
        <label
          htmlFor="featured-check"
          style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}
        >
          ⭐ Mark as Chef's Pick
        </label>
      </div>
      <div style={{ display: "flex", gap: 10, gridColumn: "1/-1" }}>
        <button type="submit" className="btn-primary" id="form-save">
          Save Dish
        </button>
        <button
          type="button"
          className="btn-outline"
          onClick={onCancel}
          style={{ padding: "9px 20px" }}
          id="form-cancel"
        >
          Cancel
        </button>
      </div>
    </motion.form>
  );
}

/* ─── Sort Icon helper ──────────────────────────────────────────── */
function SortIcon({ col, sortKey, dir }) {
  if (sortKey !== col) return <ChevronsUpDown size={13} opacity={0.35} />;
  return dir === "asc" ? (
    <ChevronUp size={13} color="var(--gold)" />
  ) : (
    <ChevronDown size={13} color="var(--gold)" />
  );
}

/* ─── Admin Panel ───────────────────────────────────────────────── */
export default function AdminPanel() {
  const [items, setItems] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("name");
  const [sortDir, setSortDir] = useState("asc");
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/admin/login");
      return;
    }
    fetchItems();
  }, []);

  const fetchItems = () => {
    api
      .get("/admin/menu")
      .then((r) => setItems(r.data))
      .catch(() => navigate("/admin/login"));
  };

  /* ── Sorting logic ── */
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  /* ── Filtered + sorted items (client-side) ── */
  const displayItems = useMemo(() => {
    let result = items.filter((i) =>
      i.name?.toLowerCase().includes(search.toLowerCase()),
    );
    result = [...result].sort((a, b) => {
      let va = a[sortKey] ?? "";
      let vb = b[sortKey] ?? "";
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [items, search, sortKey, sortDir]);

  const handleCreate = async (payload) => {
    try {
      await api.post("/admin/menu", payload);
      toast.success("Dish created!");
      setShowForm(false);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to create.");
    }
  };

  const handleUpdate = async (payload) => {
    try {
      await api.put(`/admin/menu/${editItem._id}`, payload);
      toast.success("Dish updated!");
      setEditItem(null);
      fetchItems();
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update.");
    }
  };

  const handleDelete = async (id, name) => {
    const result = await swalDark.fire({
      title: "Remove dish?",
      html: `<span style="color:var(--gold);font-weight:600">${name}</span> will be permanently removed from the menu.`,
      icon: "warning",
      iconColor: "#c9a84c",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Keep it",
      reverseButtons: true,
    });
    if (!result.isConfirmed) return;
    try {
      await api.delete(`/admin/menu/${id}`);
      toast.success(`"${name}" deleted.`);
      fetchItems();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    navigate("/admin/login");
  };

  const handleSettings = async () => {
    try {
      const { data } = await api.get("/admin/settings");
      const currentFee = data.deliveryFee;

      const { value: newFee } = await swalDark.fire({
        title: "⚙️ Global Settings",
        input: "number",
        inputLabel: "Delivery Fee ($)",
        inputValue: currentFee,
        inputAttributes: {
          min: 0,
          step: 0.5,
        },
        showCancelButton: true,
        confirmButtonText: "Save Settings",
      });

      if (newFee) {
        await api.put("/admin/settings", { deliveryFee: Number(newFee) });
        toast.success("Settings updated!");
      }
    } catch (err) {
      toast.error("Failed to load/save settings.");
    }
  };

  /* ── Column header def ── */
  const cols = [
    { key: null, label: "Image", sortable: false },
    { key: "name", label: "Name", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "price", label: "Price", sortable: true },
    { key: "avgRating", label: "Rating", sortable: true },
    { key: "featured", label: "Featured", sortable: true },
    { key: null, label: "Stored", sortable: false },
    { key: null, label: "Actions", sortable: false },
  ];

  const thStyle = (sortable) => ({
    cursor: sortable ? "pointer" : "default",
    userSelect: "none",
    whiteSpace: "nowrap",
  });

  return (
    <div className="admin-panel">
      <div className="container">
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ChefHat size={28} color="var(--gold)" /> Kitchen Manager
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                marginTop: 4,
              }}
            >
              {displayItems.length} of {items.length} dishes
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {!showForm && !editItem && (
              <button
                className="btn-primary"
                onClick={() => setShowForm(true)}
                id="add-item-btn"
              >
                <Plus size={16} /> Add Dish
              </button>
            )}
            <button
              className="btn-outline"
              style={{ padding: "10px 18px" }}
              onClick={() => navigate("/admin/orders")}
              id="admin-orders-link"
            >
              📦 Orders
            </button>
            <button
              className="btn-outline"
              style={{ padding: "10px 18px" }}
              onClick={handleSettings}
              id="admin-settings"
            >
              <Settings size={16} /> Settings
            </button>
            <button
              className="btn-outline"
              style={{ padding: "10px 18px" }}
              onClick={handleLogout}
              id="admin-logout"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        {/* Search bar */}
        <div className="search-bar-wrap" style={{ marginBottom: 20 }}>
          <Search className="search-icon" size={16} />
          <input
            id="admin-search"
            type="text"
            placeholder="Search dishes by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search admin dishes"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                position: "absolute",
                right: 14,
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text-muted)",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Forms */}
        {showForm && (
          <ItemForm onSave={handleCreate} onCancel={() => setShowForm(false)} />
        )}
        {editItem && (
          <ItemForm
            initial={editItem}
            onSave={handleUpdate}
            onCancel={() => setEditItem(null)}
          />
        )}

        {/* Table */}
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                {cols.map((col, i) => (
                  <th
                    key={i}
                    style={thStyle(col.sortable)}
                    onClick={() => col.sortable && handleSort(col.key)}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      {col.label}
                      {col.sortable && (
                        <SortIcon
                          col={col.key}
                          sortKey={sortKey}
                          dir={sortDir}
                        />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displayItems.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    style={{
                      textAlign: "center",
                      padding: "32px",
                      color: "var(--text-muted)",
                    }}
                  >
                    No dishes match "{search}"
                  </td>
                </tr>
              ) : (
                displayItems.map((item) => (
                  <motion.tr
                    key={item._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <td>
                      <img
                        src={resolveImage(item)}
                        alt={item.name}
                        className="tbl-img"
                        onError={(e) => (e.target.src = FALLBACK)}
                      />
                    </td>
                    <td
                      style={{ fontWeight: 500, color: "var(--text-primary)" }}
                    >
                      {item.name}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {item.category}
                    </td>
                    <td
                      style={{
                        color: "var(--gold)",
                        fontFamily: "var(--font-display)",
                      }}
                    >
                      ${item.price?.toFixed(2)}
                    </td>
                    <td>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                        }}
                      >
                        <Star size={13} color="#f59e0b" fill="#f59e0b" />
                        {item.avgRating > 0 ? item.avgRating : "—"}
                      </div>
                    </td>
                    <td>{item.featured ? "⭐" : "—"}</td>
                    <td>
                      {item.imageId ? (
                        <span
                          style={{
                            color: "#7c5ef0",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          🗄️ GridFS
                        </span>
                      ) : (
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontSize: "0.72rem",
                          }}
                        >
                          🔗 URL
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          className="btn-sm btn-edit"
                          id={`edit-${item._id}`}
                          onClick={() => {
                            setEditItem(item);
                            setShowForm(false);
                          }}
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          className="btn-sm btn-danger"
                          id={`delete-${item._id}`}
                          onClick={() => handleDelete(item._id, item.name)}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
