const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const otpSchema = new mongoose.Schema(
  {
    otp: {
      type: Number,
    },
    email: {
      type: String,
    },
  },
  { timestamps: true }
);

otpSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const OtpManager = mongoose.model("OtpManager", otpSchema);

module.exports = OtpManager;
