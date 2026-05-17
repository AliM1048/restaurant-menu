const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

const allowedOrigins = [
  "https://restaurant-menu-nine-orcin.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
  "http://localhost:3001"
];

if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
  allowedOrigins.push(process.env.FRONTEND_URL.replace(/\/$/, ""));
}

const corsOptions = {
  origin: allowedOrigins,
  methods: ["GET", "POST", "PUT", "DELETE"],
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

  // app.use(helmet());
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.use(cors(corsOptions));
  app.use("/api", limiter);
  app.use("/api/admin/login", adminLimiter);
}

module.exports = { applySecurityMiddleware };
