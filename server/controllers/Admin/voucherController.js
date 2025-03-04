const moment = require("moment");
const Voucher = require("../../models/Admin/voucher");
const { body, validationResult, query } = require("express-validator");
module.exports.createVoucher = [
  body("name").not().isEmpty().withMessage("name Field is required"),
  body("code").not().isEmpty().withMessage("code Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createVoucher = await Voucher.create({ ...req.body });
      if (createVoucher) {
        res.status(200).json({ data: createVoucher });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.updateVoucher = [
  body("voucherId").not().isEmpty().withMessage("voucherId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const createVoucher = await Voucher.findByIdAndUpdate(
        { _id: req.body.voucherId },
        { ...req.body },
        { new: true }
      );
      if (createVoucher) {
        res.status(200).json({ data: createVoucher });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.getSingleVoucher = [
  query("voucherId").not().isEmpty().withMessage("voucherId Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { voucherId } = req.query;
      const data = await Voucher.findById({ _id: voucherId });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
module.exports.getAllVoucher = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let filterObj = {};
    let { search, type, userType } = req.query;

    if (userType) {
      obj["userType"] = userType;
      filterObj["userType"] = userType;
    } else {
      obj["userType"] = "PARTNER";
      filterObj["userType"] = "PARTNER";
    }

    if (search) {
      obj = {
        name: { $regex: search, $options: "i" },
      };
    }

    if (type === "Current") {
      obj.endDate = { $gte: new Date(moment().format("YYYY-MM-DD")) };
    }
    if (type === "History") {
      obj.endDate = { $lt: new Date(moment().format("YYYY-MM-DD")) };
    }

    const data = await Voucher.aggregate([
      {
        $match: {
          deleted: false,
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

    const stats = await Voucher.aggregate([
      {
        $match: { ...filterObj },
      },
      {
        $group: {
          _id: null,
          currentVoucher: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$deleted", false] },
                    {
                      $gte: [
                        "$endDate",
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
          historyVoucher: {
            $sum: {
              $cond: [
                {
                  $and: [
                    {
                      $lt: [
                        "$endDate",
                        new Date(moment().format("YYYY-MM-DD")),
                      ],
                    },
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
          currentVoucher: 1,
          historyVoucher: 1,
        },
      },
    ]);
    const result = stats[0];

    const currentVoucher = result ? result.currentVoucher : 0;
    const historyVoucher = result ? result.historyVoucher : 0;

    res.status(200).json({
      data: data[0]["data"],
      totalData:
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count : 0,
      totalPage: Math.ceil(
        data[0].totalCount.length > 0 ? data[0].totalCount[0].count / limit : 0
      ),
      currentVoucher,
      historyVoucher,
      perPage: limit,
      currentPage: page,
    });
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: "Something Went Wrong" });
  }
};
