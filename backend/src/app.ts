import { authenticate } from "./middlewares/auth.middleware";
import { rateLimit } from "./middlewares/rate-limit.middleware";
import { handleError } from "./shared/errors/error-handler";
import { AppError } from "./shared/errors/app-error";
import { createHttpRequest, sanitizePath } from "./shared/http";
import { resolveRoute } from "./routes";
import type { HttpResponse, NetlifyEvent } from "./types/http.types";
import { jsonResponse, optionsResponse, withCors } from "./utils/response";

async function dispatch(request: ReturnType<typeof createHttpRequest>): Promise<HttpResponse> {
  await rateLimit(request);
  const resolvedRoute = resolveRoute(request);

  if (!resolvedRoute) {
    throw new AppError(404, "Rota nao encontrada.");
  }

  const requestWithParams = {
    ...request,
    params: resolvedRoute.params
  };

  const routedRequest = resolvedRoute.route.protected ? await authenticate(requestWithParams) : requestWithParams;

  return resolvedRoute.route.handler(routedRequest);
}

export async function handleApi(event: NetlifyEvent): Promise<HttpResponse> {
  if (event.httpMethod.toUpperCase() === "OPTIONS") {
    return optionsResponse(event);
  }

  try {
    const request = createHttpRequest(event, sanitizePath(event.path));
    const response = await dispatch(request);

    return withCors(response, event);
  } catch (error) {
    return withCors(handleError(error), event);
  }
}


export function notFound(): HttpResponse {
  return jsonResponse({ success: false, message: "Rota nao encontrada." }, { statusCode: 404 });
}
