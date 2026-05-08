require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const { MongoClient, GridFSBucket } = require("mongodb");
const fetch = require("node-fetch");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = process.env.DB_NAME || "restomenu";

const categories = [
  { name: "All", slug: "all", icon: "🍽️", order: 0 },
  { name: "Starters", slug: "starters", icon: "🥗", order: 1 },
  { name: "Mains", slug: "mains", icon: "🍖", order: 2 },
  { name: "Pasta", slug: "pasta", icon: "🍝", order: 3 },
  { name: "Pizza", slug: "pizza", icon: "🍕", order: 4 },
  { name: "Seafood", slug: "seafood", icon: "🦞", order: 5 },
  { name: "Desserts", slug: "desserts", icon: "🍮", order: 6 },
  { name: "Drinks", slug: "drinks", icon: "🍷", order: 7 },
];

const menuItems = [
  {
    name: "Bruschetta al Pomodoro",
    description:
      "Grilled sourdough topped with heirloom tomatoes, fresh basil, aged balsamic glaze, and a whisper of garlic.",
    price: 9.5,
    category: "starters",
    imageUrl:
      "https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=600&auto=format&fit=crop&q=80",
    tags: ["vegetarian", "popular"],
    allergens: ["gluten"],
    flavorProfile: { spicy: 1, sweet: 2, sour: 3, umami: 4, salty: 2 },
    prepTime: 8,
    calories: 210,
    featured: false,
    avgRating: 4.7,
    reviewCount: 23,
  },
  {
    name: "Burrata & Prosciutto",
    description:
      "Creamy burrata served with thinly sliced prosciutto di Parma, roasted cherry tomatoes, and basil oil.",
    price: 14.0,
    category: "starters",
    imageUrl:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=600&auto=format&fit=crop&q=80",
    tags: ["chef-special", "popular"],
    allergens: ["dairy"],
    flavorProfile: { spicy: 0, sweet: 2, sour: 1, umami: 5, salty: 4 },
    prepTime: 10,
    calories: 320,
    featured: true,
    avgRating: 4.9,
    reviewCount: 41,
  },
  {
    name: "Zuppa del Giorno",
    description:
      "Chef's daily soup crafted from seasonal vegetables, served with crusty artisan bread.",
    price: 8.0,
    category: "starters",
    imageUrl:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&auto=format&fit=crop&q=80",
    tags: ["vegan", "seasonal"],
    allergens: ["gluten"],
    flavorProfile: { spicy: 1, sweet: 1, sour: 1, umami: 4, salty: 3 },
    prepTime: 5,
    calories: 180,
    featured: false,
    avgRating: 4.4,
    reviewCount: 15,
  },
  {
    name: "Bistecca Fiorentina",
    description:
      "A 600g T-bone Florentine steak, aged 30 days, char-grilled and finished with rosemary butter. Served with roasted potatoes.",
    price: 42.0,
    category: "mains",
    imageUrl:
      "https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop&q=80",
    tags: ["signature", "best-seller"],
    allergens: ["dairy"],
    flavorProfile: { spicy: 0, sweet: 0, sour: 0, umami: 5, salty: 3 },
    prepTime: 25,
    calories: 780,
    featured: true,
    avgRating: 4.8,
    reviewCount: 67,
  },
  {
    name: "Pollo al Limone",
    description:
      "Pan-roasted free-range chicken breast in a lemon–caper sauce, with grilled asparagus and mashed potato.",
    price: 24.0,
    category: "mains",
    imageUrl:
      "https://images.unsplash.com/photo-1598103442097-8b74394b95c1?w=600&auto=format&fit=crop&q=80",
    tags: ["gluten-free"],
    allergens: ["dairy"],
    flavorProfile: { spicy: 0, sweet: 1, sour: 4, umami: 4, salty: 3 },
    prepTime: 20,
    calories: 460,
    featured: false,
    avgRating: 4.5,
    reviewCount: 30,
  },
  {
    name: "Melanzane alla Parmigiana",
    description:
      "Layers of oven-baked aubergine, San Marzano tomato sauce, fresh mozzarella and Parmigiano Reggiano.",
    price: 18.0,
    category: "mains",
    imageUrl:
      "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&auto=format&fit=crop&q=80",
    tags: ["vegetarian", "popular"],
    allergens: ["dairy", "gluten"],
    flavorProfile: { spicy: 1, sweet: 2, sour: 2, umami: 5, salty: 3 },
    prepTime: 30,
    calories: 520,
    featured: false,
    avgRating: 4.6,
    reviewCount: 22,
  },
  {
    name: "Tagliatelle al Tartufo",
    description:
      "Fresh egg tagliatelle tossed in truffle butter, wild mushrooms, and shaved Parmigiano Reggiano.",
    price: 28.0,
    category: "pasta",
    imageUrl:
      "https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=600&auto=format&fit=crop&q=80",
    tags: ["chef-special", "seasonal"],
    allergens: ["gluten", "dairy", "eggs"],
    flavorProfile: { spicy: 0, sweet: 0, sour: 0, umami: 5, salty: 3 },
    prepTime: 15,
    calories: 590,
    featured: true,
    avgRating: 4.9,
    reviewCount: 54,
  },
  {
    name: "Spaghetti Carbonara",
    description:
      "Classic Roman carbonara: spaghetti alla chitarra, guanciale, Pecorino Romano, egg yolk, and black pepper.",
    price: 20.0,
    category: "pasta",
    imageUrl:
      "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&auto=format&fit=crop&q=80",
    tags: ["classic", "best-seller"],
    allergens: ["gluten", "dairy", "eggs"],
    flavorProfile: { spicy: 2, sweet: 0, sour: 0, umami: 5, salty: 4 },
    prepTime: 12,
    calories: 620,
    featured: false,
    avgRating: 4.7,
    reviewCount: 88,
  },
  {
    name: "Pizza Margherita Verace",
    description:
      "Certified Neapolitan pizza: San Marzano DOP tomato, fresh Fior di latte, extra virgin olive oil, fresh basil. 72h dough.",
    price: 16.0,
    category: "pizza",
    imageUrl:
      "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=600&auto=format&fit=crop&q=80",
    tags: ["vegetarian", "classic"],
    allergens: ["gluten", "dairy"],
    flavorProfile: { spicy: 0, sweet: 2, sour: 2, umami: 4, salty: 3 },
    prepTime: 15,
    calories: 680,
    featured: false,
    avgRating: 4.7,
    reviewCount: 72,
  },
  {
    name: "Diavola Inferno",
    description:
      "Spicy Calabrian salami, nduja, smoked scamorza, pickled jalapeños, and hot honey drizzle.",
    price: 19.0,
    category: "pizza",
    imageUrl:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=80",
    tags: ["spicy", "chef-special", "popular"],
    allergens: ["gluten", "dairy"],
    flavorProfile: { spicy: 5, sweet: 2, sour: 1, umami: 5, salty: 4 },
    prepTime: 15,
    calories: 760,
    featured: true,
    avgRating: 4.8,
    reviewCount: 49,
  },
  {
    name: "Branzino al Sale",
    description:
      "Whole sea bass baked in a salt crust with lemon, herbs, and capers. Deboned tableside.",
    price: 34.0,
    category: "seafood",
    imageUrl:
      "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&auto=format&fit=crop&q=80",
    tags: ["gluten-free", "signature"],
    allergens: ["fish"],
    flavorProfile: { spicy: 0, sweet: 0, sour: 3, umami: 5, salty: 4 },
    prepTime: 35,
    calories: 390,
    featured: false,
    avgRating: 4.9,
    reviewCount: 33,
  },
  {
    name: "Risotto ai Frutti di Mare",
    description:
      "Creamy Carnaroli risotto with fresh prawns, clams, mussels, and squid in a light bisque.",
    price: 32.0,
    category: "seafood",
    imageUrl:
      "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=600&auto=format&fit=crop&q=80",
    tags: ["popular", "chef-special"],
    allergens: ["shellfish", "dairy"],
    flavorProfile: { spicy: 1, sweet: 1, sour: 1, umami: 5, salty: 4 },
    prepTime: 22,
    calories: 550,
    featured: true,
    avgRating: 4.8,
    reviewCount: 46,
  },
  {
    name: "Tiramisù della Casa",
    description:
      "House-made tiramisù: Savoiardi dipped in espresso, layered with mascarpone cream and dusted with dark cocoa.",
    price: 10.0,
    category: "desserts",
    imageUrl:
      "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&auto=format&fit=crop&q=80",
    tags: ["classic", "best-seller"],
    allergens: ["gluten", "dairy", "eggs"],
    flavorProfile: { spicy: 0, sweet: 5, sour: 0, umami: 2, salty: 1 },
    prepTime: 5,
    calories: 420,
    featured: false,
    avgRating: 4.9,
    reviewCount: 95,
  },
  {
    name: "Panna Cotta al Mango",
    description:
      "Vanilla panna cotta with tropical mango coulis, toasted coconut, and micro basil.",
    price: 9.0,
    category: "desserts",
    imageUrl:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&auto=format&fit=crop&q=80",
    tags: ["gluten-free", "seasonal"],
    allergens: ["dairy"],
    flavorProfile: { spicy: 0, sweet: 5, sour: 2, umami: 0, salty: 1 },
    prepTime: 5,
    calories: 310,
    featured: false,
    avgRating: 4.6,
    reviewCount: 38,
  },
  {
    name: "Aperol Spritz",
    description:
      "The iconic Italian aperitivo: Aperol, Prosecco DOC, a splash of soda, and a fresh orange slice over ice.",
    price: 11.0,
    category: "drinks",
    imageUrl:
      "https://images.unsplash.com/photo-1560508180-03f285f67ded?w=600&auto=format&fit=crop&q=80",
    tags: ["popular", "alcohol"],
    allergens: [],
    flavorProfile: { spicy: 0, sweet: 3, sour: 3, umami: 0, salty: 0 },
    prepTime: 3,
    calories: 190,
    featured: false,
    avgRating: 4.7,
    reviewCount: 60,
  },
  {
    name: "Limonata della Casa",
    description:
      "Fresh-pressed Amalfi lemon juice, still water, cane sugar, and a sprig of fresh mint. Non-alcoholic.",
    price: 6.5,
    category: "drinks",
    imageUrl:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop&q=80",
    tags: ["non-alcoholic", "vegan"],
    allergens: [],
    flavorProfile: { spicy: 0, sweet: 3, sour: 5, umami: 0, salty: 0 },
    prepTime: 3,
    calories: 120,
    featured: false,
    avgRating: 4.6,
    reviewCount: 27,
  },
];

const sampleReviews = [
  {
    name: "Sofia M.",
    rating: 5,
    comment: "Absolutely divine! The tiramisù alone is worth the trip.",
  },
  {
    name: "James R.",
    rating: 5,
    comment: "Bistecca Fiorentina cooked to absolute perfection. Will be back!",
  },
  {
    name: "Yuki T.",
    rating: 4,
    comment:
      "Beautiful ambiance and incredible pasta. The carbonara is authentic Roman style.",
  },
  {
    name: "Amira L.",
    rating: 5,
    comment:
      "Best seafood risotto I've had outside of Venice. Stunning presentation.",
  },
  {
    name: "Thomas K.",
    rating: 5,
    comment: "The Diavola pizza is fire – literally! Love the hot honey touch.",
  },
];

/**
 * Download an image from a URL and store it in GridFS.
 * Returns the GridFS file _id as a string.
 */
async function downloadImageToGridFS(db, url, filename) {
  const bucket = new GridFSBucket(db, { bucketName: "dishImages" });

  console.log(`  ↓ Downloading ${filename}…`);
  const response = await fetch(url, {
    headers: { "User-Agent": "resto-menu-seed/1.0" },
    timeout: 15000,
  });

  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);

  const contentType = response.headers.get("content-type") || "image/jpeg";

  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: { contentType, sourceUrl: url, uploadedAt: new Date() },
    });

    response.body.pipe(uploadStream);
    uploadStream.on("finish", () => resolve(uploadStream.id.toString()));
    uploadStream.on("error", reject);
  });
}

async function seed() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    console.log("🌿 Connected to MongoDB. Starting seed with GridFS images…\n");

    // Clear everything
    await db.collection("categories").deleteMany({});
    await db.collection("menuItems").deleteMany({});
    await db.collection("reviews").deleteMany({});
    // Drop GridFS dishImages bucket
    try {
      await db.collection("dishImages.files").drop();
      await db.collection("dishImages.chunks").drop();
    } catch (_) {
      /* collections might not exist yet */
    }

    // Insert categories
    await db.collection("categories").insertMany(categories);
    console.log(`✅ Inserted ${categories.length} categories`);

    // Download each image into GridFS, then insert the menu item
    const insertedIds = [];
    for (const item of menuItems) {
      let imageId = null;
      let imageFallback = null;
      try {
        const slug = item.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
        imageId = await downloadImageToGridFS(db, item.imageUrl, `${slug}.jpg`);
      } catch (err) {
        console.warn(
          `  ⚠️  Image download failed for "${item.name}": ${err.message}`,
        );
        imageFallback = item.imageUrl; // keep original URL as fallback
      }

      const doc = {
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        // imageId = GridFS file id (preferred), imageFallback = original URL if download failed
        imageId: imageId,
        image: imageFallback, // only set if GridFS failed
        tags: item.tags,
        allergens: item.allergens,
        flavorProfile: item.flavorProfile,
        prepTime: item.prepTime,
        calories: item.calories,
        featured: item.featured,
        avgRating: item.avgRating,
        reviewCount: item.reviewCount,
        createdAt: new Date(),
      };

      const result = await db.collection("menuItems").insertOne(doc);
      insertedIds.push(result.insertedId);
      const stored = imageId ? "🖼️  GridFS" : "🔗 URL fallback";
      console.log(`  ✅ ${item.name} (${stored})`);
    }

    console.log(`\n✅ Inserted ${menuItems.length} menu items`);

    // Insert sample reviews
    for (let i = 0; i < sampleReviews.length && i < insertedIds.length; i++) {
      await db.collection("reviews").insertOne({
        ...sampleReviews[i],
        itemId: insertedIds[i].toString(),
        createdAt: new Date(),
      });
    }
    console.log(`✅ Inserted ${sampleReviews.length} sample reviews`);
    console.log(
      "\n🎉 Seed complete! All images stored in MongoDB GridFS (dishImages.files / dishImages.chunks)\n",
    );
  } catch (err) {
    console.error("❌ Seed error:", err);
  } finally {
    await client.close();
  }
}

seed();
