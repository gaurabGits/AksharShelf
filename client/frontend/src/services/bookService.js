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
