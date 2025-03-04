const Reviews = require("../../models/Partner/reviews");
const { body, validationResult } = require("express-validator");
module.exports.addReviews = [
  body("businessId")
    .not()
    .isEmpty()
    .withMessage("businessId Field is required"),
  body("rating").not().isEmpty().withMessage("rating Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const userId = req.user._id;
      const data = await Reviews.create({ ...req.body, userId });
      if (data) {
        res.status(200).json({ data });
      } else throw Error("Something went wrong");
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
