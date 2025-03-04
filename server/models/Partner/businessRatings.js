const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const Schema = new mongoose.Schema(
  {
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerBusiness",
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    comment: {
      type: String,
    },
    rating: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

Schema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Reviews = mongoose.model("Review", Schema);

module.exports = Reviews;
