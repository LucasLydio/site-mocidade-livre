import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { areasService } from "./areas.service";
import { areaIdParamSchema, createAreaSchema, listAreasSchema, updateAreaSchema } from "./areas.schema";

export const areasController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    const { page, limit } = validateQuery(listAreasSchema, request.query);
    const result = await areasService.list(page, limit);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(areaIdParamSchema, request.params);
    const area = await areasService.getById(id);
    if (!area) throw new AppError(404, "Area nao encontrada.");
    return successResponse(area);
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "areas.create");
    return successResponse(await areasService.create(validateBody(createAreaSchema, request.body)), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "areas.update");
    const { id } = validateParams(areaIdParamSchema, request.params);
    return successResponse(await areasService.update(id, validateBody(updateAreaSchema, request.body)));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "areas.delete");
    const { id } = validateParams(areaIdParamSchema, request.params);
    await areasService.delete(id);
    return noContentResponse();
  }
};
