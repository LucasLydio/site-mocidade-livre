function parseJsonBody(body) {
  if (!body) return {};

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

module.exports = {
  parseJsonBody
};

