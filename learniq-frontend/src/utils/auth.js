export const setSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};

export const getToken = () => localStorage.getItem('token');

export const getUser = () => {
  const userString = localStorage.getItem('user');
  if (!userString) return null;
  try {
    return JSON.parse(userString);
  } catch (e) {
    return null;
  }
};

export const getUserRole = () => getUser()?.role || localStorage.getItem('role');
export const getUserName = () => getUser()?.name || localStorage.getItem('name');

export const logout = () => {
  localStorage.clear();
  window.location.href = '/login';
};