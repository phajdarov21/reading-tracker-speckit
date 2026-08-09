const path = require('path');
const express = require('express');

const config = require('./config');
const { createDatabase } = require('./db/database');
const { createBookRepository } = require('./services/bookRepository');
const { createOpenLibraryClient } = require('./services/openLibraryClient');
const createSearchRouter = require('./routes/search');
const createBooksRouter = require('./routes/books');
const createStatsRouter = require('./routes/stats');

function createApp({ dbPath = config.DB_PATH, openLibraryClient: injectedClient } = {}) {
  const db = createDatabase(dbPath);
  const bookRepository = createBookRepository(db);
  const openLibraryClient = injectedClient || createOpenLibraryClient();

  const app = express();
  app.use(express.json());
  app.locals.bookRepository = bookRepository;
  app.locals.openLibraryClient = openLibraryClient;
  app.locals.db = db;

  app.use(express.static(path.join(__dirname, '..', 'public')));

  app.use('/api', createSearchRouter(openLibraryClient));
  app.use('/api', createBooksRouter(bookRepository));
  app.use('/api', createStatsRouter(bookRepository));

  app.use((req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || 500;
    const message = err.expose ? err.message : 'Something went wrong. Please try again.';
    res.status(status).json({ error: message });
  });

  return app;
}

function start() {
  const app = createApp();
  app.listen(config.PORT, () => {
    console.log(`Reading Tracker listening on port ${config.PORT}`);
  });
}

if (require.main === module) {
  start();
}

module.exports = { createApp, start };
