import { create } from 'zustand';

const parseJwt = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch (e) {
    return null;
  }
};

const getInitialState = () => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    const payload = parseJwt(token);
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      return {
        isAuthenticated: true,
        token: token,
        user: {
          email: payload.sub,
          role: payload.role || null,
          permissions: payload.permissions || []
        }
      };
    } else {
      localStorage.removeItem('admin_token');
    }
  }
  return { isAuthenticated: false, token: null, user: null };
};

const useAuthStore = create((set) => ({
  ...getInitialState(),
  
  login: (token) => {
    localStorage.setItem('admin_token', token);
    const payload = parseJwt(token);
    set({
      isAuthenticated: true,
      token,
      user: {
        email: payload?.sub,
        role: payload?.role || null,
        permissions: payload?.permissions || []
      }
    });
  },
  
  logout: () => {
    localStorage.removeItem('admin_token');
    set({ isAuthenticated: false, token: null, user: null });
  }
}));

export default useAuthStore;
