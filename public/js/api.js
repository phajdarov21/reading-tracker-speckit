async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });

  let body = null;
  const text = await response.text();
  if (text) {
    body = JSON.parse(text);
  }

  if (!response.ok) {
    const message = (body && body.error) || 'Something went wrong. Please try again.';
    throw new Error(message);
  }

  return body;
}

function search(query) {
  return fetchJson(`/api/search?q=${encodeURIComponent(query)}`);
}

function addBook(book) {
  return fetchJson('/api/books', { method: 'POST', body: JSON.stringify(book) });
}

function listBooks(category = 'all') {
  return fetchJson(`/api/books?category=${encodeURIComponent(category)}`);
}

function updateBook(id, changes) {
  return fetchJson(`/api/books/${id}`, { method: 'PATCH', body: JSON.stringify(changes) });
}

function getStats() {
  return fetchJson('/api/stats');
}

function removeBook(id) {
  return fetchJson(`/api/books/${id}`, { method: 'DELETE' });
}

export {
  fetchJson, search, addBook, listBooks, updateBook, getStats, removeBook,
};
