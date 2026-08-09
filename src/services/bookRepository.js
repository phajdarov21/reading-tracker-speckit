function computeProgressPercent(currentPage, totalPages) {
  if (!totalPages || totalPages <= 0) return 0;
  return Math.round((currentPage / totalPages) * 100);
}

function mapRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    openLibraryWorkId: row.open_library_work_id,
    title: row.title,
    author: row.author,
    firstPublishYear: row.first_publish_year,
    coverUrl: row.cover_url,
    category: row.category,
    totalPages: row.total_pages,
    currentPage: row.current_page,
    progressPercent: row.progress_percent,
  };
}

function createBookRepository(db) {
  const insertStmt = db.prepare(`
    INSERT INTO books (
      open_library_work_id, title, author, first_publish_year, cover_url,
      category, total_pages, current_page, progress_percent, created_at
    ) VALUES (
      @openLibraryWorkId, @title, @author, @firstPublishYear, @coverUrl,
      @category, @totalPages, @currentPage, @progressPercent, @createdAt
    )
  `);
  const findByIdStmt = db.prepare('SELECT * FROM books WHERE id = ?');
  const findByWorkIdStmt = db.prepare('SELECT * FROM books WHERE open_library_work_id = ?');
  const listAllStmt = db.prepare('SELECT * FROM books ORDER BY id ASC');
  const listByCategoryStmt = db.prepare('SELECT * FROM books WHERE category = ? ORDER BY id ASC');
  const updateCategoryStmt = db.prepare(
    'UPDATE books SET category = @category, current_page = @currentPage, progress_percent = @progressPercent WHERE id = @id',
  );
  const updateCurrentPageStmt = db.prepare(
    'UPDATE books SET current_page = @currentPage, progress_percent = @progressPercent WHERE id = @id',
  );
  const deleteByIdStmt = db.prepare('DELETE FROM books WHERE id = ?');
  const countByCategoryStmt = db.prepare('SELECT category, COUNT(*) as count FROM books GROUP BY category');
  const avgReadingProgressStmt = db.prepare(
    "SELECT AVG(progress_percent) as avg FROM books WHERE category = 'reading'",
  );

  function insert({ openLibraryWorkId, title, author, firstPublishYear, coverUrl, category, totalPages }) {
    const currentPage = category === 'finished' ? totalPages : 0;
    const progressPercent = category === 'finished' ? 100 : 0;
    const result = insertStmt.run({
      openLibraryWorkId,
      title,
      author,
      firstPublishYear: firstPublishYear ?? null,
      coverUrl: coverUrl ?? null,
      category,
      totalPages,
      currentPage,
      progressPercent,
      createdAt: new Date().toISOString(),
    });
    return mapRow(findByIdStmt.get(result.lastInsertRowid));
  }

  function findByWorkId(openLibraryWorkId) {
    return mapRow(findByWorkIdStmt.get(openLibraryWorkId));
  }

  function findById(id) {
    return mapRow(findByIdStmt.get(id));
  }

  function listAll() {
    return listAllStmt.all().map(mapRow);
  }

  function listByCategory(category) {
    return listByCategoryStmt.all(category).map(mapRow);
  }

  function updateCategory(id, category) {
    const existing = findByIdStmt.get(id);
    if (!existing) return null;

    let currentPage = existing.current_page;
    let progressPercent = existing.progress_percent;
    if (category === 'finished') {
      currentPage = existing.total_pages;
      progressPercent = 100;
    }

    updateCategoryStmt.run({ id, category, currentPage, progressPercent });
    return mapRow(findByIdStmt.get(id));
  }

  function updateCurrentPage(id, currentPage) {
    const existing = findByIdStmt.get(id);
    if (!existing) return null;

    const progressPercent = computeProgressPercent(currentPage, existing.total_pages);
    updateCurrentPageStmt.run({ id, currentPage, progressPercent });
    return mapRow(findByIdStmt.get(id));
  }

  function deleteById(id) {
    const result = deleteByIdStmt.run(id);
    return result.changes > 0;
  }

  function aggregateStats() {
    const counts = { want_to_read: 0, reading: 0, finished: 0 };
    for (const row of countByCategoryStmt.all()) {
      counts[row.category] = row.count;
    }
    const avgRow = avgReadingProgressStmt.get();
    const averageReadingProgress = avgRow.avg == null ? 0 : Math.round(avgRow.avg);

    return {
      countsByCategory: counts,
      totalFinished: counts.finished,
      averageReadingProgress,
    };
  }

  return {
    insert,
    findByWorkId,
    findById,
    listAll,
    listByCategory,
    updateCategory,
    updateCurrentPage,
    deleteById,
    aggregateStats,
  };
}

module.exports = { createBookRepository, computeProgressPercent };
