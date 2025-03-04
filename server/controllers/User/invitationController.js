const mongoose = require("mongoose");
const User = require("../../models/User/User");
const Bundle = require("../../models/User/bundle");
const Invitation = require("../../models/User/invitations");
const Business = require("../../models/Partner/partnerBusiness");
const UserNotification = require("../../models/User/userNotification");
const feedback = require("../../models/User/feedback");
const { sendEmail } = require("../../util/sendEmail");
const { body, validationResult } = require("express-validator");
const { getNotificationText } = require("../../util/getNotificationText");
const { getGoogleNearByPlaces } = require("../../util/getGoogleNearByPlaces");
const {
  getAggregatedInvitaion,
} = require("../../util/getAggregatedInvitation");
const { checkUserIsPremium } = require("../../util/checkUserIsPremium");


module.exports.getBusinessUnderRadius = async (req, res) => {
  try {
    const { coordinates, radius } = req.body;
    const data = await Business.aggregate([
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
          isPartnerActive: true,
        },
      },
      {
        $limit: 80,
      },
    ]);
    if (data) {
      let finalData = [];
      if (data.length >= 80) {
        finalData = data;
      } else {
        const mapData = await getGoogleNearByPlaces(coordinates, radius);
        finalData = [...data, ...mapData.slice(0, 80 - data.length)];
      }

      res.status(200).json({ data: finalData });
    } else throw Error("Data not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.getAllPlaces = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let { _id } = req.query;
    if (_id) {
      obj["_id"] = req.query;
    }
    const data = await Business.find({
      deleted: false,
      ...obj,
      isPartnerActive: true,
    })
      .populate("partnerId")
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await Business.find({
      deleted: false,
      isPartnerActive: true,
      ...obj,
    }).countDocuments();

    res.status(200).json({
      data: _id ? (data && data.length > 0 ? data[0] : false) : data,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

const checkIsDailyInviteFinish = async (userId) => {
  const currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);
  const endOfDay = new Date(currentDate);
  endOfDay.setHours(23, 59, 59, 999);
  const invitationCount = await Invitation.countDocuments({
    userId: userId,
    createdAt: { $gte: currentDate, $lt: endOfDay },
  });
  return invitationCount;
};
module.exports.inviteUser = [
  body("users").not().isEmpty().withMessage("users Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let isUserHaveBundle = false;
      let isFreeInvitation = false;
      const invitationBy = req.user._id;
      const isPremiumUser = await checkUserIsPremium(invitationBy);

      //Create feedback with value coming from frontened
      if (!isPremiumUser) {
        const dailyInviteCount = await checkIsDailyInviteFinish(invitationBy);
        if (dailyInviteCount <= 2) {
          isFreeInvitation = true;
        }
        if (dailyInviteCount >= 2) {
          const findBundle = await Bundle.findOne({ userId: invitationBy });
          if (findBundle && findBundle.pendingInvitation > 0) {
            isUserHaveBundle = true;
          }
        }
      }

      if (isFreeInvitation || isPremiumUser || isUserHaveBundle) {
        const Feedback = await feedback.create({
          userId: req.user._id,
          given: false,
          status: "no",
        });

        const invitePeople = await Invitation.create({
          ...req.body,
          feedbackId: Feedback._id,
          invitationBy,
        });
        await invitePeople.populate("users.userId feedbackId");
        if (invitePeople) {
          if (isUserHaveBundle) {
            await Bundle.findOneAndUpdate(
              { userId: invitationBy },
              { $inc: { pendingInvitation: -1 } },
              { new: true }
            );
          }
          for await (let val of invitePeople.users) {
            await UserNotification.create({
              title: req.user.userName,
              body: getNotificationText()["Sent_Invitation"],
              image: req.user.coverImage ?? "N/A",
              userId: val.userId._id,
            });

            // for sending notification on mail
            const mailOptions = {
              from: process.env.EMAIL,
              to: val?.userId?.email,
              subject: "Invitation Notification",
              text: `Hey, ${req.user?.userName} has sent you invitation`,
            };
            await sendEmail(mailOptions);
          }
          res.status(200).json({ invitePeople });
        } else throw Error("Something went wrong");
      } else {
        res.status(400).json({
          error:
            "Please purchase subscription or any plan to invite more people",
        });
      }
    } catch (err) {
      console.log(err);
      res.status(400).json({ error: "Something Went Wrong" });
    }
  },
];

module.exports.getAllRequests = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let aggObj = {};
    if (req.query.status) {
      obj["status"] = req.query.status;
      aggObj["status"] = req.query.status;
    }

    if (req.query.myInvitations === "true") {
      obj["invitationBy"] = req.user._id;
      aggObj["invitationBy._id"] = mongoose.Types.ObjectId(req.user._id);
    }
    const data = await getAggregatedInvitaion({ skipValue, limit, aggObj });

    let count = await Invitation.find({
      deleted: false,
      ...obj,
    }).countDocuments();

    res.status(200).json({
      data,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getInvitationsRequests = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let aggObj = {};
    const { status, userId } = req.query;
    if (status) {
      obj["status"] = status;
      aggObj["status"] = status;
    }
    if (userId) {
      obj["users"] = {
        $elemMatch: { userId },
      };
      aggObj["users.userId._id"] = mongoose.Types.ObjectId(userId);
    }
    const data = await getAggregatedInvitaion({ skipValue, limit, aggObj });
    let count = await Invitation.find({
      deleted: false,
      ...obj,
    }).countDocuments();

    res.status(200).json({
      data,
      totalData: count,
      totalPage: Math.ceil(count / limit),
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getInvitationById = async (req, res) => {
  try {
    const { _id } = req.query;

    const data = await Invitation.findById({ _id })
      .populate("rescheduleBy")
      .populate("feedbackId")
      .populate("invitationBy")
      .populate("businessId")
      .populate("users.userId");

    res.status(200).json({
      data,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.updateInvitation = [
  body("invitationId")
    .not()
    .isEmpty()
    .withMessage("invitationId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const invitationBy = req.user._id;
      let obj = {};
      if (!req.body.isRecheduled) {
        obj[invitationBy] = invitationBy;
      }
      const invitePeople = await Invitation.findOneAndUpdate(
        { _id: req.body.invitationId },
        {
          ...req.body,
          ...obj,
        },
        {
          new: true,
        }
      );
      if (invitePeople) {
        if (!req.body.isRecheduled) {
          const findInvitationStatus = invitePeople.users.find(
            (user) => user.userId.toString() === req.user._id.toString()
          );
          if (findInvitationStatus) {
            const findUser = await User.findById(findInvitationStatus.userId);
            await UserNotification.create({
              title: req.user.userName,
              body: getNotificationText()[findInvitationStatus.status+"_Invitation"],
              image: req.user.coverImage ?? "N/A",
              userId: findInvitationStatus.userId,
            });

            // for sending notification on mail
            const mailOptions = {
              from: process.env.EMAIL,
              to: findUser.email,
              subject: "Invitation Notification",
              text: `Hey,\n ${req.user.userName} has ${
                getNotificationText()[findInvitationStatus.status]
              }`,
            };
            await sendEmail(mailOptions);
          }
        }
        res.status(200).json({ invitePeople });
      } else throw Error("Something went wrong");
    } catch (err) {
      console.log(err);
      res.status(400).json({ error: "Something Went Wrong" });
    }
  },
];
