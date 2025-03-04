const Subscription = require("../../models/Admin/subscription");
const User = require("../../models/User/User");
const UserSubscription = require("../../models/User/userSubscription");
const { body, validationResult, query } = require("express-validator");

module.exports.createSubscription = [
  body("planName").not().isEmpty().withMessage("planName Field is required"),
  body("timePeriod")
    .not()
    .isEmpty()
    .withMessage("timePeriod Field is required"),
  body("price").not().isEmpty().withMessage("price Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createSubscription = await Subscription.create({ ...req.body });
      if (createSubscription) {
        res.status(200).json({ data: createSubscription });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateSubscription = [
  body("planId").not().isEmpty().withMessage("planId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const updatePlan = await Subscription.findOneAndUpdate(
        { _id: req.body.planId },
        { ...req.body },
        { new: true }
      );
      if (updatePlan) {
        res.status(200).json({ data: updatePlan });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllSubscription = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let { search, userType } = req.query;

    if (search) {
      obj = {
        planName: { $regex: search, $options: "i" },
      };
    }
    if (userType) {
      obj["userType"] = userType;
    }
    const data = await Subscription.find({ ...obj })
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await Subscription.find({
      deleted: false,
      ...obj,
    }).countDocuments();

    res.status(200).json({
      data: data,
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

module.exports.getSingleSubscription = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      const data = await Subscription.findById({ _id });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllPremiumUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let {
      search,
      registerationStartDate,
      registerationEndDate,
      gender,
      city,
      ageRangeStart,
      ageRangeEnd,
    } = req.query;

    const currentDate = new Date();
    if (ageRangeStart && ageRangeEnd) {
      obj["dob"] = {
        $gte: new Date(currentDate.getFullYear() - ageRangeEnd, 0, 1),
        $lte: new Date(currentDate.getFullYear() - ageRangeStart + 1, 0, 1),
      };
    }

    if (ageRangeStart) {
      obj["dob"] = {
        $lte: new Date(currentDate.getFullYear() - ageRangeStart + 1, 0, 1),
      };
    }
    if (ageRangeEnd) {
      obj["dob"] = {
        $gte: new Date(currentDate.getFullYear() - ageRangeEnd, 0, 1),
      };
    }
    if (gender) {
      obj["age"] = gender;
    }
    if (city) {
      obj["city"] = new RegExp(city, "i");
    }
    if (registerationStartDate) {
      obj["releaseDate"] = {
        $gte: new Date(registerationStartDate),
      };
    }
    if (registerationEndDate) {
      obj["releaseDate"] = {
        $lte: new Date(moment(registerationEndDate).endOf("day")),
      };
    }
    if (registerationStartDate && registerationEndDate) {
      obj["releaseDate"] = {
        $gte: new Date(registerationStartDate),
        $lte: new Date(moment(registerationEndDate).endOf("day")),
      };
    }
    if (search) {
      obj = {
        $or: [
          { userName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }
    const userSubscription = await User.aggregate([
      {
        $match: {
          isPremium: true,
          deleted: false,
          ...obj,
        },
      },
      {
        $lookup: {
          from: "usersubscriptions",
          let: { userId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$userId"] },
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
        $facet: {
          metadata: [
            { $count: "totalData" },
            {
              $addFields: {
                currentPage: parseInt(page),
                perPage: limit,
                totalPage: {
                  $ceil: {
                    $divide: ["$totalData", limit],
                  },
                },
              },
            },
          ],
          data: [{ $skip: skipValue }, { $limit: limit }],
        },
      },
      { $unwind: "$metadata" },
    ]);
    const data = userSubscription.length ? userSubscription[0].data : [];
    if (data) {
      let metadata = userSubscription.length
        ? userSubscription[0].metadata
        : {};

      res.json({
        data,
        ...metadata,
        isNextPageAvailable: metadata.currentPage < metadata.totalPage,
      });
    } 
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
