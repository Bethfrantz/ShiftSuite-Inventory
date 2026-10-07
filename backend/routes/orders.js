const express = require("express");
const router = express.Router();
const Item = require("../models/Item");
const InventoryCount = require("../models/InventoryCount");
const Order = require("../models/Order");

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

// Generate order for a store
router.post("/:storeId", async (req, res, next) => {
  try {
    const { storeId } = req.params;

    // Get all items
    const items = await Item.find().populate({
      path: "categoryId",
      select: "name photoUrl color",
    });
    if (!items.length) throwError("No items found", 404);

    // Get inventory counts for this store
    const counts = await InventoryCount.find({ storeId });
    if (!counts.length)
      throwError("No inventory counts found for this store", 404);

    const orderItems = items.map((item) => {
      // Find par level for this store
      const parEntry = item.parLevels.find(
        (p) => p.storeId?.toString() === storeId,
      );
      if (!parEntry) throwError(`Par level missing for item ${item.name}`, 404);

      const par = parEntry ? parEntry.par : 0;

      // Find current count
      const countEntry = counts.find(
        (c) => c.itemId.toString() === item._id.toString(),
      );
      const currentQuantity = countEntry ? countEntry.quantity : 0;

      // Calculate order quantity
      const orderQuantity = Math.max(par - currentQuantity, 0);

      return {
        itemId: item._id,
        vendor: item.vendor,
        par,
        currentQuantity,
        orderQuantity,
      };
    });

    // Save order
    const order = await Order.create({
      storeId,
      items: orderItems,
      notes: req.body.notes || "",
    });

    res.json({ order, requestId: req.requestId });
  } catch (err) {
    next(err);
  }
});
/* -------------------------------------------------------
   ORDERS REPORT
   GET /orders/report?storeId=xxx&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
------------------------------------------------------- */
router.get("/report", async (req, res, next) => {
  try {
    const { storeId, startDate, endDate } = req.query;

    if (!storeId) throwError("storeId is required", 400);

    // Default: last 30 days
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const end = endDate ? new Date(endDate) : new Date();

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    /* -------------------------------------------------------
       1. Pull orders for store + date range
    ------------------------------------------------------- */
    const orders = await Order.find({
      storeId,
      timestamp: { $gte: start, $lte: end },
    }).populate("items.itemId");

    if (!orders.length) {
      return res.json({
        requestId: req.requestId,
        storeId,
        startDate: start,
        endDate: end,
        vendors: [],
        items: [],
        totals: {
          totalOrders: 0,
          totalCost: 0,
        },
      });
    }

    /* -------------------------------------------------------
       2. Group orders by vendor
    ------------------------------------------------------- */
    const vendorMap = new Map();

    for (const order of orders) {
      const vendorName = order.items.length
        ? order.items[0].itemId.vendor
        : "Unknown Vendor";

      if (!vendorMap.has(vendorName)) {
        vendorMap.set(vendorName, {
          vendorName,
          totalCost: 0,
          totalItems: 0,
          orders: [],
        });
      }

      const vendorEntry = vendorMap.get(vendorName);

      let orderCost = 0;
      let orderItems = 0;

      for (const item of order.items) {
        const lineCost = item.price * item.quantity;
        orderCost += lineCost;
        orderItems += item.quantity;
      }

      vendorEntry.totalCost += orderCost;
      vendorEntry.totalItems += orderItems;

      vendorEntry.orders.push({
        orderId: order._id,
        timestamp: order.timestamp,
        items: order.items.map((i) => ({
          itemId: i.itemId._id,
          name: i.itemId.name,
          quantity: i.quantity,
          price: i.price,
          lineCost: i.price * i.quantity,
        })),
        orderCost,
      });
    }

    const vendorSummary = Array.from(vendorMap.values());

    /* -------------------------------------------------------
       3. Group orders by item
    ------------------------------------------------------- */
    const itemMap = new Map();

    for (const order of orders) {
      for (const item of order.items) {
        const id = item.itemId._id.toString();
        const price = item.price;

        if (!itemMap.has(id)) {
          itemMap.set(id, {
            itemId: id,
            name: item.itemId.name,
            vendor: item.itemId.vendor,
            quantityOrdered: 0,
            totalCost: 0,
          });
        }

        const entry = itemMap.get(id);
        entry.quantityOrdered += item.quantity;
        entry.totalCost += item.quantity * price;
      }
    }

    const itemSummary = Array.from(itemMap.values());

    /* -------------------------------------------------------
       4. Totals
    ------------------------------------------------------- */
    const totalOrders = orders.length;
    const totalCost = vendorSummary.reduce((sum, v) => sum + v.totalCost, 0);

    /* -------------------------------------------------------
       5. Final response
    ------------------------------------------------------- */
    res.json({
      requestId: req.requestId,
      storeId,
      startDate: start,
      endDate: end,
      vendors: vendorSummary,
      items: itemSummary,
      totals: {
        totalOrders,
        totalCost,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
