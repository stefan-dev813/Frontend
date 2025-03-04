const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const partnerBusinessSchema = new mongoose.Schema(
  {
    photos: [],
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
      index: true,
    },

    name: {
      type: String,
    },
    category: {
      type: String,
    },
    city: {
      type: String,
    },
    taxNumber: {
      type: String,
    },
    businessEmail: {
      type: String,
    },
    businessMobile: {
      type: String,
    },
    businessTel: {
      type: String,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        index: "2dsphere",
      },
    },

    address: {
      type: String,
    },
    isPartnerActive: {
      type: Boolean,
      default: false,
    },
    buinessSchedule: [
      {
        status: Boolean,
        day: String,
        from: String,
        to: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

partnerBusinessSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Business = mongoose.model("partnerBusiness", partnerBusinessSchema);

module.exports = Business;
