import type { UserRole } from "../modules/users/users.schema";

export const rolePermissions: Record<UserRole, string[]> = {
  admin: ["*"],
  common: ["auth.me", "users.me", "users.update.me", "carts.manage.own"]
};
