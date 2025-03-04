const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const Schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerBusiness",
    },
  },
  { timestamps: true }
);

Schema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Stamp = mongoose.model("Stamp", Schema);

module.exports = Stamp;
