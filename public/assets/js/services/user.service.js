import { apiClient } from '../core/api.js';
import { getUser, setSession } from '../core/session.js';

export class UsersService {
  getMe() {
    return apiClient.get('/users/me');
  }

  async updateMe({ name, email, telephone, currentPassword, password } = {}) {
    const current = getUser() || await this.getMe();
    const user = await apiClient.patch(`/users/${encodeURIComponent(current.id)}`, {
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(telephone !== undefined ? { telephone: telephone || null } : {}),
      ...(currentPassword !== undefined ? { currentPassword } : {}),
      ...(password !== undefined ? { password } : {})
    });
    setSession({ user });
    return user;
  }
}

export const usersService = new UsersService();
export const getMe = () => usersService.getMe();
export const updateMe = (input) => usersService.updateMe(input);
