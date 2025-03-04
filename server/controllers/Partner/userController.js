const User = require("../../models/Partner/Partner");
const PaymentDetails = require("../../models/Partner/paymentDetails");
const Business = require("../../models/Partner/partnerBusiness");
const { body, validationResult } = require("express-validator");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
module.exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await User.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(userId),
          deleted: false,
        },
      },
      {
        $lookup: {
          from: "partnersubscriptions",
          let: { mainCollectionId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$partnerId", "$$mainCollectionId"] },
                    { $eq: ["$isActive", true] },
                  ],
                },
              },
            },
          ],
          as: "purchasedSubscriptionInfo",
        },
      },
      {
        $unwind: {
          path: "$purchasedSubscriptionInfo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "purchasedSubscriptionInfo.subscriptionId",
          foreignField: "_id",
          as: "purchasedSubscriptionPlan",
        },
      },
      {
        $unwind: {
          path: "$purchasedSubscriptionPlan",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);
    if (user) {
      // const token = await createToken(user);
      res.status(200).json({ user });
    } else throw Error("User not found");
  } catch (err) {
    console.log(err);
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

// module.exports.updateUserProfile = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     const userProfile = await UserProfile.findOneAndUpdate(
//       {
//         userId,
//       },
//       { ...req.body, userId },
//       { new: true, upsert: true }
//     );
//     if (userProfile) {
//       res
//         .status(200)
//         .json({ message: "Updated Details Successfully", userProfile });
//     } else throw Error("Something Went Wrong");
//   } catch (err) {
//     let error = err.message;
//     res.status(400).json({ error: error });
//   }
// };

module.exports.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
    if (req.body.deleted) {
      req.body.status = "Deleted";
      await Business.findOneAndUpdate(
        { partnerId: userId },
        { deleted: true },
        { new: true }
      );
    }
    const user = await User.findByIdAndUpdate(
      { _id: userId },
      { ...req.body },
      { new: true }
    );
    if (user) {
      res.status(200).json({ user });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};
module.exports.updatePassword = [
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage("oldPassword Field is required"),
  body("newPassword")
    .not()
    .isEmpty()
    .withMessage("newPassword Field is required"),
  async (req, res) => {
    const { newPassword, oldPassword } = req.body;
    let userId = req.user._id;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ _id: userId });
      if (user) {
        const auth = await bcrypt.compare(oldPassword, user.password);
        if (!auth) {
          res.status(400).json({ message: "Please Enter Correct Password" });
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(newPassword, salt);
          const updatePassword = await User.findByIdAndUpdate(
            { _id: req.user._id },
            { password: hashedPassword },
            { new: true, useFindAndModify: false }
          );
          res.status(200).json({
            message: "Password Updated Successfuly",
            user: updatePassword,
          });
        }
      } else throw Error("User not found");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updatePaymentDetails = [
  async (req, res) => {
    try {
      const partnerId = req.user._id;
      const user = await PaymentDetails.findOneAndUpdate(
        { partnerId },
        { ...req.body, partnerId },
        { new: true, upsert: true }
      );
      if (user) {
        res.status(200).json({ user });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getPaymentDetails = [
  async (req, res) => {
    try {
      const partnerId = req.user._id;
      const data = await PaymentDetails.findOne({ partnerId }).sort({
        createdAt: -1,
      });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateEmail = [
  body("oldEmail").not().isEmpty().withMessage("oldEmail field is required"),
  body("newEmail").not().isEmpty().withMessage("newEmail field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { oldEmail, newEmail } = req.body;
      const userId = req.user._id;
      if (req.user.email === newEmail) {
        res.status(400).json({ message: "You are already using same email" });
        return;
      }

      // const findUser = await User.findOne({ email: oldEmail });
      // if (findUser) {
      //   res.status(400).json({ message: "Email already in use" });
      //   return;
      // } else {
      const user = await User.findByIdAndUpdate(
        { _id: userId },
        { email: newEmail },
        { new: true }
      );
      if (user) {
        res.status(200).json({ user });
      } else throw Error("User not found");
      // }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
