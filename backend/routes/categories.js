const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");

// GET all categories
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const categories = await db
      .collection("categories")
      .find({})
      .sort({ order: 1 })
      .toArray();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories." });
  }
});

module.exports = router;
