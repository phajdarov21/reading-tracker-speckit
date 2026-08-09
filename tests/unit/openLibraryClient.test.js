const { createOpenLibraryClient } = require('../../src/services/openLibraryClient');

function fakeResponse(docs = []) {
  return { ok: true, json: async () => ({ docs }) };
}

describe('openLibraryClient', () => {
  test('every outgoing request carries a User-Agent header with the configured value', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(fakeResponse([]));
    const client = createOpenLibraryClient({
      fetchImpl,
      userAgent: 'reading-tracker/1.0 (test@example.com)',
      sleep: async () => {},
    });

    await client.search('fantastic mr fox');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, options] = fetchImpl.mock.calls[0];
    expect(options.headers['User-Agent']).toBe('reading-tracker/1.0 (test@example.com)');
  });

  test('repeated identical queries are served from the cache without a second fetch call', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(fakeResponse([{ key: '/works/OL1W', title: 'Book' }]));
    const client = createOpenLibraryClient({ fetchImpl, sleep: async () => {} });

    await client.search('fantastic mr fox');
    await client.search('  Fantastic Mr Fox  ');

    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  test('does not throttle the first request', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(fakeResponse([]));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const client = createOpenLibraryClient({ fetchImpl, sleep });

    await client.search('first query');

    expect(sleep).not.toHaveBeenCalled();
  });

  test('throttles a second distinct-query request to no more than 3 requests/second', async () => {
    const fetchImpl = jest.fn().mockResolvedValue(fakeResponse([]));
    const sleep = jest.fn().mockResolvedValue(undefined);
    const client = createOpenLibraryClient({ fetchImpl, sleep, minRequestIntervalMs: 334 });

    await client.search('first query');
    await client.search('second query');

    expect(sleep).toHaveBeenCalledTimes(1);
    const waitedMs = sleep.mock.calls[0][0];
    expect(waitedMs).toBeGreaterThan(0);
    expect(waitedMs).toBeLessThanOrEqual(334);
  });

  test('translates a network failure into a single clear error', async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new Error('network down'));
    const client = createOpenLibraryClient({ fetchImpl, sleep: async () => {} });

    await expect(client.search('anything')).rejects.toThrow(/temporarily unavailable/i);
  });

  test('translates a non-ok HTTP response into the same clear error', async () => {
    const fetchImpl = jest.fn().mockResolvedValue({ ok: false, json: async () => ({}) });
    const client = createOpenLibraryClient({ fetchImpl, sleep: async () => {} });

    await expect(client.search('anything')).rejects.toThrow(/temporarily unavailable/i);
  });
});
