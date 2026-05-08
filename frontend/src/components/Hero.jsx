import { motion } from "framer-motion";
import { ChevronDown, UtensilsCrossed } from "lucide-react";
import { useNavigate } from "react-router-dom";

const textVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.18, duration: 0.7, ease: [0.4, 0, 0.2, 1] },
  }),
};

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="hero-bg">
        <div className="hero-bg-img" />
        <div className="hero-overlay" />
      </div>

      <div className="hero-content">
        <motion.p
          custom={0}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="hero-eyebrow"
        >
          Fine Italian Dining
        </motion.p>

        <motion.h1
          custom={1}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="hero-title"
        >
          La <em>Tavola</em>
        </motion.h1>

        <motion.p
          custom={2}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="hero-subtitle"
        >
          Where every dish tells a story — crafted with tradition,
          <br />
          served with passion.
        </motion.p>

        <motion.div
          custom={3}
          variants={textVariants}
          initial="hidden"
          animate="visible"
          className="hero-cta-group"
        >
          <button
            className="btn-primary"
            onClick={() => navigate("/menu")}
            id="hero-view-menu"
          >
            <UtensilsCrossed size={16} />
            Explore Our Menu
          </button>
          <button
            className="btn-outline"
            onClick={() =>
              document
                .getElementById("special")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            id="hero-chef-special"
          >
            Chef's Special
          </button>
        </motion.div>
      </div>

      <div className="hero-scroll">
        <ChevronDown size={18} />
        <span>Scroll</span>
      </div>
    </section>
  );
}
