import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import MenuCard from "../components/MenuCard";
import DishModal from "../components/DishModal";
import api from "../api/client";

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function Menu() {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    api
      .get("/categories")
      .then((r) => setCategories(r.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== "all") params.category = activeCategory;
    if (search) params.search = search;
    api
      .get("/menu", { params })
      .then((r) => setItems(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, search]);

  const handleSearch = useCallback((e) => {
    setSearch(e.target.value);
    setActiveCategory("all");
  }, []);

  return (
    <main
      className="menu-section"
      style={{ paddingTop: "calc(var(--nav-height) + 40px)" }}
    >
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="section-title">
            Our Menu
            <span className="gold-line" />
          </h1>
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              marginTop: 12,
              fontFamily: "var(--font-serif)",
              fontSize: "1.05rem",
            }}
          >
            Seasonal ingredients · Handcrafted with love · Every day
          </p>
        </motion.div>

        {/* Search */}
        <div className="search-bar-wrap">
          <Search className="search-icon" size={16} />
          <input
            id="menu-search"
            type="text"
            placeholder="Search dishes…"
            value={search}
            onChange={handleSearch}
            aria-label="Search menu"
          />
        </div>

        {/* Category Tabs */}
        <div className="category-tabs" role="tablist">
          {categories.map((cat) => (
            <button
              key={cat.slug}
              role="tab"
              aria-selected={activeCategory === cat.slug}
              className={`tab-btn ${activeCategory === cat.slug ? "active" : ""}`}
              onClick={() => {
                setActiveCategory(cat.slug);
                setSearch("");
              }}
              id={`tab-${cat.slug}`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="menu-grid">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="menu-card skeleton"
                style={{ height: 380 }}
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "60px 0",
              color: "var(--text-muted)",
            }}
          >
            <p style={{ fontSize: "2rem" }}>🍽️</p>
            <p style={{ marginTop: 12 }}>
              No dishes found. Try a different search.
            </p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory + search}
              className="menu-grid"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {items.map((item) => (
                <MenuCard
                  key={item._id}
                  item={item}
                  onClick={setSelectedDish}
                />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      {selectedDish && (
        <DishModal item={selectedDish} onClose={() => setSelectedDish(null)} />
      )}
    </main>
  );
}
