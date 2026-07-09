import type { Prisma, User } from "@prisma/client";
import { prisma } from "../../infra/prisma/prisma.client";
import { userRoleSchema, type UserRole } from "./users.schema";

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  telephone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true
} satisfies Prisma.UserSelect;

type RawPublicUser = Prisma.UserGetPayload<{ select: typeof publicUserSelect }>;

export type PublicUser = Omit<RawPublicUser, "role"> & {
  role: UserRole;
};

export type AuthUser = Omit<User, "role"> & {
  role: UserRole;
};

function toPublicUser(user: RawPublicUser): PublicUser {
  return {
    ...user,
    role: userRoleSchema.parse(user.role)
  };
}

function toAuthUser(user: User): AuthUser {
  return {
    ...user,
    role: userRoleSchema.parse(user.role)
  };
}

export type CreateUserRepositoryInput = {
  name: string;
  email: string;
  role: UserRole;
  telephone?: string;
  passwordHash: string;
};

export type UpdateUserRepositoryInput = {
  name?: string;
  email?: string;
  role?: UserRole;
  telephone?: string | null;
  isActive?: boolean;
  passwordHash?: string;
};

export const usersRepository = {
  async findPublicById(id: string): Promise<PublicUser | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: publicUserSelect
    });

    return user ? toPublicUser(user) : null;
  },

  async findByLogin(login: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { email: login } });

    return user ? toAuthUser(user) : null;
  },

  async findAuthById(id: string): Promise<AuthUser | null> {
    const user = await prisma.user.findUnique({ where: { id } });

    return user ? toAuthUser(user) : null;
  },

  async list(page: number, limit: number): Promise<{ users: PublicUser[]; total: number }> {
    const skip = (page - 1) * limit;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        select: publicUserSelect,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit
      }),
      prisma.user.count()
    ]);

    return { users: users.map(toPublicUser), total };
  },

  async create(input: CreateUserRepositoryInput): Promise<PublicUser> {
    const user = await prisma.user.create({
      data: input,
      select: publicUserSelect
    });

    return toPublicUser(user);
  },

  async update(id: string, input: UpdateUserRepositoryInput): Promise<PublicUser> {
    const user = await prisma.user.update({
      where: { id },
      data: input,
      select: publicUserSelect
    });

    return toPublicUser(user);
  },

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  },

  count(): Promise<number> {
    return prisma.user.count();
  }
};
