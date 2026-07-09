import { AppError } from "../../shared/errors/app-error";
import { comparePassword, hashPassword } from "../../utils/hash";
import { cacheNamespaces } from "../../infra/redis/cache.namespaces";
import { invalidateCacheNamespace } from "../../infra/redis/cache.service";
import { paginationMeta } from "../../utils/pagination";
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

    return user;
  },

  async register(input: PublicRegisterInput): Promise<PublicUser> {
    return this.create({
      ...input,
      role: UserRole.common
    });
  },

  async update(id: string, input: UpdateUserInput): Promise<PublicUser> {
    let passwordHash: string | undefined;

    if (input.password) {
      if (input.currentPassword) {
        const user = await usersRepository.findAuthById(id);

        if (!user) {
          throw new AppError(404, "Usuario nao encontrado.");
        }

        const currentPasswordMatches = await comparePassword(input.currentPassword, user.passwordHash);

        if (!currentPasswordMatches) {
          throw new AppError(401, "Senha atual invalida.");
        }
      }

      passwordHash = await hashPassword(input.password);
    }

    const user = await usersRepository.update(id, {
      name: input.name?.trim(),
      email: input.email?.trim().toLowerCase(),
      role: input.role,
      telephone: input.telephone,
      isActive: input.isActive,
      passwordHash
    });

    if (input.name !== undefined) {
      await invalidateCacheNamespace(cacheNamespaces.events);
    }

    return user;
  },

  async delete(id: string): Promise<void> {
    await usersRepository.delete(id);
    await invalidateCacheNamespace(cacheNamespaces.events);
  }
};
