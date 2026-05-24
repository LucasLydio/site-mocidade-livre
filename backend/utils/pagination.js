function getPagination(query = {}) {
  const limit = Math.max(parseInt(query.limit, 10) || 10, 1);

  const rawOffset = query.offset !== undefined ? parseInt(query.offset, 10) : NaN;
  const hasOffset = Number.isFinite(rawOffset) && !Number.isNaN(rawOffset) && rawOffset >= 0;

  const page = hasOffset ? Math.floor(rawOffset / limit) + 1 : Math.max(parseInt(query.page, 10) || 1, 1);

  const from = hasOffset ? rawOffset : (page - 1) * limit;
  const to = from + limit - 1;

  return {
    page,
    limit,
    from,
    to
  };
}

function buildPagination({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

module.exports = {
  getPagination,
  buildPagination
};
