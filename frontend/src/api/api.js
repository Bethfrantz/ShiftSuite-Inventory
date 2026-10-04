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
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.items)) {
      return [];
    }

    return data.items;
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
  getCategory: async (id) => {
    const res = await fetch(`/api/categories/${id}`);
    const { data } = await normalize(res);
    return data.category || null;
  },
  getCategories: async () => {
    const res = await fetch("/api/categories");
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.categories)) {
      return [];
    }

    return data.categories;
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
    const { ok, data } = await normalize(res);

    if (!ok || !data) {
      return {
        kpiAnomalies: [],
        kpiHistory: {},
        kpis: {},
        storeScoreTrend: {},
        storeScoreHistory: [],
        storeScoreForecast: [],
      };
    }

    return data;
  },

  /* ---------------- ALERTS ---------------- */
  getAlerts: async (storeId) => {
    const res = await fetch(`/api/alerts/${storeId}`);
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.alerts)) {
      return [];
    }

    return data.alerts;
  },

  /* ---------------- INVENTORY ---------------- */
  getInventoryItems: async (storeId) => {
    const res = await fetch(`/api/inventory/items/${storeId}`);
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.items)) {
      return [];
    }
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
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.history)) {
      return [];
    }

    return data.history;
  },

  getWasteCost: async (storeId, start, end) => {
    const res = await fetch(
      `/api/wasteCost/${storeId}?startDate=${start}&endDate=${end}`,
    );
    const { ok, data } = await normalize(res);

    if (!ok || !data || typeof data.cost !== "number") {
      return null;
    }

    return data.cost;
  },

  /* ---------------- FINISHED PRODUCTS ---------------- */
  getFinishedProducts: async () => {
    const res = await fetch("/api/finishedProducts");
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.products)) {
      return [];
    }

    return data.products;
  },

  /* ---------------- DISTRICT COMPARISON ---------------- */
  getDistrictComparison: async () => {
    const res = await fetch("/api/districtComparison");
    const { ok, data } = await normalize(res);

    if (!ok || !data || !Array.isArray(data.districts)) {
      return [];
    }

    return data.districts;
  },

  /* ---------------- MANAGER DASHBOARD ---------------- */
  getManagerDashboard: async () => {
    const res = await fetch("/api/managerDashboard");
    const { ok, data } = await normalize(res);
  },
  /* ---------------- HOME DASHBOARD ---------------- */
  getHomeDashboard: async () => {
    const res = await fetch("/api/homeDashboard");
    const { ok, data } = await normalize(res);
  },

  /* ---------------- STORE COUNT HISTORY ---------------- */
  getStoreCountHistory: async (storeId, itemId, start, end) => {
    const res = await fetch(
      `/api/storeCountHistory/${storeId}/${itemId}?start=${start}&end=${end}`,
    );
    const { ok, data } = await normalize(res);
  },
  /* ---------------- STORE INVENTORY ITEMS ---------------- */
  getStoreInventoryItems: async (storeId) => {
    const res = await fetch(`/api/storeInventoryItems/${storeId}`);
    const { ok, data } = await normalize(res);
  },

  /* ---------------- STORE FINISHED PRODUCTS ---------------- */
  getStoreFinishedProducts: async (storeId) => {
    const res = await fetch(`/api/storeFinishedProducts/${storeId}`);
    const { ok, data } = await normalize(res);
  },
};

export default API;
