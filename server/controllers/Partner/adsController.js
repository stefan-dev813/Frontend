const Ads = require("../../models/Partner/partnerAds");
const ExternalAds = require("../../models/Partner/externanAd");
const { query, body, validationResult } = require("express-validator");
const { sendEmail } = require("../../util/sendEmail");
const moment = require("moment");
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
      const partnerId = req.user._id;
      const createAds = await Ads.create({ ...req.body, partnerId });
      if (createAds) {
        res.status(200).json({ data: createAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateAds = [
  body("businessId")
    .not()
    .isEmpty()
    .withMessage("businessId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { businessId } = req.body;
      const updateBusiness = await Ads.findOneAndUpdate(
        { businessId },
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

module.exports.getAds = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { _id } = req.query;
      const findBusiness = await Ads.findOne({ _id });
      if (findBusiness) {
        res.status(200).json({ data: findBusiness });
      } else throw Error("No data found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

function generateEmailText(data) {
  return `
You have received new ad request,
Name: ${data.legalRepresentative.firstName} ${data.legalRepresentative.lastName},
Email: ${data.legalRepresentative.email},
Title: ${data.title},
Release Date: ${data.releaseDate},
Company Name: ${data.companyName},
Address: ${data.address},
Business Email: ${data.businessEmail},
Business Mobile: ${data.businessMobile},
Category: ${data.category},
Ad Type: ${data.adType}
`;
}

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
        const mailOptions = {
          from: process.env.EMAIL,
          to: "ads@netme.eu",
          subject: "New ad request",
          text: generateEmailText(createAds),
        };
        await sendEmail(mailOptions);
        res.status(200).json({ data: createAds });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllAds = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let filterObj = {};
    let { status, search, startDate, endDate } = req.query;

    const currentDate = new Date(moment().format("YYYY-MM-DD"));
    if (status === "History" || status.includes("History")) {
      obj = {
        ...obj,
        $or: [{ releaseDate: { $lt: currentDate } }, { status: "Ended" }],
      };
    }

    if (status === "Overview" || status.includes("Overview")) {
      obj.releaseDate = { $gte: currentDate };
      obj.deleted = false;
    }

    if (
      status === "Requested" ||
      status === "Rejected" ||
      status === "Approved" ||
      typeof status === "object"
    ) {
      if (typeof status === "object") {
        obj.status = { $in: status };
        filterObj.status = { $in: status };
      } else {
        obj.status = { $in: [status] };
        filterObj.status = { $in: [status] };
      }
    }

    if (startDate) {
      obj.createdAt = {
        $gte: new Date(startDate),
      };
      filterObj.createdAt = {
        $gte: new Date(startDate),
      };
    }
    if (endDate) {
      obj.createdAt = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
      filterObj.createdAt = {
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }
    if (startDate && endDate) {
      obj.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
      filterObj.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(moment(endDate).endOf("day")),
      };
    }

    if (search) {
      obj.name = { $regex: search, $options: "i" };
      filterObj.name = { $regex: search, $options: "i" };
    }

    const data = await Ads.aggregate([
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
    console.log(obj, filterObj);
    const stats = await Ads.aggregate([
      {
        $match: { ...filterObj },
      },
      {
        $group: {
          _id: null,
          overView: {
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
                  $or: [
                    { $lt: ["$releaseDate", currentDate] },
                    { $eq: ["$status", "Ended"] },
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
        },
      },
    ]);
    const result = stats[0];
    const overView = result ? result.overViewCount : 0;
    const historyCount = result ? result.historyCount : 0;

    res.status(200).json({
      data: data[0]["data"],
      overViewCount: overView,
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
