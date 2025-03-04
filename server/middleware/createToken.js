const jwt = require("jsonwebtoken");
const { USER_TOKEN_AGE, TOKEN_SECRET } = require("../config/config");

module.exports.createToken = async (user) => {
  let expiresIn = USER_TOKEN_AGE;
  const token = await jwt.sign({ ...user._doc }, TOKEN_SECRET, {
    expiresIn,
  });
  return token;
};
