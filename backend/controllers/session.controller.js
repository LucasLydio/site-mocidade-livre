const userService = require("../services/user.service");
const { sendError, sendSuccess, badRequest } = require("../utils/response");
const { requireAuth } = require("../utils/guards");

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || "").toLowerCase();

    if (method !== "GET") {
      return badRequest(`Unsupported method: ${method}`);
    }

    if (!path.endsWith("/session/me")) {
      return badRequest("Unsupported route.");
    }

    const auth = requireAuth(event);
    const user = await userService.getMe(auth.userId);

    return sendSuccess(user, "Session fetched successfully.");
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler,
};

