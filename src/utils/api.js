const API_BASE_URL = "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const authApi = {
  register: async ({ name, email, password }) => {
    return apiRequest("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
  },

  login: async ({ email, password }) => {
    return apiRequest("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  getMe: async () => {
    return apiRequest("/auth/me", {
      method: "GET",
    });
  },
};
