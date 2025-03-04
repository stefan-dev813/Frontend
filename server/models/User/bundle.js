const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const Schema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    pendingInvitation: {
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
const Bundle = mongoose.model("bundle", Schema);

module.exports = Bundle;
