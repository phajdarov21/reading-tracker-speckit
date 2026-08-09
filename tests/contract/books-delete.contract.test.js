const request = require('supertest');
const { createTestApp } = require('../testUtils');

async function addBook(app, overrides = {}) {
  const res = await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL1W',
    title: 'A Book',
    author: 'An Author',
    category: 'want_to_read',
    totalPages: 100,
    ...overrides,
  });
  return res.body;
}

describe('DELETE /api/books/:id contract', () => {
  test('successful delete returns 204 and the book is absent from a subsequent GET', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const deleteRes = await request(app).delete(`/api/books/${book.id}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get('/api/books');
    expect(listRes.body.books).toHaveLength(0);
  });

  test('unknown id returns 404', async () => {
    const app = createTestApp();

    const res = await request(app).delete('/api/books/9999');

    expect(res.status).toBe(404);
    expect(typeof res.body.error).toBe('string');
  });
});
