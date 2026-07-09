import { usersRepository } from "../users/users.repository";

export const authRepository = {
  findUserByLogin(login: string) {
    return usersRepository.findByLogin(login);
  }
};

