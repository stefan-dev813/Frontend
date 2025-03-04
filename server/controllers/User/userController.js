const User = require("../../models/User/User");
const HelpCenter = require("../../models/User/helpCenter");
const feedback = require("../../models/User/feedback");
const invitation = require("../../models/User/invitations");
const Report = require("../../models/User/reportUser");
const Analytics = require("../../models/Partner/analytics");
const Ratings = require("../../models/Partner/businessRatings");
const { body, validationResult, query } = require("express-validator");
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
          from: "usersubscriptions",
          let: { mainCollectionId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$mainCollectionId"] },
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
      {
        $lookup: {
          from: "bundles",
          localField: "_id",
          foreignField: "userId",
          as: "bundleInvitation",
        },
      },
      {
        $unwind: {
          path: "$bundleInvitation",
          preserveNullAndEmptyArrays: true,
        },
      },
    ]);

    if (user && user.length > 0) {
      res.status(200).json({ user: user[0] });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const userId = req.user._id;
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

module.exports.getUsersUnderRadius = async (req, res) => {
  try {
    const { coordinates, radius } = req.body;
    console.log(req.user._id);
    const user = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: coordinates,
          },
          distanceField: "distance",
          maxDistance: Number(radius),
          spherical: true,
        },
      },
      {
        $match: {
          _id: { $ne: mongoose.Types.ObjectId(req.user._id) },
          deleted: false,
        },
      },
    ]);
    if (user) {
      res.status(200).json({ user });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getUserById = [
  query("userId").not().isEmpty().withMessage("userId Field is required"),
  async (req, res) => {
    try {
      const { userId } = req.query;
      const user = await User.findOne({
        _id: new mongoose.Types.ObjectId(userId),
        deleted: false,
      });
      if (user) {
        // const token = await createToken(user);
        res.status(200).json({ user });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getSpecificUsers = [
  async (req, res) => {
    try {
      const { userIds } = req.body;
      const user = await User.find({
        _id: { $in: userIds },
      });
      if (user) {
        res.status(200).json({ user });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.updateBusinessRating = [
  body("userId").not().isEmpty().withMessage("userId Field is required"),
  body("businessId")
    .not()
    .isEmpty()
    .withMessage("businessId Field is required"),
  body("rating").not().isEmpty().withMessage("rating Field is required"),
  async (req, res) => {
    try {
      const { userId, businessId } = req.body;
      const ratings = await Ratings.findOneAndUpdate(
        { userId, businessId },
        { ...req.body },
        { new: true, upsert: true }
      );
      if (ratings) {
        // const token = await createToken(user);
        res.status(200).json({ data: ratings });
      } else throw Error("Data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.createHelpCenter = [
  body("name").not().isEmpty().withMessage("name field is required"),
  body("email").not().isEmpty().withMessage("email Field is required"),
  body("subject").not().isEmpty().withMessage("subject Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const helpcenter = await HelpCenter.create({
        userId: req.user._id,
        message: req.body.message,
        ...req.body,
      });
      res.status(201).json({ HelpCenter: helpcenter });
    } catch (err) {
      console.log(err, "error");
    }
  },
];

module.exports.createFeedback = [
  async (req, res) => {
    try {
      const userFeedback = await feedback.create({
        userId: req.user._id,
        invitationId: req.params.invitationId,
        ...req.body,
      });

      await invitation.findByIdAndUpdate(req.params.invitationId, {
        $set: { feedbackId: userFeedback._id },
      });

      if (userFeedback.status == "no") {
        const updateCount = await User.findOneAndUpdate(
          { _id: req.body.feedbackFor },
          { $inc: { didNotAttendMeetingCount: 1 } },
          { new: true }
        );
        if (updateCount.didNotAttendMeetingCount === 4) {
          //send email and infor user
        }
        if (updateCount.didNotAttendMeetingCount > 4) {
          await User.updateOne({ _id: updateCount._id }, { deleted: true });
        }
      }

      res.status(201).json({ Feedback: userFeedback });
    } catch (err) {
      console.log(err, "error");
    }
  },
];

module.exports.reportUser = async (req, res) => {
  try {
    const reportuser = await Report.create({
      reportedBy: req.user._id,
      reportedTo: req.body.reportedTo,
      hide: req.body.hide,
      report: req.body.report,
      block: req.body.block,
      categories: req.body.categories,
      message: req.body.message,
    });
    res.status(200).json({ Report: reportuser });
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getReportedUserById = async (req, res) => {
  try {
    const getReportedUserById = await Report.find({ reportedBy: req.user._id });
    if (!getReportedUserById) {
      res.status(400).json({ message: "user does not exist" });
    } else {
      res.status(200).json({ ReportDetails: getReportedUserById });
    }
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.updateAnalytics = async (req, res) => {
  try {
    await Analytics.create({
      ...req.body,
      userId: req.user._id,
      actionTime: new Date(),
    });
    res.status(200).json({ message: "Added analytics" });
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

//
