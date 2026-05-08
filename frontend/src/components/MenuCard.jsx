import { motion } from "framer-motion";
import { Star, Clock, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { resolveImage } from "../utils/helpers";

const ALLERGEN_COLORS = {
  gluten: "allergen-gluten",
  dairy: "allergen-dairy",
  eggs: "allergen-eggs",
  shellfish: "allergen-shellfish",
  fish: "allergen-fish",
  nuts: "allergen-nuts",
};

const ALLERGEN_ICONS = {
  gluten: "🌾",
  dairy: "🥛",
  eggs: "🥚",
  shellfish: "🦐",
  fish: "🐟",
  nuts: "🥜",
};

export function AllergenBadges({ allergens = [] }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
      {allergens.map((a) => (
        <span key={a} className={`badge allergen ${ALLERGEN_COLORS[a] || ""}`}>
          {ALLERGEN_ICONS[a] || "⚠️"} {a}
        </span>
      ))}
    </div>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
};

export default function MenuCard({ item, onClick }) {
  const { addItem } = useCart();

  return (
    <motion.div
      variants={cardVariants}
      className="menu-card"
      onClick={() => onClick(item)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick(item)}
    >
      <div className="menu-card-img-wrap">
        <img src={resolveImage(item)} alt={item.name} loading="lazy" />
        <div className="card-overlay">
          <span className="view-btn">View Details →</span>
        </div>
        {item.featured && <div className="featured-ribbon">⭐ Chef's Pick</div>}
      </div>

      <div className="card-body">
        <h3 className="card-name">{item.name}</h3>
        <p className="card-desc">{item.description}</p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "4px",
            marginBottom: "8px",
          }}
        >
          {(item.tags || []).map((t) => (
            <span key={t} className="badge" style={{ fontSize: "0.62rem" }}>
              {t}
            </span>
          ))}
        </div>

        <div className="card-footer">
          <span className="card-price">${item.price?.toFixed(2)}</span>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="card-meta">
              <Clock size={12} />
              <span>{item.prepTime}m</span>
            </div>
            {item.avgRating > 0 && (
              <div className="card-rating">
                <Star size={12} fill="currentColor" />
                <span
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  {item.avgRating}
                </span>
              </div>
            )}
          </div>

          <button
            className="add-to-cart-btn"
            title="Add to cart"
            id={`add-cart-${item._id}`}
            onClick={(e) => {
              e.stopPropagation();
              addItem(item);
            }}
            aria-label={`Add ${item.name} to cart`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
