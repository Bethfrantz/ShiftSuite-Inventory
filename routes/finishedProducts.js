const express = require("express");
const router = express.Router();

const FinishedProduct = require("../models/FinishedProduct");

// CREATE finished product
router.post("/", async (req, res) => {
  try {
    const { name, photoUrl, ingredients } = req.body;

    const product = await FinishedProduct.create({
      name,
      photoUrl,
      ingredients,
    });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all finished products
router.get("/", async (req, res) => {
  try {
    const products =
      await FinishedProduct.find().populate("ingredients.itemId");
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single finished product
router.get("/:id", async (req, res) => {
  try {
    const product = await FinishedProduct.findById(req.params.id).populate(
      "ingredients.itemId",
    );

    if (!product) return res.status(404).json({ error: "Not found" });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE finished product
router.put("/:id", async (req, res) => {
  try {
    const { name, photoUrl, ingredients, active } = req.body;

    const updated = await FinishedProduct.findByIdAndUpdate(
      req.params.id,
      { name, photoUrl, ingredients, active },
      { new: true },
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE finished product
router.delete("/:id", async (req, res) => {
  try {
    await FinishedProduct.findByIdAndDelete(req.params.id);
    res.json({ message: "Finished product deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
