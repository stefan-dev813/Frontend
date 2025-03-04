const Voucher = require("../../models/Admin/voucher");
const { query, validationResult } = require("express-validator");

function compareDates(date) {
  const leftDate = new Date(date);
  const rightDate = new Date();
  console.log(leftDate, rightDate, leftDate >= rightDate);
  return leftDate >= rightDate;
}

const voucherPercentage = {
  "75% off": 75,
  "50% off": 50,
  "25% off": 25,
};

module.exports.checkVoucherDetails = [
  query("code").not().isEmpty().withMessage("code Field is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const { code } = req.query;
      const findVoucher = await Voucher.findOne({
        // endDate: { $gte: new Date() },
        userType: "USER",
        code,
      });
      if (!findVoucher) {
        res.status(400).json({ message: "Please enter valid code" });
      } else {
        if (compareDates(findVoucher.endDate)) {
          res.status(200).json({
            message: "Code is valid",
            data: findVoucher,
            offPercentage: voucherPercentage[findVoucher.percentage],
          });
        } else {
          res.status(400).json({ message: "Code is expired" });
        }
      }
    } catch (err) {
      let error = err.message;
      res.status(400).json({ error: error });
    }
  },
];
