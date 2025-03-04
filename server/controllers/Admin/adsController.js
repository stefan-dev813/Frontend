const PartnerAds = require("../../models/Partner/partnerAds");
const Analytics = require("../../models/Partner/analytics");
const mongoose = require("mongoose");
const ExternalAds = require("../../models/Partner/externanAd");
const { body, validationResult, query } = require("express-validator");
const moment = require("moment");
const { getNotificationText } = require("../../util/getNotificationText");
const { sendPushNotification } = require("../../util/sendPushNotification");
module.exports.getAllAds = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let {
      status,
      search,
      adType,
      releaseStartDate,
      releaseEndDate,
      createdStartDate,
      createdEndDate,
      filterStatus,
    } = req.query;
    if (status && status !== "History") {
      obj["status"] = {
        $in: [req.query.status, filterStatus ? filterStatus : ""],
      };
      obj["deleted"] = false;
    }
    const currentDate = new Date();
    console.log(currentDate);
    if (status === "History") {
      obj = {
        ...obj,
        $or: [{ releaseDate: { $lt: currentDate } }, { status: "Ended" }],
      };
    }
    if (status === "Approved") {
      obj.releaseDate = { $gte: currentDate };
    }
    if (search) {
      obj = {
        name: { $regex: search, $options: "i" },
      };
    }
    if (adType) {
      obj.adType = adType;
    }

    if (releaseStartDate || releaseEndDate) {
      obj.releaseDate = {};
      if (releaseStartDate) {
        obj.releaseDate.$gte = new Date(releaseStartDate);
      }
      if (releaseEndDate) {
        obj.releaseDate.$lte = new Date(releaseEndDate);
      }
    }

    if (createdStartDate || createdEndDate) {
      obj.createdAt = {};
      if (createdStartDate) {
        obj.createdAt.$gte = new Date(createdStartDate);
      }
      if (createdEndDate) {
        obj.createdAt.$lte = new Date(createdEndDate);
      }
    }
    if (filterStatus) {
      obj["status"] = filterStatus;
    }
    const data = await PartnerAds.aggregate([
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
        $match: {
          ...obj,
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

    const stats = await PartnerAds.aggregate([
      {
        $group: {
          _id: null,
          overView: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Approved"] },
                    { $eq: ["$deleted", false] },
                    { $gte: ["$releaseDate", currentDate] },
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
                  $or: [
                    { $eq: ["$status", "Ended"] },
                    { $lt: ["$releaseDate", currentDate] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          requestedCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Requested"] },
                    { $eq: ["$deleted", false] },
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
          overView: 1,
          historyCount: 1,
          requestedCount: 1,
        },
      },
    ]);
    const result = stats[0];

    const overViewCount = result ? result.overView : 0;
    const historyCount = result ? result.historyCount : 0;
    const requestedCount = result ? result.requestedCount : 0;
    res.status(200).json({
      data: data[0]["data"],
      overViewCount,
      requestedCount,
      historyCount,
      totalPage: Math.ceil(
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count / limit : 0
      ),
      totalData:
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.updateAds = [
  body("adId").not().isEmpty().withMessage("adId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { adId } = req.body;

      const updateAds = await PartnerAds.findOneAndUpdate(
        { _id: adId },
        { ...req.body },
        { new: true }
      ).populate("partnerId");
      if (updateAds) {
        const notificationText =
          getNotificationText()[updateAds.status + "_Ads"];
        const partnerDetails = updateAds?.partnerId;
        if (
          notificationText &&
          partnerDetails.fcmToken &&
          partnerDetails.isNotificationsEnabled
        ) {
          const updateAdsStringified = JSON.stringify(updateAds);
          await sendPushNotification({
            title: `Hi ${partnerDetails.fullName}`,
            body: notificationText,
            fcmToken: partnerDetails.fcmToken,
            data: {
              type: "Ads",
              ads: updateAdsStringified,
            },
            userType: "PARTNER",
          });
        }
        res.status(200).json({ data: updateAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.createAds = [
  body("name").not().isEmpty().withMessage("name Field is required"),
  body("title").not().isEmpty().withMessage("title Field is required"),
  body("releaseDate")
    .not()
    .isEmpty()
    .withMessage("releaseDate Field is required"),
  body("body").not().isEmpty().withMessage("location Field is required"),
  body("adType").not().isEmpty().withMessage("adType Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createAds = await PartnerAds.create({ ...req.body });
      if (createAds) {
        res.status(200).json({ data: createAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.getSingleAds = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      const data = await PartnerAds.findById({ _id });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.createExternalAds = [
  body("body").not().isEmpty().withMessage("body Field is required"),
  body("title").not().isEmpty().withMessage("title Field is required"),
  body("releaseDate")
    .not()
    .isEmpty()
    .withMessage("releaseDate Field is required"),
  body("legalRepresentative")
    .not()
    .isEmpty()
    .withMessage("legalRepresentative object field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createAds = await ExternalAds.create({ ...req.body });
      if (createAds) {
        res.status(200).json({ data: createAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllExternalAds = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let filterObj = {};
    let {
      status,
      search,

      startDate,
      endDate,
      releaseStartDate,
      releaseEndDate,
    } = req.query;
    const currentDate = new Date(moment().format("YYYY-MM-DD"));

    if (status === "Overview") {
      if (!releaseStartDate && !releaseEndDate) {
        obj.releaseDate = {
          $gte: currentDate,
        };
      }

      obj.deleted = false;
    }
    if (status === "History") {
      if (!releaseStartDate && !releaseEndDate) {
        obj.releaseDate = { $lt: currentDate };
      }
    }
    if (search) {
      obj.$or = [
        { name: { $regex: search, $options: "i" } },
        { title: { $regex: search, $options: "i" } },
      ];
    }

    if (startDate) {
      filterObj["createdAt"] = {
        $gte: new Date(startDate),
      };
    }
    if (endDate) {
      filterObj["createdAt"] = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    if (startDate && endDate) {
      filterObj["createdAt"] = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }

    if (releaseStartDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releaseStartDate),
      };
    }
    if (releaseEndDate) {
      filterObj["releaseDate"] = {
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };
    }
    if (releaseStartDate && releaseEndDate) {
      filterObj["releaseDate"] = {
        $gte: new Date(releaseStartDate),
        $lte: new Date(moment(releaseEndDate).endOf("day")),
      };
    }
    console.log(obj, filterObj);
    const data = await ExternalAds.aggregate([
      {
        $match: {
          ...obj,
          ...filterObj,
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

    const stats = await ExternalAds.aggregate([
      {
        $match: {
          ...filterObj,
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
                    { $eq: ["$deleted", false] },
                    { $gte: ["$releaseDate", currentDate] },
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
                      $lt: ["$releaseDate", currentDate],
                    },
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
        },
      },
    ]);

    const result = stats[0];
    const overViewCount = result ? result.overViewCount : 0;
    const historyCount = result ? result.historyCount : 0;

    res.status(200).json({
      data: data[0]["data"],
      totalData:
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
      overViewCount,
      historyCount,
      totalPage: Math.ceil(
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count / limit : 0
      ),
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.updateExternalAds = [
  body("adId").not().isEmpty().withMessage("adId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { adId } = req.body;
      const updateAds = await ExternalAds.findOneAndUpdate(
        { _id: adId },
        { ...req.body },
        { new: true }
      );
      if (updateAds) {
        res.status(200).json({ data: updateAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getSingleExternalAds = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      const data = await ExternalAds.findById({ _id });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

const getAdsAnalytics = async (_id, actionType, type) => {
  let obj = {};
  if (type === "INTERNAL") {
    obj["adId"] = _id;
  }
  if (type === "EXTERNAL") {
    obj["extAdId"] = _id;
  }
  const internalStats = await Analytics.aggregate([
    {
      $match: {
        actionType,
        adId: mongoose.Types.ObjectId(_id),
        deleted: { $ne: true },
      },
    },
    {
      $group: {
        _id: {
          hour: { $hour: "$actionTime" },
          minute: { $minute: "$actionTime" },
          second: { $second: "$actionTime" },
        },
        count: { $sum: 1 },
      },
    },
    {
      $project: {
        _id: 0,
        time: {
          $concat: [
            { $toString: "$_id.hour" },
            ":",
            { $toString: "$_id.minute" },
            ":",
            { $toString: "$_id.second" },
          ],
        },
        count: 1,
      },
    },
    {
      $sort: { time: 1 },
    },
  ]);
  if (internalStats) {
    return internalStats;
  } else false;
};
module.exports.getAdvtertisementStats = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  query("type").not().isEmpty().withMessage("type Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { _id, type } = req.query;
      const internalClickStats = await getAdsAnalytics(_id, "CLICK", type);
      const internalImpressionStats = await getAdsAnalytics(
        _id,
        "IMPRESSION",
        type
      );
      if (internalClickStats || internalImpressionStats) {
        res.status(200).json({
          data: {
            internalClickStats,
            internalImpressionStats,
            invitesStats: [],
          },
        });
      } else throw Error("No data found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
