import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://campus-coin-backend.vercel.app";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusCoinToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getApiBaseUrl = () => BASE_URL;
export const API_MAIN_URL = BASE_URL;

export const authAPI = {
  register: async (data) => {
    const res = await api.post("/auth/register", data);
    return res.data;
  },
  login: async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    return res.data;
  },
  getProfile: async (userId) => {
    const res = await api.get(`/auth/profile/${userId}`);
    return res.data;
  },
  updateProfile: async (userId, updateData) => {
    const res = await api.put(`/auth/profile/${userId}`, updateData);
    return res.data;
  },
  getAllUsers: async () => {
    const res = await api.get("/auth/users");
    return res.data;
  },
};

export const categoryAPI = {
  getAll: async (type = "") => {
    const endpoint = type ? `/categories?type=${type}` : "/categories";
    const res = await api.get(endpoint);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/categories/${id}`);
    return res.data;
  },
  create: async ({ name, type, is_default = false }) => {
    const res = await api.post("/categories", { name, type, is_default });
    return res.data;
  },
  update: async (id, updateData) => {
    const res = await api.put(`/categories/${id}`, updateData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/categories/${id}`);
    return res.data;
  },
};

export const transactionAPI = {
  getAll: async (params = {}) => {
    const res = await api.get("/transactions", { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },
  getSummary: async (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const res = await api.get("/transactions/summary", { params });
    return res.data;
  },
  create: async (transactionData) => {
    const res = await api.post("/transactions", transactionData);
    return res.data;
  },
  update: async (id, updateData) => {
    const res = await api.put(`/transactions/${id}`, updateData);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};

export const budgetAPI = {
  getAll: async (userId = null, month = null) => {
    const params = {};
    if (userId) params.user_id = userId;
    if (month) params.month = month;
    const res = await api.get("/budgets", { params });
    return res.data;
  },
  set: async ({ user_id, category_id, month, limit_amount }) => {
    const res = await api.post("/budgets", { user_id, category_id, month, limit_amount });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/budgets/${id}`);
    return res.data;
  },
};

export const insightAPI = {
  getAll: async (userId = null, month = null) => {
    const params = {};
    if (userId) params.user_id = userId;
    if (month) params.month = month;
    const res = await api.get("/insights", { params });
    return res.data;
  },
  getLatest: async (userId = null) => {
    const params = userId ? { user_id: userId } : {};
    const res = await api.get("/insights/latest", { params });
    return res.data;
  },
  create: async ({ user_id, month, summary_text, tip_text }) => {
    const res = await api.post("/insights", { user_id, month, summary_text, tip_text });
    return res.data;
  },
};

export default api;
