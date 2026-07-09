import { rolePermissions } from "../config/auth";
import { AppError } from "../shared/errors/app-error";
import type { HttpRequest } from "../types/http.types";

export function requirePermission(request: HttpRequest, permission: string): void {
  if (!request.user) {
    throw new AppError(401, "Voce precisa estar autenticado para continuar.");
  }

  const permissions = rolePermissions[request.user.role];

  if (!permissions.includes("*") && !permissions.includes(permission)) {
    throw new AppError(403, "Voce nao possui acesso para realizar esta acao.");
  }
}

export function requireSelfOrPermission(request: HttpRequest, userId: string, permission: string): void {
  if (request.user?.id === userId) {
    return;
  }

  requirePermission(request, permission);
}

