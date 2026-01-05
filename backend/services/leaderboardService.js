// backend/services/leaderboardService.js
const { Report } = require('../models/reportModel');

let sseClients = [];

/**
 * Aggregation: top cities (by number of issues reported)
 */
async function getTopCities(limit = 50) {
  const pipeline = [
    { $group: {
        _id: '$city',
        total: { $sum: 1 },
        active: { $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] } },
        closed: { $sum: { $cond: [{ $eq: ['$status', 'Closed'] }, 1, 0] } }
    }},
    { $project: { _id: 0, city: '$_id', total: 1, active: 1, closed: 1 } },
    { $sort: { total: -1 } },
    { $limit: limit }
  ];
  return Report.aggregate(pipeline).allowDiskUse(true);
}

/**
 * Add SSE client (res is the response object)
 * Returns an id you can use to remove client later.
 */
function addSseClient(res) {
  const id = Date.now() + Math.random();
  sseClients.push({ id, res });
  return id;
}

function removeSseClient(id) {
  sseClients = sseClients.filter(c => c.id !== id);
}

/**
 * Broadcast leaderboard snapshot to all connected SSE clients
 */
async function broadcastLeaderboard() {
  try {
    const snapshot = await getTopCities(50);
    const payload = `data: ${JSON.stringify({ data: snapshot })}\n\n`;
    sseClients.forEach(c => {
      try { c.res.write(payload); } catch (e) { /* ignore individual client failures */ }
    });
  } catch (err) {
    console.error('broadcastLeaderboard error', err);
  }
}

module.exports = {
  getTopCities,
  addSseClient,
  removeSseClient,
  broadcastLeaderboard
};
