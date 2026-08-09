const request = require('supertest');
const { createTestApp, createFakeOpenLibraryClient } = require('../testUtils');

function searchResult(overrides = {}) {
  return {
    openLibraryWorkId: 'OL45804W',
    title: 'Fantastic Mr Fox',
    author: 'Roald Dahl',
    firstPublishYear: 1970,
    coverUrl: 'https://covers.openlibrary.org/b/id/12345-M.jpg',
    ...overrides,
  };
}

describe('User Story 1 - Find and add a book to the list', () => {
  test('search then add ends up in the personal list', async () => {
    const openLibraryClient = createFakeOpenLibraryClient(async () => [searchResult()]);
    const app = createTestApp({ openLibraryClient });

    const searchRes = await request(app).get('/api/search').query({ q: 'fantastic mr fox' });
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.results).toHaveLength(1);
    const result = searchRes.body.results[0];

    const addRes = await request(app).post('/api/books').send({
      openLibraryWorkId: result.openLibraryWorkId,
      title: result.title,
      author: result.author,
      firstPublishYear: result.firstPublishYear,
      coverUrl: result.coverUrl,
      category: 'want_to_read',
      totalPages: 96,
    });
    expect(addRes.status).toBe(201);

    const listRes = await request(app).get('/api/books');
    expect(listRes.body.books).toHaveLength(1);
    expect(listRes.body.books[0].title).toBe('Fantastic Mr Fox');
  });

  test('adding a search result that has no cover image succeeds with a null coverUrl', async () => {
    const openLibraryClient = createFakeOpenLibraryClient(async () => [searchResult({ coverUrl: null })]);
    const app = createTestApp({ openLibraryClient });

    const searchRes = await request(app).get('/api/search').query({ q: 'fantastic mr fox' });
    const result = searchRes.body.results[0];
    expect(result.coverUrl).toBeNull();

    const addRes = await request(app).post('/api/books').send({
      ...result,
      category: 'want_to_read',
      totalPages: 96,
    });

    expect(addRes.status).toBe(201);
    expect(addRes.body.coverUrl).toBeNull();
  });

  test('adding the same book twice is rejected as a duplicate', async () => {
    const app = createTestApp();
    const book = {
      openLibraryWorkId: 'OL45804W',
      title: 'Fantastic Mr Fox',
      author: 'Roald Dahl',
      category: 'want_to_read',
      totalPages: 96,
    };

    const first = await request(app).post('/api/books').send(book);
    expect(first.status).toBe(201);

    const second = await request(app).post('/api/books').send(book);
    expect(second.status).toBe(409);
    expect(second.body.error).toMatch(/already/i);
  });

  test('an empty search is rejected with a clear message instead of results or a crash', async () => {
    const app = createTestApp();

    const res = await request(app).get('/api/search').query({ q: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });
});
