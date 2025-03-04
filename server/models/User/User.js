const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");
const { isEmail } = require("validator");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      lowercase: true,
      index: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    userName: {
      type: String,
      index: true,
    },
    profilePicUploaded: {
      type: Boolean,
      default: false,
    },
    dob: {
      type: Date,
    },
    city: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Others"],
      default: "Male",
      index: true,
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
    isNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    verificationType: {
      type: String,
      enum: ["GOOGLE", "FACEBOOK", "EMAIL", "IOS"],
      default: "EMAIL",
    },
    appleUniqueKey: {
      type: String,
    },
    password: {
      type: String,
    },
    fcmToken: {
      type: String,
    },
    coverImage: {
      type: String,
    },
    images: [],
    interest: [],
    bio: {
      type: String,
    },
    job: {
      type: String,
    },
    reason: {
      type: String,
    },
    tags: [
      {
        _id: String,
        icon: String,
        name: String,
      },
    ],
    profileEdited: {
      type: Boolean,
      deafault: false,
    },
    usernameEdited: {
      type: Boolean,
      deafault: false,
    },
    emailEdited: {
      type: Boolean,
      deafault: false,
    },
    genderEdited: {
      type: Boolean,
      deafault: false,
    },
    bDayEdited: {
      type: Boolean,
      deafault: false,
    },
    userType: {
      type: String,
      required: true,
      enum: ["USER"],
      default: "USER",
    },
    didNotAttendMeetingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "update"],
});
const User = mongoose.model("user", userSchema);

module.exports = User;
