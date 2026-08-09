const request = require('supertest');
const { createTestApp, createFakeOpenLibraryClient } = require('../testUtils');

function makeResult(overrides = {}) {
  return {
    openLibraryWorkId: 'OL1W',
    title: 'A Book',
    author: 'An Author',
    firstPublishYear: 2000,
    coverUrl: 'https://covers.openlibrary.org/b/id/1-M.jpg',
    ...overrides,
  };
}

describe('GET /api/search contract', () => {
  test('valid query returns results in the documented shape, capped at 20', async () => {
    const manyResults = Array.from({ length: 25 }, (_, i) => makeResult({ openLibraryWorkId: `OL${i}W`, title: `Book ${i}` }));
    const openLibraryClient = createFakeOpenLibraryClient(async () => manyResults.slice(0, 20));
    const app = createTestApp({ openLibraryClient });

    const res = await request(app).get('/api/search').query({ q: 'fantastic mr fox' });

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.results)).toBe(true);
    expect(res.body.results.length).toBeLessThanOrEqual(20);
    const first = res.body.results[0];
    expect(first).toHaveProperty('openLibraryWorkId');
    expect(first).toHaveProperty('title');
    expect(first).toHaveProperty('author');
    expect(first).toHaveProperty('firstPublishYear');
    expect(first).toHaveProperty('coverUrl');
  });

  test('a result with no cover image has a null coverUrl instead of failing', async () => {
    const openLibraryClient = createFakeOpenLibraryClient(async () => [makeResult({ coverUrl: null })]);
    const app = createTestApp({ openLibraryClient });

    const res = await request(app).get('/api/search').query({ q: 'no cover book' });

    expect(res.status).toBe(200);
    expect(res.body.results[0].coverUrl).toBeNull();
  });

  test('a query with no matches returns an empty results array, not an error', async () => {
    const openLibraryClient = createFakeOpenLibraryClient(async () => []);
    const app = createTestApp({ openLibraryClient });

    const res = await request(app).get('/api/search').query({ q: 'zzzzznomatch' });

    expect(res.status).toBe(200);
    expect(res.body.results).toEqual([]);
  });

  test('empty query returns 400 with a clear error', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/search').query({ q: '' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
    expect(res.body.error.length).toBeGreaterThan(0);
  });

  test('whitespace-only query returns 400', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/search').query({ q: '   ' });

    expect(res.status).toBe(400);
  });

  test('a simulated Open Library failure returns 502 with a clear error', async () => {
    const openLibraryClient = createFakeOpenLibraryClient(async () => {
      throw new Error('Book search is temporarily unavailable. Please try again later.');
    });
    const app = createTestApp({ openLibraryClient });

    const res = await request(app).get('/api/search').query({ q: 'fantastic mr fox' });

    expect(res.status).toBe(502);
    expect(typeof res.body.error).toBe('string');
  });
});
