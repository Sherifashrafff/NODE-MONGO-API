// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  // eslint-disable-next-line no-console
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(422).json({ message: 'Validation error', details: err.message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate entry' });
  }

  const status = err.status || 500;
  return res.status(status).json({ message: err.message || 'Internal server error' });
};
