const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const Schema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      index: true,
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerBusiness",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerAds",
      index: true,
    },
    extAdId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "externalPartnerAds",
      index: true,
    },
    actionTime: {
      type: Date,
    },

    actionType: {
      type: String,
      enum: ["IMPRESSION", "CLICK"],
      default: "CLICK",
    },
  },
  {
    timestamps: true,
  }
);

Schema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Analytics = mongoose.model("Analytics", Schema);

module.exports = Analytics;
