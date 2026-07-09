import type { UserRole } from "../modules/users/users.schema";

export type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
};
