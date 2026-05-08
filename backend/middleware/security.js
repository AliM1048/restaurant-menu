const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization", "multipart/form-data"],
  credentials: true,
};

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many login attempts. Please try again later." },
});

function applySecurityMiddleware(app) {
  app.use(helmet());
  app.use(cors(corsOptions));
  app.use("/api", limiter);
  app.use("/api/admin/login", adminLimiter);
}

module.exports = { applySecurityMiddleware };
