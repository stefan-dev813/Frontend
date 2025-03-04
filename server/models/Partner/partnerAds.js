const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const partnerAdsSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      index: true,
    },
    name: {
      type: String,
    },
    image: {
      type: String,
    },
    title: {
      type: String,
    },
    body: {
      type: String,
    },
    location: {
      type: String,
    },
    cities: [],
    releaseDate: {
      type: Date,
      index: true,
    },
    releaseTime: {
      type: String,
    },
    adType: {
      type: String,
      enum: ["Feed", "Suggestion", "Fullscreen"],
      default: "Feed",
      index: true,
    },
    status: {
      type: String,
      enum: [
        "Requested",
        "Approved",
        "Rejected",
        "Cancelled",
        "Live",
        "Ended",
        "WithDrawed",
      ],
      default: "Requested",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

partnerAdsSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const PartnerAds = mongoose.model("partnerAds", partnerAdsSchema);

module.exports = PartnerAds;
