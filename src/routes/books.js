const express = require('express');
const {
  validateCategory,
  validateTotalPages,
  validateCurrentPage,
} = require('../validation/validators');

function createBooksRouter(bookRepository) {
  const router = express.Router();

  router.get('/books', (req, res) => {
    const category = typeof req.query.category === 'string' ? req.query.category : 'all';

    if (category === 'all') {
      res.status(200).json({ books: bookRepository.listAll() });
      return;
    }

    const categoryError = validateCategory(category);
    if (categoryError) {
      res.status(400).json({ error: categoryError });
      return;
    }

    res.status(200).json({ books: bookRepository.listByCategory(category) });
  });

  router.post('/books', (req, res) => {
    const {
      openLibraryWorkId,
      title,
      author,
      firstPublishYear,
      coverUrl,
      category,
      totalPages,
    } = req.body || {};

    if (typeof openLibraryWorkId !== 'string' || openLibraryWorkId.trim().length === 0) {
      res.status(400).json({ error: 'A book identifier is required.' });
      return;
    }
    if (typeof title !== 'string' || title.trim().length === 0) {
      res.status(400).json({ error: 'A title is required.' });
      return;
    }
    if (typeof author !== 'string' || author.trim().length === 0) {
      res.status(400).json({ error: 'An author is required.' });
      return;
    }

    const categoryError = validateCategory(category);
    if (categoryError) {
      res.status(400).json({ error: categoryError });
      return;
    }

    const totalPagesError = validateTotalPages(totalPages);
    if (totalPagesError) {
      res.status(400).json({ error: totalPagesError });
      return;
    }

    if (bookRepository.findByWorkId(openLibraryWorkId)) {
      res.status(409).json({ error: 'This book is already on your list.' });
      return;
    }

    const created = bookRepository.insert({
      openLibraryWorkId,
      title,
      author,
      firstPublishYear: typeof firstPublishYear === 'number' ? firstPublishYear : null,
      coverUrl: typeof coverUrl === 'string' ? coverUrl : null,
      category,
      totalPages,
    });

    res.status(201).json(created);
  });

  router.patch('/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const existing = bookRepository.findById(id);
    if (!existing) {
      res.status(400).json({ error: 'Book not found.' });
      return;
    }

    const { category, currentPage } = req.body || {};
    if (category === undefined && currentPage === undefined) {
      res.status(400).json({ error: 'Provide a category or currentPage to update.' });
      return;
    }

    let updated = existing;

    if (category !== undefined) {
      const categoryError = validateCategory(category);
      if (categoryError) {
        res.status(400).json({ error: categoryError });
        return;
      }
      updated = bookRepository.updateCategory(id, category);
    }

    if (currentPage !== undefined) {
      const currentPageError = validateCurrentPage(currentPage, updated.totalPages);
      if (currentPageError) {
        res.status(400).json({ error: currentPageError });
        return;
      }
      updated = bookRepository.updateCurrentPage(id, currentPage);
    }

    res.status(200).json(updated);
  });

  router.delete('/books/:id', (req, res) => {
    const id = Number(req.params.id);
    const deleted = bookRepository.deleteById(id);
    if (!deleted) {
      res.status(404).json({ error: 'Book not found.' });
      return;
    }
    res.status(204).send();
  });

  return router;
}

module.exports = createBooksRouter;
