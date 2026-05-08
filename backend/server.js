require("dotenv").config();
const express = require("express");
const { connectDB } = require("./db/mongo");
const { applySecurityMiddleware } = require("./middleware/security");

const menuRouter = require("./routes/menu");
const categoriesRouter = require("./routes/categories");
const specialsRouter = require("./routes/specials");
const reviewsRouter = require("./routes/reviews");
const adminRouter = require("./routes/admin");
const { router: imagesRouter } = require("./routes/images");
const ordersRouter = require("./routes/orders");
const settingsRouter = require("./routes/settings");

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware (helmet, cors, rate-limit)
applySecurityMiddleware(app);

// Body parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/api/menu", menuRouter);
app.use("/api/categories", categoriesRouter);
app.use("/api/specials", specialsRouter);
app.use("/api/reviews", reviewsRouter);
app.use("/api/admin", adminRouter);
app.use("/api/images", imagesRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/settings", settingsRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error." });
});

// Start server after DB connects
async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`🚀 Resto Menu API running on http://localhost:${PORT}`);
  });
}

start();
