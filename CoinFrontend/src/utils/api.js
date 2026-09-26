import axios from "axios";

/**
 * Automatically determine the main API base URL:
 * 1. Environment variable VITE_API_URL or VITE_API_BASE_URL (used in deployment)
 * 2. If running on deployed domain (non-localhost), automatically use origin /api
 * 3. Fallback to local development server: http://localhost:5000/api
 */
export const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (
    typeof window !== "undefined" &&
    window.location.hostname !== "localhost" &&
    window.location.hostname !== "127.0.0.1"
  ) {
    return `${window.location.origin}/api`;
  }
  return "http://localhost:5000/api";
};

export const API_MAIN_URL = getApiBaseUrl();

// Axios instance configured with auto-detected base URL
const api = axios.create({
  baseURL: API_MAIN_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to automatically attach JWT token if present
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("campusCoinToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn("Could not read auth token from storage:", e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─────────────────────────────────────────────────────────────
// 1. AUTH ENDPOINTS (STATIC)
// ─────────────────────────────────────────────────────────────
export const authAPI = {
  /** Register student */
  register: async (data) => {
    try {
      const response = await api.post("/auth/register", data);
      return response.data;
    } catch (error) {
      console.error("authAPI.register error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Login student */
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return response.data;
    } catch (error) {
      console.error("authAPI.login error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get profile by userId */
  getProfile: async (userId) => {
    try {
      const response = await api.get(`/auth/profile/${userId}`);
      return response.data;
    } catch (error) {
      console.error("authAPI.getProfile error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Update profile */
  updateProfile: async (userId, updateData) => {
    try {
      const response = await api.put(`/auth/profile/${userId}`, updateData);
      return response.data;
    } catch (error) {
      console.error("authAPI.updateProfile error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get all users */
  getAllUsers: async () => {
    try {
      const response = await api.get("/auth/users");
      return response.data;
    } catch (error) {
      console.error("authAPI.getAllUsers error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 2. CATEGORY ENDPOINTS (STATIC)
// ─────────────────────────────────────────────────────────────
export const categoryAPI = {
  /** Get all categories, optionally filtered by ?type=income or ?type=expense */
  getAll: async (type = "") => {
    try {
      const endpoint = type ? `/categories?type=${type}` : "/categories";
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error("categoryAPI.getAll error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get category by ID */
  getById: async (id) => {
    try {
      const response = await api.get(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error("categoryAPI.getById error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Create category */
  create: async ({ name, type, is_default = false }) => {
    try {
      const response = await api.post("/categories", { name, type, is_default });
      return response.data;
    } catch (error) {
      console.error("categoryAPI.create error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Update category (toggle default, rename) */
  update: async (id, updateData) => {
    try {
      const response = await api.put(`/categories/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("categoryAPI.update error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Delete category permanently from DB */
  delete: async (id) => {
    try {
      const response = await api.delete(`/categories/${id}`);
      return response.data;
    } catch (error) {
      console.error("categoryAPI.delete error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 3. TRANSACTION ENDPOINTS (STATIC)
// ─────────────────────────────────────────────────────────────
export const transactionAPI = {
  /** Get transactions with optional filters */
  getAll: async (params = {}) => {
    try {
      const response = await api.get("/transactions", { params });
      return response.data;
    } catch (error) {
      console.error("transactionAPI.getAll error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get single transaction by ID */
  getById: async (id) => {
    try {
      const response = await api.get(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error("transactionAPI.getById error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get financial totals: totalIncome, totalExpense, balance */
  getSummary: async (userId = null) => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get("/transactions/summary", { params });
      return response.data;
    } catch (error) {
      console.error("transactionAPI.getSummary error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Create transaction (income or expense) */
  create: async (transactionData) => {
    try {
      const response = await api.post("/transactions", transactionData);
      return response.data;
    } catch (error) {
      console.error("transactionAPI.create error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Update transaction */
  update: async (id, updateData) => {
    try {
      const response = await api.put(`/transactions/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error("transactionAPI.update error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Delete transaction */
  delete: async (id) => {
    try {
      const response = await api.delete(`/transactions/${id}`);
      return response.data;
    } catch (error) {
      console.error("transactionAPI.delete error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 4. BUDGET ENDPOINTS (STATIC)
// ─────────────────────────────────────────────────────────────
export const budgetAPI = {
  /** Get all budgets by user and month */
  getAll: async (userId = null, month = null) => {
    try {
      const params = {};
      if (userId) params.user_id = userId;
      if (month) params.month = month;
      const response = await api.get("/budgets", { params });
      return response.data;
    } catch (error) {
      console.error("budgetAPI.getAll error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Set or update budget cap */
  set: async ({ user_id, category_id, month, limit_amount }) => {
    try {
      const response = await api.post("/budgets", {
        user_id,
        category_id,
        month,
        limit_amount,
      });
      return response.data;
    } catch (error) {
      console.error("budgetAPI.set error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Delete budget cap */
  delete: async (id) => {
    try {
      const response = await api.delete(`/budgets/${id}`);
      return response.data;
    } catch (error) {
      console.error("budgetAPI.delete error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

// ─────────────────────────────────────────────────────────────
// 5. INSIGHT ENDPOINTS (STATIC)
// ─────────────────────────────────────────────────────────────
export const insightAPI = {
  /** Get all insights */
  getAll: async (userId = null, month = null) => {
    try {
      const params = {};
      if (userId) params.user_id = userId;
      if (month) params.month = month;
      const response = await api.get("/insights", { params });
      return response.data;
    } catch (error) {
      console.error("insightAPI.getAll error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Get latest insight */
  getLatest: async (userId = null) => {
    try {
      const params = userId ? { user_id: userId } : {};
      const response = await api.get("/insights/latest", { params });
      return response.data;
    } catch (error) {
      console.error("insightAPI.getLatest error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },

  /** Create new insight */
  create: async ({ user_id, month, summary_text, tip_text }) => {
    try {
      const response = await api.post("/insights", {
        user_id,
        month,
        summary_text,
        tip_text,
      });
      return response.data;
    } catch (error) {
      console.error("insightAPI.create error:", error.response?.data || error.message);
      throw error.response?.data || error;
    }
  },
};

export default api;
