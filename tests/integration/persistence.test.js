const fs = require('fs');
const os = require('os');
const path = require('path');

const { createDatabase } = require('../../src/db/database');
const { createBookRepository } = require('../../src/services/bookRepository');

describe('Persistence across restarts (FR-014 / SC-003)', () => {
  let dbPath;

  beforeEach(() => {
    dbPath = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'reading-tracker-')), 'test.db');
  });

  afterEach(() => {
    fs.rmSync(path.dirname(dbPath), { recursive: true, force: true });
  });

  test('data written before a restart is still readable after reopening the same database file', () => {
    const firstDb = createDatabase(dbPath);
    const firstRepository = createBookRepository(firstDb);
    firstRepository.insert({
      openLibraryWorkId: 'OL1W',
      title: 'Fantastic Mr Fox',
      author: 'Roald Dahl',
      category: 'reading',
      totalPages: 96,
    });
    firstDb.close();

    // Simulates a process restart: a fresh database.js instance opens the same file on disk.
    const secondDb = createDatabase(dbPath);
    const secondRepository = createBookRepository(secondDb);

    const books = secondRepository.listAll();
    expect(books).toHaveLength(1);
    expect(books[0].title).toBe('Fantastic Mr Fox');

    const stats = secondRepository.aggregateStats();
    expect(stats.countsByCategory.reading).toBe(1);

    secondDb.close();
  });
});
