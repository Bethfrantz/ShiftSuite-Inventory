const Inventory = require("../models/inventoryModel");
const Item = require("../models/itemModel");

// GET full inventory list
exports.getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().populate("item");
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch inventory" });
  }
};

// GET inventory for a specific location
exports.getInventoryByLocation = async (req, res) => {
  try {
    const { location } = req.params;
    const inventory = await Inventory.find({ location }).populate("item");
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch location inventory" });
  }
};

// UPDATE quantity (counting, adjustments, waste)
exports.updateQuantity = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, reason } = req.body;

    const inventory = await Inventory.findById(id);
    if (!inventory)
      return res.status(404).json({ error: "Inventory item not found" });

    inventory.quantity = quantity;
    inventory.lastUpdated = new Date();
    inventory.lastReason = reason;

    await inventory.save();
    res.json(inventory);
  } catch (err) {
    res.status(500).json({ error: "Failed to update quantity" });
  }
};

// CREATE inventory record
exports.createInventory = async (req, res) => {
  try {
    const { item, quantity, location } = req.body;

    const newInventory = new Inventory({
      item,
      quantity,
      location,
      lastUpdated: new Date(),
    });

    await newInventory.save();
    res.json(newInventory);
  } catch (err) {
    res.status(500).json({ error: "Failed to create inventory record" });
  }
};

// DELETE inventory record
exports.deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    await Inventory.findByIdAndDelete(id);
    res.json({ message: "Inventory record deleted" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete inventory record" });
  }
};
