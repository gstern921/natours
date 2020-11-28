const csrf = require('csurf');

module.exports = csrf({
  cookie: { httpOnly: true, sameSite: 'lax' },
});
