import { requirePermission } from "../../middlewares/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { eventsService } from "./events.service";
import { createEventSchema, eventIdParamSchema, listEventsSchema, updateEventSchema } from "./events.schema";

export const eventsController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    const { page, limit } = validateQuery(listEventsSchema, request.query);
    const result = await eventsService.list(page, limit);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(eventIdParamSchema, request.params);
    const event = await eventsService.getById(id);
    if (!event) throw new AppError(404, "Evento nao encontrado.");
    return successResponse(event);
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "events.create");
    if (!request.user) throw new AppError(401, "Autenticacao obrigatoria.");
    return successResponse(await eventsService.create(validateBody(createEventSchema, request.body), request.user.id), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "events.update");
    const { id } = validateParams(eventIdParamSchema, request.params);
    return successResponse(await eventsService.update(id, validateBody(updateEventSchema, request.body)));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "events.delete");
    const { id } = validateParams(eventIdParamSchema, request.params);
    await eventsService.delete(id);
    return noContentResponse();
  }
};
