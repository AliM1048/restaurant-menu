const express = require("express");
const router = express.Router();
const multer = require("multer");
const { GridFSBucket, ObjectId } = require("mongodb");
const { getDB } = require("../db/mongo");

// Use memory storage — we pipe the buffer directly into GridFS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB max
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only JPEG, PNG, or WebP images are allowed."));
  },
});

// POST /api/images/upload  — save image to GridFS, return file id
router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ error: "No image file provided." });

    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: "dishImages" });

    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: {
        contentType: req.file.mimetype,
        uploadedAt: new Date(),
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on("finish", () => {
      res.status(201).json({
        fileId: uploadStream.id.toString(),
        filename: req.file.originalname,
        size: req.file.size,
        contentType: req.file.mimetype,
      });
    });

    uploadStream.on("error", (err) => {
      console.error("GridFS upload error:", err);
      res.status(500).json({ error: "Failed to upload image." });
    });
  } catch (err) {
    console.error("Upload route error:", err);
    res.status(500).json({ error: "Server error during upload." });
  }
});

// GET /api/images/:id  — stream image from GridFS to browser
router.get("/:id", async (req, res) => {
  try {
    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: "dishImages" });
    const fileId = new ObjectId(req.params.id);

    // Check the file exists and get its metadata
    const files = await db
      .collection("dishImages.files")
      .find({ _id: fileId })
      .toArray();
    if (!files.length)
      return res.status(404).json({ error: "Image not found." });

    const file = files[0];
    const contentType = file.metadata?.contentType || "image/jpeg";

    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=31536000"); // 1 year cache

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.on("error", () =>
      res.status(404).json({ error: "Image not found." }),
    );
    downloadStream.pipe(res);
  } catch (err) {
    if (err.message?.includes("hex string")) {
      return res.status(400).json({ error: "Invalid image ID." });
    }
    res.status(500).json({ error: "Failed to retrieve image." });
  }
});

// DELETE /api/images/:id
router.delete("/:id", async (req, res) => {
  try {
    const db = getDB();
    const bucket = new GridFSBucket(db, { bucketName: "dishImages" });
    await bucket.delete(new ObjectId(req.params.id));
    res.json({ message: "Image deleted." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete image." });
  }
});

module.exports = { router, upload };
