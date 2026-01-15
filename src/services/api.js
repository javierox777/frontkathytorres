// src/services/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://backkathitorres-production.up.railway.app/api",
  withCredentials: false,
});

const TOKEN_KEY = "token";

export function attachToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

export function saveTokenToStorage(token) {
  // Guardar el token como string plano (sin JSON.stringify)
  // para ser consistente con AuthContext (lee/escribe string).
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  attachToken(token);
}

(() => {
  try {
    let t = localStorage.getItem(TOKEN_KEY);
    // Compatibilidad con versiones anteriores que guardaron el token como JSON string
    // (ej: "\"eyJ...\""), lo normalizamos.
    if (t && t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
    if (t) attachToken(t);
  } catch (e) {
    console.error(e);
    // ignore
  }
})();

// ================= Endpoints existentes =================
export const getMe = () => api.get("/auth/me");
export const uploadMySignature = (file) => {
  const fd = new FormData();
  fd.append("signature", file);
  return api.post("/users/me/signature", fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// ================= Nuevo sistema (Reports) =================
export const createReport = async (payload) => {
  const res = await api.post("/reports", payload);
  return res.data;
};

export const listReports = (params) => api.get("/reports", { params });
export const getReport = (id) => api.get(`/reports/${id}`);
export const signReport = (id, payload) => api.post(`/reports/${id}/sign`, payload);
export const generateReportPdf = (id) => api.get(`/reports/${id}/pdf`);

// ================= Legacy (WorkOrders) =================
export const signWorkOrder = (id, payload) => api.post(`/workorders/${id}/sign`, payload);
export const generateWorkOrderPdf = (id, type) => api.get(`/workorders/${id}/pdf`, { params: { type } });
export const createWorkOrder = async (payload) => {
  const res = await api.post("/workorders", payload);
  return res.data;
};
