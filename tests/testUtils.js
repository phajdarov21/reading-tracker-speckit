const { createApp } = require('../src/server');

function createTestApp({ openLibraryClient } = {}) {
  return createApp({ dbPath: ':memory:', openLibraryClient });
}

function createFakeOpenLibraryClient(searchImpl) {
  return {
    search: searchImpl || (async () => []),
  };
}

module.exports = { createTestApp, createFakeOpenLibraryClient };
