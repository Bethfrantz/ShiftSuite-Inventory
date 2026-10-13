import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api/api";

import InventoryCategoryList from "./InventoryCategoryList";
import InventoryItemList from "./InventoryItemList";
import InventoryItemDetail from "./InventoryItemDetail";

export default function Inventory() {
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);

  const [scanValue, setScanValue] = useState("");
  const [blindMode, setBlindMode] = useState(false);

  const itemDetailRef = useRef(null);

  /* -----------------------------------------
     LOAD USER + CATEGORIES
  ----------------------------------------- */
  useEffect(() => {
    async function loadInitial() {
      const userData = await API.getCurrentUser();
      setUser(userData);

      const categoryData = await API.getCategories();
      setCategories(categoryData);
    }
    loadInitial();
  }, []);

  /* -----------------------------------------
     LOAD ITEMS FOR CATEGORY
  ----------------------------------------- */
  async function loadItems(categoryId) {
    const itemData = await API.getItems();
    const filtered = itemData.filter((i) => i.categoryId === categoryId);
    setItems(filtered);
  }

  function handleSelectCategory(category) {
    setSelectedCategory(category);
    loadItems(category._id);
  }

  function handleSelectItem(item) {
    setSelectedItem(item);
  }

  function handleBackToCategories() {
    setSelectedCategory(null);
    setSelectedItem(null);
  }

  function handleBackToItems() {
    setSelectedItem(null);
  }

  /* -----------------------------------------
     PRINT BARCODE LIST
  ----------------------------------------- */
  function generateBarcodeList() {
    const win = window.open("", "_blank");

    win.document.write("<h1>Inventory Barcode List</h1>");

    items.forEach((item) => {
      win.document.write(`
        <div style="margin-bottom:20px;">
          <h3>${item.name}</h3>
          <img src="${item.barcodeImageUrl}" />
        </div>
      `);
    });

    win.print();
  }

  /* -----------------------------------------
     BARCODE SCANNING
  ----------------------------------------- */
  async function handleBarcodeScan(code) {
    try {
      const item = await API.lookupBarcode(code);

      if (!item) {
        alert("Barcode not found.");
        return;
      }

      // Find category
      const category = categories.find((c) => c._id === item.categoryId);

      if (category) {
        setSelectedCategory(category);
        await loadItems(category._id);
      }

      // Open item detail
      setSelectedItem(item);

      // Auto-add 1 unit if detail supports it
      setTimeout(() => {
        if (itemDetailRef.current?.addOneUnitFromScan) {
          itemDetailRef.current.addOneUnitFromScan();
        }
      }, 50);
    } catch (err) {
      console.error("Barcode scan error:", err);
    }
  }

  /* -----------------------------------------
     RENDER
  ----------------------------------------- */
  return (
    <div style={{ padding: "2rem" }}>
      <h1>Inventory</h1>

      {/* BLIND COUNT MODE TOGGLE (district/corporate only) */}
      {(user?.role === "district" || user?.role === "corporate") && (
        <button
          style={{ marginBottom: "1rem" }}
          onClick={() => setBlindMode((prev) => !prev)}
        >
          {blindMode ? "Disable Blind Count Mode" : "Enable Blind Count Mode"}
        </button>
      )}

      {/* CATEGORY VIEW */}
      {!selectedCategory && (
        <InventoryCategoryList
          categories={categories}
          onSelect={handleSelectCategory}
        />
      )}

      {/* ITEM LIST VIEW */}
      {selectedCategory && !selectedItem && (
        <>
          <InventoryItemList
            category={selectedCategory}
            items={items}
            onSelectItem={handleSelectItem}
            onBack={handleBackToCategories}
            user={user}
            blindMode={blindMode}
          />

          {/* PRINT BARCODE LIST */}
          <button
            style={{ marginTop: "2rem", padding: "0.5rem 1rem" }}
            onClick={generateBarcodeList}
          >
            Print Barcode List
          </button>

          {/* VARIANCE REPORT */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => navigate(`/inventory/variance/${user.storeId}`)}
          >
            View Inventory Variance Report
          </button>

          {/* ANOMALY REPORT */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => navigate(`/inventory/anomalies/${user.storeId}`)}
          >
            View Inventory Anomaly Report
          </button>
          {/* FORECAST REPORT */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => navigate(`/inventory/forecast/${user.storeId}`)}
          >
            View Inventory Forecast Report
          </button>
          {/* COST FORECAST REPORT */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => navigate(`/inventory/costForecast/${user.storeId}`)}
          >
            View Inventory Cost Impact Forecast
          </button>
          {/* VENDOR FORECAST REPORT */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() =>
              navigate(`/inventory/vendorForecast/${user.storeId}`)
            }
          >
            View Vendor Delivery Forecast
          </button>
          {/*Order Guide*/}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() => navigate(`/inventory/orderGuide/${user.storeId}`)}
          >
            View Order Guide
          </button>
          {/* Purchase Orders */}
          <button
            style={{ marginTop: "1rem", padding: "0.5rem 1rem" }}
            onClick={() =>
              navigate(`/inventory/purchaseOrders/${user.storeId}`)
            }
          >
            View Vendor Purchase Orders
          </button>
        </>
      )}

      {/* ITEM DETAIL VIEW */}
      {selectedItem && (
        <InventoryItemDetail
          ref={itemDetailRef}
          item={selectedItem}
          onBack={handleBackToItems}
          user={user}
          blindMode={blindMode}
        />
      )}

      {/* HIDDEN BARCODE INPUT */}
      <input
        type="text"
        value={scanValue}
        onChange={(e) => setScanValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleBarcodeScan(scanValue);
            setScanValue("");
          }
        }}
        style={{
          position: "absolute",
          opacity: 0,
          height: 0,
          width: 0,
          pointerEvents: "none",
        }}
        autoFocus
      />
    </div>
  );
}
