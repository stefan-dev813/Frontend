const Notification = require("../../models/Common/notification");
const UserNotification = require("../../models/User/userNotification");
const { query, body, validationResult, param } = require("express-validator");
const { default: mongoose } = require("mongoose");
const moment = require("moment");
const { sendPushNotification } = require("../../util/sendPushNotification");
const { getNotificationText } = require("../../util/getNotificationText");

module.exports.createNotifications = [
  body("name").not().isEmpty().withMessage("name Field is required"),
  body("title").not().isEmpty().withMessage("title Field is required"),
  body("releaseDate")
    .not()
    .isEmpty()
    .withMessage("releaseDate Field is required"),
  body("releaseTime")
    .not()
    .isEmpty()
    .withMessage("releaseTime Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createNotification = await Notification.create({ ...req.body });
      if (createNotification) {
        res.status(200).json({ data: createNotification });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateNotification = [
  body("notificationId")
    .not()
    .isEmpty()
    .withMessage("notificationId Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const updateNotification = await Notification.findByIdAndUpdate(
        { _id: req.body.notificationId },
        { ...req.body },
        { new: true }
      ).populate("partnerId");
      if (updateNotification) {
        const notificationText =
          getNotificationText()[updateNotification.status + "_Notification"];
        const partnerDetails = updateNotification?.partnerId;
        const updatedNotification = JSON.stringify(updateNotification);
        if (
          notificationText &&
          partnerDetails &&
          partnerDetails.fcmToken &&
          partnerDetails.isNotificationsEnabled
        ) {
          await sendPushNotification({
            title: `Hi ${partnerDetails.fullName}`,
            body: notificationText,
            fcmToken: partnerDetails.fcmToken,
            data: {
              type: "Notification",
              notification: updatedNotification,
            },
            userType: "PARTNER",
          });
        }
        res.status(200).json({ data: updateNotification });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

const aggregateNotificationData = async ({
  matchCondition = {},
  limit,
  skipValue,
  countCond = {},
  count1Cond = {},
  count2Cond = {},
  count3Cond = {},
}) => {
  try {
    const currentDate = new Date();
    const data = await Notification.aggregate([
      {
        $match: {
          ...matchCondition,
        },
      },
      {
        $lookup: {
          from: "partners",
          localField: "partnerId",
          foreignField: "_id",
          as: "partnerId",
        },
      },
      {
        $unwind: {
          path: "$partnerId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          data: [{ $skip: skipValue }, { $limit: limit }],
          totalCount: [
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0, count: 1 } },
          ],
        },
      },
    ]);

    const stats = await Notification.aggregate([
      {
        $match: {
          ...countCond,
        },
      },
      {
        $group: {
          _id: null,
          overViewCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { ...count1Cond },
                    { $eq: ["$deleted", false] },
                    {
                      $gte: [
                        "$releaseDate",
                        new Date(moment().format("YYYY-MM-DD")),
                      ],
                    },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pendingCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Pending"] },
                    {
                      $gte: [
                        "$releaseDate",
                        new Date(moment().format("YYYY-MM-DD")),
                      ],
                    },
                    { $eq: ["$deleted", false] },
                    { ...count2Cond },
                  ],
                },
                1,
                0,
              ],
            },
          },
          historyCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $lt: [
                        "$releaseDate",
                        new Date(moment().format("YYYY-MM-DD")),
                      ],
                    },
                    { ...count3Cond },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      {
        $project: {
          _id: 0,
          overViewCount: 1,
          historyCount: 1,
          pendingCount: 1,
        },
      },
    ]);
    const result = stats[0];
    const overViewCount = result ? result.overViewCount : 0;
    const historyCount = result ? result.historyCount : 0;
    const pendingCount = result ? result.pendingCount : 0;
    return {
      overViewCount,
      historyCount,
      pendingCount,
      data: data[0]["data"],
      totalPage: Math.ceil(
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count / limit : 0
      ),
      totalCount: overViewCount + historyCount + pendingCount,
    };
  } catch (err) {
    console.log(err);
  }
};

const isDateGreaterThanCurrent = (inputDate) => {
  // Get the current date
  const currentDate = new Date();
  const argDate = new Date(inputDate);
  // Convert the dates to milliseconds since the Unix epoch
  const inputDateTimestamp = argDate.getTime();
  const currentDateTimestamp = currentDate.getTime();
  // Compare the timestamps
  return inputDateTimestamp > currentDateTimestamp;
};
module.exports.getAllNotificationForAdmin = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let filterObj = {};
    let count1Cond = {};
    let count3Cond = { $eq: ["$deleted", false] };
    let {
      status,
      search,
      userType,
      startDate,
      endDate,
      releasStartDate,
      releaseEndDate,
      city,
      type,
    } = req.query;
    const currentDate = new Date(moment().format("YYYY-MM-DD"));
    let countCond = { deleted: false }; // Add this line
    const isDateGreater =
      isDateGreaterThanCurrent(releaseEndDate) && status === "History";
    if (status === "Overview") {
      obj.releaseDate = { $gte: new Date(moment().startOf("day")) };
      obj["deleted"] = false;
      if (type === "PARTNER") {
        obj.status = "Accepted";
      }
    }
    if (type === "PARTNER") {
      count1Cond = { $eq: ["$status", "Accepted"] };
    }
    if (status === "History") {
      obj["deleted"] = false;

      obj.releaseDate = { $lt: new Date(moment().startOf("day")) };
    }

    if (status === "Pending") {
      obj.status = status;
      obj.releaseDate = { $gt: currentDate };
      obj["deleted"] = false;
    }

    if (search) {
      obj = {
        name: { $regex: search, $options: "i" },
        title: { $regex: search, $options: "i" },
      };
      filterObj = {
        name: { $regex: search, $options: "i" },
        title: { $regex: search, $options: "i" },
      };
    }

    if (type) {
      filterObj["type"] = type;
      obj["type"] = type;
    }

    if (userType) {
      filterObj["userType"] = userType;
      obj["userType"] = userType;
    }

    if (startDate) {
      filterObj["createdAt"] = {
        $gte: new Date(startDate),
      };
      obj["createdAt"] = {
        $gte: new Date(startDate),
      };
    }
    if (endDate) {
      filterObj["createdAt"] = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
      obj["createdAt"] = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    if (startDate && endDate) {
      filterObj["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
      obj["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }

    if (releasStartDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releasStartDate),
      };
      obj["releaseDate"] = {
        $gte: new Date(releasStartDate),
      };
    }

    if (releaseEndDate) {
      filterObj["releaseDate"] = {
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };

      obj["releaseDate"] = {
        $lte: isDateGreater
          ? new Date(moment(releaseEndDate).startOf("day"))
          : new Date(moment(releaseEndDate).endOf("day")),
      };
    }
    if (releasStartDate && releaseEndDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releasStartDate),
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };
      obj["releaseDate"] = {
        $gte: new Date(releasStartDate),
        $lte: isDateGreater
          ? new Date(moment(releaseEndDate).startOf("day"))
          : new Date(moment(releaseEndDate).endOf("day")),
      };
    }

    if (city) {
      filterObj["cities"] = { $in: [new RegExp(city, "i")] };
      obj["cities"] = { $in: [new RegExp(city, "i")] };
    }

    const data = await aggregateNotificationData({
      matchCondition: obj,
      limit,
      skipValue,
      countCond: filterObj,
      count1Cond,
      count3Cond,
    });

    res.status(200).json({
      ...data,
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getNotificationbyId = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      const data = await Notification.findOne({ _id }).populate("partnerId");
      if (data) {
        res.status(200).json({ data });
      } else throw Error("No data found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.sendNotification = [
  body("title").not().isEmpty().withMessage("title Field is required"),
  body("body").not().isEmpty().withMessage("body Field is required"),
  body("fcmToken").not().isEmpty().withMessage("fcmToken Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { title, body, fcmToken, type, id, userType } = req.body;
      let data = {};
      if (type) {
        data["type"] = type;
      }
      if (id) {
        data["id"] = id;
      }

      await sendPushNotification({
        title,
        body,
        fcmToken,
        data,
        userType,
      });
      res.status(200).json({ message: "Notification sent successfully" });
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllUserNotifications = [
  param("userId").not().isEmpty().withMessage("userId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let page = parseInt(req.query.page ? req.query.page : 1);
      let limit = parseInt(req.query.limit ? req.query.limit : 100);
      let skipValue = (page - 1) * limit;
      const { userId } = req.params;
      const data = await UserNotification.find({ userId })
        .populate("userId")
        .skip(skipValue)
        .limit(limit)
        .sort({ createdAt: -1 });

      let count = await UserNotification.find({
        deleted: false,
      }).countDocuments();
      res.status(200).json({
        data,
        totalCount: count,
        totalPage: Math.ceil(count / limit),
        perPage: limit,
        currentPage: page,
      });
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllNotificationsForPartner = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let { status, search, partnerId, releasStartDate, releaseEndDate, city } =
      req.query;
    let obj = {
      partnerId: mongoose.Types.ObjectId(partnerId),
    };
    let filterObj = {
      partnerId: mongoose.Types.ObjectId(partnerId),
    };
    let count1Cond = { $eq: ["$status", "Accepted"] };
    const currentDate = new Date(moment().format("YYYY-MM-DD"));
    const isDateGreater =
      isDateGreaterThanCurrent(releaseEndDate) && status === "History";
    if (status === "Overview") {
      obj.releaseDate = { $gte: currentDate };
      obj["deleted"] = false;
      obj.status = "Accepted";
    }

    if (status === "History") {
      obj.releaseDate = { $lt: currentDate };
    }

    if (status === "Pending") {
      obj.status = status;
      obj.releaseDate = { $gte: currentDate };
      obj["deleted"] = false;
    }

    if (search) {
      obj = {
        name: { $regex: search, $options: "i" },
        title: { $regex: search, $options: "i" },
      };
      filterObj = {
        name: { $regex: search, $options: "i" },
        title: { $regex: search, $options: "i" },
      };
    }

    if (releasStartDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releasStartDate),
      };
      obj["releaseDate"] = {
        $gte: new Date(releasStartDate),
      };
    }
    if (releaseEndDate) {
      filterObj["releaseDate"] = {
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };
      obj["releaseDate"] = {
        $lte: isDateGreater
          ? currentDate
          : status === "History"
          ? new Date(moment(releaseEndDate).startOf("day"))
          : new Date(moment(releaseEndDate).endOf("day")),
      };
    }
    if (releasStartDate && releaseEndDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releasStartDate),
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };
      obj["releaseDate"] = {
        $gte: new Date(releasStartDate),
        $lte: isDateGreater
          ? currentDate
          : status === "History"
          ? new Date(moment(releaseEndDate).startOf("day"))
          : new Date(moment(releaseEndDate).endOf("day")),
      };
    }

    if (city) {
      filterObj["cities"] = { $in: [new RegExp(city, "i")] };
      obj["cities"] = { $in: [new RegExp(city, "i")] };
    }

    const data = await aggregateNotificationData({
      matchCondition: obj,
      limit,
      skipValue,
      count1Cond,
      countCond: filterObj,
    });

    res.status(200).json({
      ...data,
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
