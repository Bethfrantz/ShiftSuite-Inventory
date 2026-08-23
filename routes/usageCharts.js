const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Usage = require("../models/Usage");
const Item = require("../models/Item");

// Store usage charts
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate, groupBy } = req.query;

    // groupBy can be: day, week, month, category, vendor, item
    const grouping = groupBy || "day";

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery = Object.keys(dateFilter).length
      ? { createdAt: dateFilter }
      : {};

    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    const usageRecords = await Usage.find({
      storeId,
      ...dateQuery,
    }).populate("itemId");

    const chartData = {};

    for (const u of usageRecords) {
      const item = u.itemId;

      // Determine grouping key
      let key;

      if (grouping === "day") {
        key = u.createdAt.toISOString().split("T")[0];
      } else if (grouping === "week") {
        const d = new Date(u.createdAt);
        const week = Math.ceil(d.getDate() / 7);
        key = `${d.getFullYear()}-${d.getMonth() + 1}-W${week}`;
      } else if (grouping === "month") {
        const d = new Date(u.createdAt);
        key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      } else if (grouping === "category") {
        key = item.categoryId?.toString() || "Uncategorized";
      } else if (grouping === "vendor") {
        key = item.vendor || "Unknown Vendor";
      } else if (grouping === "item") {
        key = item._id.toString();
      }

      if (!chartData[key]) {
        chartData[key] = {
          totalUsage: 0,
          items: [],
        };
      }

      chartData[key].totalUsage += u.quantity;

      chartData[key].items.push({
        itemId: item._id,
        name: item.name,
        vendor: item.vendor,
        categoryId: item.categoryId,
        quantity: u.quantity,
      });
    }

    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      grouping,
      chartData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
