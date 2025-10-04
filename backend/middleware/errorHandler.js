function errorHandler(err, req, res, next) {
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({ error: "Payload too large" });
  }
  console.error(err);
  res.status(500).json({ error: "Something went wrong" });
}

module.exports = errorHandler;
