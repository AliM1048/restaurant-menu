const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");
const { ObjectId } = require("mongodb");

// GET all menu items (with optional category filter)
router.get("/", async (req, res) => {
  try {
    const db = getDB();
    const query = {};
    if (req.query.category) query.category = req.query.category;
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ];
    }
    const items = await db.collection("menuItems").find(query).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu items." });
  }
});

// GET single menu item by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const item = await db
      .collection("menuItems")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!item) return res.status(404).json({ error: "Item not found." });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu item." });
  }
});

module.exports = router;
