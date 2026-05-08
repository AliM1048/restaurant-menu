import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import confetti from "canvas-confetti";
import { resolveImage } from "../utils/helpers";

export default function SpecialBanner({ special, onView }) {
  const { addItem } = useCart();
  const fired = useRef(false);

  useEffect(() => {
    if (special && !fired.current) {
      fired.current = true;
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#d4af64", "#f0d080", "#fff8e7", "#c0a050"],
          scalar: 0.9,
        });
      }, 600);
    }
  }, [special]);

  if (!special) return null;

  return (
    <section id="special" className="special-banner">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="section-title" style={{ marginBottom: 32 }}>
            Tonight's Highlight
            <span className="gold-line" />
          </p>

          <div className="special-card">
            <div className="special-img-wrap">
              <img
                src={special.image || resolveImage(special)}
                alt={special.name}
              />
              <div className="chefs-badge">
                <Sparkles size={12} /> Chef's Pick
              </div>
            </div>

            <div className="special-info">
              <p className="special-eyebrow">Special of the Day</p>
              <h3 className="special-name">{special.name}</h3>
              <p className="special-desc">{special.description}</p>

              {special.tags?.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {special.tags.map((t) => (
                    <span key={t} className="badge">
                      {t}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{ display: "flex", alignItems: "center", gap: "16px" }}
              >
                <p className="special-price">${special.price?.toFixed(2)}</p>
                <button
                  className="btn-primary"
                  onClick={() => {
                    addItem(special);
                  }}
                  id="special-add-cart"
                >
                  <Plus size={16} />
                  Add to Order
                </button>
                <button
                  className="btn-outline"
                  style={{ padding: "10px 18px" }}
                  onClick={() => onView(special)}
                  id="special-view-detail"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
