const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const subscriptionSchema = new mongoose.Schema(
  {
    planName: {
      type: String,
      index: true,
    },
    timePeriod: {
      type: Number,
    },
    price: {
      type: Number,
    },
    features: {
      type: String,
    },

    status: {
      type: Boolean,
      default: true,
    },

    userType: {
      type: String,
      required: true,
      enum: ["PARTNER", "USER"],
      default: "USER",
    },
  },
  {
    timestamps: true,
  }
);

subscriptionSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Subscription = mongoose.model("Subscription", subscriptionSchema);

module.exports = Subscription;
