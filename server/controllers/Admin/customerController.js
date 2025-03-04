const User = require("../../models/User/User");
const { body, validationResult, query } = require("express-validator");
const Report = require("../../models/User/reportUser");
const moment = require("moment");
module.exports.getAllUsers = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let obj = {};
    let {
      status,
      search,
      registerationStartDate,
      registerationEndDate,
      gender,
      city,
      ageRangeStart,
      ageRangeEnd,
      didNotAttendMeetingCount,
    } = req.query;
    const currentDate = new Date();

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
    if (ageRangeStart && ageRangeEnd) {
      obj["dob"] = {
        $gte: new Date(currentDate.getFullYear() - ageRangeEnd, 0, 1),
        $lte: new Date(currentDate.getFullYear() - ageRangeStart + 1, 0, 1),
      };
    }

    if (gender) {
      obj["gender"] = gender;
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

    if (req.query.search) {
      obj = {
        $or: [
          { userName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      };
    }

    if (didNotAttendMeetingCount) {
      obj["didNotAttendMeetingCount"] = Number(didNotAttendMeetingCount);
    }

    let filterObj = {};
    if (status === "Standard") {
      filterObj["deleted"] = false;
      filterObj["isPremium"] = false;
    }
    if (status === "Premium") {
      filterObj["deleted"] = false;
      filterObj["isPremium"] = true;
    }
    if (status === "Deleted") {
      filterObj["deleted"] = true;
    }

    const data = await User.aggregate([
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
          data: [{ $skip: limit * (page - 1) }, { $limit: limit }],
          totalCount: [
            { $group: { _id: null, count: { $sum: 1 } } },
            { $project: { _id: 0, count: 1 } },
          ],
        },
      },
    ]);

    const stats = await User.aggregate([
      {
        $match: { ...obj },
      },
      {
        $group: {
          _id: null,

          standardUser: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    { $eq: ["$isPremium", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          premiumUser: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    { $eq: ["$isPremium", true] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          deletedUser: {
            $sum: {
              $cond: [
                {
                  $and: [{ $eq: ["$deleted", true] }],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    const result = stats[0];

    if (data && data.length > 0) {
      const standardUser = result ? result.standardUser : 0;
      const premiumUser = result ? result.premiumUser : 0;
      const deletedUser = result ? result.deletedUser : 0;

      res.status(200).json({
        data: data[0]["data"],
        standardUser,
        totalUsers: deletedUser + standardUser + premiumUser,
        premiumUser,
        deletedUser,
        perPage: limit,
        totalPage: Math.ceil(
          data[0].totalCount.length > 0
            ? data[0].totalCount[0].count / limit
            : 0
        ),
        totalCount:
          data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
      });
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};

module.exports.getSingleUser = [
  query("userId").not().isEmpty().withMessage("userId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { userId } = req.query;
      const user = await User.findById(userId);
      if (user) {
        res.status(200).json({ user });
      } else throw Error("User not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.updateCustomer = [
  body("userId").not().isEmpty().withMessage("userId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const data = await User.findOneAndUpdate(
        { _id: req.body.userId },
        { ...req.body },
        { new: true }
      );
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.findAllFeedbackById = async (req, res) => {
  try {
    const findAllFeedback = await Report.find({ reportedTo: req.params.id })
      .populate("reportedBy")
      .populate("reportedTo");
    if (!findAllFeedback) {
      res.status(404).json({ message: "user does not exist" });
    } else {
      res.status(200).json({ findAllFeedback });
    }
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.findAllFeedback = async (req, res) => {
  const { userName, email, reportedToUserName, reportedToEmail, userType } =
    req.query; // Assuming query parameters

  let obj = {};
  if (userType === "STANDARD") {
    obj["reportedToDetails.isPremium"] = false;
  }
  if (userType === "PREMIUM") {
    obj["reportedToDetails.isPremium"] = true;
  }

  try {
    let aggregationPipeline = [
      {
        $lookup: {
          from: "users",
          localField: "reportedBy",
          foreignField: "_id",
          as: "reportedByDetails",
        },
      },
      {
        $unwind: {
          path: "$reportedByDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "reportedTo",
          foreignField: "_id",
          as: "reportedToDetails",
        },
      },
      {
        $unwind: {
          path: "$reportedToDetails",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $match: {
          ...obj,
        },
      },
    ];
    if (userName) {
      aggregationPipeline.push({
        $match: {
          "reportedByDetails.userName": userName,
        },
      });
    }

    if (email) {
      aggregationPipeline.push({
        $match: {
          "reportedByDetails.email": email,
        },
      });
    }

    if (reportedToUserName) {
      aggregationPipeline.push({
        $match: {
          "reportedToDetails.userName": reportedToUserName,
        },
      });
    }

    if (reportedToEmail) {
      aggregationPipeline.push({
        $match: {
          "reportedToDetails.email": reportedToEmail,
        },
      });
    }

    const findFeedback = await Report.aggregate(aggregationPipeline);

    res.status(200).json({ findFeedback });
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.deletePermanently = async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.body.userId },
      { deletePermanently: true },
      { new: true }
    );
    if (updatedUser) {
      const deletedUser = await User.findOneAndDelete({
        _id: updatedUser._id,
        deletePermanently: true,
      });

      if (deletedUser) {
        return res.status(200).json({ message: "User deleted permanently" });
      } else {
        return res.status(500).json({ message: "Failed to delete user" });
      }
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
