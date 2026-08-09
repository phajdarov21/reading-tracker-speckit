const request = require('supertest');
const { createTestApp } = require('../testUtils');

describe('User Story 4 - View reading statistics', () => {
  test('counts per category and total finished match the underlying data', async () => {
    const app = createTestApp();
    await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL1W', title: 'Book A', author: 'Author A', category: 'want_to_read', totalPages: 100,
    });
    await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL2W', title: 'Book B', author: 'Author B', category: 'finished', totalPages: 100,
    });
    await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL3W', title: 'Book C', author: 'Author C', category: 'finished', totalPages: 100,
    });

    const res = await request(app).get('/api/stats');

    expect(res.body.countsByCategory.want_to_read).toBe(1);
    expect(res.body.countsByCategory.finished).toBe(2);
    expect(res.body.totalFinished).toBe(2);
  });

  test('average progress across multiple "reading" books matches their average', async () => {
    const app = createTestApp();
    const bookA = await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL1W', title: 'Book A', author: 'Author A', category: 'reading', totalPages: 100,
    });
    const bookB = await request(app).post('/api/books').send({
      openLibraryWorkId: 'OL2W', title: 'Book B', author: 'Author B', category: 'reading', totalPages: 100,
    });
    await request(app).patch(`/api/books/${bookA.body.id}`).send({ currentPage: 20 });
    await request(app).patch(`/api/books/${bookB.body.id}`).send({ currentPage: 80 });

    const res = await request(app).get('/api/stats');

    expect(res.body.averageReadingProgress).toBe(50);
  });

  test('average reading progress is 0, not an error, when no books are "reading"', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.averageReadingProgress).toBe(0);
  });
});
