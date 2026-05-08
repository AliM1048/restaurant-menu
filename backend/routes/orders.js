const express = require("express");
const router = express.Router();
const { getDB } = require("../db/mongo");
const { verifyToken } = require("../middleware/auth");
const crypto = require("crypto");

/* ── POST /api/orders   — place a new order ─────────────────── */
router.post("/", async (req, res) => {
  try {
    const db = getDB();
    const { customer, items, total, orderType, deliveryFee } = req.body;

    // Delivery orders require address
    if (orderType === "delivery" && (!customer?.name || !customer?.phone || !customer?.address)) {
      return res
        .status(400)
        .json({ error: "Name, phone, and delivery address are required for delivery." });
    }
    // Pickup orders only require name and phone
    if (orderType === "pickup" && (!customer?.name || !customer?.phone)) {
      return res
        .status(400)
        .json({ error: "Name and phone are required for pickup." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ error: "Order must contain at least one item." });
    }

    const orderNumber = `LT-${Date.now().toString(36).toUpperCase()}-${crypto.randomUUID().slice(0, 4).toUpperCase()}`;

    const order = {
      orderNumber,
      orderType: orderType || "delivery",
      deliveryFee: orderType === "delivery" ? Number(deliveryFee || 0) : 0,
      customer: {
        name: String(customer.name).substring(0, 100),
        phone: String(customer.phone).substring(0, 30),
        address: orderType === "delivery" ? String(customer.address).substring(0, 300) : "",
        notes: String(customer.notes || "").substring(0, 500),
      },
      items: items.map((i) => ({
        _id: i._id,
        name: String(i.name).substring(0, 100),
        category: String(i.category || ""),
        price: Number(i.price),
        qty: Number(i.qty),
        subtotal: Number(i.price) * Number(i.qty),
      })),
      total: Number(total),
      status: "pending", // pending | preparing | delivered | cancelled
      createdAt: new Date(),
    };

    const result = await db.collection("orders").insertOne(order);
    res.status(201).json({ ...order, _id: result.insertedId });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ error: "Failed to place order." });
  }
});

/* ── GET /api/orders   (admin) — all orders, newest first ─── */
router.get("/", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const orders = await db
      .collection("orders")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders." });
  }
});

/* ── GET /api/orders/stats   (admin) ─────────────────────── */
router.get("/stats", verifyToken, async (req, res) => {
  try {
    const db = getDB();

    // Total orders & revenue
    const [totals] = await db
      .collection("orders")
      .aggregate([
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
      ])
      .toArray();

    // Most ordered items (by qty)
    const topItems = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.name",
            category: { $first: "$items.category" },
            totalQty: { $sum: "$items.qty" },
            totalRevenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { totalQty: -1 } },
        { $limit: 10 },
      ])
      .toArray();

    // Most ordered categories
    const topCategories = await db
      .collection("orders")
      .aggregate([
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.category",
            totalQty: { $sum: "$items.qty" },
            totalRevenue: { $sum: "$items.subtotal" },
          },
        },
        { $sort: { totalQty: -1 } },
      ])
      .toArray();

    // Orders by day (last 14 days)
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const ordersPerDay = await db
      .collection("orders")
      .aggregate([
        { $match: { createdAt: { $gte: twoWeeksAgo } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 },
            revenue: { $sum: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    // Top delivery areas (first word of address as "area")
    const topLocations = await db
      .collection("orders")
      .aggregate([
        {
          $project: {
            area: { $arrayElemAt: [{ $split: ["$customer.address", ","] }, 0] },
          },
        },
        { $group: { _id: "$area", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ])
      .toArray();

    // Status breakdown
    const statusBreakdown = await db
      .collection("orders")
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray();

    res.json({
      totals: totals || { count: 0, revenue: 0 },
      topItems,
      topCategories,
      ordersPerDay,
      topLocations,
      statusBreakdown,
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Failed to fetch stats." });
  }
});

/* ── PATCH /api/orders/:id/status   (admin) ─────────────── */
router.patch("/:id/status", verifyToken, async (req, res) => {
  try {
    const db = getDB();
    const { ObjectId } = require("mongodb");
    const { status } = req.body;
    const validStatuses = ["pending", "preparing", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }
    await db
      .collection("orders")
      .updateOne(
        { _id: new ObjectId(req.params.id) },
        { $set: { status, updatedAt: new Date() } },
      );
    res.json({ message: "Status updated." });
  } catch (err) {
    res.status(500).json({ error: "Failed to update status." });
  }
});

module.exports = router;
