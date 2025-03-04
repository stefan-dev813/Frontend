const User = require("../../models/User/User");
const bcrypt = require("bcryptjs");
const { createToken } = require("../../middleware/createToken");
const { body, validationResult } = require("express-validator");
const { sendEmail } = require("../../util/sendEmail");

module.exports.register = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let findUser = await User.findOne({ email: req.body.email });
      if (!findUser) {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        req.body.password = hashedPassword;

        const user = await User.create({ ...req.body });
        const token = await createToken(user);
        const mailOptions = {
          from: process.env.EMAIL,
          to: req.body.email,
          subject: "Welcome to Our Platform!",
          text: `Hello,\n
          Thank you for registering on our platform! We're excited to have you on board.\n
          Your account has been created and you can now log in using yout creds.\n
          Thank you and Best regards\n
          Netme`,
        };
        await sendEmail(mailOptions);
        res.status(201).json({ user: user, token: token });
      } else
        throw Error(`User Already Loginned with ${findUser.verificationType}`);
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
      const user = await User.findOne({ email, verificationType: "EMAIL" });

      if (user) {
        const auth = await bcrypt.compare(password, user.password);
        if (auth) {
          const token = await createToken(user);
          res.status(200).json({ user, token });
        } else throw Error("Please Enter Correct Password");
      } else throw Error("Email id is not connected to any user.");
    } catch (err) {
      console.log(err);
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.googleAuth = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  async (req, res) => {
    const { email } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const findUser = await User.findOne({ email });
      if (findUser) {
        if (findUser.verificationType !== "GOOGLE") {
          throw Error(
            `Please Use ${findUser.verificationType ?? "EMAIL"} to login`
          );
        } else {
          const token = await createToken(findUser);
          res.status(200).json({ user: findUser, token });
        }
      } else {
        const createUser = await User.create({
          email,
          verificationType: "GOOGLE",
        });
        if (createUser) {
          const token = await createToken(createUser);
          res.status(200).json({ user: createUser, token });
        }
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.socialAuth = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  async (req, res) => {
    const { email, type, appleUniqueKey } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const findUser = await User.findOne({ email });
      if (findUser) {
        if (findUser.verificationType !== type) {
          throw Error(
            `An Account is already linked to this Email. Please login`
          );
        } else {
          const token = await createToken(findUser);
          res.status(200).json({ user: findUser, token });
        }
      } else {
        const createUser = await User.create({
          ...req.body,
          verificationType: type,
        });
        if (createUser) {
          const token = await createToken(createUser);
          res.status(200).json({ user: createUser, token });
        }
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.facebookAuth = [
  body("email").not().isEmpty().withMessage("email Field is required"),
  async (req, res) => {
    const { email, userName } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const findUser = await User.findOne({ email });
      if (findUser) {
        if (findUser.verificationType !== "FACEBOOK") {
          throw Error(
            `An Account is already linked to this Email. Please login`
          );
        } else {
          const token = await createToken(findUser);
          res.status(200).json({ user: findUser, token });
        }
      } else {
        const createUser = await User.create({
          email,
          userName,
          verificationType: "FACEBOOK",
        });
        if (createUser) {
          const token = await createToken(createUser);
          res.status(200).json({ user: createUser, token });
        }
      }
    } catch (err) {
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

module.exports.checkUserAppleKey = [
  body("appleUniqueKey")
    .not()
    .isEmpty()
    .withMessage("appleUniqueKey Field is required"),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { appleUniqueKey } = req.body;
    try {
      let findUser = await User.findOne({
        appleUniqueKey,
      });
      if (findUser) {
        res
          .status(200)
          .json({ status: true, message: "Key already registered" });
      } else {
        res
          .status(200)
          .json({ status: false, message: "Key Not registered" });
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

module.exports.appleAuth = [
  body("appleUniqueKey")
    .not()
    .isEmpty()
    .withMessage("appleUniqueKey Field is required"),
  async (req, res) => {
    const { email, type, appleUniqueKey } = req.body;
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      const findUser = await User.findOne({ appleUniqueKey });
      if (findUser) {
        if (findUser.verificationType !== type) {
          throw Error(
            `An Account is already linked to this Email. Please login`
          );
        } else {
          const token = await createToken(findUser);
          res.status(200).json({ user: findUser, token });
        }
      } else {
        const createUser = await User.create({
          ...req.body,
          verificationType: type,
        });
        if (createUser) {
          const token = await createToken(createUser);
          res.status(200).json({ user: createUser, token });
        }
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
