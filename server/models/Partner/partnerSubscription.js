const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const Schema = new mongoose.Schema(
  {
    partnerId: { type: mongoose.Schema.Types.ObjectId, ref: "partner" },
    expireAt: {
      type: Date,
    },
    subscriptionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subscription",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

Schema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const PartnerSubscription = mongoose.model("partnerSubscription", Schema);

module.exports = PartnerSubscription;
