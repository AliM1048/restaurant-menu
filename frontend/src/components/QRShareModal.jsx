import { motion } from "framer-motion";
import { X } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export default function QRShareModal({ items, total, onClose }) {
  const shareText = items.map((i) => `${i.qty}× ${i.name}`).join(", ");
  const shareUrl = `${window.location.origin}/menu?order=${encodeURIComponent(shareText)}`;

  return (
    <motion.div
      className="modal-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        className="modal-sheet"
        style={{ maxWidth: 360, borderRadius: "var(--radius-xl)" }}
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.85, opacity: 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
      >
        <div className="qr-modal">
          <button
            className="nav-icon-btn"
            style={{ alignSelf: "flex-end" }}
            onClick={onClose}
            id="qr-close"
          >
            <X size={18} />
          </button>

          <h3 className="qr-title">Share Your Order</h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
            Scan to view this order on another device
          </p>

          <div
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "var(--radius-md)",
              lineHeight: 0,
            }}
          >
            <QRCodeSVG
              value={shareUrl}
              size={200}
              fgColor="#1a1208"
              bgColor="white"
              level="H"
            />
          </div>

          <div
            style={{
              textAlign: "left",
              width: "100%",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              padding: "16px",
            }}
          >
            {items.map((i) => (
              <div
                key={i._id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.82rem",
                  marginBottom: "6px",
                }}
              >
                <span style={{ color: "var(--text-secondary)" }}>
                  {i.qty}× {i.name}
                </span>
                <span style={{ color: "var(--gold)" }}>
                  ${(i.price * i.qty).toFixed(2)}
                </span>
              </div>
            ))}
            <div
              style={{
                borderTop: "1px solid var(--border)",
                marginTop: "8px",
                paddingTop: "8px",
                display: "flex",
                justifyContent: "space-between",
                fontWeight: 600,
              }}
            >
              <span>Total</span>
              <span style={{ color: "var(--gold)" }}>${total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
