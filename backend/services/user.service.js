const userRepository = require("../repositories/user.repository");
const { hashPassword } = require("../utils/hash");
const { buildPagination } = require("../utils/pagination");
const { normalizeEmail, validateUpdateProfilePayload } = require("../utils/validators");

const ALLOWED_ROLES = ["admin", "common"];

function validateRole(role) {
  if (!ALLOWED_ROLES.includes(role)) {
    const error = new Error("Invalid role. Allowed values: admin, common.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
}

function validateRequiredFields(fields) {
  const missing = Object.entries(fields)
    .filter(([, value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);

  if (missing.length > 0) {
    const error = new Error(`Missing required fields: ${missing.join(", ")}`);
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }
}

async function listUsers({ page, limit, from, to, name, email, role }) {
  if (role) validateRole(role);

  const result = await userRepository.getUsers({
    from,
    to,
    name,
    email,
    role,
  });

  return {
    items: result.data,
    pagination: buildPagination({
      page,
      limit,
      total: result.count,
    }),
  };
}

async function findUserById(id) {
  if (!id) {
    const error = new Error("User id is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const user = await userRepository.getUserById(id);

  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return user;
}

async function createUser(data) {
  const { name, email, telephone, password, role = "common" } = data || {};

  validateRequiredFields({ name, email, password });
  validateRole(role);

  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error("Invalid email.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const existingUser = await userRepository.getUserByEmail(normalizedEmail);
  if (existingUser) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    error.code = "CONFLICT";
    throw error;
  }

  const passwordHash = await hashPassword(password);

  return userRepository.createUser({
    name: String(name).trim(),
    email: normalizedEmail,
    telephone: telephone ? String(telephone).trim() : null,
    passwordHash,
    role,
  });
}

async function updateUser(id, data) {
  if (!id) {
    const error = new Error("User id is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const currentUser = await userRepository.getUserById(id);
  if (!currentUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  const payload = {};

  if (data?.name !== undefined) payload.name = data.name;
  if (data?.telephone !== undefined) payload.telephone = data.telephone;

  if (data?.email !== undefined) {
    const normalizedEmail = normalizeEmail(data.email);
    if (!normalizedEmail) {
      const error = new Error("Invalid email.");
      error.statusCode = 400;
      error.code = "VALIDATION_ERROR";
      throw error;
    }

    const existingUser = await userRepository.getUserByEmail(normalizedEmail);

    if (existingUser && existingUser.id !== id) {
      const error = new Error("Email already in use by another user.");
      error.statusCode = 409;
      error.code = "CONFLICT";
      throw error;
    }

    payload.email = normalizedEmail;
  }

  if (data?.role !== undefined) {
    validateRole(data.role);
    payload.role = data.role;
  }

  if (data?.password !== undefined && data.password !== "") {
    payload.passwordHash = await hashPassword(data.password);
  }

  if (data?.is_active !== undefined) {
    payload.isActive = Boolean(data.is_active);
  }

  return userRepository.updateUser(id, payload);
}

async function removeUser(id) {
  if (!id) {
    const error = new Error("User id is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const existingUser = await userRepository.getUserById(id);
  if (!existingUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  return userRepository.deleteUser(id);
}

async function getMe(userId) {
  if (!userId) {
    const error = new Error("User id is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const user = await userRepository.getUserById(userId);
  if (!user) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (user.is_active === false) {
    const error = new Error("User is inactive.");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  return user;
}

async function updateMe(userId, data) {
  if (!userId) {
    const error = new Error("User id is required.");
    error.statusCode = 400;
    error.code = "VALIDATION_ERROR";
    throw error;
  }

  const currentUser = await userRepository.getUserById(userId);
  if (!currentUser) {
    const error = new Error("User not found.");
    error.statusCode = 404;
    error.code = "NOT_FOUND";
    throw error;
  }

  if (currentUser.is_active === false) {
    const error = new Error("User is inactive.");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  const { name, telephone } = validateUpdateProfilePayload(data);

  const payload = {};
  if (name !== undefined) payload.name = name;
  if (telephone !== undefined) payload.telephone = telephone;

  return userRepository.updateUser(userId, payload);
}

module.exports = {
  listUsers,
  findUserById,
  createUser,
  updateUser,
  removeUser,
  getMe,
  updateMe,
};
