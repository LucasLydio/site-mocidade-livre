import { usersRepository } from "../users/users.repository";

export const authRepository = {
  findUserByLogin(login: string) {
    return usersRepository.findByLogin(login);
  },

  updatePassword(userId: string, passwordHash: string) {
    return usersRepository.update(userId, { passwordHash });
  }
};
