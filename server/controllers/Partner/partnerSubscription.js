const Subscription = require("../../models/Admin/subscription");
const PartnerSubscription = require("../../models/Partner/partnerSubscription");
const mongoose = require("mongoose");
const { createCheckoutLink } = require("../../util/stripe");
const { param, validationResult } = require("express-validator");
module.exports.getPartnerSubscriptionPaymentLink = [
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
      const { purchaseType } = req.query;
      const findSubscription = await Subscription.findById({
        _id: req.params.subscriptionId,
        userType: "PARTNER",
        status: true,
      });

      if (findSubscription) {
        const checkOut = await createCheckoutLink(findSubscription.price, {
          userId: req.user._id,
          userType: req.user.userType,
          email: req.user?.email,
          userName: req.user?.fullName,
          subscriptionId: req.params.subscriptionId,
          month: findSubscription.timePeriod,
          isUpgrade: purchaseType === "UPGRADE" ? true : false,
          planName:
            findSubscription.planName + purchaseType
              ? " upgrade plan"
              : " subscription plan",
          purchaseType: "SUBSCRIPTION",
        });
        res
          .status(200)
          .json({ url: checkOut, message: "Feteched successfully" });
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
      const data = await Subscription.find({
        userType: "PARTNER",
        status: true,
      });
      if (data) {
        res.status(201).json({ data });
      } else throw Error("No subscription plan found for user");
    } catch (err) {
      console.log(err, "error");
    }
  },
];

module.exports.cancelSubscription = [
  async (req, res) => {
    try {
      await PartnerSubscription.updateMany(
        { partnerId: req.user._id },
        { isActive: false }
      );
      res.status(200).json({ message: "Subscription got cancelled" });
    } catch (err) {
      console.log(err, "error");
    }
  },
];
