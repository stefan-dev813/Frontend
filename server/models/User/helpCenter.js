const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const helpCenterSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    message: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

helpCenterSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const HelpCenter = mongoose.model("helpCenter", helpCenterSchema);

module.exports = HelpCenter;
