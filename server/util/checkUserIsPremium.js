const UserSubscription = require("../models/User/userSubscription");
const User = require("../models/User/User");
module.exports.checkUserIsPremium = async (userId) => {
  const findUser = await User.findById(userId);
  const memberShip = await UserSubscription.findOne({ isActive: true, userId });
  if (findUser && memberShip) {
    return true;
  } else false;
};
