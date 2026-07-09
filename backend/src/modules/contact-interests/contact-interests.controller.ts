import { requirePermission } from "../../middlewares/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { contactInterestsService } from "./contact-interests.service";
import { contactInterestIdParamSchema, createContactInterestSchema, listContactInterestsSchema, updateContactInterestSchema } from "./contact-interests.schema";

export const contactInterestsController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "contact-interests.read");
    const { page, limit, status } = validateQuery(listContactInterestsSchema, request.query);
    const result = await contactInterestsService.list(page, limit, status);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "contact-interests.read");
    const { id } = validateParams(contactInterestIdParamSchema, request.params);
    const contact = await contactInterestsService.getById(id);
    if (!contact) throw new AppError(404, "Interesse de contato nao encontrado.");
    return successResponse(contact);
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    return successResponse(await contactInterestsService.create(validateBody(createContactInterestSchema, request.body)), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "contact-interests.update");
    const { id } = validateParams(contactInterestIdParamSchema, request.params);
    const { status } = validateBody(updateContactInterestSchema, request.body);
    return successResponse(await contactInterestsService.updateStatus(id, status));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "contact-interests.delete");
    const { id } = validateParams(contactInterestIdParamSchema, request.params);
    await contactInterestsService.delete(id);
    return noContentResponse();
  }
};
