CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  open_library_work_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  first_publish_year INTEGER,
  cover_url TEXT,
  category TEXT NOT NULL CHECK (category IN ('want_to_read', 'reading', 'finished')),
  total_pages INTEGER NOT NULL CHECK (total_pages > 0),
  current_page INTEGER NOT NULL CHECK (current_page >= 0),
  progress_percent INTEGER NOT NULL CHECK (progress_percent >= 0 AND progress_percent <= 100),
  created_at TEXT NOT NULL
);
