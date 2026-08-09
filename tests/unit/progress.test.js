const { computeProgressPercent } = require('../../src/services/bookRepository');

describe('computeProgressPercent', () => {
  test('computes an exact percentage', () => {
    expect(computeProgressPercent(50, 100)).toBe(50);
  });

  test('rounds down when the fractional part is below .5', () => {
    expect(computeProgressPercent(1, 3)).toBe(33);
  });

  test('rounds up when the fractional part is .5 or above', () => {
    expect(computeProgressPercent(2, 3)).toBe(67);
  });

  test('returns 0 for a current page of 0', () => {
    expect(computeProgressPercent(0, 200)).toBe(0);
  });

  test('returns 100 when current page equals total pages', () => {
    expect(computeProgressPercent(200, 200)).toBe(100);
  });

  test('returns 0 when totalPages is 0 (defensive default)', () => {
    expect(computeProgressPercent(0, 0)).toBe(0);
  });
});
