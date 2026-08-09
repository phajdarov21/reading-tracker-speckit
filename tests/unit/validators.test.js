const {
  validateSearchQuery,
  validateCategory,
  validateTotalPages,
  validateCurrentPage,
} = require('../../src/validation/validators');

describe('validateSearchQuery', () => {
  test('rejects an empty string', () => {
    expect(validateSearchQuery('')).toEqual(expect.any(String));
  });

  test('rejects a whitespace-only string', () => {
    expect(validateSearchQuery('   ')).toEqual(expect.any(String));
  });

  test('accepts a non-empty query', () => {
    expect(validateSearchQuery('fantastic mr fox')).toBeNull();
  });
});

describe('validateCategory', () => {
  test.each(['want_to_read', 'reading', 'finished'])('accepts %s', (category) => {
    expect(validateCategory(category)).toBeNull();
  });

  test('rejects an unknown category', () => {
    expect(validateCategory('archived')).toEqual(expect.any(String));
  });

  test('rejects a non-string category', () => {
    expect(validateCategory(undefined)).toEqual(expect.any(String));
  });
});

describe('validateTotalPages', () => {
  test('rejects zero', () => {
    expect(validateTotalPages(0)).toEqual(expect.any(String));
  });

  test('rejects negative numbers', () => {
    expect(validateTotalPages(-10)).toEqual(expect.any(String));
  });

  test('rejects non-integers', () => {
    expect(validateTotalPages(10.5)).toEqual(expect.any(String));
  });

  test('accepts a positive integer', () => {
    expect(validateTotalPages(200)).toBeNull();
  });
});

describe('validateCurrentPage', () => {
  test('rejects a value above totalPages', () => {
    expect(validateCurrentPage(201, 200)).toEqual(expect.any(String));
  });

  test('rejects a negative value', () => {
    expect(validateCurrentPage(-1, 200)).toEqual(expect.any(String));
  });

  test('rejects non-integers', () => {
    expect(validateCurrentPage(10.5, 200)).toEqual(expect.any(String));
  });

  test('accepts 0', () => {
    expect(validateCurrentPage(0, 200)).toBeNull();
  });

  test('accepts a value equal to totalPages', () => {
    expect(validateCurrentPage(200, 200)).toBeNull();
  });
});
