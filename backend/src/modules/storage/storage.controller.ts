import { requirePermission } from "../../middlewares/rbac.middleware";
import { AppError } from "../../shared/errors/app-error";
import type { HttpRequest, HttpResponse } from "../../types/http.types";
import { successResponse } from "../../utils/response";
import { parseMultipartFormData, storageService } from "./storage.service";
import { uploadFolderSchema } from "./storage.schema";

export const storageController = {
  async uploadImage(request: HttpRequest): Promise<HttpResponse> {
    requirePermission(request, "storage.upload");

    const form = parseMultipartFormData(request.headers, request.rawBody);
    const file = form.files.find((item) => item.fieldName === "file") ?? form.files[0];

    if (!file) {
      throw new AppError(400, "Selecione uma imagem para enviar.");
    }

    const folder = uploadFolderSchema.parse(form.fields.folder || "general");
    const uploaded = await storageService.uploadImage({ folder, file });

    return successResponse(uploaded, { statusCode: 201 });
  }
};
