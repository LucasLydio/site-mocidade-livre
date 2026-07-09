import { apiClient } from '../core/api.js';
import { clearSession, setSession } from '../core/session.js';

export class AuthService {
  async login({ email, password }) {
    const data = await apiClient.post('/auth/login', { email, password });
    setSession({ user: data.user });
    return data;
  }

  async register({ name, email, telephone, password }) {
    const data = await apiClient.post('/auth/register', {
      name,
      email,
      ...(telephone ? { telephone } : {}),
      password
    });
    setSession({ user: data.user });
    return data;
  }

  async me() {
    const user = await apiClient.get('/auth/me');
    setSession({ user });
    return user;
  }

  async logout() {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      clearSession();
    }
  }
}

export const authService = new AuthService();
export const login = (input) => authService.login(input);
export const register = (input) => authService.register(input);
export const logout = () => authService.logout();
export const getSession = () => authService.me();
