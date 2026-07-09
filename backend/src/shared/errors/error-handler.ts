import { ZodError } from "zod";
import { jsonResponse } from "../../utils/response";
import type { HttpResponse } from "../../types/http.types";
import { AppError } from "./app-error";
import { errorMessages } from "./error-messages";
import { mapPrismaError } from "./prisma-error";

export function handleError(error: unknown): HttpResponse {
  if (error instanceof AppError) {
    return jsonResponse({ success: false, message: error.message }, { statusCode: error.statusCode });
  }

  if (error instanceof ZodError) {
    return jsonResponse(
      {
        success: false,
        message: errorMessages[400],
        issues: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }))
      },
      { statusCode: 400 }
    );
  }

  const prismaError = mapPrismaError(error);

  if (prismaError) {
    console.error(error);

    return jsonResponse(
      {
        success: false,
        message: prismaError.message
      },
      { statusCode: prismaError.statusCode }
    );
  }

  console.error(error);

  return jsonResponse({ success: false, message: errorMessages[500] }, { statusCode: 500 });
}
