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

describe('User Story 5 - Remove a book from the list', () => {
  test('a removed book no longer appears in the list or statistics', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const deleteRes = await request(app).delete(`/api/books/${book.id}`);
    expect(deleteRes.status).toBe(204);

    const listRes = await request(app).get('/api/books');
    expect(listRes.body.books).toHaveLength(0);

    const statsRes = await request(app).get('/api/stats');
    expect(statsRes.body.countsByCategory.want_to_read).toBe(0);
  });

  test("a removed book's openLibraryWorkId can be added again", async () => {
    const app = createTestApp();
    const book = await addBook(app);

    await request(app).delete(`/api/books/${book.id}`);

    const readdRes = await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL1W',
      title: 'A Book',
      author: 'An Author',
      category: 'reading',
      totalPages: 100,
    });

    expect(readdRes.status).toBe(201);
  });
});
