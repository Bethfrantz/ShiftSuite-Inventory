const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const InventoryCount = require("../models/InventoryCount");
const FinishedProduct = require("../models/FinishedProduct");
const Item = require("../models/Item");
const Usage = require("../models/Usage");

// AUTO-PAR REPLENISHMENT SUGGESTIONS
router.get("/:storeId", async (req, res) => {
    try {
        const { storeId } = req.params;

        const store = await Store.findById(storeId);
        if (!store) return res.status(404).json({ error: "Store not found" });

        // Load items
        const items = await Item.find().populate("categoryId");

        // Load inventory
        const inventory = await InventoryCount.find({ storeId });

        // Load finished products
        const finishedProducts = await FinishedProduct.find()
            .populate("ingredients.itemId");

        // Load usage for demand forecasting
        const since = new Date();
        since.setDate(since.getDate() - 14);

        const usageRecords = await Usage.find({
            storeId,
            createdAt: { $gte: since }
        }).populate("itemId");

        const suggestions = {};

        // Initialize entries
        for (const item of items) {
            const inv = inventory.find(i => i.itemId.toString() === item._id.toString());
            const currentStock = inv ? inv.quantity : 0;

            const parLevel = item.parLevels?.find(p => p.storeId.toString() === storeId);

            suggestions[item._id] = {
                itemId: item._id,
                name: item.name,
                vendor: item.vendor,
                category: item.categoryId?.name || "Uncategorized",
                currentStock,
                parLevel: parLevel ? parLevel.par : null,
                forecastUsageNext7Days: 0,
                batchPrepDemand: 0,
                recommendedOrderQty: 0,
                urgency: "Normal"
            };
        }

        // FORECAST USAGE (raw item level)
        for (const u of usageRecords) {
            const item = u.itemId;
            const daysAgo = (Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24);

            if (daysAgo <= 7) {
                suggestions[item._id].forecastUsageNext7Days += u.quantity;
            }
        }

        // BATCH PREP DEMAND (convert finished product demand into raw item demand)
        for (const fp of finishedProducts) {
            const fpForecast = 0; // placeholder for future integration with demand forecast

            for (const ing of fp.ingredients) {
                const item = ing.itemId;
                const rawDemand = fpForecast * ing.quantityUsed;

                suggestions[item._id].batchPrepDemand += rawDemand;
            }
        }

        // CALCULATE ORDER QUANTITY
        for (const id in suggestions) {
            const s = suggestions[id];

            const par = s.parLevel || 0;
            const forecast = s.forecastUsageNext7Days;
            const batchDemand = s.batchPrepDemand;

            const targetStock = par + forecast + batchDemand;

            const needed = targetStock - s.currentStock;

            s.recommendedOrderQty = needed > 0 ? Math.ceil(needed) : 0;

            // Urgency logic
            if (s.currentStock < forecast * 0.5) {
                s.urgency = "Critical";
            } else if (s.currentStock < forecast) {
                s.urgency = "High";
            }
        }

        // Group by vendor
        const vendorGroups = {};
        for (const id in suggestions) {
            const s = suggestions[id];

            if (!vendorGroups[s.vendor]) vendorGroups[s.vendor] = [];
            vendorGroups[s.vendor].push(s);
        }

        res.json({
            store: {
                id: store._id,
                name: store.name,
                storeNumber: store.storeNumber
            },
            replenishmentByVendor: vendorGroups,
            rawSuggestions: suggestions
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
