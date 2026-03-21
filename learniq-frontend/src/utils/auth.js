export const getToken = () => localStorage.getItem('token');
export const getUserRole = () => localStorage.getItem('role');
export const getUserName = () => localStorage.getItem('name');
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('name');
  window.location.href = '/login';
};