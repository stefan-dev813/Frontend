const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const voucherSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
    },
    code: {
      type: String,
      index: true,
    },
    percentage: {
      type: String,
    },
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    stampId: { type: mongoose.Schema.Types.ObjectId, ref: "Stamp" },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerBusiness",
    },

    //   status: {
    //     type: String,
    //     enum: ["Active", "Requested", "Blacklisted"],
    //     default: "Requested",
    //   },
    userType: {
      type: String,
      enum: ["PARTNER", "USER"],
      default: "PARTNER",
      index: true,
    },
    expiryDate: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

voucherSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Voucher = mongoose.model("voucher", voucherSchema);

module.exports = Voucher;
