// Simple helper to send consistent error responses
function sendError(res, status = 500, message = 'Server error', details) {
  const payload = { success: false, message };
  if (details && process.env.NODE_ENV === 'development') payload.error = details;
  return res.status(status).json(payload);
}

module.exports = { sendError };
