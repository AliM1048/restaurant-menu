const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");
const { ObjectId } = require("mongodb");

// GET latest global reviews
router.get("/recent", async (req, res) => {
  try {
    const db = getDB();
    const reviews = await db
      .collection("reviews")
      .find({})
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent reviews." });
  }
});

// GET reviews for a menu item
router.get("/:itemId", async (req, res) => {
  try {
    const db = getDB();
    const reviews = await db
      .collection("reviews")
      .find({ itemId: req.params.itemId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch reviews." });
  }
});

// POST a new review
router.post("/:itemId", async (req, res) => {
  try {
    const db = getDB();
    const { name, rating, comment } = req.body;

    if (!name || !rating || !comment) {
      return res
        .status(400)
        .json({ error: "Name, rating, and comment are required." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5." });
    }
    if (comment.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment must be under 500 characters." });
    }

    // Sanitize input - strip HTML tags
    const sanitize = (str) => str.replace(/<[^>]*>/g, "").trim();

    const review = {
      itemId: req.params.itemId,
      name: sanitize(name).substring(0, 50),
      rating: Number(rating),
      comment: sanitize(comment),
      createdAt: new Date(),
    };

    const result = await db.collection("reviews").insertOne(review);

    // Update average rating on menu item
    const allReviews = await db
      .collection("reviews")
      .find({ itemId: req.params.itemId })
      .toArray();
    const avgRating =
      allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
    await db
      .collection("menuItems")
      .updateOne(
        { _id: new ObjectId(req.params.itemId) },
        {
          $set: {
            avgRating: Math.round(avgRating * 10) / 10,
            reviewCount: allReviews.length,
          },
        },
      );

    res.status(201).json({ ...review, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: "Failed to submit review." });
  }
});

module.exports = router;
