const jwt = require("jsonwebtoken");

const authRepository = require("../repositories/auth.repository");
const { comparePassword, hashPassword } = require("../utils/hash");
const authConfig = require("../config/auth");
const { validateLoginPayload, validateRegisterPayload } = require("../utils/validators");

function buildAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    authConfig.jwtSecret,
    {
      issuer: authConfig.jwtIssuer,
      expiresIn: authConfig.jwtExpiresIn
    },
  );
}

function toPublicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    telephone: user.telephone,
    role: user.role,
    is_active: user.is_active,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

async function register(payload) {
  const { name, email, telephone, password } = validateRegisterPayload(payload);

  const existing = await authRepository.getUserByEmailWithPassword(email);
  if (existing) {
    const error = new Error("Email already in use.");
    error.statusCode = 409;
    error.code = "CONFLICT";
    throw error;
  }

  const passwordHash = await hashPassword(password);

  const user = await authRepository.createUser({
    name,
    email,
    telephone,
    passwordHash,
    role: "common",
  });

  const token = buildAccessToken(user);
  return {
    token,
    user: toPublicUser(user),
  };
}

async function login(payload) {
  const { email, password } = validateLoginPayload(payload);

  const user = await authRepository.getUserByEmailWithPassword(email);
  if (!user) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  if (user.is_active === false) {
    const error = new Error("User is inactive.");
    error.statusCode = 403;
    error.code = "FORBIDDEN";
    throw error;
  }

  const ok = await comparePassword(password, user.password_hash);
  if (!ok) {
    const error = new Error("Invalid email or password.");
    error.statusCode = 401;
    error.code = "UNAUTHORIZED";
    throw error;
  }

  const token = buildAccessToken(user);

  return {
    token,
    user: toPublicUser(user),
  };
}

module.exports = {
  register,
  login
};
