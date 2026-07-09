import { hashPassword } from "../../utils/hash";
import { paginationMeta } from "../../utils/pagination";
import { deleteCache } from "../../infra/redis/cache.service";
import {
  UserRole,
  type CreateUserInput,
  type PublicRegisterInput,
  type UpdateUserInput
} from "./users.schema";
import { usersRepository, type PublicUser } from "./users.repository";

export const usersService = {
  async list(page: number, limit: number) {
    const { users, total } = await usersRepository.list(page, limit);

    return {
      data: users,
      pagination: paginationMeta(page, limit, total)
    };
  },

  getById(id: string): Promise<PublicUser | null> {
    return usersRepository.findPublicById(id);
  },

  async create(input: CreateUserInput): Promise<PublicUser> {
    const passwordHash = await hashPassword(input.password);

    const user = await usersRepository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      telephone: input.telephone,
      passwordHash
    });

    await deleteCache("users:list");

    return user;
  },

  async register(input: PublicRegisterInput): Promise<PublicUser> {
    return this.create({
      ...input,
      role: UserRole.common
    });
  },

  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const passwordHash = input.password ? await hashPassword(input.password) : undefined;

    const user = await usersRepository.update(id, {
      name: input.name?.trim(),
      email: input.email?.trim().toLowerCase(),
      role: input.role,
      telephone: input.telephone,
      isActive: input.isActive,
      passwordHash
    });

    await deleteCache("users:list");

    return user;
  },

  async delete(id: string): Promise<void> {
    await usersRepository.delete(id);
    await deleteCache("users:list");
  }
};
