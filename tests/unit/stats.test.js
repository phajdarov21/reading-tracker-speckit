const { createDatabase } = require('../../src/db/database');
const { createBookRepository } = require('../../src/services/bookRepository');

function setup() {
  const db = createDatabase(':memory:');
  return createBookRepository(db);
}

let idCounter = 0;
function nextWorkId() {
  idCounter += 1;
  return `OL${idCounter}W`;
}

describe('bookRepository.aggregateStats', () => {
  test('averageReadingProgress is 0 when there are no "reading" books', () => {
    const repo = setup();
    repo.insert({
      openLibraryWorkId: nextWorkId(), title: 'A', author: 'A', category: 'want_to_read', totalPages: 100,
    });

    const stats = repo.aggregateStats();

    expect(stats.averageReadingProgress).toBe(0);
  });

  test('averageReadingProgress rounds to the nearest whole number', () => {
    const repo = setup();
    const a = repo.insert({
      openLibraryWorkId: nextWorkId(), title: 'A', author: 'A', category: 'reading', totalPages: 3,
    });
    const b = repo.insert({
      openLibraryWorkId: nextWorkId(), title: 'B', author: 'B', category: 'reading', totalPages: 3,
    });
    repo.updateCurrentPage(a.id, 1); // 33%
    repo.updateCurrentPage(b.id, 2); // 67%

    const stats = repo.aggregateStats();

    // (33 + 67) / 2 = 50
    expect(stats.averageReadingProgress).toBe(50);
  });

  test('counts and totalFinished reflect the current rows only', () => {
    const repo = setup();
    repo.insert({
      openLibraryWorkId: nextWorkId(), title: 'A', author: 'A', category: 'finished', totalPages: 100,
    });
    const toRemove = repo.insert({
      openLibraryWorkId: nextWorkId(), title: 'B', author: 'B', category: 'finished', totalPages: 100,
    });
    repo.deleteById(toRemove.id);

    const stats = repo.aggregateStats();

    expect(stats.countsByCategory.finished).toBe(1);
    expect(stats.totalFinished).toBe(1);
  });
});
