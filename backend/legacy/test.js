const express = require("express");
const router = express.Router();
const Item = require("../models/Item");

router.post("/create-test-item", async (req, res) => {
  try {
    const item = await Item.create({
      name: "Test Item",
      vendor: "Test Vendor",
      categoryId: someCategoryId,
      active: true,
      currentPrice: 0,
      units: {
        caseSize: 0,
        bagSize: 0,
        cambroSize: 0,
        allowCambros: false,
        allowSingles: true,
      },
      parLevels: [],
      priceHistory: [],
    });

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
