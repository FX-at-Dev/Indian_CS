// backend/routes/leaderboard.js
const express = require('express');
const router = express.Router();
const leaderboardService = require('../services/leaderboardService');

/**
 * GET /            -> mounted at /api/leaderboard in server.js
 * Example: GET /api/leaderboard?limit=25
 */
router.get('/', async (req, res) => {
  try {
    const limit = Math.min(500, Number(req.query.limit) || 25);
    const data = await leaderboardService.getTopCities(limit);
    res.json({ data });
  } catch (err) {
    console.error('Leaderboard aggregation error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /stream      -> mounted at /api/leaderboard/stream
 * Example: GET /api/leaderboard/stream
 */
router.get('/stream', async (req, res) => {
  try {
    res.set({
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'Content-Type': 'text/event-stream',
    });
    // Some environments need explicit flush to start streaming headers
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    // initial snapshot (25)
    const init = await leaderboardService.getTopContributors(25);
    res.write(`data: ${JSON.stringify({ data: init })}\n\n`);

    // register client — service should store `res` and return an id
    const id = leaderboardService.addSseClient(res);
    console.log('SSE client connected', id);

    req.on('close', () => {
      leaderboardService.removeSseClient(id);
      console.log('SSE client disconnected', id);
    });
  } catch (err) {
    console.error('SSE connection error', err);
    try { res.end(); } catch (e) {}
  }
});

module.exports = router;
