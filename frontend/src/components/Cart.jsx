import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Minus,
  Plus,
  Trash2,
  QrCode,
  CheckCircle,
  Download,
} from "lucide-react";
import { useCart } from "../context/CartContext";
import { useState } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import QRShareModal from "./QRShareModal";
import { resolveImage } from "../utils/helpers";
import api from "../api/client";
import { downloadOrderPDF } from "../utils/pdfReceipt";

const swalDark = Swal.mixin({
  background: "#1a1208",
  color: "#e8d5aa",
  confirmButtonColor: "#c9a84c",
  cancelButtonColor: "#3d3020",
});

export default function Cart() {
  const { items, isOpen, setIsOpen, removeItem, updateQty, total, clearCart } =
    useCart();
  const [showQR, setShowQR] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);

  const handlePlaceOrder = async () => {
    setIsOpen(false);
    /* ── STEP 1: Choose Order Type ─────────────────────────────── */
    const { value: orderType } = await swalDark.fire({
      title: "How would you like your order?",
      input: 'radio',
      inputOptions: {
        'delivery': '🛵 Delivery',
        'pickup': '🥡 Pickup'
      },
      inputValidator: (value) => {
        if (!value) return 'Please choose delivery or pickup!';
      },
      showCancelButton: true,
      confirmButtonText: "Next →",
      cancelButtonText: "Cancel"
    });

    if (!orderType) return;

    /* ── STEP 2: Fetch Delivery Fee (if delivery) ───────────── */
    let fetchedDeliveryFee = 0;
    if (orderType === "delivery") {
      try {
        const { data } = await api.get("/settings");
        fetchedDeliveryFee = data.deliveryFee || 0;
      } catch (e) {
        console.error("Failed to fetch delivery fee", e);
        fetchedDeliveryFee = 5; // fallback
      }
    }

    /* ── STEP 3: Collect details ─────────────────────────────── */
    const isDelivery = orderType === "delivery";
    const htmlForm = isDelivery ? `
        <div style="text-align:left;display:flex;flex-direction:column;gap:10px;padding:4px 0">
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Full Name *</label>
            <input id="swal-name" class="swal2-input" placeholder="e.g. Marco Rossi" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Phone Number *</label>
            <input id="swal-phone" class="swal2-input" type="tel" placeholder="e.g. +39 333 123 4567" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Delivery Address *</label>
            <input id="swal-address" class="swal2-input" placeholder="Street, City, Postcode" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Notes (optional)</label>
            <textarea id="swal-notes" class="swal2-textarea" placeholder="Doorbell name, floor, allergies…" style="margin:0;width:100%;box-sizing:border-box;resize:vertical;height:70px"></textarea>
          </div>
        </div>
      ` : `
        <div style="text-align:left;display:flex;flex-direction:column;gap:10px;padding:4px 0">
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Full Name *</label>
            <input id="swal-name" class="swal2-input" placeholder="e.g. Marco Rossi" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Phone Number *</label>
            <input id="swal-phone" class="swal2-input" type="tel" placeholder="e.g. +39 333 123 4567" style="margin:0;width:100%;box-sizing:border-box">
          </div>
          <div>
            <label style="font-size:0.78rem;color:#c9a84c;display:block;margin-bottom:4px">Notes (optional)</label>
            <textarea id="swal-notes" class="swal2-textarea" placeholder="Pickup time, allergies…" style="margin:0;width:100%;box-sizing:border-box;resize:vertical;height:70px"></textarea>
          </div>
        </div>
      `;

    const { value: formValues, isConfirmed: infoConfirmed } =
      await swalDark.fire({
        title: isDelivery ? "🏠 Delivery Details" : "🥡 Pickup Details",
        html: htmlForm,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: "Continue →",
        cancelButtonText: "Back",
        width: 500,
        preConfirm: () => {
          const name = document.getElementById("swal-name").value.trim();
          const phone = document.getElementById("swal-phone").value.trim();
          const address = isDelivery ? document.getElementById("swal-address").value.trim() : "";
          const notes = document.getElementById("swal-notes").value.trim();
          if (!name || !phone || (isDelivery && !address)) {
            Swal.showValidationMessage(
              isDelivery ? "Name, phone, and address are required." : "Name and phone are required."
            );
            return false;
          }
          return { name, phone, address, notes };
        },
      });

    if (!infoConfirmed || !formValues) return;

    /* ── STEP 4: Order confirmation summary ─────────────────── */
    const finalTotal = total + fetchedDeliveryFee;

    const { isConfirmed } = await swalDark.fire({
      title: "Confirm your order?",
      html: `
        <div style="text-align:left;font-size:0.87rem;line-height:2">
          <p style="color:#a08860;font-size:0.8rem;margin-bottom:6px">
            ${isDelivery ? `📍 Delivering to: <strong style="color:#e8d5aa">${formValues.address}</strong>` : `🥡 Pickup by: <strong style="color:#e8d5aa">${formValues.name}</strong>`}
          </p>
          <hr style="border-color:rgba(255,255,255,0.1);margin:6px 0"/>
          ${items
            .map(
              (i) => `
            <div style="display:flex;justify-content:space-between;gap:16px">
              <span>${i.qty}× ${i.name}</span>
              <strong style="color:#c9a84c">$${(i.price * i.qty).toFixed(2)}</strong>
            </div>`,
            )
            .join("")}
          <hr style="border-color:rgba(255,255,255,0.1);margin:6px 0"/>
          <div style="display:flex;justify-content:space-between;font-size:0.9rem">
            <span>Subtotal</span>
            <span>$${total.toFixed(2)}</span>
          </div>
          ${isDelivery ? `
          <div style="display:flex;justify-content:space-between;font-size:0.9rem">
            <span>Delivery Fee</span>
            <span>$${fetchedDeliveryFee.toFixed(2)}</span>
          </div>
          ` : ''}
          <hr style="border-color:rgba(255,255,255,0.1);margin:6px 0"/>
          <div style="display:flex;justify-content:space-between;font-size:1rem">
            <strong>Total</strong>
            <strong style="color:#c9a84c">$${finalTotal.toFixed(2)}</strong>
          </div>
        </div>
      `,
      icon: "question",
      iconColor: "#c9a84c",
      showCancelButton: true,
      confirmButtonText: "🍽️ Place Order",
      cancelButtonText: "← Edit details",
      reverseButtons: true,
      width: 480,
    });

    if (!isConfirmed) return;

    /* ── STEP 5: Save to DB & download PDF ─────────────────── */
    setPlacing(true);
    try {
      const { data: order } = await api.post("/orders", {
        customer: formValues,
        orderType,
        deliveryFee: fetchedDeliveryFee,
        items: items.map((i) => ({
          _id: i._id,
          name: i.name,
          category: i.category,
          price: i.price,
          qty: i.qty,
        })),
        total: finalTotal,
      });

      setLastOrder(order);
      clearCart();
      setIsOpen(false);

      /* ── STEP 6: Success dialog ── */
      await swalDark.fire({
        title: "Order Received! 🎉",
        html: `
          <p style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;color:#c9a84c;margin-bottom:10px">
            Grazie mille, ${order.customer.name}!
          </p>
          <p style="font-size:0.85rem;color:#a08860">
            Order <strong style="color:#e8d5aa">#${order.orderNumber}</strong> is in the kitchen.
          </p>
          <p style="font-size:0.85rem;color:#a08860;margin-top:6px">
            ${isDelivery ? `Estimated delivery: <strong style="color:#e8d5aa">~25–35 minutes</strong>` : `Estimated pickup time: <strong style="color:#e8d5aa">~15–20 minutes</strong>`}
          </p>
        `,
        icon: "success",
        iconColor: "#c9a84c",
        confirmButtonText: "✔ Perfetto!",
        width: 440,
      });
    } catch (err) {
      Swal.fire({
        title: "Order failed",
        text:
          err.response?.data?.error ||
          "Something went wrong. Please try again.",
        icon: "error",
        background: "#1a1208",
        color: "#e8d5aa",
        confirmButtonColor: "#c9a84c",
      });
    } finally {
      setPlacing(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 2999,
              backdropFilter: "blur(4px)",
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="cart-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 26, stiffness: 240 }}
          >
            <div className="cart-header">
              <h3 className="cart-title">Your Order</h3>
              <div
                style={{ display: "flex", gap: "8px", alignItems: "center" }}
              >
                {items.length > 0 && (
                  <button
                    className="nav-icon-btn"
                    onClick={() => {
                      setIsOpen(false);
                      setShowQR(true);
                    }}
                    title="Share via QR"
                    id="cart-qr-btn"
                  >
                    <QrCode size={18} />
                  </button>
                )}
                <button
                  className="nav-icon-btn"
                  onClick={() => setIsOpen(false)}
                  id="cart-close"
                  aria-label="Close cart"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {items.length === 0 ? (
              <div className="cart-empty">
                <ShoppingBag size={48} strokeWidth={1} />
                <p>Your cart is empty</p>
                {lastOrder && (
                  <button
                    className="btn-outline"
                    style={{
                      marginTop: 8,
                      padding: "8px 18px",
                      fontSize: "0.8rem",
                      gap: 6,
                    }}
                    onClick={() => downloadOrderPDF(lastOrder)}
                    id="redownload-pdf"
                  >
                    <Download size={14} /> Download last receipt
                  </button>
                )}
                <button
                  className="btn-outline"
                  style={{
                    padding: "10px 22px",
                    fontSize: "0.82rem",
                    marginTop: 6,
                  }}
                  onClick={() => setIsOpen(false)}
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  <AnimatePresence>
                    {items.map((item) => (
                      <motion.div
                        key={item._id}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="cart-item"
                      >
                        <img
                          src={resolveImage(item)}
                          alt={item.name}
                          className="cart-item-img"
                          onError={(e) =>
                            (e.target.src =
                              "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=80&auto=format&fit=crop")
                          }
                        />
                        <div className="cart-item-info">
                          <p className="cart-item-name">{item.name}</p>
                          <p className="cart-item-price">
                            ${(item.price * item.qty).toFixed(2)}
                          </p>
                        </div>
                        <div className="cart-item-qty">
                          <button
                            className="qty-btn"
                            id={`cart-minus-${item._id}`}
                            onClick={() => updateQty(item._id, item.qty - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span>{item.qty}</span>
                          <button
                            className="qty-btn"
                            id={`cart-plus-${item._id}`}
                            onClick={() => updateQty(item._id, item.qty + 1)}
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            className="qty-btn"
                            id={`cart-remove-${item._id}`}
                            style={{ color: "var(--red-accent)" }}
                            onClick={() => removeItem(item._id)}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <span className="cart-total-amount">
                      ${total.toFixed(2)}
                    </span>
                  </div>
                  <button
                    className="btn-primary"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      marginBottom: "10px",
                      gap: 8,
                    }}
                    onClick={handlePlaceOrder}
                    disabled={placing}
                    id="cart-checkout"
                  >
                    {placing ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{
                            repeat: Infinity,
                            duration: 0.8,
                            ease: "linear",
                          }}
                          style={{ display: "inline-block" }}
                        >
                          ⏳
                        </motion.span>{" "}
                        Saving order…
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Place Order
                      </>
                    )}
                  </button>
                  <button
                    className="btn-outline"
                    style={{
                      width: "100%",
                      justifyContent: "center",
                      fontSize: "0.78rem",
                    }}
                    onClick={clearCart}
                    id="cart-clear"
                  >
                    Clear Cart
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showQR && (
          <QRShareModal
            items={items}
            total={total}
            onClose={() => setShowQR(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
