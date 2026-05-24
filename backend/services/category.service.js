const categoryRepository = require("../repositories/category.repository");
const { validateCategoryPayload } = require("../utils/validators");
const { buildPagination, getPagination } = require("../utils/pagination");

async function listCategories(query = {}, { isAdmin = false } = {}) {
  const { page, limit, from, to } = getPagination(query);

  const wantsActiveFilter = query.is_active !== undefined && query.is_active !== "";
  const isActive = wantsActiveFilter ? String(query.is_active).toLowerCase() === "true" : undefined;

  const effectiveIsActive = isAdmin ? isActive : true;

  const result = await categoryRepository.listCategories({
    from,
    to,
    isActive: effectiveIsActive,
  });

  return {
    items: result.data,
    pagination: buildPagination({ page, limit, total: result.count }),
  };
}

async function createCategory(payload) {
  const data = validateCategoryPayload(payload);
  return categoryRepository.createCategory(data);
}

async function updateCategory(id, payload) {
  if (!id) {
    const err = new Error("Category id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  const data = validateCategoryPayload(payload);
  return categoryRepository.updateCategory(id, data);
}

async function removeCategory(id) {
  if (!id) {
    const err = new Error("Category id is required.");
    err.statusCode = 400;
    err.code = "VALIDATION_ERROR";
    throw err;
  }

  return categoryRepository.deleteCategory(id);
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  removeCategory,
};

