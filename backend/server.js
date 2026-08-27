const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

const itemRoutes = require("./routes/items");
app.use("/api/items", itemRoutes);

const storeRoutes = require("./routes/stores");
app.use("/api/stores", storeRoutes);

const vendorRoutes = require("./routes/vendors");
app.use("/api/vendors", vendorRoutes);

const categoryRoutes = require("./routes/categories");
app.use("/api/categories", categoryRoutes);

const inventoryCountRoutes = require("./routes/inventoryCounts");
app.use("/api/inventoryCounts", inventoryCountRoutes);

const inventorySnapshotRoutes = require("./routes/inventorySnapshots");
app.use("/api/inventorySnapshots", inventorySnapshotRoutes);

const usageRoutes = require("./routes/snapshotUsageAudit");
app.use("/api/usage", usageRoutes);

const shrinkageRoutes = require("./routes/shrinkage");
app.use("/api/shrinkage", shrinkageRoutes);

const orderRoutes = require("./routes/orders");
app.use("/api/orders", orderRoutes);

const storeDashboardRoutes = require("./routes/storeDashboard");
app.use("/api/storeDashboard", storeDashboardRoutes);

const vendorOrderRoutes = require("./routes/vendorOrders");
app.use("/api/vendorOrders", vendorOrderRoutes);

const wasteReportRoutes = require("./routes/wasteReport");
app.use("/api/wasteReport", wasteReportRoutes);

const wasteCostRoutes = require("./routes/wasteCost");
app.use("/api/wasteCost", wasteCostRoutes);

const wasteReasonsRoutes = require("./routes/wasteReasons");
app.use("/api/wasteReasons", wasteReasonsRoutes);

const finishedProductRoutes = require("./routes/finishedProducts");
app.use("/api/finishedProducts", finishedProductRoutes);

const usageChartsRoutes = require("./routes/usageCharts");
app.use("/api/usageCharts", usageChartsRoutes);

const categoryAnalyticsRoutes = require("./routes/categoryAnalytics");
app.use("/api/categoryAnalytics", categoryAnalyticsRoutes);

const menuEngineeringRoutes = require("./routes/menuEngineering");
app.use("/api/menuEngineering", menuEngineeringRoutes);

const finishedProductCostRoutes = require("./routes/finishedProductCost");
app.use("/api/finishedProductCost", finishedProductCostRoutes);

const vendorAnalyticsRoutes = require("./routes/vendorAnalytics");
app.use("/api/vendorAnalytics", vendorAnalyticsRoutes);

const menuProfitabilityRoutes = require("./routes/menuProfitability");
app.use("/api/menuProfitability", menuProfitabilityRoutes);

const menuPricingRoutes = require("./routes/menuPricing");
app.use("/api/menuPricing", menuPricingRoutes);

const batchPrepRoutes = require("./routes/batchPrep");
app.use("/api/batchPrep", batchPrepRoutes);

const menuOptimizationRoutes = require("./routes/menuOptimization");
app.use("/api/menuOptimization", menuOptimizationRoutes);

const storePricingRoutes = require("./routes/storePricing");
app.use("/api/storePricing", storePricingRoutes);

const batchPrepDeductionRoutes = require("./routes/batchPrepDeduction");
app.use("/api/batchPrepDeduction", batchPrepDeductionRoutes);

const storeDemandForecastRoutes = require("./routes/storeDemandForecast");
app.use("/api/storeDemandForecast", storeDemandForecastRoutes);

const batchPrepSchedulingRoutes = require("./routes/batchPrepScheduling");
app.use("/api/batchPrepScheduling", batchPrepSchedulingRoutes);

const autoParReplenishmentRoutes = require("./routes/autoParReplenishment");
app.use("/api/autoParReplenishment", autoParReplenishmentRoutes);

const storeStaffingRoutes = require("./routes/storeStaffing");
app.use("/api/storeStaffing", storeStaffingRoutes);

const storeDashboardRoutes = require("./routes/storeDashboard");
app.use("/api/storeDashboard", storeDashboardRoutes);

const batchPrepCalendarRoutes = require("./routes/batchPrepCalendar");
app.use("/api/batchPrepCalendar", batchPrepCalendarRoutes);

const districtDashboardRoutes = require("./routes/districtDashboard");
app.use("/api/districtDashboard", districtDashboardRoutes);

const gmWeeklyReportRoutes = require("./routes/gmWeeklyReport");
app.use("/api/gmWeeklyReport", gmWeeklyReportRoutes);

const alertRoutes = require("./routes/alerts");
app.use("/api/alerts", alertRoutes);

const gmMonthlyReportRoutes = require("./routes/gmMonthlyReport");
app.use("/api/gmMonthlyReport", gmMonthlyReportRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log("MongoDB connection error:", err));

app.listen(process.env.PORT || 5000, () => {
  console.log(`Backend running on port ${process.env.PORT || 5000}`);
});
