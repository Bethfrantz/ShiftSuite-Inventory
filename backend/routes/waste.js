router.post("/", async (req, res) => {
  try {
    const { storeId, type, rawItemId, finishedProductId, quantity, reason } =
      req.body;

    // Save waste record
    const waste = await Waste.create({
      storeId,
      type,
      rawItemId,
      finishedProductId,
      quantity,
      reason,
    });

    // RAW WASTE
    if (type === "raw") {
      await InventoryCount.updateOne(
        { storeId, itemId: rawItemId },
        { $inc: { quantity: -quantity } },
      );
    }

    // FINISHED PRODUCT WASTE
    if (type === "finished") {
      const finished = await FinishedProduct.findById(finishedProductId);

      for (const ingredient of finished.ingredients) {
        await InventoryCount.updateOne(
          { storeId, itemId: ingredient.itemId },
          { $inc: { quantity: -(ingredient.quantityUsed * quantity) } },
        );
      }
    }

    res.json(waste);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
