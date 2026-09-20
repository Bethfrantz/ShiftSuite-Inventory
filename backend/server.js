const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------------------------------------------
   CORE ENTITIES
------------------------------------------------------- */
app.use("/api/items", require("./routes/items"));
app.use("/api/stores", require("./routes/stores"));
app.use("/api/vendors", require("./routes/vendors"));
app.use("/api/categories", require("./routes/categories"));

/* -------------------------------------------------------
   INVENTORY & SNAPSHOTS
------------------------------------------------------- */
app.use("/api/inventoryCounts", require("./routes/inventoryCounts"));
app.use("/api/inventorySnapshots", require("./routes/inventorySnapshots"));
app.use("/api/usage", require("./routes/snapshotUsageAudit"));
app.use("/api/shrinkage", require("./routes/shrinkage"));

/* -------------------------------------------------------
   FINISHED PRODUCTS & MENU ENGINEERING
------------------------------------------------------- */
app.use("/api/finishedProducts", require("./routes/finishedProducts"));
app.use("/api/finishedProductCost", require("./routes/finishedProductCost"));
app.use("/api/menuEngineering", require("./routes/menuEngineering"));
app.use("/api/menuProfitability", require("./routes/menuProfitability"));
app.use("/api/menuPricing", require("./routes/menuPricing"));
app.use("/api/menuOptimization", require("./routes/menuOptimization"));

/* -------------------------------------------------------
   WASTE ANALYTICS
------------------------------------------------------- */
app.use("/api/wasteReport", require("./routes/wasteReport"));
app.use("/api/wasteCost", require("./routes/wasteCost"));
app.use("/api/wasteReasons", require("./routes/wasteReasons"));

/* -------------------------------------------------------
   FORECASTING & PREP SCHEDULING
------------------------------------------------------- */
app.use("/api/storeDemandForecast", require("./routes/storeDemandForecast"));
app.use("/api/batchPrep", require("./routes/batchPrep"));
app.use("/api/batchPrepDeduction", require("./routes/batchPrepDeduction"));
app.use("/api/batchPrepScheduling", require("./routes/batchPrepScheduling"));
app.use("/api/batchPrepCalendar", require("./routes/batchPrepCalendar"));

/* -------------------------------------------------------
   ANALYTICS & DASHBOARDS
------------------------------------------------------- */
app.use("/api/usageCharts", require("./routes/usageCharts"));
app.use("/api/categoryAnalytics", require("./routes/categoryAnalytics"));
app.use("/api/vendorAnalytics", require("./routes/vendorAnalytics"));
app.use("/api/storeDashboard", require("./routes/storeDashboard")); // FIXED: only once
app.use("/api/districtDashboard", require("./routes/districtDashboard"));

/* -------------------------------------------------------
   ORDERING & AUTOMATION
------------------------------------------------------- */
app.use("/api/orders", require("./routes/orders"));
app.use("/api/vendorOrders", require("./routes/vendorOrders"));
app.use("/api/autoParReplenishment", require("./routes/autoParReplenishment"));
app.use("/api/storePricing", require("./routes/storePricing"));

/* -------------------------------------------------------
   STAFFING & GM REPORTS
------------------------------------------------------- */
app.use("/api/storeStaffing", require("./routes/storeStaffing"));
app.use("/api/gmWeeklyReport", require("./routes/gmWeeklyReport"));
app.use("/api/gmMonthlyReport", require("./routes/gmMonthlyReport"));

/* -------------------------------------------------------
   ALERTS
------------------------------------------------------- */
app.use("/api/alerts", require("./routes/alerts"));

/* -------------------------------------------------------
   middleware
------------------------------------------------------- */
const errorHandler = require("./middleware/errorHandler");
app.use(errorHandler);

/* -------------------------------------------------------
   store routes
------------------------------------------------------- */
const storeRoutes = require("./routes/storeRoutes");
app.use("/api/stores", storeRoutes);

/* -------------------------------------------------------
   DATABASE CONNECTION
------------------------------------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

/* -------------------------------------------------------
   SERVER START
------------------------------------------------------- */
app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend running on port ${process.env.PORT || 5000}`);
});
