const request = require('supertest');
const { createTestApp } = require('../testUtils');

function validBook(overrides = {}) {
  return {
    openLibraryWorkId: 'OL45804W',
    title: 'Fantastic Mr Fox',
    author: 'Roald Dahl',
    firstPublishYear: 1970,
    coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
    category: 'want_to_read',
    totalPages: 96,
    ...overrides,
  };
}

describe('POST /api/books contract', () => {
  test('valid add returns 201 with the created entry', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/books').send(validBook());

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      openLibraryWorkId: 'OL45804W',
      title: 'Fantastic Mr Fox',
      author: 'Roald Dahl',
      category: 'want_to_read',
      totalPages: 96,
      currentPage: 0,
      progressPercent: 0,
    });
    expect(res.body).toHaveProperty('id');
  });

  test('invalid category returns 400', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/books').send(validBook({ category: 'not-a-category' }));

    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  test('non-positive totalPages returns 400', async () => {
    const app = createTestApp();

    const res = await request(app).post('/api/books').send(validBook({ totalPages: 0 }));

    expect(res.status).toBe(400);
  });

  test('duplicate openLibraryWorkId returns 409', async () => {
    const app = createTestApp();
    await request(app).post('/api/books').send(validBook());

    const res = await request(app).post('/api/books').send(validBook());

    expect(res.status).toBe(409);
    expect(typeof res.body.error).toBe('string');
  });
});
