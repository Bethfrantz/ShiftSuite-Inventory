const normalize = async (res) => {
  const data = await res.json();

  // Always return a predictable shape:
  // { ok: boolean, data: any, error: string|null }
  if (!res.ok) {
    return {
      ok: false,
      data: null,
      error: data?.message || "Unknown API error",
    };
  }

  return {
    ok: true,
    data,
    error: null,
  };
};

const API = {
  /* ---------------- ITEMS ---------------- */
  getItems: async () => {
    const res = await fetch("/api/items");
    const { data } = await normalize(res);
    return data.items || []; // ALWAYS an array
  },

  getItem: async (itemId) => {
    const res = await fetch(`/api/items/${itemId}`);
    const { data } = await normalize(res);
    return data.item || null;
  },

  lookupBarcode: async (code) => {
    const res = await fetch(`/api/items/barcode/${code}`);
    const { data } = await normalize(res);
    return data.item || null;
  },

  createItem: async (payload) => {
    const res = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { data } = await normalize(res);
    return data.item;
  },

  updateItem: async (itemId, payload) => {
    const res = await fetch(`/api/items/${itemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { data } = await normalize(res);
    return data.item;
  },

  deleteItem: async (itemId) => {
    const res = await fetch(`/api/items/${itemId}`, { method: "DELETE" });
    const { data } = await normalize(res);
    return data.message;
  },

  uploadCSV: async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/items/import-csv", {
      method: "POST",
      body: formData,
    });

    const { data } = await normalize(res);
    return data;
  },

  /* ---------------- CATEGORIES ---------------- */
  getCategories: async () => {
    const res = await fetch("/api/categories");
    const { data } = await normalize(res);
    return data.categories || [];
  },

  createCategory: async (payload) => {
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { data } = await normalize(res);
    return data.category;
  },

  updateCategory: async (id, payload) => {
    const res = await fetch(`/api/categories/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { data } = await normalize(res);
    return data.category;
  },

  deleteCategory: async (id) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    const { data } = await normalize(res);
    return data.message;
  },

  /* ---------------- STORES ---------------- */
  getStores: async () => {
    const res = await fetch("/api/stores");
    const { ok, data } = await normalize(res);

    if (!ok || !data || !data.stores) {
      return []; // ALWAYS return an array
    }

    return data.stores;
  },

  getStoreDashboard: async (storeId) => {
    const res = await fetch(`/api/storeDashboard/${storeId}`);
    const { data } = await normalize(res);
    return data; // dashboard object
  },

  /* ---------------- ALERTS ---------------- */
  getAlerts: async (storeId) => {
    const res = await fetch(`/api/alerts/${storeId}`);
    const { data } = await normalize(res);
    return data.alerts || [];
  },

  /* ---------------- INVENTORY ---------------- */
  getInventoryItems: async (storeId) => {
    const res = await fetch(`/api/inventory/items/${storeId}`);
    const { data } = await normalize(res);
    return data.items || [];
  },

  submitCounts: async (storeId, counts) => {
    const res = await fetch(`/api/inventory/counts/${storeId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ counts }),
    });
    const { data } = await normalize(res);
    return data;
  },

  getCountHistory: async (storeId, itemId, start, end) => {
    const res = await fetch(
      `/api/inventoryCounts/history/${storeId}/${itemId}?start=${start}&end=${end}`,
    );
    const { data } = await normalize(res);
    return data.history || [];
  },

  /* ---------------- REPORTS ---------------- */
  getReport: async (type, start, end) => {
    const res = await fetch(`/api/reports/${type}?start=${start}&end=${end}`);
    const { data } = await normalize(res);
    return data.report || null;
  },

  /* ---------------- WASTE ---------------- */
  submitWaste: async (payload) => {
    const res = await fetch("/api/waste", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const { data } = await normalize(res);
    return data;
  },

  getWasteHistory: async (storeId) => {
    const res = await fetch(`/api/waste/history/${storeId}`);
    const { data } = await normalize(res);
    return data.history || [];
  },

  getWasteCost: async (storeId, start, end) => {
    const res = await fetch(
      `/api/wasteCost/${storeId}?startDate=${start}&endDate=${end}`,
    );
    const { data } = await normalize(res);
    return data.cost || null;
  },

  /* ---------------- FINISHED PRODUCTS ---------------- */
  getFinishedProducts: async () => {
    const res = await fetch("/api/finishedProducts");
    const { data } = await normalize(res);
    return data.products || [];
  },

  /* ---------------- DISTRICT COMPARISON ---------------- */
  getDistrictComparison: async () => {
    const res = await fetch("/api/districtComparison");
    const { data } = await normalize(res);
    return data.districts || [];
  },
};

export default API;
