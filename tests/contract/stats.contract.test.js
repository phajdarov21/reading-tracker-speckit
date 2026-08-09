const request = require('supertest');
const { createTestApp } = require('../testUtils');

async function seedBooks(app) {
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL1W', title: 'Book A', author: 'Author A', category: 'want_to_read', totalPages: 100,
  });
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL2W', title: 'Book B', author: 'Author B', category: 'reading', totalPages: 100,
  });
  const readingC = await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL3W', title: 'Book C', author: 'Author C', category: 'reading', totalPages: 100,
  });
  await request(app).patch(`/api/books/${readingC.body.id}`).send({ currentPage: 50 });
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL4W', title: 'Book D', author: 'Author D', category: 'finished', totalPages: 100,
  });
}

describe('GET /api/stats contract', () => {
  test('returns correct counts, total finished, and average reading progress', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.countsByCategory).toEqual({ want_to_read: 1, reading: 2, finished: 1 });
    expect(res.body.totalFinished).toBe(1);
    expect(res.body.averageReadingProgress).toBe(25);
  });

  test('averageReadingProgress is 0 when no "reading" books exist', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/stats');

    expect(res.status).toBe(200);
    expect(res.body.averageReadingProgress).toBe(0);
    expect(res.body.countsByCategory).toEqual({ want_to_read: 0, reading: 0, finished: 0 });
    expect(res.body.totalFinished).toBe(0);
  });
});
