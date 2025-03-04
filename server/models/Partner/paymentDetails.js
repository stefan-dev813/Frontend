const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const paymentDetailsSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partner",
    },
    cardNumber: {
      type: Number,
    },
    expireDate: {
      type: Date,
    },
    cvv: {
      type: String,
    },
    postalCode: {
      type: String,
    },
    method: [],
  },
  {
    timestamps: true,
  }
);

paymentDetailsSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const paymentDetails = mongoose.model("paymentDetail", paymentDetailsSchema);

module.exports = paymentDetails;
