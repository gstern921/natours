const bcrypt = require('bcryptjs');

module.exports = async (password, passwordHash) => {
  return await bcrypt.compare(password, passwordHash);
};
