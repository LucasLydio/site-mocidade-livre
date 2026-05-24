const authService = require('../services/auth.service');
const { sendSuccess, badRequest, sendError } = require('../utils/response');
const { parseJsonBody } = require('./http');

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || '').toLowerCase();

    if (method !== 'POST') {
      return badRequest(`Unsupported method: ${method}`);
    }

    const body = parseJsonBody(event.body);
    if (!body) {
      return badRequest('Invalid JSON body.');
    }

    const action = (body.action || body.mode || '').toLowerCase();

    const isLoginRoute = path.endsWith('/auth/login');
    const isRegisterRoute = path.endsWith('/auth/register');
    const isLogoutRoute = path.endsWith('/auth/logout');

    if (isLoginRoute || action === 'login') {
      const result = await authService.login({
        email: body.email,
        password: body.password
      });

      return sendSuccess(result, 'Login successful.');
    }

    if (isRegisterRoute || action === 'register') {
      const result = await authService.register({
        name: body.name,
        email: body.email,
        telephone: body.telephone ?? body.phone,
        password: body.password
      });

      return sendSuccess(result, 'Registration successful.', 201);
    }

    if (isLogoutRoute || action === 'logout') {
      return sendSuccess(null, 'Logout successful.');
    }

    return badRequest('Missing or invalid action. Use action: "login" or "register".');
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler
};
