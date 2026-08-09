const request = require('supertest');
const { createTestApp } = require('../testUtils');

async function addBook(app, overrides = {}) {
  return request(app)
    .post('/api/books')
    .send({
      openLibraryWorkId: 'OL1W',
      title: 'A Book',
      author: 'An Author',
      category: 'reading',
      totalPages: 100,
      ...overrides,
    });
}

describe('GET /api/books contract', () => {
  test('returns the list with title, author, category, and progressPercent per entry', async () => {
    const app = createTestApp();
    await addBook(app);

    const res = await request(app).get('/api/books');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.books)).toBe(true);
    expect(res.body.books).toHaveLength(1);
    const book = res.body.books[0];
    expect(book).toHaveProperty('title', 'A Book');
    expect(book).toHaveProperty('author', 'An Author');
    expect(book).toHaveProperty('category', 'reading');
    expect(book).toHaveProperty('progressPercent', 0);
  });

  test('returns an empty list when no books have been added', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/books');

    expect(res.status).toBe(200);
    expect(res.body.books).toEqual([]);
  });
});
