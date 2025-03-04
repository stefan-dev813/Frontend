const Stamp = require("../../models/User/stamp");
const Voucher = require("../../models/Admin/voucher");
const { body, validationResult, query } = require("express-validator");
const generateUniqueRandomNumber = require("../../util/generateUniqueNumber");
const mongoose = require("mongoose");
module.exports.createStamp = [
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
      const createStamp = await Stamp.create({
        ...req.body,
        userId: req.user._id,
      });
      await createStamp.populate("businessId");
      if (createStamp) {
        const totalStampCount = await Stamp.countDocuments({
          ...req.body,
          userId: req.user._id,
        });
        let createVoucher;

        if (totalStampCount % 5 === 0) {
          const expiredAt = new Date();
          expiredAt.setHours(expiredAt.getHours() + 26);
          const uniqueRandomNumber = await generateUniqueRandomNumber();
          createVoucher = await Voucher.create({
            name: "voucher",
            code: uniqueRandomNumber,
            percentage: 10,
            userId: req.user._id,
            stampId: createStamp._id,
            businessId: createStamp.businessId,
            expiryDate: expiredAt,
          });
        }
        res
          .status(200)
          .json({ data: createStamp, totalStampCount, createVoucher });
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getAllUserStamps = [
  async (req, res) => {
    try {
      const pipeline = [
        {
          $group: {
            _id: {
              userId: "$userId",
              businessId: "$businessId",
            },

            count: { $sum: 1 },
            stampId: { $first: "$_id" },
          },
        },
        {
          $lookup: {
            from: "partnerbusinesses",
            localField: "_id.businessId",
            foreignField: "_id",
            as: "businessDetails",
          },
        },
        {
          $lookup: {
            from: "vocuhers",
            localField: "_id.userId",
            foreignField: "userId",
            as: "vouchers",
          },
        },

        {
          $project: {
            _id: "$stampId",
            userId: "$_id.userId",
            businessId: "$_id.businessId",
            count: "$count",

            businessDetails: { $arrayElemAt: ["$businessDetails", 0] },
            vouchers: "$vouchers", // Include voucher data in the result
          },
        },
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.user._id),
          },
        },
      ];

      const findStamp = await Stamp.aggregate(pipeline);
      if (findStamp) {
        res.status(200).json({ data: findStamp, count: findStamp.length });
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error });
    }
  },
];
