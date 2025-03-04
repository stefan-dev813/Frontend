const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const partnerAdsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      index: true,
    },
    title: {
      type: String,
      index: true,
    },
    body: {
      type: String,
    },
    image: {
      type: String,
    },
    releaseDate: {
      type: Date,
      index: true,
    },
    buttonUrl: {
      type: String,
    },
    releaseTime: {
      type: String,
    },
    legalRepresentative: {
      type: Object,
    },
    companyName: {
      type: String,
    },
    companyTaxNumber: {
      type: String,
    },
    address: {
      type: String,
    },
    businessEmail: {
      type: String,
    },
    businessMobile: {
      type: String,
    },
    category: {
      type: String,
    },
    location: {
      type: String,
    },
    city: {
      type: String,
    },
    targetGroup: {
      type: String,
    },
    ageRange: {
      type: Array,
      default: [18, 80],
    },
    adType: {
      type: String,
      enum: ["Feed", "Suggestion", "Fullscreen"],
      default: "Feed",
      index: true,
    },
    // status: {
    //   type: String,
    //   enum: ["Requested", "Approved", "Rejected", "Cancelled", "Live", "Ended"],
    //   default: "Requested",
    //   index: true,
    // },
  },
  {
    timestamps: true,
  }
);

partnerAdsSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const PartnerAds = mongoose.model("externalPartnerAds", partnerAdsSchema);

module.exports = PartnerAds;
