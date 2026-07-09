import { requirePermission } from "../../middlewares/rbac.middleware";
import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { productsService } from "./products.service";
import { createProductImageSchema, createProductSchema, listProductsSchema, productIdParamSchema, productImageParamsSchema, updateProductImageSchema, updateProductSchema } from "./products.schema";

export const productsController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    const { page, limit, categoryId } = validateQuery(listProductsSchema, request.query);
    const result = await productsService.list(page, limit, categoryId);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(productIdParamSchema, request.params);
    const product = await productsService.getById(id);
    if (!product) throw new AppError(404, "Produto nao encontrado.");
    return successResponse(product);
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.create");
    return successResponse(await productsService.create(validateBody(createProductSchema, request.body)), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.update");
    const { id } = validateParams(productIdParamSchema, request.params);
    return successResponse(await productsService.update(id, validateBody(updateProductSchema, request.body)));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.delete");
    const { id } = validateParams(productIdParamSchema, request.params);
    await productsService.delete(id);
    return noContentResponse();
  },
  async listImages(request: HttpRequest): Promise<HttpResponse> {
    const { productId } = validateParams(productImageParamsSchema, request.params);
    return successResponse(await productsService.listImages(productId));
  },
  async createImage(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.update");
    const { productId } = validateParams(productImageParamsSchema, request.params);
    return successResponse(await productsService.createImage(productId, validateBody(createProductImageSchema, request.body)), { statusCode: 201 });
  },
  async updateImage(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.update");
    const { productId, imageId } = validateParams(productImageParamsSchema, request.params);
    const image = await productsService.updateImage(productId, imageId!, validateBody(updateProductImageSchema, request.body));
    if (!image) throw new AppError(404, "Imagem de produto nao encontrada.");
    return successResponse(image);
  },
  async deleteImage(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "products.update");
    const { productId, imageId } = validateParams(productImageParamsSchema, request.params);
    if (!(await productsService.deleteImage(productId, imageId!))) throw new AppError(404, "Imagem de produto nao encontrada.");
    return noContentResponse();
  }
};
