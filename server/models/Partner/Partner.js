const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const partnerSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      index: true,
    },
    fcmToken: {
      type: String,
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    isWebsiteNotification: {
      type: Boolean,
      default: false,
    },
    isEmailNotification: {
      type: Boolean,
      default: false,
    },
    lastName: {
      type: String,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    mobile: {
      type: String,
      index: true,
    },
    jobPosition: {
      type: String,
    },
    dob: {
      type: String,
    },
    gender: {
      type: String,
    },
    location: {
      type: String,
    },
    password: {
      type: String,
    },
    active: {
      type: Boolean,
      default: false,
    },
    isNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ["Active", "Requested", "Blacklisted", "Deleted", "Rejected"],
      default: "Requested",
      index: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["PARTNER"],
      default: "PARTNER",
    },
  },
  { timestamps: true }
);

partnerSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Partner = mongoose.model("partner", partnerSchema);

module.exports = Partner;
