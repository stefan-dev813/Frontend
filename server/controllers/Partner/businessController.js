const Business = require("../../models/Partner/partnerBusiness");
const { query, body, validationResult } = require("express-validator");

module.exports.createBusiness = [
  body("name").not().isEmpty().withMessage("name Field is required"),
  body("location").not().isEmpty().withMessage("location Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const partnerId = req.user._id;
      const createBusiness = await Business.create({ ...req.body, partnerId });
      if (createBusiness) {
        res.status(200).json({ data: createBusiness });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];

module.exports.updateBusiness = [
  body("businessId")
    .not()
    .isEmpty()
    .withMessage("businessId Field is required"),
  async (req, res) => {
    try {
      const updateBusiness = await Business.findOneAndUpdate(
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

module.exports.getBusiness = [
  query("_id").not().isEmpty().withMessage("_id Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { _id } = req.query;
      let obj = {};
      if (_id) {
        obj = {
          $or: [{ _id }, { partnerId: _id }],
        };
      }
      console.log({ ...obj });
      const findBusiness = await Business.findOne({ ...obj });
      if (findBusiness) {
        res.status(200).json({ data: findBusiness });
      } else throw Error("No data found");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];


