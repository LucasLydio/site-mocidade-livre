import { authenticate } from "../../middlewares/auth.middleware";
import { rateLimit } from "../../middlewares/rate-limit.middleware";
import { validateBody } from "../../middlewares/validate.middleware";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { successResponse } from "../../utils/response";
import { usersController } from "../users/users.controller";
import { authService, clearAccessTokenCookie } from "./auth.service";
import { loginSchema, recoverPasswordSchema, registerSchema } from "./auth.schema";

export const authController = {
  async login(request: HttpRequest): Promise<HttpResponse> {
    await rateLimit(request, "auth-login");
    const input = validateBody(loginSchema, request.body);
    const result = await authService.login(input);

    return successResponse(
      { user: result.user, token: result.token },
      {
        headers: {
          "Set-Cookie": result.cookie
        }
      }
    );
  },

  async register(request: HttpRequest): Promise<HttpResponse> {
    await rateLimit(request, "auth-register");
    const input = validateBody(registerSchema, request.body);
    const result = await authService.register(input);

    return successResponse(
      { user: result.user, token: result.token },
      {
        statusCode: 201,
        headers: {
          "Set-Cookie": result.cookie
        }
      }
    );
  },

  async recoverPassword(request: HttpRequest): Promise<HttpResponse> {
    await rateLimit(request, "auth-recover-password");
    const input = validateBody(recoverPasswordSchema, request.body);
    return successResponse(await authService.recoverPassword(input));
  },

  async me(request: HttpRequest): Promise<HttpResponse> {
    const authenticated = await authenticate(request);

    return usersController.me(authenticated);
  },

  async logout(): Promise<HttpResponse> {
    return successResponse(
      { loggedOut: true },
      {
        headers: {
          "Set-Cookie": clearAccessTokenCookie
        }
      }
    );
  },

};
