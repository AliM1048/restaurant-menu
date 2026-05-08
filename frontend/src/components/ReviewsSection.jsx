import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";
import api from "../api/client";

const SAMPLE = [
  {
    name: "Sofia M.",
    rating: 5,
    comment: "Absolutely divine! The tiramisù alone is worth the trip.",
  },
  {
    name: "James R.",
    rating: 5,
    comment: "Bistecca Fiorentina cooked to absolute perfection. Will be back!",
  },
  {
    name: "Yuki T.",
    rating: 4,
    comment: "Beautiful ambiance and incredible pasta. The carbonara is authentic Roman style.",
  },
  {
    name: "Amira L.",
    rating: 5,
    comment: "Best seafood risotto I've had outside of Venice. Stunning presentation.",
  },
  {
    name: "Thomas K.",
    rating: 5,
    comment: "The Diavola pizza is fire — literally! Love the hot honey touch.",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    api.get("/reviews/recent")
      .then(res => {
        if (res.data && res.data.length > 0) {
          setReviews(res.data);
        } else {
          setReviews(SAMPLE);
        }
      })
      .catch(() => setReviews(SAMPLE));
  }, []);

  return (
    <section className="reviews-section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">
            What Our Guests Say
            <span className="gold-line" />
          </h2>
        </motion.div>

        <div className="reviews-carousel">
          {reviews.map((r, i) => (
            <motion.div
              key={i}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="review-card"
            >
              <div className="review-stars">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={14}
                    color="#f59e0b"
                    fill={n <= r.rating ? "#f59e0b" : "none"}
                  />
                ))}
              </div>
              <Quote
                size={20}
                color="var(--gold-dim)"
                style={{ marginBottom: 8 }}
              />
              <p className="review-comment">{r.comment}</p>
              <p className="review-author">— {r.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
