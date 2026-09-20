const express = require("express");
const router = express.Router();

const Store = require("../models/Store");
const Waste = require("../models/Waste");
const FinishedProduct = require("../models/FinishedProduct");

/* -------------------------------------------------------
   Waste Report for a Store (Fixed)
------------------------------------------------------- */
router.get("/:storeId", async (req, res) => {
  try {
    const { storeId } = req.params;
    const { startDate, endDate } = req.query;

    if (!storeId) return res.status(400).json({ error: "storeId is required" });

    /* -------------------------------------------------------
       Date Filtering
    ------------------------------------------------------- */
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const dateQuery =
      Object.keys(dateFilter).length > 0 ? { createdAt: dateFilter } : {};

    /* -------------------------------------------------------
       Validate Store Exists
    ------------------------------------------------------- */
    const store = await Store.findById(storeId);
    if (!store) return res.status(404).json({ error: "Store not found" });

    /* -------------------------------------------------------
       Fetch Waste Records with Deep Populate
       (Fixes N+1 Query Problem)
    ------------------------------------------------------- */
    const wasteRecords = await Waste.find({
      storeId,
      ...dateQuery,
    })
      .populate({
        path: "rawItemId",
        select: "name photoUrl",
      })
      .populate({
        path: "finishedProductId",
        select: "name photoUrl",
        populate: {
          path: "ingredients.itemId",
          select: "name photoUrl",
        },
      });

    if (!wasteRecords.length)
      return res.status(404).json({ error: "No waste records found" });

    const rawWaste = [];
    const finishedWaste = [];

    /* -------------------------------------------------------
       Build Response
    ------------------------------------------------------- */
    for (const w of wasteRecords) {
      /* -------------------------------------------------------
         RAW WASTE
      ------------------------------------------------------- */
      if (w.type === "raw") {
        const item = w.rawItemId;

        if (!item)
          return res.status(500).json({
            error: "Raw item reference missing in waste record",
          });

        rawWaste.push({
          itemId: item._id,
          name: item.name,
          quantity: w.quantity,
          reason: w.reason,
          photoUrl: item.photoUrl,
        });
      }

      /* -------------------------------------------------------
         FINISHED PRODUCT WASTE
      ------------------------------------------------------- */
      if (w.type === "finished") {
        const finished = w.finishedProductId;

        if (!finished)
          return res.status(500).json({
            error: "Finished product reference missing in waste record",
          });

        finishedWaste.push({
          finishedProductId: finished._id,
          name: finished.name,
          quantity: w.quantity,
          reason: w.reason,
          photoUrl: finished.photoUrl,
          ingredients: finished.ingredients.map((ing) => ({
            itemId: ing.itemId._id,
            name: ing.itemId.name,
            quantityUsed: ing.quantityUsed * w.quantity,
            photoUrl: ing.itemId.photoUrl,
          })),
        });
      }
    }

    /* -------------------------------------------------------
       Final Response
    ------------------------------------------------------- */
    res.json({
      store: {
        id: store._id,
        name: store.name,
        storeNumber: store.storeNumber,
      },
      rawWaste,
      finishedWaste,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
