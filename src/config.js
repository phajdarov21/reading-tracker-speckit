const path = require('path');

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const DB_PATH = process.env.READING_TRACKER_DB_PATH
  || path.join(__dirname, '..', 'data', 'reading-tracker.db');

const OPEN_LIBRARY_CONTACT_EMAIL = process.env.OPEN_LIBRARY_CONTACT_EMAIL
  || 'contact@example.com';

const USER_AGENT = `reading-tracker/1.0 (${OPEN_LIBRARY_CONTACT_EMAIL})`;

module.exports = {
  PORT,
  DB_PATH,
  OPEN_LIBRARY_CONTACT_EMAIL,
  USER_AGENT,
};
