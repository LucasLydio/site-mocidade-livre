const contactRepository = require("../repositories/contact.repository");
const { buildPagination, getPagination } = require("../utils/pagination");
const { normalizeEmail } = require("../utils/validators");

const ALLOWED_STATUSES = new Set(["new", "contacted", "archived"]);

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = "VALIDATION_ERROR";
  throw err;
}

function notFound(message) {
  const err = new Error(message);
  err.statusCode = 404;
  err.code = "NOT_FOUND";
  throw err;
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeOptionalText(value) {
  if (value === undefined) return undefined;
  return normalizeText(value) || null;
}

function validateCreateInterestPayload(payload) {
  const name = normalizeText(payload?.name);
  const whatsapp = normalizeText(payload?.whatsapp);
  const area_interest = normalizeText(payload?.area_interest);
  const email = payload?.email !== undefined ? normalizeEmail(payload.email) : null;
  const message = normalizeOptionalText(payload?.message) ?? null;

  const missing = [];
  if (!name) missing.push("name");
  if (!whatsapp) missing.push("whatsapp");
  if (!area_interest) missing.push("area_interest");
  if (missing.length) badRequest(`Missing required fields: ${missing.join(", ")}`);

  if (email && !email.includes("@")) badRequest("Invalid email.");

  return { name, whatsapp, email, area_interest, message, status: "new" };
}

function normalizeStatus(value, { allowAll = false } = {}) {
  const raw = normalizeText(value).toLowerCase();
  if (!raw) return null;
  if (allowAll && raw === "all") return "all";
  if (!ALLOWED_STATUSES.has(raw)) badRequest("Invalid status. Allowed: new, contacted, archived.");
  return raw;
}

function normalizeSearch(value) {
  const raw = normalizeText(value);
  return raw ? raw : null;
}

async function createInterest(payload) {
  const data = validateCreateInterestPayload(payload);
  return contactRepository.createInterest(data);
}

async function listInterestsAdmin(query = {}) {
  const { page, limit, from, to } = getPagination(query);
  const status = normalizeStatus(query.status, { allowAll: true }) || "all";
  const search = normalizeSearch(query.search);

  const result = await contactRepository.listInterests({
    from,
    to,
    status,
    search,
  });

  return {
    items: result.data,
    pagination: buildPagination({ page, limit, total: result.count }),
  };
}

async function getInterestByIdAdmin(id) {
  const interestId = normalizeText(id);
  if (!interestId) badRequest("Interest id is required.");

  const item = await contactRepository.getInterestById(interestId);
  if (!item) notFound("Interest not found.");
  return item;
}

async function updateInterestStatusAdmin(id, status) {
  const interestId = normalizeText(id);
  if (!interestId) badRequest("Interest id is required.");

  const next = normalizeStatus(status);
  if (!next) badRequest("status is required.");

  const updated = await contactRepository.updateInterestStatus(interestId, next);
  if (!updated) notFound("Interest not found.");
  return updated;
}

async function deleteInterestAdmin(id) {
  const interestId = normalizeText(id);
  if (!interestId) badRequest("Interest id is required.");

  const deleted = await contactRepository.deleteInterest(interestId);
  if (!deleted) notFound("Interest not found.");
  return deleted;
}

module.exports = {
  createInterest,
  listInterestsAdmin,
  getInterestByIdAdmin,
  updateInterestStatusAdmin,
  deleteInterestAdmin,
};
