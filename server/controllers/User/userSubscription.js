const Subscription = require("../../models/Admin/subscription");
const UserSubscription = require("../../models/User/userSubscription");
const User = require("../../models/User/User");
const Bundle = require("../../models/User/bundle");
const { param, validationResult } = require("express-validator");
const { calculateExpiryDate } = require("../../util/calculateExpiryDate");

module.exports.createUserSubscription = [
  param("subscriptionId")
    .not()
    .isEmpty()
    .withMessage("subscriptionId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const findSubscription = await Subscription.findById({
        _id: req.params.subscriptionId,
      });
      if (findSubscription) {
        const expireAt = calculateExpiryDate(findSubscription.timePeriod);
        await UserSubscription.updateMany(
          { userId: req.user._id },
          { isActive: false }
        );
        await UserSubscription.create({
          userId: req.user._id,
          expireAt,
          isActive: true,
          subscriptionId: findSubscription._id,
        });
        await User.findByIdAndUpdate(
          { _id: req.user._id },
          { isPremium: true },
          { new: true }
        );
        res.status(200).json({ message: "Subscription successfull" });
      } else {
        res.status(400).json({ message: "Subscription not found" });
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllSubscriptionPlans = [
  async (req, res) => {
    try {
      const data = await Subscription.find({ userType: "USER", status: true });
      if (data) {
        res.status(201).json({ data });
      } else throw Error("No subscription plan found for user");
    } catch (err) {
      console.log(err, "error");
    }
  },
];

module.exports.updatePurchasedBundle = [
  async (req, res) => {
    try {
      const { totalInvitations } = req.body;
      await Bundle.findOneAndUpdate(
        { userId: req.user._id },
        { $inc: { pendingInvitation: Number(totalInvitations) } },
        { new: true, upsert: true }
      );
      res.status(200).json({ message: "Updated successfully" });
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
