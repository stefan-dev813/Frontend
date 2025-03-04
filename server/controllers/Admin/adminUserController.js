const User = require("../../models/Admin/Admin");
const Stamp = require("../../models/User/stamp");
const { body, validationResult, query } = require("express-validator");
const bcrypt = require("bcryptjs");

module.exports.forgotPassword = [
  body("password").not().isEmpty().withMessage("password Field is required"),
  body("oldPassword")
    .not()
    .isEmpty()
    .withMessage("oldPassword Field is required"),
  async (req, res) => {
    const { password, oldPassword } = req.body;
    try {
      const userId = req.user._id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ _id: userId });
      if (user) {
        const auth = await bcrypt.compare(oldPassword, user.password);
        if (!auth) {
          res.status(400).json({ message: "Please enter correct password" });
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(password, salt);
          const updatePassword = await User.findOneAndUpdate(
            { _id: user._id },
            { password: hashedPassword },
            { new: true, useFindAndModify: false }
          );
          res.status(200).json({
            message: "Password Updated Successfuly",
            user: updatePassword,
          });
        }
      } else throw Error("User not found with given Email");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.getUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (user) {
      res.status(200).json({ user });
    } else throw Error("User not found");
  } catch (err) {
    let error = err.message;
    res.status(400).json({ error: error });
  }
};

module.exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.body;
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

module.exports.getAllSubAdmins = async (req, res) => {
  try {
    let page = parseInt(req.query.page ? req.query.page : 1);
    let limit = parseInt(req.query.limit ? req.query.limit : 100);
    let skipValue = (page - 1) * limit;
    let obj = {};
    let { search } = req.query;

    if (search) {
      obj = {
        email: { $regex: search, $options: "i" },
        name: { $regex: search, $options: "i" },
      };
    }
    const data = await User.find({ userType: "SUB-ADMIN", ...obj })
      .skip(skipValue)
      .limit(limit)
      .sort({ createdAt: -1 });

    let count = await User.find({
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

module.exports.getUserById = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      const data = await User.findById({ _id });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("data not found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
