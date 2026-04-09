// Frontend runtime config. In production, use relative /api so hosting redirects decide backend target.
window.APP_CONFIG = {
  API_BASE: window.location.hostname === "localhost"
    ? "http://localhost:10000/api"
    : "/api",
};
