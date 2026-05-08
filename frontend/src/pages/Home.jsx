import { useEffect, useState } from "react";
import Hero from "../components/Hero";
import SpecialBanner from "../components/SpecialBanner";
import ReviewsSection from "../components/ReviewsSection";
import DishModal from "../components/DishModal";
import api from "../api/client";

export default function Home() {
  const [special, setSpecial] = useState(null);
  const [selectedDish, setSelectedDish] = useState(null);

  useEffect(() => {
    api
      .get("/specials/today")
      .then((r) => setSpecial(r.data))
      .catch(() => {});
  }, []);

  return (
    <>
      <Hero />
      <SpecialBanner special={special} onView={setSelectedDish} />
      <ReviewsSection />

      <footer className="footer">
        <div className="container">
          <div className="footer-logo">La Tavola</div>
          <p>Via della Cucina 14, Roma · reservations@latavola.it</p>
          <p style={{ marginTop: 8, opacity: 0.6 }}>
            © {new Date().getFullYear()} La Tavola. All rights reserved.
          </p>
        </div>
      </footer>

      {selectedDish && (
        <DishModal item={selectedDish} onClose={() => setSelectedDish(null)} />
      )}
    </>
  );
}
