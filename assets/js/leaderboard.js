// Use absolute URLs for backend API endpoints to support running frontend on a different port (e.g., Live Server)
(function () {
  const API_URL = 'http://localhost:5000/api/leaderboard';            // GET aggregated JSON
  const SSE_URL = 'http://localhost:5000/api/leaderboard/stream';     // SSE stream for live updates
  const lbBody = document.getElementById('lb-body');
  const POLL_INTERVAL = 10_000; // ms fallback if SSE not available
  let pollTimer = null;
  let sse = null;

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function renderRows(list) {
    if (!Array.isArray(list) || list.length === 0) {
      lbBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:1rem">No entries yet</td></tr>';
      return;
    }

    // build rows (rank starts at 1)
      const rows = list.map((r, i) => {
        // r: { city, total, active, closed }
        return `<tr${r.highlight ? ' class="current"' : ''}>
          <td>${i + 1}</td>
          <td>${escapeHtml(r.city)}</td>
          <td>${Number(r.total || 0)}</td>
          <td>${Number(r.active || 0)}</td>
          <td>${Number(r.closed || 0)}</td>
        </tr>`;
    }).join('');
    lbBody.innerHTML = rows;
  }

  async function fetchLeaderboard() {
    try {
      // Read limit from select
      const limitSelect = document.getElementById('lb-limit');
      const limit = limitSelect ? Number(limitSelect.value) : 25;
      const q = new URLSearchParams({ limit });
      const res = await fetch(`${API_URL}?${q}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      // accept either { data: [...] } or just [...]
      const list = json.data || json.leaderboard || json || [];
  markUserCity(list);
      renderRows(list);
    } catch (err) {
      console.error('Leaderboard fetch failed', err);
      lbBody.innerHTML = `<tr><td colspan="5" style="color:#f66;padding:1rem">Failed to load leaderboard</td></tr>`;
    }
  }

  // optional: highlight the row that matches current user's name
  // optional: highlight the row that matches current user's city
  function markUserCity(list) {
    try {
      const u = (window.IP && typeof IP.currentUser === 'function') ? IP.currentUser() : null;
      const userCity = u && (u.city || u.location || u.town);
      if (!userCity) return;
      list.forEach(item => { item.highlight = (String(item.city).toLowerCase() === String(userCity).toLowerCase()); });
    } catch (e) { /* ignore */ }
  }

  // SSE with polling fallback
  function startSSE() {
    if (!('EventSource' in window)) { startPolling(); return; }
    try {
      sse = new EventSource(SSE_URL);
      sse.onopen = () => {
        console.log('Leaderboard SSE connected');
        stopPolling();
      };
      sse.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data);
          const list = payload && (payload.data || payload.leaderboard || payload);
          if (Array.isArray(list)) {
            markUserCity(list);
            renderRows(list);
          } else {
            lbBody.innerHTML = `<tr><td colspan="5" style="color:#f66;padding:1rem">Invalid leaderboard data</td></tr>`;
          }
        } catch (e) {
          console.error('Invalid SSE payload', e);
        }
      };
      sse.onerror = (err) => {
        console.warn('SSE error — falling back to polling', err);
        if (sse) { sse.close(); sse = null; }
        startPolling();
      };
    } catch (e) {
      console.warn('SSE start failed', e);
      startPolling();
    }
  }

  function startPolling() {
    if (pollTimer) return;
    fetchLeaderboard(); // initial
    pollTimer = setInterval(fetchLeaderboard, POLL_INTERVAL);
  }
  function stopPolling() {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  }

  function initLeaderboardPage() {
    fetchLeaderboard();
    startSSE();
  }

  // attach to IP namespace if present (your HTML calls this)
  if (window.IP && typeof window.IP === 'object') {
    window.IP.initLeaderboardPage = initLeaderboardPage;
  } else {
    // fallback auto-init
    document.addEventListener('DOMContentLoaded', initLeaderboardPage);
  }

  // exposables for debug
  window.__leaderboard = { fetchLeaderboard, startSSE, startPolling, stopPolling };
})();
