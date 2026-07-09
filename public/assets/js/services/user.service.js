import { apiClient } from '../core/api.js';
import { getUser, setSession } from '../core/session.js';

export class UsersService {
  getMe() {
    return apiClient.get('/users/me');
  }

  async updateMe({ name, telephone } = {}) {
    const current = getUser() || await this.getMe();
    const user = await apiClient.patch(`/users/${encodeURIComponent(current.id)}`, {
      ...(name !== undefined ? { name } : {}),
      ...(telephone !== undefined ? { telephone: telephone || null } : {})
    });
    setSession({ user });
    return user;
  }
}

export const usersService = new UsersService();
export const getMe = () => usersService.getMe();
export const updateMe = (input) => usersService.updateMe(input);
