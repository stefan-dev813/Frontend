const mongoose = require("mongoose");
const { isEmail } = require("validator");
const bcrypt = require("bcryptjs");
const mongoose_delete = require("mongoose-delete");
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Please enter an email"],
      unique: true,
      lowercase: true,
      validate: [isEmail, "Please enter a valid email"],
    },
    name: {
      type: String,
    },
    password: {
      type: String,
      required: [true, "Please enter a password"],
      minlength: [6, "Minimum password length is 6 characters"],
    },
    profileImage: {
      type: String,
    },
    isPermission: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: String,
      enum: ["BOTH", "PARTNER", "USER"],
      default: "BOTH",
    },
    userType: {
      type: String,
      enum: ["SUPER-ADMIN", "SUB-ADMIN"],
      default: "SUPER-ADMIN",
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
userSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Admin = mongoose.model("admin", userSchema);

module.exports = Admin;
