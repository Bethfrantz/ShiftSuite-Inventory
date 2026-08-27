const API = {
  getItems: async () => {
    const res = await fetch("/api/items");
    return res.json();
  },

  getInventoryItems: async (storeId) => {
    const res = await fetch(`/api/inventory/items/${storeId}`);
    return res.json();
  },

  submitCounts: async (storeId, counts) => {
    const res = await fetch(`/api/inventory/counts/${storeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counts }),
    });
    return res.json();
  },

  lookupBarcode: async (code) => {
    const res = await fetch(`/api/items/barcode/${code}`);
    return res.json();
  },
  updateItem: async (itemId, data) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  createItem: async (data) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
  deleteItem: async (itemId) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "DELETE",
    });
    return res.json();
  },
  getCategories: async () => {
    const res = await fetch("/api/categories");
    return res.json();
  },

  createCategory: async (data) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateCategory: async (id, data) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteCategory: async (id) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "DELETE",
    });
    return res.json();
  },
  getItem: async (itemId) => {
    const res = await fetch(`/api/items/${itemId}`);
    return res.json();
  },
  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/items/import-csv", {
      method: "POST",
      body: formData,
    });

    return res.json();
  },
  getReport: async (type, start, end) => {
    const res = await fetch(`/api/reports/${type}?start=${start}&end=${end}`);
    return res.json();
  },
  getCountHistory: async (storeId, itemId, start, end) => {
    const res = await fetch(
      `/api/inventoryCounts/history/${storeId}/${itemId}?start=${start}&end=${end}`,
    );
    return res.json();
  },
  getStoreDashboard: async (storeId) => {
    const res = await fetch(`/api/storeDashboard/${storeId}`);
    return res.json();
  },
  getStoreDashboard: async (storeId) => {
    const res = await fetch(`/api/storeDashboard/${storeId}`);
    return res.json();
  },
  submitWaste: async (data) => {
    const res = await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getWasteHistory: async (storeId) => {
    const res = await fetch(`/api/waste/history/${storeId}`);
    return res.json();
  },

  getFinishedProducts: async () => {
    const res = await fetch("/api/finishedProducts");
    return res.json();
  },
  getDistrictComparison: async () => {
    const res = await fetch("/api/districtComparison");
    return res.json();
  },
  getAlerts: async (storeId) => {
    const res = await fetch(`/api/alerts/${storeId}`);
    return res.json();
  },
  getWasteCost: async (storeId, start, end) => {
    const res = await fetch(
      `/api/wasteCost/${storeId}?startDate=${start}&endDate=${end}`,
    );
    return res.json();
  },
};

export default API;
