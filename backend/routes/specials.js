const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");

// GET today's special (chef's pick)
router.get("/today", async (req, res) => {
  try {
    const db = getDB();
    // First check if there's a manually set special for today
    const today = new Date().toISOString().split("T")[0];
    let special = await db.collection("specials").findOne({ date: today });

    if (!special) {
      // Randomly pick a featured item
      const featured = await db
        .collection("menuItems")
        .find({ featured: true })
        .toArray();
      if (featured.length > 0) {
        const randomItem =
          featured[Math.floor(Math.random() * featured.length)];
        special = { ...randomItem, isAutoSelected: true };
      } else {
        // Fallback: any item
        const allItems = await db.collection("menuItems").find({}).toArray();
        if (allItems.length > 0) {
          const randomItem =
            allItems[Math.floor(Math.random() * allItems.length)];
          special = { ...randomItem, isAutoSelected: true };
        }
      }
    }

    if (!special)
      return res.status(404).json({ error: "No special available today." });
    res.json(special);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch today's special." });
  }
});

module.exports = router;
