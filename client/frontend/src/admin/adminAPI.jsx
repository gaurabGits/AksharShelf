import axios from "axios";

const BASE_URL = "http://localhost:3000/api/admin";

const authHeaders = () => {
  const token = localStorage.getItem("adminToken");
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const adminLogin = (data) => axios.post(`${BASE_URL}/login`, data);

export const getDashboardStats = () => axios.get(`${BASE_URL}/dashboard`, authHeaders());

export const fetchAllUsers = () => axios.get(`${BASE_URL}/users`, authHeaders());
export const deleteUser = (id) => axios.delete(`${BASE_URL}/users/${id}`, authHeaders());
export const toggleBlockUser = (id) => axios.put(`${BASE_URL}/users/${id}/block`, {}, authHeaders());

export const fetchAllBooks = () => axios.get(`${BASE_URL}/books`, authHeaders());
export const addBook = (data) => axios.post(`${BASE_URL}/books`, data, authHeaders());
export const editBook = (id, data) => axios.put(`${BASE_URL}/books/${id}`, data, authHeaders());
export const deleteBook = (id) => axios.delete(`${BASE_URL}/books/${id}`, authHeaders());

export const fetchAllReviews = () => axios.get(`${BASE_URL}/reviews`, authHeaders());
export const deleteReviewById = (id) => axios.delete(`${BASE_URL}/reviews/${id}`, authHeaders());

export const fetchPaymentOrders = (params = {}) =>
  axios.get(`${BASE_URL}/payments/orders`, { ...authHeaders(), params });

export const fetchPurchases = (params = {}) =>
  axios.get(`${BASE_URL}/payments/purchases`, { ...authHeaders(), params });

export const grantPurchaseAccess = (data) =>
  axios.post(`${BASE_URL}/payments/purchases/grant`, data, authHeaders());

export const updatePurchaseAccess = (id, data) =>
  axios.put(`${BASE_URL}/payments/purchases/${id}`, data, authHeaders());

// Notifications
export const sendAdminNotification = (data) =>
  axios.post(`${BASE_URL}/notifications`, data, authHeaders());

export const fetchSentNotifications = (params = {}) =>
  axios.get(`${BASE_URL}/notifications/sent`, { ...authHeaders(), params });
