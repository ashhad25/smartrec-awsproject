// services/api.js
// All HTTP calls to the SmartRec backend API.
// The Vite proxy forwards /api → http://localhost:5000

const BASE =
  "https://9nnnmm885j.execute-api.ca-central-1.amazonaws.com/prod/api";

function getToken() {
  return localStorage.getItem("smartrec_token");
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(method, path, body = null) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json", ...authHeaders() },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

// ── Auth ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),
  register: (name, email, password) =>
    request("POST", "/auth/register", { name, email, password }),
  me: () => request("GET", "/auth/me"),
  listUsers: () => request("GET", "/auth/users"),
};

// ── Products ─────────────────────────────────────────────────────
export const productsAPI = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    ).toString();
    return request("GET", `/products${qs ? `?${qs}` : ""}`);
  },
  categories: () => request("GET", "/products/categories"),
  get: (id) => request("GET", `/products/${id}`),
  create: (data) => request("POST", "/products", data),
  update: (id, data) => request("PUT", `/products/${id}`, data),
  delete: (id) => request("DELETE", `/products/${id}`),
};

// ── Recommendations ──────────────────────────────────────────────
export const recsAPI = {
  forYou: (userId, limit = 12) =>
    request("GET", `/recommendations/for-you/${userId}?limit=${limit}`),
  similar: (productId, limit = 8) =>
    request("GET", `/recommendations/similar/${productId}?limit=${limit}`),
  popular: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== null && v !== "",
      ),
    ).toString();
    return request("GET", `/recommendations/popular${qs ? `?${qs}` : ""}`);
  },
  algorithmInfo: (userId) =>
    request("GET", `/recommendations/algorithm-info/${userId}`),
};

// ── Interactions ─────────────────────────────────────────────────
export const interactionsAPI = {
  record: (productId, interactionType) =>
    request("POST", "/interactions", { productId, interactionType }),
  history: (userId) => request("GET", `/interactions/${userId}`),
  delete: (interactionId) =>
    request("DELETE", `/interactions/${interactionId}`),
  eraseAll: (userId) => request("DELETE", `/interactions/user/${userId}/all`),
};

// ── Health ────────────────────────────────────────────────────────
export const healthAPI = {
  check: () =>
    fetch(
      "https://9nnnmm885j.execute-api.ca-central-1.amazonaws.com/prod/health",
    ).then((r) => r.json()),
};
