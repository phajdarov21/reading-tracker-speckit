const ALLOWED_CATEGORIES = ['want_to_read', 'reading', 'finished'];

function validateSearchQuery(query) {
  if (typeof query !== 'string' || query.trim().length === 0) {
    return 'Please enter a search term.';
  }
  return null;
}

function validateCategory(category) {
  if (typeof category !== 'string' || !ALLOWED_CATEGORIES.includes(category)) {
    return `Category must be one of: ${ALLOWED_CATEGORIES.join(', ')}.`;
  }
  return null;
}

function validateTotalPages(totalPages) {
  if (!Number.isInteger(totalPages) || totalPages <= 0) {
    return 'Total pages must be a whole number greater than zero.';
  }
  return null;
}

function validateCurrentPage(currentPage, totalPages) {
  if (!Number.isInteger(currentPage) || currentPage < 0 || currentPage > totalPages) {
    return `Current page must be a whole number between 0 and ${totalPages}.`;
  }
  return null;
}

module.exports = {
  ALLOWED_CATEGORIES,
  validateSearchQuery,
  validateCategory,
  validateTotalPages,
  validateCurrentPage,
};
