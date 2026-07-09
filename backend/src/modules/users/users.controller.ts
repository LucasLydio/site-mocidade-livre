import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { noContentResponse, successResponse, jsonResponse } from "../../utils/response";
import { paginationSchema } from "../../utils/pagination";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { requirePermission, requireSelfOrPermission } from "../../middlewares/rbac.middleware";
import { createUserSchema, idParamSchema, updateUserSchema } from "./users.schema";
import { usersService } from "./users.service";

export const usersController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "users.read");
    const { page, limit } = validateQuery(paginationSchema, request.query);
    const result = await usersService.list(page, limit);

    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },

  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(idParamSchema, request.params);
    requireSelfOrPermission(request, id, "users.read");
    const user = await usersService.getById(id);

    if (!user) {
      throw new AppError(404, "Usuario nao encontrado.");
    }

    return successResponse(user);
  },

  async me(request: HttpRequest): Promise<HttpResponse> {
    if (!request.user) {
      throw new AppError(401, "Voce precisa estar autenticado para continuar.");
    }

    const user = await usersService.getById(request.user.id);

    if (!user) {
      throw new AppError(404, "Usuario nao encontrado.");
    }

    return successResponse(user);
  },

  async create(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "users.create");
    const input = validateBody(createUserSchema, request.body);
    const user = await usersService.create(input);

    return successResponse(user, { statusCode: 201 });
  },

  async update(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(idParamSchema, request.params);
    requireSelfOrPermission(request, id, "users.update.me");
    const input = validateBody(updateUserSchema, request.body);

    if ((input.role || input.isActive !== undefined) && request.user?.role !== "admin") {
      throw new AppError(403, "Voce nao possui acesso para alterar papeis.");
    }

    if (input.password && request.user?.id === id && !input.currentPassword) {
      throw new AppError(400, "Informe sua senha atual para alterar a senha.");
    }

    const user = await usersService.update(id, input);

    return successResponse(user);
  },

  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "users.delete");
    const { id } = validateParams(idParamSchema, request.params);

    await usersService.delete(id);

    return noContentResponse();
  }
};
