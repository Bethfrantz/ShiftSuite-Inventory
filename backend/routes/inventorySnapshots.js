const express = require("express");
const router = express.Router();

const InventorySnapshot = require("../models/InventorySnapshot");
const InventoryCount = require("../models/InventoryCount");
const Usage = require("../models/Usage");
const Waste = require("../models/Waste");
const Item = require("../models/Item");

/* -------------------------------------------------------
   Helper: Throw formatted errors
------------------------------------------------------- */
const throwError = (message, statusCode = 400) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
};

/* -------------------------------------------------------
   Middleware: Attach Request ID (Step 5)
------------------------------------------------------- */
const { v4: uuid } = require("uuid");

router.use((req, res, next) => {
  req.requestId = uuid();
  res.setHeader("X-Request-ID", req.requestId);
  next();
});

/* -------------------------------------------------------
   Middleware: Logging (Step 6)
------------------------------------------------------- */
router.use((req, res, next) => {
  console.log(
    `[${req.requestId}] ${req.method} ${req.originalUrl} — Body:`,
    req.body,
  );
  next();
});

/* -------------------------------------------------------
   DAILY SNAPSHOT GENERATION
   GET /inventorySnapshots/daily?storeId=xxx&date=YYYY-MM-DD
------------------------------------------------------- */
router.get("/daily", async (req, res, next) => {
  try {
    const { storeId, date } = req.query;

    if (!storeId || !date) {
      return throwError("storeId and date are required", 400);
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);

    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    /* -------------------------------------------------------
       1. Latest counts for the day
    ------------------------------------------------------- */
    const counts = await InventoryCount.aggregate([
      {
        $match: {
          storeId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      { $sort: { timestamp: -1 } },
      {
        $group: {
          _id: "$itemId",
          latestCount: { $first: "$countedQuantity" },
        },
      },
    ]);

    /* -------------------------------------------------------
       2. Usage for the day
    ------------------------------------------------------- */
    const usages = await Usage.aggregate([
      {
        $match: {
          storeId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$itemId",
          totalUsed: { $sum: "$quantityUsed" },
        },
      },
    ]);

    /* -------------------------------------------------------
       3. Waste for the day
    ------------------------------------------------------- */
    const wastes = await Waste.aggregate([
      {
        $match: {
          storeId,
          timestamp: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: "$itemId",
          totalWaste: { $sum: "$quantity" },
        },
      },
    ]);

    /* -------------------------------------------------------
       4. Convert usage/waste to maps
    ------------------------------------------------------- */
    const usageMap = new Map(
      usages.map((u) => [u._id.toString(), u.totalUsed]),
    );

    const wasteMap = new Map(
      wastes.map((w) => [w._id.toString(), w.totalWaste]),
    );

    /* -------------------------------------------------------
       5. Load item details
    ------------------------------------------------------- */
    const itemIds = counts.map((c) => c._id);
    const items = await Item.find({ _id: { $in: itemIds } });

    const snapshotItems = items.map((item) => {
      const id = item._id.toString();
      const countDoc = counts.find((c) => c._id.toString() === id);

      const quantity = countDoc ? countDoc.latestCount : 0;
      const usage = usageMap.get(id) || 0;
      const waste = wasteMap.get(id) || 0;
      const costImpact = quantity * (item.currentPrice || 0);

      return {
        itemId: id,
        name: item.name,
        quantity,
        usageSinceLast: usage,
        wasteSinceLast: waste,
        costImpact,
      };
    });

    /* -------------------------------------------------------
       6. Save snapshot
    ------------------------------------------------------- */
    const snapshot = await InventorySnapshot.create({
      storeId,
      timestamp: end,
      items: snapshotItems,
    });

    res.json({
      requestId: req.requestId,
      snapshot,
    });
  } catch (err) {
    next(err);
  }
});

/* -------------------------------------------------------
   EXISTING CRUD ROUTES (unchanged)
------------------------------------------------------- */

// Create snapshot manually
router.post("/", async (req, res, next) => {
  try {
    const snapshot = await InventorySnapshot.create(req.body);
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

// Get all snapshots
router.get("/", async (req, res, next) => {
  try {
    const snapshots = await InventorySnapshot.find()
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    next(err);
  }
});

// Get snapshots for a store
router.get("/store/:storeId", async (req, res, next) => {
  try {
    const snapshots = await InventorySnapshot.find({
      storeId: req.params.storeId,
    }).populate("items.itemId");
    res.json(snapshots);
  } catch (err) {
    next(err);
  }
});

// Get single snapshot
router.get("/:id", async (req, res, next) => {
  try {
    const snapshot = await InventorySnapshot.findById(req.params.id)
      .populate("storeId")
      .populate("items.itemId");
    res.json(snapshot);
  } catch (err) {
    next(err);
  }
});

// Delete snapshot
router.delete("/:id", async (req, res, next) => {
  try {
    await InventorySnapshot.findByIdAndDelete(req.params.id);
    res.json({ message: "Snapshot deleted", requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
