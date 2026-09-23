const { randomUUID } = require('crypto');

function requestId(req, res, next) {
  const incomingId = req.get('x-request-id');
  const isSafeIncomingId = incomingId && /^[a-zA-Z0-9._-]{1,100}$/.test(incomingId);

  req.id = isSafeIncomingId ? incomingId : randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
}

module.exports = requestId;
