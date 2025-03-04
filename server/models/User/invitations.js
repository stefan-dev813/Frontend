const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const invitationSchema = new mongoose.Schema(
  {
    users: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
        status: {
          type: String,
          default: "Pending",
          enum: ["Pending", "Accepted", "Rejected"],
          index: true,
        },
      },
    ],
    groupName: {
      type: String,
    },
    dob: {
      type: String,
    },
    invitationBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      index: true,
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "feedback",
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerBusiness",
      index: true,
    },
    googleBusiness: {
      type: Object,
    },
    date: {
      type: Date,
    },
    time: {
      type: String,
    },
    isSeen: {
      type: Boolean,
      default: false,
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    isRescheduled: {
      type: Boolean,
      default: false,
    },
    rescheduleBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
    },
    reschedule: {
      date: String,
      time: String,
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
      index: true,
    },
    adId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "partnerAds",
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

invitationSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Invitation = mongoose.model("invitation", invitationSchema);

module.exports = Invitation;
