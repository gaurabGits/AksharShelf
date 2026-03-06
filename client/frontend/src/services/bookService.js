import api from './api';

export const fetchBookDetail = (id) => {
  return api.get(`/books/${id}`);
};