const express = require('express');

function createStatsRouter(bookRepository) {
  const router = express.Router();

  router.get('/stats', (req, res) => {
    res.status(200).json(bookRepository.aggregateStats());
  });

  return router;
}

module.exports = createStatsRouter;
