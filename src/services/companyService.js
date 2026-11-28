import axios from "axios";
import { API_URL as API_BASE_URL } from "../utils/apiConfig";

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const companyService = {
  getAll: async (params = {}) => {
    const response = await axios.get(`${API_BASE_URL}/companies`, { params });
    return response.data;
  },

  getMine: async () => {
    const response = await axios.get(`${API_BASE_URL}/companies/mine`, {
      headers: authHeaders(),
    });
    return response.data;
  },

  create: async (data) => {
    const response = await axios.post(`${API_BASE_URL}/companies`, data, {
      headers: authHeaders(),
    });
    return response.data;
  },

  update: async (id, data) => {
    const response = await axios.put(`${API_BASE_URL}/companies/${id}`, data, {
      headers: authHeaders(),
    });
    return response.data;
  },

  uploadMedia: async (id, type, file) => {
    const data = new FormData();
    data.append("image", file);
    const response = await axios.post(
      `${API_BASE_URL}/companies/${id}/media/${type}`,
      data,
      { headers: authHeaders() }
    );
    return response.data;
  },
};
