const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const { requireSuperAdmin } = require("../middleware/adminAuth"); // Custom admin check

// GET /admin/items — View absolutely everything in the database
router.get("/items", requireSuperAdmin, async (req, res, next) => {
  try {
    // The plugin sees .bypassTenant() and leaves the query unrestricted
    const allGlobalItems = await Item.find({}).bypassTenant();

    res.json({ items: allGlobalItems });
  } catch (err) {
    next(err);
  }
});

// PUT /admin/items/:id — Update an item regardless of which tenant owns it
router.put("/items/:id", requireSuperAdmin, async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(req.params.id, req.body, {
      new: true,
    }).bypassTenant(); // Bypasses tenant scoping for the update query

    res.json(item);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
