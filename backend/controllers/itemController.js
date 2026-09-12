const Item = require("../models/itemModel");

// GET all items
exports.getItems = async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// GET single item
exports.getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await Item.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

// LOOKUP by barcode
exports.getItemByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const item = await Item.findOne({ barcode });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: "Failed to lookup barcode" });
  }
};

// CREATE item
exports.createItem = async (req, res) => {
  try {
    const newItem = new Item(req.body);
    await newItem.save();
    res.json(newItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to create item" });
  }
};

// UPDATE item
exports.updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedItem = await Item.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: "Failed to update item" });
  }
};

// DELETE item
exports.deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    await Item.findByIdAndDelete(id);
    res.json({ message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete item" });
  }
};
