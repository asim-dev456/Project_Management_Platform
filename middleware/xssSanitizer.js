const xss = require('xss');

function sanitizeObject(obj) {
  for (let key in obj) {
    if (typeof obj[key] === 'string') {
      obj[key] = xss(obj[key]);
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key]);
    }
  }
  return obj;
}

function xssSanitizer(req, res, next) {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject({ ...req.query });
  if (req.params) req.params = sanitizeObject(req.params);
  next();
}

module.exports = xssSanitizer;
