import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Clock, Flame, ShoppingCart, Minus, Plus, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/client";
import FlavorWheel from "./FlavorWheel";
import { AllergenBadges } from "./MenuCard";
import { useCart } from "../context/CartContext";
import toast from "react-hot-toast";
import { resolveImage } from "../utils/helpers";

export default function DishModal({ item, onClose }) {
  const [qty, setQty] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  
  const { addItem } = useCart();

  useEffect(() => {
    if (item?._id) {
      api.get(`/reviews/${item._id}`)
        .then(res => setReviews(res.data))
        .catch(() => {});
    }
  }, [item]);

  if (!item) return null;

  const handleAdd = () => {
    addItem(item, qty);
    toast.success(`${qty}× ${item.name} added to cart!`);
    onClose();
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) {
      return toast.error("Please fill in all fields.");
    }
    setSubmittingReview(true);
    try {
      const { data } = await api.post(`/reviews/${item._id}`, {
        name: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviews([data, ...reviews]);
      setShowReviewForm(false);
      setReviewName("");
      setReviewRating(5);
      setReviewComment("");
      toast.success("Review submitted!");
      // Optionally update local item ratings, but the exact visual update depends on the parent component triggering a refresh.
      item.reviewCount = (item.reviewCount || 0) + 1;
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            className="modal-sheet"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            style={{ position: "relative" }}
          >
            {/* Close btn */}
            <button className="close-btn" onClick={onClose} id="modal-close">
              <X size={18} />
            </button>

            {/* Image */}
            <img
              src={resolveImage(item)}
              alt={item.name}
              className="modal-img"
            />

            <div className="modal-body">
              <div className="modal-header">
                <p className="modal-category">{item.category}</p>
                <h2 className="modal-name">{item.name}</h2>
                {item.avgRating > 0 && (
                  <div className="card-rating" style={{ marginTop: "6px" }}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        size={14}
                        fill={
                          n <= Math.round(item.avgRating)
                            ? "currentColor"
                            : "none"
                        }
                      />
                    ))}
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--text-muted)",
                        marginLeft: "4px",
                      }}
                    >
                      {item.avgRating} ({item.reviewCount} reviews)
                    </span>
                  </div>
                )}
              </div>

              <p className="modal-desc">{item.description}</p>

              {/* Stats */}
              <div className="modal-stats">
                <div className="stat">
                  <span className="stat-label">Price</span>
                  <span className="stat-value" style={{ color: "var(--gold)" }}>
                    ${item.price?.toFixed(2)}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Prep Time</span>
                  <span
                    className="stat-value"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <Clock size={16} /> {item.prepTime} min
                  </span>
                </div>
                {item.calories > 0 && (
                  <div className="stat">
                    <span className="stat-label">Calories</span>
                    <span
                      className="stat-value"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <Flame size={16} /> {item.calories} kcal
                    </span>
                  </div>
                )}
              </div>

              {/* Allergens */}
              {item.allergens?.length > 0 && (
                <>
                  <div className="modal-divider" />
                  <div>
                    <p className="flavor-title" style={{ marginBottom: "8px" }}>
                      Allergens
                    </p>
                    <AllergenBadges allergens={item.allergens} />
                  </div>
                </>
              )}

              {/* Flavor wheel */}
              <div className="modal-divider" />
              <FlavorWheel profile={item.flavorProfile} />

              {/* Tags */}
              {item.tags?.length > 0 && (
                <>
                  <div className="modal-divider" />
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}
                  >
                    {item.tags.map((t) => (
                      <span key={t} className="badge">
                        {t}
                      </span>
                    ))}
                  </div>
                </>
              )}

              {/* Reviews Section */}
              <div className="modal-divider" />
              <div style={{ padding: "0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <p className="flavor-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={16} color="var(--gold)" /> Customer Reviews
                  </p>
                  {!showReviewForm && (
                    <button 
                      className="btn-outline" 
                      style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                      onClick={() => setShowReviewForm(true)}
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                <AnimatePresence>
                  {showReviewForm && (
                    <motion.form 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      style={{ overflow: "hidden", marginBottom: "20px" }}
                      onSubmit={submitReview}
                    >
                      <div style={{ background: "var(--bg-secondary)", padding: "16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}>
                        <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                          <input 
                            type="text" 
                            className="form-input" 
                            placeholder="Your Name *" 
                            value={reviewName}
                            onChange={e => setReviewName(e.target.value)}
                            style={{ flex: 1, minWidth: "150px" }}
                            required
                            maxLength={50}
                          />
                          <select 
                            className="form-select" 
                            value={reviewRating}
                            onChange={e => setReviewRating(Number(e.target.value))}
                            style={{ width: "120px" }}
                          >
                            <option value={5}>5 Stars</option>
                            <option value={4}>4 Stars</option>
                            <option value={3}>3 Stars</option>
                            <option value={2}>2 Stars</option>
                            <option value={1}>1 Star</option>
                          </select>
                        </div>
                        <textarea 
                          className="form-input" 
                          placeholder="What did you think? *" 
                          value={reviewComment}
                          onChange={e => setReviewComment(e.target.value)}
                          style={{ width: "100%", height: "80px", resize: "vertical", marginBottom: "12px" }}
                          required
                          maxLength={500}
                        />
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button 
                            type="button" 
                            className="btn-outline" 
                            onClick={() => setShowReviewForm(false)}
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="btn-primary" 
                            disabled={submittingReview}
                            style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                          >
                            {submittingReview ? "Submitting..." : "Submit Review"}
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {reviews.length === 0 ? (
                  <p style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>
                    No reviews yet. Be the first to review!
                  </p>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {reviews.map(review => (
                      <div key={review._id} style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderRadius: "var(--radius-sm)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <strong style={{ color: "var(--text-primary)", fontSize: "0.9rem" }}>{review.name}</strong>
                          <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "2px", marginBottom: "8px" }}>
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              size={12}
                              fill={n <= review.rating ? "var(--gold)" : "none"}
                              color={n <= review.rating ? "var(--gold)" : "var(--text-muted)"}
                            />
                          ))}
                        </div>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5, margin: 0 }}>
                          {review.comment}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add to cart */}
              <div className="modal-divider" />
              <div className="modal-add-row">
                <span className="modal-price">
                  ${(item.price * qty).toFixed(2)}
                </span>

                <div className="quantity-row">
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    id="qty-minus"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-display">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => q + 1)}
                    id="qty-plus"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                <button
                  className="btn-primary"
                  onClick={handleAdd}
                  id="modal-add-cart"
                >
                  <ShoppingCart size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
