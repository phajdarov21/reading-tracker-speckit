const config = require('../config');

const SEARCH_URL = 'https://openlibrary.org/search.json';
const RESULT_LIMIT = 20;
const MIN_REQUEST_INTERVAL_MS = 334; // no more than 3 requests/second
const UNAVAILABLE_MESSAGE = 'Book search is temporarily unavailable. Please try again later.';

function buildCoverUrl(coverId) {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

function normalizeQuery(query) {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mapDoc(doc) {
  const openLibraryWorkId = typeof doc.key === 'string' ? doc.key.replace('/works/', '') : null;
  return {
    openLibraryWorkId,
    title: doc.title || null,
    author: Array.isArray(doc.author_name) && doc.author_name.length > 0 ? doc.author_name[0] : null,
    firstPublishYear: typeof doc.first_publish_year === 'number' ? doc.first_publish_year : null,
    coverUrl: buildCoverUrl(doc.cover_i),
  };
}

function createOpenLibraryClient(options = {}) {
  const {
    fetchImpl = fetch,
    userAgent = config.USER_AGENT,
    minRequestIntervalMs = MIN_REQUEST_INTERVAL_MS,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;

  const cache = new Map();
  let lastRequestAt = 0;

  async function throttle() {
    const elapsed = Date.now() - lastRequestAt;
    if (elapsed < minRequestIntervalMs) {
      await sleep(minRequestIntervalMs - elapsed);
    }
    lastRequestAt = Date.now();
  }

  async function search(query) {
    const cacheKey = normalizeQuery(query);
    if (cache.has(cacheKey)) {
      return cache.get(cacheKey);
    }

    await throttle();

    let response;
    try {
      response = await fetchImpl(
        `${SEARCH_URL}?q=${encodeURIComponent(query)}&limit=${RESULT_LIMIT}`,
        { headers: { 'User-Agent': userAgent } },
      );
    } catch (err) {
      throw new Error(UNAVAILABLE_MESSAGE);
    }

    if (!response.ok) {
      throw new Error(UNAVAILABLE_MESSAGE);
    }

    let body;
    try {
      body = await response.json();
    } catch (err) {
      throw new Error(UNAVAILABLE_MESSAGE);
    }

    const docs = Array.isArray(body.docs) ? body.docs : [];
    const results = docs
      .slice(0, RESULT_LIMIT)
      .map(mapDoc)
      .filter((result) => result.openLibraryWorkId && result.title);

    cache.set(cacheKey, results);
    return results;
  }

  return { search };
}

module.exports = {
  createOpenLibraryClient,
  buildCoverUrl,
  normalizeQuery,
  UNAVAILABLE_MESSAGE,
  RESULT_LIMIT,
  MIN_REQUEST_INTERVAL_MS,
};
