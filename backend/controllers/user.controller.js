const userService = require('../services/user.service');
const { sendSuccess, badRequest, sendError } = require('../utils/response');
const { getPagination } = require('../utils/pagination');
const { requireAdmin, requireAuth } = require('../utils/guards');
const { parseJsonBody } = require('./http');

async function handler(event) {
  try {
    const method = event.httpMethod;
    const path = String(event.path || '').toLowerCase();
    const query = event.queryStringParameters || {};
    const id = query.id;

    if (path.endsWith('/user/me')) {
      const auth = requireAuth(event);

      if (method === 'GET') {
        const user = await userService.getMe(auth.userId);
        return sendSuccess(user, 'User fetched successfully.');
      }

      if (method === 'PATCH' || method === 'PUT') {
        const body = parseJsonBody(event.body);

        if (!body) {
          return badRequest('Invalid JSON body.');
        }

        const user = await userService.updateMe(auth.userId, body);
        return sendSuccess(user, 'User updated successfully.');
      }

      return badRequest(`Unsupported method: ${method}`);
    }

    if (method === 'GET') {
      requireAdmin(event);
      if (id) {
        const user = await userService.findUserById(id);
        return sendSuccess(user, 'User fetched successfully.');
      }

      const pagination = getPagination(query);

      const users = await userService.listUsers({
        ...pagination,
        name: query.name,
        email: query.email,
        role: query.role
      });

      return sendSuccess(users, 'Users fetched successfully.');
    }

    if (method === 'POST') {
      requireAdmin(event);
      const body = parseJsonBody(event.body);

      if (!body) {
        return badRequest('Invalid JSON body.');
      }

      const user = await userService.createUser(body);
      return sendSuccess(user, 'User created successfully.', 201);
    }

    if (method === 'PUT') {
      requireAdmin(event);
      if (!id) {
        return badRequest('User id is required in query params.');
      }

      const body = parseJsonBody(event.body);

      if (!body) {
        return badRequest('Invalid JSON body.');
      }

      const user = await userService.updateUser(id, body);
      return sendSuccess(user, 'User updated successfully.');
    }

    if (method === 'DELETE') {
      requireAdmin(event);
      if (!id) {
        return badRequest('User id is required in query params.');
      }

      const user = await userService.removeUser(id);
      return sendSuccess(user, 'User deleted successfully.');
    }

    return badRequest(`Unsupported method: ${method}`);
  } catch (error) {
    return sendError(error, error.statusCode || 500);
  }
}

module.exports = {
  handler
};
