import crypto from "node:crypto";
import { AppError } from "../../shared/errors/app-error";
import { comparePassword, hashPassword } from "../../utils/hash";
import { signAccessToken } from "../../middlewares/auth.middleware";
import { isEmailConfigured, sendEmail } from "../../infra/smtp/email.service";
import { recoverPasswordTemplate, welcomeTemplate } from "../../infra/smtp/email.template";
import { env } from "../../config/env";
import { usersService } from "../users/users.service";
import { authRepository } from "./auth.repository";
import type { LoginInput, RecoverPasswordInput, RegisterInput } from "./auth.schema";

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

const recoverPasswordMessage = "Se este email estiver cadastrado, enviaremos uma senha temporaria em instantes.";

function generateTemporaryPassword(): string {
  return `ML-${crypto.randomBytes(10).toString("base64url")}`;
}

function publicLoginUrl(): string {
  const base = (env.FRONTEND_URL || env.APP_URL).replace(/\/+$/, "");

  try {
    return new URL("login.html", `${base}/`).toString();
  } catch {
    return `${base}/login.html`;
  }
}

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
  },

  async recoverPassword(input: RecoverPasswordInput) {
    if (!isEmailConfigured()) {
      throw new AppError(503, "Recuperacao de senha indisponivel no momento.");
    }

    const email = input.email.trim().toLowerCase();
    const user = await authRepository.findUserByLogin(email);

    if (!user || !user.isActive) {
      return { message: recoverPasswordMessage };
    }

    const temporaryPassword = generateTemporaryPassword();
    const temporaryPasswordHash = await hashPassword(temporaryPassword);
    const previousPasswordHash = user.passwordHash;

    await authRepository.updatePassword(user.id, temporaryPasswordHash);

    try {
      await sendEmail({
        to: user.email,
        subject: "Recuperacao de senha - Mocidade Livre",
        html: recoverPasswordTemplate({
          name: user.name,
          temporaryPassword,
          loginUrl: publicLoginUrl()
        }),
        text: `Ola, ${user.name}. Sua senha temporaria da Mocidade Livre e: ${temporaryPassword}. Entre e altere sua senha assim que possivel.`
      });
    } catch (error) {
      console.error("recover password email failed", error);

      try {
        await authRepository.updatePassword(user.id, previousPasswordHash);
      } catch (restoreError) {
        console.error("recover password rollback failed", restoreError);
      }

      throw new AppError(503, "Nao foi possivel enviar a senha temporaria. Tente novamente em alguns minutos.");
    }

    return { message: recoverPasswordMessage };
  }
};
