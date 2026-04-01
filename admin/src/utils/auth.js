// Authentication utilities

export const setAuthToken = (token) => {
  localStorage.setItem('adminToken', token);
};

export const getAuthToken = () => {
  return localStorage.getItem('adminToken');
};

export const removeAuthToken = () => {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
};

export const setUser = (user) => {
  localStorage.setItem('adminUser', JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem('adminUser');
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user && user.role === 'admin');
};

export const logout = () => {
  removeAuthToken();
  window.location.href = '/login';
};
