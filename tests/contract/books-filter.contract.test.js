const request = require('supertest');
const { createTestApp } = require('../testUtils');

async function seedBooks(app) {
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL1W', title: 'Book A', author: 'Author A', category: 'want_to_read', totalPages: 100,
  });
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL2W', title: 'Book B', author: 'Author B', category: 'reading', totalPages: 100,
  });
  await request(app).post('/api/books').send({
    openLibraryWorkId: 'OL3W', title: 'Book C', author: 'Author C', category: 'finished', totalPages: 100,
  });
}

describe('GET /api/books?category= contract', () => {
  test('each valid category returns only matching books', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const res = await request(app).get('/api/books').query({ category: 'reading' });

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(1);
    expect(res.body.books[0].title).toBe('Book B');
  });

  test('"all" returns every book regardless of category', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const res = await request(app).get('/api/books').query({ category: 'all' });

    expect(res.status).toBe(200);
    expect(res.body.books).toHaveLength(3);
  });

  test('an invalid category returns 400', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const res = await request(app).get('/api/books').query({ category: 'bogus' });

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });
});
