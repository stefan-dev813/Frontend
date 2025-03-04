const Partner = require("../../models/Partner/Partner");
const Stamp = require("../../models/User/stamp");
const Invitations = require("../../models/User/invitations");
const PartnerBusiness = require("../../models/Partner/partnerBusiness");
const PartnerAds = require("../../models/Partner/partnerAds");
const ExternalAds = require("../../models/Partner/externanAd");
const { body, validationResult, query } = require("express-validator");
const moment = require("moment");
const { sendEmail } = require("../../util/sendEmail");
const { default: mongoose } = require("mongoose");
module.exports.getAllPartners = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let { status, search } = req.query;
    if (status) {
      obj["partnerId.status"] = req.query.status;
    }

    if (req.query.search) {
      obj = {
        $or: [
          { "partnerId.fullName": { $regex: search, $options: "i" } },
          { "partnerId.email": { $regex: search, $options: "i" } },
        ],
      };
    }

    const data = await PartnerBusiness.aggregate([
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
          deleted: false,
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          data: [{ $skip: limit * (page - 1) }, { $limit: limit }],
          totalCount: [
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0, count: 1 } },
          ],
        },
      },
    ]);

    const stats = await Partner.aggregate([
      {
        $group: {
          _id: null,
          totalActive: {
            $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
          },
          totalRequested: {
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
          totalBlacklisted: {
            $sum: { $cond: [{ $eq: ["$status", "Blacklisted"] }, 1, 0] },
          },
          totalDeleted: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Deleted"] },
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
    ]);

    const finalCount = stats[0];
    if (data && data.length > 0) {
      const totalActive = finalCount ? finalCount.totalActive : 0;
      const totalBlacklisted = finalCount ? finalCount.totalBlacklisted : 0;
      const totalDeleted = finalCount ? finalCount.totalDeleted : 0;
      const totalRequested = finalCount ? finalCount.totalRequested : 0;
      const totalPartnerCount =
        totalActive + totalBlacklisted + totalDeleted + totalRequested;
      res.status(200).json({
        data: data[0]["data"],
        perPage: limit,
        ...finalCount,
        totalPage: Math.ceil(
          data[0].totalCount.length > 0
            ? data[0].totalCount[0].count / limit
            : 0
        ),
        totalPartnerCount,
        totalCount:
          data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.updatePartner = [
  body("partnerId").not().isEmpty().withMessage("partnerId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      if (req.body.deleted) {
        req.body.status = "Deleted";
      }
      const data = await Partner.findByIdAndUpdate(
        { _id: req.body.partnerId },
        {
          ...req.body,
        },
        { new: true }
      );
      if (req.body.status == "Active") {
        await PartnerBusiness.findOneAndUpdate(
          { partnerId: req.body.partnerId },
          { isPartnerActive: true },
          { new: true }
        );
        //@INFO SES HAVE SOME ISSUES CURRENTLY
        // const mailOptions = {
        //   from: process.env.EMAIL,
        //   to: data.email,
        //   subject: "Welcome to Our Platform!",
        //   text: `Hello,\n
        //   Thank you for registering on our platform! We're excited to have you on board.\n
        //   Your requested is now accepted and now you can login with your register email and password of your account is 12345678.\n
        //   Thank you and Best regards\n
        //   Netme`,
        // };
        // await sendEmail(mailOptions);
      }
      if (req.body.deleted) {
        await PartnerBusiness.findOneAndUpdate(
          { partnerId: req.body.partnerId },
          { deleted: true },
          { new: true }
        );
        await PartnerAds.deleteMany({ partnerId: req.body.partnerId });
      }
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getSinglePartner = [
  query("partnerId").not().isEmpty().withMessage("partnerId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { partnerId } = req.query;
      const data = await Partner.findById({ _id: partnerId });
      const findpartnerBusiness = await PartnerBusiness.findOne({ partnerId });
      if (data) {
        res
          .status(200)
          .json({ data: { ...data._doc, business: findpartnerBusiness._doc } });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateProfile = [
  body("businessId")
    .not()
    .isEmpty()
    .withMessage("businessId Field is required"),
  async (req, res) => {
    try {
      const updateBusiness = await PartnerBusiness.findOneAndUpdate(
        { businessId: req.body.businessId },
        { ...req.body },
        { new: true }
      );
      if (updateBusiness) {
        res.status(200).json({ data: updateBusiness });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllPatnerStamps = [
  async (req, res) => {
    try {
      const currentDate = moment();
      const lastMonthDate = moment().subtract(1, "months");

      const findStamp = await Stamp.find({ businessId: req.params.id });
      if (findStamp) {
        const currentMonthData = await Stamp.find({
          businessId: req.params.id,
          createdAt: {
            $gte: currentDate.startOf("month").toDate(),
            $lte: currentDate.endOf("month").toDate(),
          },
        });
        const previousMonthData = await Stamp.find({
          businessId: req.params.id,
          createdAt: {
            $gte: lastMonthDate.startOf("month").toDate(),
            $lte: lastMonthDate.endOf("month").toDate(),
          },
        });
        const currentMonthCount = currentMonthData.length;
        const previousMonthCount = previousMonthData.length;
        res.status(200).json({
          data: findStamp,
          currentMonthDataCount: currentMonthCount,
          previousMonthDataCount: previousMonthCount,
          count: findStamp.length,
        });
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error });
    }
  },
];

module.exports.getMeetingDetails = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    const { businessId } = req.query;

    const stats = await Invitations.aggregate([
      {
        $match: {
          businessId: new mongoose.Types.ObjectId(businessId),
        },
      },
      {
        $group: {
          _id: null,
          totalMeetings: {
            $sum: { $cond: [{ $eq: ["$status", "Accepted"] }, 1, 0] },
          },
          totalThisMonthMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Accepted"] },
                    {
                      $gt: [
                        "$date",
                        new Date(
                          moment().startOf("month").format("YYYY-MM-DD")
                        ),
                      ],
                    }, // $gt condition
                    {
                      $lt: [
                        "$date",
                        new Date(moment().endOf("month").format("YYYY-MM-DD")),
                      ],
                    }, // $lt condition
                  ],
                },
                1,
                0,
              ],
            },
          },
          totalPastMonthMeetings: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$status", "Accepted"] },
                    {
                      $gt: [
                        "$date",
                        new Date(
                          moment()
                            .subtract(1, "months")
                            .startOf("month")
                            .format("YYYY-MM-DD")
                        ),
                      ],
                    }, // $gt condition
                    {
                      $lt: [
                        "$date",
                        new Date(
                          moment()
                            .subtract(1, "months")
                            .endOf("month")
                            .format("YYYY-MM-DD")
                        ),
                      ],
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
    ]);

    const finalCount = stats[0];

    const totalMeetings = finalCount ? finalCount.totalMeetings : 0;
    const totalThisMonthMeetings = finalCount
      ? finalCount.totalThisMonthMeetings
      : 0;
    const totalPastMonthMeetings = finalCount
      ? finalCount.totalPastMonthMeetings
      : 0;

    res.status(200).json({
      totalMeetings,
      totalThisMonthMeetings,
      totalPastMonthMeetings,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
