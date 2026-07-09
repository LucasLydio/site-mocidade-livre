import { validateBody, validateParams, validateQuery } from "../../middlewares/validate.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { jsonResponse, noContentResponse, successResponse } from "../../utils/response";
import { cartsService } from "./carts.service";
import { cartIdParamSchema, cartItemParamsSchema, createCartItemSchema, createCartSchema, listCartsSchema, updateCartItemSchema, updateCartSchema } from "./carts.schema";

function userFrom(request: HttpRequest) {
  if (!request.user) throw new AppError(401, "Voce precisa estar autenticado para continuar.");
  return request.user;
}

export const cartsController = {
  async list(request: HttpRequest): Promise<HttpResponse> {
    const { page, limit, status } = validateQuery(listCartsSchema, request.query);
    const result = await cartsService.list(page, limit, userFrom(request), status);
    return jsonResponse({ success: true, data: result.data, pagination: result.pagination });
  },
  async get(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(cartIdParamSchema, request.params);
    return successResponse(await cartsService.getById(id, userFrom(request)));
  },
  async create(request: HttpRequest): Promise<HttpResponse> {
    const user = userFrom(request);
    return successResponse(await cartsService.create(user.id, validateBody(createCartSchema, request.body)), { statusCode: 201 });
  },
  async update(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(cartIdParamSchema, request.params);
    return successResponse(await cartsService.update(id, validateBody(updateCartSchema, request.body), userFrom(request)));
  },
  async delete(request: HttpRequest): Promise<HttpResponse> {
    const { id } = validateParams(cartIdParamSchema, request.params);
    await cartsService.delete(id, userFrom(request));
    return noContentResponse();
  },
  async addItem(request: HttpRequest): Promise<HttpResponse> {
    const { cartId } = validateParams(cartItemParamsSchema, request.params);
    const input = validateBody(createCartItemSchema, request.body);
    return successResponse(await cartsService.addItem(cartId, input.productId, input.quantity, userFrom(request)), { statusCode: 201 });
  },
  async updateItem(request: HttpRequest): Promise<HttpResponse> {
    const { cartId, itemId } = validateParams(cartItemParamsSchema, request.params);
    const { quantity } = validateBody(updateCartItemSchema, request.body);
    return successResponse(await cartsService.updateItem(cartId, itemId!, quantity, userFrom(request)));
  },
  async deleteItem(request: HttpRequest): Promise<HttpResponse> {
    const { cartId, itemId } = validateParams(cartItemParamsSchema, request.params);
    await cartsService.deleteItem(cartId, itemId!, userFrom(request));
    return noContentResponse();
  }
};
