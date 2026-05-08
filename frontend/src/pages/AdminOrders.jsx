import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingBag,
  TrendingUp,
  MapPin,
  BarChart2,
  Download,
  ChevronDown,
  ChevronUp,
  Clock,
  ArrowLeft,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { downloadOrderPDF } from "../utils/pdfReceipt";

const STATUS_COLORS = {
  pending: { bg: "#3d2a00", text: "#f59e0b" },
  preparing: { bg: "#003d2a", text: "#10b981" },
  delivered: { bg: "#0a2a60", text: "#60a5fa" },
  cancelled: { bg: "#3d0000", text: "#f87171" },
};

const STATUSES = ["pending", "preparing", "delivered", "cancelled"];

/* ── Bar component ──────────────────────────────────── */
function Bar({ label, value, max, color = "var(--gold)", sub }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.82rem",
          marginBottom: 4,
        }}
      >
        <span
          style={{
            color: "var(--text-secondary)",
            maxWidth: "65%",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
        <span style={{ color: "var(--gold)", fontWeight: 600 }}>
          {value}
          {sub ? ` (${sub})` : ""}
        </span>
      </div>
      <div
        style={{
          height: 7,
          borderRadius: 4,
          background: "var(--bg-primary)",
          overflow: "hidden",
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 4, background: color }}
        />
      </div>
    </div>
  );
}

/* ── Stat Card ──────────────────────────────────────── */
function StatCard({ icon, label, value, sub, color = "var(--gold)" }) {
  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        display: "flex",
        gap: 16,
        alignItems: "center",
      }}
    >
      <div
        style={{
          padding: 12,
          borderRadius: "var(--radius-md)",
          background: "var(--bg-primary)",
          color,
        }}
      >
        {icon}
      </div>
      <div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "var(--text-muted)",
            marginBottom: 2,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontSize: "1.6rem",
            fontFamily: "var(--font-display)",
            color,
            lineHeight: 1,
          }}
        >
          {value}
        </p>
        {sub && (
          <p
            style={{
              fontSize: "0.72rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {sub}
          </p>
        )}
      </div>
    </div>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const orderCountRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) {
      navigate("/admin/login");
      return;
    }
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get("/orders"),
        api.get("/orders/stats"),
      ]);
      setOrders(ordersRes.data);
      orderCountRef.current = ordersRes.data.length;
      setStats(statsRes.data);
    } catch {
      navigate("/admin/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("admin_token")) return;
    const interval = setInterval(() => {
      fetchLatestOrdersSilently();
    }, 60000); // Poll every 60 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLatestOrdersSilently = async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        api.get("/orders"),
        api.get("/orders/stats"),
      ]);
      
      const newLen = ordersRes.data.length;
      if (orderCountRef.current > 0 && newLen > orderCountRef.current) {
        const newOrdCount = newLen - orderCountRef.current;
        toast.success(
          `You have ${newOrdCount} new order${newOrdCount > 1 ? "s" : ""}! 🔔`,
          {
            duration: 5000,
            style: {
              background: "#1a1208",
              color: "#e8d5aa",
              border: "1px solid #c9a84c",
            },
          },
        );
      }
      
      orderCountRef.current = newLen;
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch {
      // ignore silently
    }
  };

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status } : o)),
      );
    } catch {
      /* ignore */
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading)
    return (
      <div
        className="admin-panel"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <p style={{ color: "var(--text-muted)" }}>Loading orders…</p>
      </div>
    );

  const topItem = stats?.topItems?.[0];
  const topCat = stats?.topCategories?.[0];
  const topLoc = stats?.topLocations?.[0];
  const maxItemQty = stats?.topItems?.[0]?.totalQty || 1;
  const maxCatQty = stats?.topCategories?.[0]?.totalQty || 1;
  const maxLocCnt = stats?.topLocations?.[0]?.count || 1;

  return (
    <div className="admin-panel">
      <div className="container">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 28,
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2rem",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <ShoppingBag size={26} color="var(--gold)" /> Orders &amp; Analytics
          </h1>
          <button
            className="btn-outline"
            style={{
              padding: "8px 16px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
            onClick={() => navigate("/admin")}
            id="back-to-admin"
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>

        {/* ── KPI Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 200px), 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard
            icon={<ShoppingBag size={22} />}
            label="Total Orders"
            value={stats?.totals?.count ?? 0}
          />
          <StatCard
            icon={<TrendingUp size={22} />}
            label="Total Revenue"
            value={`$${(stats?.totals?.revenue ?? 0).toFixed(2)}`}
          />
          <StatCard
            icon={<BarChart2 size={22} />}
            label="Top Dish"
            value={topItem?._id ?? "—"}
            sub={topItem ? `${topItem.totalQty} ordered` : ""}
            color="#a78bfa"
          />
          <StatCard
            icon={<MapPin size={22} />}
            label="Top Area"
            value={topLoc?._id ?? "—"}
            sub={topLoc ? `${topLoc.count} orders` : ""}
            color="#34d399"
          />
        </div>

        {/* ── Stats Grid ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
            gap: 20,
            marginBottom: 32,
          }}
        >
          {/* Top Items */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <BarChart2 size={16} color="var(--gold)" /> Most Ordered Dishes
            </h3>
            {stats?.topItems?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No data yet
              </p>
            ) : (
              stats?.topItems?.map((item) => (
                <Bar
                  key={item._id}
                  label={item._id}
                  value={item.totalQty}
                  max={maxItemQty}
                  sub={`$${item.totalRevenue.toFixed(0)}`}
                  color="var(--gold)"
                />
              ))
            )}
          </div>

          {/* Top Categories */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <TrendingUp size={16} color="#a78bfa" /> Most Ordered Categories
            </h3>
            {stats?.topCategories?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No data yet
              </p>
            ) : (
              stats?.topCategories?.map((cat) => (
                <Bar
                  key={cat._id}
                  label={cat._id || "Unknown"}
                  value={cat.totalQty}
                  max={maxCatQty}
                  sub={`$${cat.totalRevenue.toFixed(0)}`}
                  color="#a78bfa"
                />
              ))
            )}
          </div>

          {/* Top Delivery Areas */}
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              padding: 20,
            }}
          >
            <h3
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MapPin size={16} color="#34d399" /> Top Delivery Locations
            </h3>
            {stats?.topLocations?.length === 0 ? (
              <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>
                No data yet
              </p>
            ) : (
              stats?.topLocations?.map((loc) => (
                <Bar
                  key={loc._id}
                  label={loc._id || "Unspecified"}
                  value={loc.count}
                  max={maxLocCnt}
                  color="#34d399"
                />
              ))
            )}
          </div>
        </div>

        {/* ── Orders Table ── */}
        <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: 14 }}>
          All Orders ({orders.length})
        </h2>
        <div className="admin-table-wrap">
          {orders.length === 0 ? (
            <div
              style={{
                padding: "40px",
                textAlign: "center",
                color: "var(--text-muted)",
              }}
            >
              <ShoppingBag
                size={36}
                strokeWidth={1}
                style={{ marginBottom: 10 }}
              />
              <p>
                No orders yet — they'll appear here once customers start
                ordering.
              </p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Location</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <>
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        setExpanded(expanded === order._id ? null : order._id)
                      }
                    >
                      <td
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--gold)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {order.orderNumber}
                      </td>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {order.customer.name}
                        </div>
                        <div
                          style={{
                            fontSize: "0.75rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          {order.customer.phone}
                        </div>
                      </td>
                      <td
                        style={{
                          fontSize: "0.8rem",
                          maxWidth: 160,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {order.customer.address}
                      </td>
                      <td
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: "0.82rem",
                        }}
                      >
                        {order.items.length} item
                        {order.items.length !== 1 ? "s" : ""}
                      </td>
                      <td
                        style={{
                          color: "var(--gold)",
                          fontFamily: "var(--font-display)",
                        }}
                      >
                        ${order.total.toFixed(2)}
                      </td>
                      <td
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <Clock size={11} />
                          {new Date(order.createdAt).toLocaleDateString()}{" "}
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                      </td>
                      <td>
                        <select
                          value={order.status}
                          disabled={updatingId === order._id}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) =>
                            handleStatusChange(order._id, e.target.value)
                          }
                          style={{
                            background:
                              STATUS_COLORS[order.status]?.bg ||
                              "var(--bg-secondary)",
                            color:
                              STATUS_COLORS[order.status]?.text ||
                              "var(--text-primary)",
                            border: "none",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: 6,
                            alignItems: "center",
                          }}
                        >
                          <button
                            className="btn-sm btn-edit"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadOrderPDF(order);
                            }}
                            title="Download PDF"
                            id={`pdf-${order._id}`}
                          >
                            <Download size={13} />
                          </button>
                          {expanded === order._id ? (
                            <ChevronUp size={14} />
                          ) : (
                            <ChevronDown size={14} />
                          )}
                        </div>
                      </td>
                    </motion.tr>

                    {/* ── Expanded row: items detail ── */}
                    {expanded === order._id && (
                      <tr key={`${order._id}-detail`}>
                        <td colSpan={8} style={{ padding: 0 }}>
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{
                              background: "var(--bg-primary)",
                              padding: "16px 20px",
                              borderBottom: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                gap: 32,
                                flexWrap: "wrap",
                              }}
                            >
                              <div>
                                <p
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                    marginBottom: 6,
                                  }}
                                >
                                  ITEMS
                                </p>
                                {order.items.map((item, i) => (
                                  <div
                                    key={i}
                                    style={{
                                      display: "flex",
                                      gap: 16,
                                      fontSize: "0.83rem",
                                      marginBottom: 4,
                                    }}
                                  >
                                    <span
                                      style={{ color: "var(--text-secondary)" }}
                                    >
                                      {item.qty}× {item.name}
                                    </span>
                                    <span style={{ color: "var(--gold)" }}>
                                      ${item.subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                              {order.customer.notes && (
                                <div>
                                  <p
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "var(--text-muted)",
                                      marginBottom: 6,
                                    }}
                                  >
                                    NOTES
                                  </p>
                                  <p
                                    style={{
                                      fontSize: "0.83rem",
                                      color: "var(--text-secondary)",
                                      maxWidth: 280,
                                    }}
                                  >
                                    {order.customer.notes}
                                  </p>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
