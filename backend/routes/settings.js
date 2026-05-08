const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");

/* ── GET /api/settings   — public settings (like deliveryFee) ── */
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection("settings").findOne({ _id: "global" });
    
    // Default delivery fee if not set
    if (!settings || settings.deliveryFee === undefined) {
      return res.json({ deliveryFee: 5 });
    }
    
    res.json(settings);
  } catch (err) {
    console.error("Settings error:", err);
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

module.exports = router;
