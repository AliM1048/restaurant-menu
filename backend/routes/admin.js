const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");
const { verifyToken } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { ObjectId } = require("mongodb");

// POST /api/admin/login
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password required." });
    }

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
    const adminPasswordPlain = process.env.ADMIN_PASSWORD;

    if (username !== adminUsername) {
      return res.status(401).json({ error: "Invalid credentials." });
    }

    let isValid = false;
    if (adminPasswordHash) {
      isValid = await bcrypt.compare(password, adminPasswordHash);
    } else {
      // Fallback for dev: plain password comparison
      isValid = password === adminPasswordPlain;
    }

    if (!isValid)
      return res.status(401).json({ error: "Invalid credentials." });

    const token = jwt.sign(
      { username, role: "admin" },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );
    res.json({ token, expiresIn: 28800 });
  } catch (err) {
    res.status(500).json({ error: "Login failed." });
  }
});

// All routes below require valid JWT
// GET all menu items (admin view)
router.get("/menu", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const items = await db.collection("menuItems").find({}).toArray();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items." });
  }
});

// POST create a new menu item
router.post("/menu", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      description,
      price,
      category,
      image,
      imageId,
      tags,
      allergens,
      flavorProfile,
      prepTime,
      calories,
      featured,
    } = req.body;

    if (!name || !price || !category) {
      return res
        .status(400)
        .json({ error: "Name, price, and category are required." });
    }

    const item = {
      name: String(name).substring(0, 100),
      description: String(description || "").substring(0, 500),
      price: Number(price),
      category: String(category),
      imageId: imageId || null, // GridFS file id (preferred)
      image: image ? String(image) : "", // legacy URL fallback
      tags: Array.isArray(tags) ? tags : [],
      allergens: Array.isArray(allergens) ? allergens : [],
      flavorProfile: flavorProfile || {
        spicy: 0,
        sweet: 0,
        sour: 0,
        umami: 0,
        salty: 0,
      },
      prepTime: Number(prepTime) || 15,
      calories: Number(calories) || 0,
      featured: Boolean(featured),
      avgRating: 0,
      reviewCount: 0,
      createdAt: new Date(),
    };

    const result = await db.collection("menuItems").insertOne(item);
    res.status(201).json({ ...item, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to create item." });
  }
});

// PUT update a menu item
router.put("/menu/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      description,
      price,
      category,
      image,
      imageId,
      tags,
      allergens,
      flavorProfile,
      prepTime,
      calories,
      featured,
    } = req.body;

    const update = {};
    if (name !== undefined) update.name = String(name).substring(0, 100);
    if (description !== undefined)
      update.description = String(description).substring(0, 500);
    if (price !== undefined) update.price = Number(price);
    if (category !== undefined) update.category = String(category);
    if (imageId !== undefined) update.imageId = imageId || null; // GridFS id
    if (image !== undefined) update.image = String(image); // legacy fallback
    if (tags !== undefined) update.tags = Array.isArray(tags) ? tags : [];
    if (allergens !== undefined)
      update.allergens = Array.isArray(allergens) ? allergens : [];
    if (flavorProfile !== undefined) update.flavorProfile = flavorProfile;
    if (prepTime !== undefined) update.prepTime = Number(prepTime);
    if (calories !== undefined) update.calories = Number(calories);
    if (featured !== undefined) update.featured = Boolean(featured);
    update.updatedAt = new Date();

    const result = await db
      .collection("menuItems")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: update });

    if (result.matchedCount === 0)
      return res.status(404).json({ error: "Item not found." });
    res.json({ message: "Item updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update item." });
  }
});

// DELETE a menu item
router.delete("/menu/:id", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const result = await db
      .collection("menuItems")
      .deleteOne({ _id: new ObjectId(req.params.id) });
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Item not found." });
    res.json({ message: "Item deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item." });
  }
});

// POST set today's special
router.post("/specials", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { itemId, date } = req.body;
    if (!itemId) return res.status(400).json({ error: "itemId is required." });

    const item = await db
      .collection("menuItems")
      .findOne({ _id: new ObjectId(itemId) });
    if (!item) return res.status(404).json({ error: "Item not found." });

    const specialDate = date || new Date().toISOString().split("T")[0];
    await db
      .collection("specials")
      .updateOne(
        { date: specialDate },
        { $set: { ...item, date: specialDate, setAt: new Date() } },
        { upsert: true },
      );
    res.json({ message: "Special set successfully.", date: specialDate });
  } catch (err) {
    res.status(500).json({ error: "Failed to set special." });
  }
});

// GET global settings
router.get("/settings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const settings = await db.collection("settings").findOne({ _id: "global" });
    res.json(settings || { deliveryFee: 5 });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch settings." });
  }
});

// PUT update global settings
router.put("/settings", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { deliveryFee } = req.body;
    
    if (deliveryFee === undefined) {
      return res.status(400).json({ error: "deliveryFee is required." });
    }

    await db.collection("settings").updateOne(
      { _id: "global" },
      { $set: { deliveryFee: Number(deliveryFee), updatedAt: new Date() } },
      { upsert: true }
    );
    
    res.json({ message: "Settings updated successfully." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings." });
  }
});

module.exports = router;
