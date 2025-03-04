const User = require("../../models/Partner/Partner");
const UserBusiness = require("../../models/Partner/partnerBusiness");
const bcrypt = require("bcryptjs");
const { createToken } = require("../../middleware/createToken");
const { body, validationResult } = require("express-validator");
const { sendEmail } = require("../../util/sendEmail");

module.exports.register = [
  body("legalDetails")
    .not()
    .isEmpty()
    .withMessage("legalDetails Field is required"),
  body("businessDetails")
    .not()
    .isEmpty()
    .withMessage("businessDetails Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { legalDetails, businessDetails } = req.body;
      if (legalDetails) {
        let findUser = await User.findOne({ email: legalDetails.email });

        if (findUser) {
          res
            .status(400)
            .json({ error: `Partner already registered with this email` });
        } else {
          const hashedPassword = await bcrypt.hash("12345678", 10);

          const user = await User.create({
            ...legalDetails,
            password: hashedPassword,
          });
          if (user) {
            await UserBusiness.create({
              ...businessDetails,
              partnerId: user._id,
            });
      
            const token = await createToken(user);
            res.status(201).json({ user: user, token: token });
          }
        }
      }
    } catch (err) {
      let error = err.message;
      if (err.code == 11000) {
        error = ` Email already exists`;
      }
      res.status(400).json({ error: error });
    }
  },
];

module.exports.login = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  body("password").not().isEmpty().withMessage("password Field is required"),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ email });

      if (user) {
        if (user.status === "Active") {
          const auth = await bcrypt.compare(password, user.password);
          if (auth) {
            let business = await UserBusiness.findOne({ partnerId: user._id });
            const token = await createToken(user);
            const data = {
              ...user._doc,
              category: business.category,
              photos: business.photos,
            };

            res.status(200).json({ user: data, token });
          } else throw Error("Please Enter Correct Password");
        } else throw Error("Please contact admin");
      } else throw Error("Email id is not connected to any user.");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.forgotPassword = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  body("password").not().isEmpty().withMessage("password Field is required"),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const user = await User.findOne({ email });
      if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
          res
            .status(400)
            .json({ message: "Old and New password can't be same" });
        } else {
          const salt = await bcrypt.genSalt();
          const hashedPassword = await bcrypt.hash(password, salt);
          const updatePassword = await User.findOneAndUpdate(
            { email },
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

module.exports.checkUserEmail = [
  body("email").not().isEmpty().withMessage("email Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email } = req.body;
    try {
      let findUser = await User.findOne({ email, deleted: false });
      if (findUser) {
        res
          .status(200)
          .json({ status: true, message: "Email already registered" });
      } else {
        res
          .status(200)
          .json({ status: false, message: "Email Not registered" });
      }
    } catch (err) {
      let error = err.message;
      if (err.code == 11000) {
        error = ` Email already exists`;
      }
      res.status(400).json({ error: error });
    }
  },
];
