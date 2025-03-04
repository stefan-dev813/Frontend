const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const notificationSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["Pending", "Rejected", "Ended", "Accepted"],
      default: "Pending",
      index: true,
    },
    name: {
      type: String,
    },
    title: {
      type: String,
      index: true,
    },
    body: {
      type: String,
    },
    cities: [],
    sendTo: {
      type: String,
      enum: ["All", "Custom"],
      default: "All",
      index: true,
    },

    releaseDate: {
      type: Date,
      index: true,
    },
    releaseTime: {
      type: String,
    },

    type: {
      type: String,
      enum: ["PARTNER", "USER"],
      default: "USER",
      index: true,
    },
    userType: {
      type: String,
      enum: [
        "STANDARD",
        "PREMIUM",
        "ALL_USER",
        "INTERPRISE",
        "STARTER",
        "BUSINESS",
      ],
      default: "ALL_USER",
    },
    platform: {
      type: String,
    },
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
    },
  },
  {
    timestamps: true,
  }
);

notificationSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const notification = mongoose.model("notifications", notificationSchema);

module.exports = notification;
