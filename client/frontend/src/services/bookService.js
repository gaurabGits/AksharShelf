import api from './api';

export const fetchBookDetail = (id) => {
  return api.get(`/books/${id}`);
};

export const addBookBookmark = (id) => {
  return api.post(`/books/${id}/bookmark`);
};

export const fetchBookmarkedBooks = () => {
  return api.get('/books/bookmarks');
};

export const fetchBookRecommendations = (id, { limit } = {}) => {
  const params = {};
  if (Number.isFinite(Number(limit)) && Number(limit) > 0) params.limit = Number(limit);
  return api.get(`/books/${id}/recommendations`, { params });
};

export const fetchBookCollaborativeRecommendations = (id, { limit } = {}) => {
  const params = {};
  if (Number.isFinite(Number(limit)) && Number(limit) > 0) params.limit = Number(limit);
  return api.get(`/books/${id}/recommendations/collaborative`, { params });
};
