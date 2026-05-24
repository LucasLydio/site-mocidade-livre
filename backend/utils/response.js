function buildResponse(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  };
}

function sendSuccess(data = null, message = 'Success', statusCode = 200) {
  return buildResponse(statusCode, {
    success: true,
    message,
    data
  });
}

function badRequest(message = 'Bad request', errors = null) {
  return buildResponse(400, {
    success: false,
    message,
    code: 'VALIDATION_ERROR',
    errors
  });
}

function sendError(error, statusCode = 500) {
  const normalizedStatus = typeof statusCode === 'number' ? statusCode : 500;
  const code =
    error?.code ||
    error?.errorCode ||
    (normalizedStatus === 400
      ? 'VALIDATION_ERROR'
      : normalizedStatus === 401
        ? 'UNAUTHORIZED'
        : normalizedStatus === 403
          ? 'FORBIDDEN'
          : normalizedStatus === 404
            ? 'NOT_FOUND'
            : normalizedStatus === 409
              ? 'CONFLICT'
              : 'INTERNAL_ERROR');

  return buildResponse(statusCode, {
    success: false,
    message: error.message || 'Internal server error',
    code
  });
}

module.exports = {
  sendSuccess,
  badRequest,
  sendError
};
