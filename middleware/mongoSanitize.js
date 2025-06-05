function sanitizeObject(obj) {
  for (let key in obj) {
    if (/^\$/.test(key) || key.includes('.')) {
      delete obj[key];
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

function mongoSanitize(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.params) req.params = sanitizeObject(req.params);
  if (req.query) req.query = sanitizeObject({ ...req.query });
  next();
}

module.exports = mongoSanitize;
