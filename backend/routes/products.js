// routes/products.js
// Product CRUD endpoints — simulates DynamoDB Products table operations.
// GET /api/products             — list / search / filter
// GET /api/products/:id         — single product
// POST /api/products            — create (admin)
// PUT /api/products/:id         — update (admin)
// DELETE /api/products/:id      — delete (admin)

const express = require("express");
const { protect } = require("../middleware/auth");
const { computePopularityScore } = require("../services/popularity.service");
const db = require("../db");

const router = express.Router();

/**
 * GET /api/products
 * Query params:
 *   category   — filter by category slug
 *   search     — full-text search on title/description
 *   minPrice   — minimum price filter
 *   maxPrice   — maximum price filter
 *   minRating  — minimum rating filter
 *   sort       — 'price_asc' | 'price_desc' | 'rating' | 'popularity' | 'discount'
 *   page       — pagination (default 1)
 *   limit      — items per page (default 20, max 100)
 *   inStock    — 'true' to show only in-stock items
 */
router.get("/", (req, res) => {
  try {
    let products = [...db.products];

    // Filtering
    if (req.query.category) {
      products = products.filter((p) => p.category === req.query.category);
    }

    if (req.query.search) {
      const q = req.query.search.toLowerCase();
      products = products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.category.includes(q) ||
          (p.brand || "").toLowerCase().includes(q) ||
          (p.tags || []).some((t) => t.toLowerCase().includes(q)),
      );
    }

    if (req.query.minPrice) {
      products = products.filter(
        (p) => p.price >= parseFloat(req.query.minPrice),
      );
    }
    if (req.query.maxPrice) {
      products = products.filter(
        (p) => p.price <= parseFloat(req.query.maxPrice),
      );
    }
    if (req.query.minRating) {
      products = products.filter(
        (p) => p.rating >= parseFloat(req.query.minRating),
      );
    }
    if (req.query.inStock === "true") {
      products = products.filter(
        (p) => p.availabilityStatus !== "Out of Stock" && p.stock > 0,
      );
    }

    // Add popularity score to each product
    products = products.map((p) => ({
      ...p,
      popularityScore: parseFloat(computePopularityScore(p).toFixed(4)),
      discountedPrice: parseFloat(
        (p.price * (1 - p.discountPercentage / 100)).toFixed(2),
      ),
    }));

    // Sorting
    const sort = req.query.sort || "popularity";
    switch (sort) {
      case "price_asc":
        products.sort((a, b) => a.discountedPrice - b.discountedPrice);
        break;
      case "price_desc":
        products.sort((a, b) => b.discountedPrice - a.discountedPrice);
        break;
      case "rating":
        products.sort((a, b) => b.rating - a.rating);
        break;
      case "discount":
        products.sort((a, b) => b.discountPercentage - a.discountPercentage);
        break;
      case "popularity":
        products.sort((a, b) => b.popularityScore - a.popularityScore);
        break;
      default:
        break;
    }

    // Pagination
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const total = products.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const paginated = products.slice(start, start + limit);

    // Category list for sidebar — return {name, count} objects
    const catCounts = {};
    db.products.forEach((p) => {
      catCounts[p.category] = (catCounts[p.category] || 0) + 1;
    });
    const categories = Object.entries(catCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));

    res.json({
      success: true,
      data: paginated,
      pagination: { page, limit, total, totalPages },
      categories,
      filters: {
        category: req.query.category || null,
        search: req.query.search || null,
        sort,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/products/categories
 * Returns all unique categories with product count.
 */
router.get("/categories", (req, res) => {
  const counts = {};
  db.products.forEach((p) => {
    counts[p.category] = (counts[p.category] || 0) + 1;
  });
  const categories = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));

  res.json({ success: true, categories, total: categories.length });
});

/**
 * GET /api/products/:id
 * Returns a single product with discounted price and popularity score.
 */
router.get("/:id", (req, res) => {
  const product = db.products.find((p) => p.id === parseInt(req.params.id));
  if (!product) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }
  res.json({
    success: true,
    data: {
      ...product,
      popularityScore: parseFloat(computePopularityScore(product).toFixed(4)),
      discountedPrice: parseFloat(
        (product.price * (1 - product.discountPercentage / 100)).toFixed(2),
      ),
    },
  });
});

/**
 * POST /api/products
 * Create a new product (authenticated).
 */
router.post("/", protect, (req, res) => {
  try {
    const required = ["title", "description", "category", "price"];
    for (const field of required) {
      if (!req.body[field]) {
        return res
          .status(400)
          .json({ success: false, error: `Field '${field}' is required` });
      }
    }
    const maxId = Math.max(...db.products.map((p) => p.id));
    const newProduct = {
      id: maxId + 1,
      title: req.body.title,
      description: req.body.description,
      category: req.body.category,
      price: parseFloat(req.body.price),
      discountPercentage: parseFloat(req.body.discountPercentage) || 0,
      rating: parseFloat(req.body.rating) || 0,
      stock: parseInt(req.body.stock) || 0,
      brand: req.body.brand || "",
      sku: req.body.sku || `NEW-${maxId + 1}`,
      tags: req.body.tags || [],
      thumbnail: req.body.thumbnail || "",
      availabilityStatus: req.body.stock > 0 ? "In Stock" : "Out of Stock",
      createdAt: new Date().toISOString(),
    };
    db.products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/products/:id
 * Update an existing product (authenticated).
 */
router.put("/:id", protect, (req, res) => {
  const idx = db.products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }
  db.products[idx] = {
    ...db.products[idx],
    ...req.body,
    id: db.products[idx].id,
  };
  res.json({ success: true, data: db.products[idx] });
});

/**
 * DELETE /api/products/:id
 * Delete a product (authenticated).
 */
router.delete("/:id", protect, (req, res) => {
  const idx = db.products.findIndex((p) => p.id === parseInt(req.params.id));
  if (idx === -1) {
    return res.status(404).json({ success: false, error: "Product not found" });
  }
  const deleted = db.products.splice(idx, 1)[0];
  res.json({ success: true, data: deleted, message: "Product deleted" });
});

module.exports = router;
