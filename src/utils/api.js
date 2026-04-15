const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    signal: options.signal,
  });

  const contentType = response.headers.get("content-type") || "";
  let data = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      (data && typeof data === "object" && data.message) || "Request failed";
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
};

export const toQueryString = (params = {}) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (String(value).trim() === "") return;
    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
};

// -------- Auth ------------
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

  getMe: async (signal) => {
    return apiRequest("/auth/me", {
      method: "GET",
      signal,
    });
  },
};

// -------- Import History -----------
export const importHistoryApi = {
  list: async (filters = {}, signal) => {
    const query = toQueryString(filters);
    const response = await apiRequest(`/import-history${query}`, {
      method: "GET",
      signal,
    });

    return response?.data || { items: [], stats: {} };
  },

  getById: async (id, signal) => {
    const response = await apiRequest(`/import-history/${id}`, {
      method: "GET",
      signal,
    });

    return response?.data;
  },

  reprocess: async (id) => {
    const response = await apiRequest(`/import-history/${id}/reprocess`, {
      method: "POST",
    });

    return response?.data;
  },

  remove: async (id) => {
    const response = await apiRequest(`/import-history/${id}`, {
      method: "DELETE",
    });

    return response?.data;
  },
};

// -------- Files -----------
export const fileApi = {
  list: async (signal) => {
    const response = await apiRequest("/files", {
      method: "GET",
      signal,
    });

    return response?.data || [];
  },

  upload: async ({ file, reportType }) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("reportType", reportType);

    const response = await apiRequest("/files/upload", {
      method: "POST",
      body: formData,
    });

    return response?.data;
  },

  retry: async (id) => {
    const response = await apiRequest(`/files/${id}/retry`, {
      method: "POST",
    });

    return response?.data;
  },

  remove: async (id) => {
    const response = await apiRequest(`/files/${id}`, {
      method: "DELETE",
    });

    return response?.data;
  },
};

// -------- Users Analysis -----------
export const usersAnalysisApi = {
  list: async (filters = {}, signal) => {
    const query = toQueryString(filters);
    const response = await apiRequest(`/users-analysis${query}`, {
      method: "GET",
      signal,
    });

    return (
      response?.data || {
        items: [],
        stats: {},
      }
    );
  },

  getById: async (id, signal) => {
    const response = await apiRequest(`/users-analysis/${id}`, {
      method: "GET",
      signal,
    });

    return response?.data;
  },
};
