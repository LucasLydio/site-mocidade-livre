const jwt = require("jsonwebtoken");

const authConfig = require("../config/auth");

function getHeader(event, name) {
  const headers = event?.headers || {};
  const target = String(name || "").toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (String(key).toLowerCase() === target) return value;
  }

  return undefined;
}

function unauthorized(message = "Unauthorized") {
  const err = new Error(message);
  err.statusCode = 401;
  err.code = "UNAUTHORIZED";
  throw err;
}

function forbidden(message = "Forbidden") {
  const err = new Error(message);
  err.statusCode = 403;
  err.code = "FORBIDDEN";
  throw err;
}

function getBearerToken(event) {
  const raw = String(getHeader(event, "authorization") || "").trim();
  if (!raw) return null;

  const match = raw.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = String(match[1] || "").trim();
  return token || null;
}

function verifyToken(token) {
  try {
    const payload = jwt.verify(token, authConfig.jwtSecret, {
      issuer: authConfig.jwtIssuer,
    });

    if (!payload?.sub) unauthorized("Invalid token payload.");

    return payload;
  } catch (error) {
    unauthorized("Invalid or expired token.");
  }
}

function requireAuth(event) {
  const token = getBearerToken(event);
  if (!token) unauthorized("Missing Authorization token.");

  const payload = verifyToken(token);

  return {
    userId: payload.sub,
    role: payload.role,
    email: payload.email,
    name: payload.name,
  };
}

function requireAdmin(event) {
  const auth = requireAuth(event);
  if (auth.role !== "admin") forbidden("Admin access required.");
  return auth;
}

module.exports = {
  getBearerToken,
  requireAuth,
  requireAdmin,
};
