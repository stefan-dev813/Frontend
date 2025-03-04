const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin/Admin");

const { TOKEN_SECRET } = require('../config/config');

module.exports.getUser = async (token, next) => {
  token = token.replace("Bearer ", "");
  await jwt.verify(token, TOKEN_SECRET, async (err, user) => {
    if (err) {
      next("INVALID_TOKEN");
    } else {
      console.log(user)
      Admin.findOne({ _id: user._id }).exec(function (err, userData) {
        if (err || userData == null) {
          next("INVALID_TOKEN");
        } else {
          next(userData);
        }
      });
    }
  });
};
