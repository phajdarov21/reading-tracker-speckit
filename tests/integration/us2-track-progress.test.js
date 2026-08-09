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

describe('User Story 2 - Track reading progress', () => {
  test('the list view shows title, author, category, and progress', async () => {
    const app = createTestApp();
    await addBook(app);

    const res = await request(app).get('/api/books');

    expect(res.body.books[0]).toMatchObject({
      title: 'A Book',
      author: 'An Author',
      category: 'reading',
      progressPercent: 0,
    });
  });

  test('updating current page recalculates progress as current/total', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 100 });

    expect(res.body.progressPercent).toBe(50);
  });

  test('changing category to finished sets progress to 100% without a page number', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ category: 'finished' });

    expect(res.body.progressPercent).toBe(100);
  });

  test('a current page above total or negative is rejected with a clear message', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const tooHigh = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 201 });
    expect(tooHigh.status).toBe(400);
    expect(tooHigh.body.error).toBeTruthy();

    const negative = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: -5 });
    expect(negative.status).toBe(400);
  });

  test('reaching current page equal to total pages keeps category unchanged until an explicit change', async () => {
    const app = createTestApp();
    const book = await addBook(app);

    const res = await request(app).patch(`/api/books/${book.id}`).send({ currentPage: 200 });

    expect(res.body.progressPercent).toBe(100);
    expect(res.body.category).toBe('reading');
  });
});
