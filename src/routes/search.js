const express = require('express');
const { validateSearchQuery } = require('../validation/validators');

function createSearchRouter(openLibraryClient) {
  const router = express.Router();

  router.get('/search', async (req, res) => {
    const query = typeof req.query.q === 'string' ? req.query.q : '';
    const validationError = validateSearchQuery(query);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    try {
      const results = await openLibraryClient.search(query);
      res.status(200).json({ results });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  return router;
}

module.exports = createSearchRouter;
