function getEnv(key, { required = false, defaultValue } = {}) {
  const rawValue = process.env[key];
  const value = typeof rawValue === "string" ? rawValue.trim() : rawValue;

  if ((value === undefined || value === "") && required) {
    throw new Error(`Missing required env var: ${key}`);
  }

  if (value === undefined || value === "") {
    return defaultValue;
  }

  return value;
}

function requireHttpUrl(key, value) {
  const raw = String(value || "").trim();
  if (!raw) {
    throw new Error(`Missing required env var: ${key}`);
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`${key} must be a valid HTTP or HTTPS URL.`);
  }

  return raw;
}

function requireOneOf(keys, label) {
  for (const key of keys) {
    const value = getEnv(key);
    if (value) return { key, value };
  }

  throw new Error(`Missing required env var (${label}): one of ${keys.join(", ")}`);
}

const env = {
  supabaseUrl: requireHttpUrl("SUPABASE_URL", getEnv("SUPABASE_URL", { required: true })),
  supabaseKey: requireOneOf(["SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_ANON_KEY"], "SUPABASE key").value,

  jwtSecret: requireOneOf(["JWT_SECRET", "AUTH_JWT_SECRET"], "JWT secret").value,
  jwtIssuer: getEnv("JWT_ISSUER", { defaultValue: getEnv("AUTH_JWT_ISSUER", { defaultValue: "mocidade-livre" }) }),
  jwtExpiresIn: getEnv("JWT_EXPIRES_IN", { defaultValue: getEnv("AUTH_JWT_EXPIRES_IN", { defaultValue: "7d" }) }),
};

module.exports = {
  getEnv,
  requireHttpUrl,
  requireOneOf,
  env,
};
