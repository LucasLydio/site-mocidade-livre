import { AppError } from "../../shared/errors/app-error";
import { comparePassword } from "../../utils/hash";
import { signAccessToken } from "../../middlewares/auth.middleware";
import { sendEmail } from "../../infra/smtp/email.service";
import { welcomeTemplate } from "../../infra/smtp/email.template";
import { usersService } from "../users/users.service";
import { authRepository } from "./auth.repository";
import type { LoginInput, RegisterInput } from "./auth.schema";

function accessTokenCookie(token: string): string {
  return [
    `pg_access_token=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=604800"
  ].join("; ");
}

export const clearAccessTokenCookie = "pg_access_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0";

export const authService = {
  async login(input: LoginInput) {
    const login = (input.email ?? input.login ?? "").toLowerCase();
    const user = await authRepository.findUserByLogin(login);

    if (!user || !user.isActive) {
      throw new AppError(401, "Credenciais invalidas.");
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError(401, "Credenciais invalidas.");
    }

    const publicUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      telephone: user.telephone,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    return {
      user: publicUser,
      token,
      cookie: accessTokenCookie(token)
    };
  },

  async register(input: RegisterInput) {
    const user = await usersService.register(input);
    const token = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role
    });

    sendEmail({
      to: user.email,
      subject: "Bem-vindo a Mocidade Livre",
      html: welcomeTemplate(user.name)
    }).catch((error: unknown) => console.error("welcome email failed", error));

    return {
      user,
      token,
      cookie: accessTokenCookie(token)
    };
  }
};
