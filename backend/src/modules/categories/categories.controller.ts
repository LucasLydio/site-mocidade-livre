import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { requirePermission } from "../../middlewares/rbac.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { categoriesService } from "./categories.service";
import { categoryIdParamSchema, createCategorySchema, listCategoriesSchema, updateCategorySchema } from "./categories.schema";

export const categoriesController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    const { page, limit } = validateQuery(listCategoriesSchema, request.query);
    const result = await categoriesService.list(page, limit);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(categoryIdParamSchema, request.params);
    const category = await categoriesService.getById(id);
    if (!category) throw new AppError(404, "Categoria nao encontrada.");
    return successResponse(category);
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "categories.create");
    return successResponse(await categoriesService.create(validateBody(createCategorySchema, request.body)), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "categories.update");
    const { id } = validateParams(categoryIdParamSchema, request.params);
    return successResponse(await categoriesService.update(id, validateBody(updateCategorySchema, request.body)));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "categories.delete");
    const { id } = validateParams(categoryIdParamSchema, request.params);
    await categoriesService.delete(id);
    return noContentResponse();
  }
};
