const jwt = require("jsonwebtoken");

const { TOKEN_SECRET } = require('../config/config');

module.exports.getUser = async (token, next) => {
  await jwt.verify(token, TOKEN_SECRET, async (err, user) => {
    if (err) {
      next(err);
    } else {
      next(user);
    }
  });
};
