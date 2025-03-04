const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const feedbackSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    feedBackFor: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
    invitationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "invitation",
    },
    given: {
      type: Boolean,
    },
    status: {
      type: String,
      enum: ["yes", "no"],
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Feedback = mongoose.model("feedback", feedbackSchema);

module.exports = Feedback;
