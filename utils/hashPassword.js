const bcrypt = require('bcryptjs');

module.exports = async (password) => {
  return await bcrypt.hash(password, +process.env.BCRYPT_SALT_ROUNDS);
};
