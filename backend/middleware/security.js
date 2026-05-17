const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const corsOptions = {
  origin:
    "https://restaurant-menu-nine-orcin.vercel.app" || process.env.FRONTEND_URL,
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
  // Trust the Render proxy (needed for express-rate-limit to see real client IPs)
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(cors(corsOptions));
  app.use("/api", limiter);
  app.use("/api/admin/login", adminLimiter);
}

module.exports = { applySecurityMiddleware };
