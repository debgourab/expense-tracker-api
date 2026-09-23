function notFoundHandler(req, res) {
  return res.status(404).json({
    message: 'Route not found',
    requestId: req.id,
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({ message: messages.join(', '), requestId: req.id });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid id format', requestId: req.id });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Email already exists', requestId: req.id });
  }

  if (err.message === 'Origin is not allowed by CORS') {
    return res.status(403).json({ message: err.message, requestId: req.id });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body contains invalid JSON', requestId: req.id });
  }

  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Request body is too large', requestId: req.id });
  }

  console.error(`[${req.id || 'no-request-id'}]`, err);

  return res.status(500).json({
    message: 'Something went wrong on the server',
    requestId: req.id,
  });
}

module.exports = { notFoundHandler, errorHandler };
