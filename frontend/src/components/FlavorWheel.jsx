const FLAVOR_COLORS = {
  spicy: { fill: "#ef4444", label: "🌶 Spicy" },
  sweet: { fill: "#f59e0b", label: "🍯 Sweet" },
  sour: { fill: "#84cc16", label: "🍋 Sour" },
  umami: { fill: "#8b5cf6", label: "🍄 Umami" },
  salty: { fill: "#06b6d4", label: "🧂 Salty" },
};

export default function FlavorWheel({ profile = {} }) {
  const entries = Object.entries(FLAVOR_COLORS);

  return (
    <div className="flavor-section">
      <p className="flavor-title">Flavor Profile</p>
      <div className="flavor-bars">
        {entries.map(([key, { fill, label }]) => {
          const val = profile[key] ?? 0;
          const pct = (val / 5) * 100;
          return (
            <div className="flavor-row" key={key}>
              <span className="flavor-label">{label}</span>
              <div className="flavor-track">
                <div
                  className="flavor-fill"
                  style={{ width: `${pct}%`, background: fill }}
                />
              </div>
              <span className="flavor-val">{val}/5</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
