import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Sun,
  Moon,
  Monitor,
  Menu as MenuIcon,
  X,
  Utensils,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../context/ThemeContext";
import { useCart } from "../context/CartContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { count, setIsOpen } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { label: "Home", to: "/" },
    { label: "Menu", to: "/menu" },
  ];

  return (
    <header className={`navbar ${scrolled ? "scrolled" : ""}`}>
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <div className="logo" onClick={() => navigate("/")}>
            La Tavola
            <span>cucina italiana</span>
          </div>

          {/* Desktop Links */}
          <nav className="nav-links">
            {links.map((l) => (
              <Link key={l.to} to={l.to}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="nav-actions">
            <button
              id="theme-toggle"
              className="nav-icon-btn"
              onClick={toggleTheme}
              title="Toggle theme"
              aria-label="Toggle dark/light mode"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button
              id="cart-btn"
              className="nav-icon-btn"
              onClick={() => setIsOpen(true)}
              aria-label="Open cart"
            >
              <ShoppingCart size={18} />
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="cart-badge"
                >
                  {count}
                </motion.span>
              )}
            </button>

            {/* Mobile hamburger */}
            <button
              className="nav-icon-btn"
              style={{ display: "none" }}
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
              id="mobile-menu-btn"
            >
              {mobileOpen ? <X size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--bg-glass)",
              backdropFilter: "blur(20px)",
              borderBottom: "1px solid var(--border)",
              padding: "16px 24px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                style={{ color: "var(--gold)", fontWeight: 500 }}
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
