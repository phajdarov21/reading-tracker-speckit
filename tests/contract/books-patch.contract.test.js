const request = require('supertest');
const { createTestApp } = require('../testUtils');

async function addBook(app, overrides = {}) {
  const res = await request(app)
    .post('/api/books')
    .send({
      openLibraryWorkId: 'OL1W',
      title: 'A Book',
      author: 'An Author',
      category: 'reading',
      totalPages: 200,
      ...overrides,
    });
  return res.body;
}

describe('PATCH /api/books/:id contract', () => {
  test('updating currentPage recomputes progressPercent', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 50 });

    expect(res.status).toBe(200);
    expect(res.body.currentPage).toBe(50);
    expect(res.body.progressPercent).toBe(25);
  });

  test('setting category to finished forces currentPage and progressPercent to 100%', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ category: 'finished' });

    expect(res.status).toBe(200);
    expect(res.body.category).toBe('finished');
    expect(res.body.currentPage).toBe(200);
    expect(res.body.progressPercent).toBe(100);
  });

  test('a currentPage update alone never changes category, even when it equals totalPages', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 200 });

    expect(res.status).toBe(200);
    expect(res.body.progressPercent).toBe(100);
    expect(res.body.category).toBe('reading');
  });

  test('out-of-range currentPage returns 400', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 999 });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  test('negative currentPage returns 400', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: -1 });

    expect(res.status).toBe(400);
  });

  test('unknown id returns 400', async () => {
    const app = createTestApp();

    const res = await request(app).patch('/api/books/9999').send({ currentPage: 1 });

    expect(res.status).toBe(400);
  });

  test('invalid category returns 400', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ category: 'bogus' });

    expect(res.status).toBe(400);
  });
});
