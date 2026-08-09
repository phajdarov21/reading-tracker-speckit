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

describe('User Story 3 - Filter the list by category', () => {
  test('selecting a category filter shows only books in that category', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const wantToRead = await request(app).get('/api/books').query({ category: 'want_to_read' });
    expect(wantToRead.body.books.map((b) => b.title)).toEqual(['Book A']);

    const finished = await request(app).get('/api/books').query({ category: 'finished' });
    expect(finished.body.books.map((b) => b.title)).toEqual(['Book C']);
  });

  test('selecting "all" shows every book regardless of category', async () => {
    const app = createTestApp();
    await seedBooks(app);

    const res = await request(app).get('/api/books').query({ category: 'all' });
    expect(res.body.books).toHaveLength(3);
  });
});
