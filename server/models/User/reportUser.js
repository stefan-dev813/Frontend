const mongoose = require("mongoose");
const mongoose_delete = require("mongoose-delete");

const reportSchema = new mongoose.Schema(
  {
    reportedBy:{ type: mongoose.Schema.Types.ObjectId, ref: "user" },
    reportedTo:{ type: mongoose.Schema.Types.ObjectId, ref: "user" },
    hide: {
        type: String,
        enum: ['true', 'false']
      },
    report: {
    type: String,
    enum: ['true', 'false']
    },
    block: {
    type: String,
    enum: ['true', 'false']
    },
    categories: {
    type: String,
    enum: [
        'Stolen fake photo',
        'Insult or harassment',
        'Spam or Fraud',
        'Pornographic or inappropriate content',
        'Optional Message'
    ]
    },
    message: {
      type: String
    }
  },
  {
    timestamps: true,
  }
);

reportSchema.plugin(mongoose_delete, {
  overrideMethods: ["find", "findOne", "findOneAndUpdate", "update"],
});
const Report = mongoose.model("report", reportSchema);

module.exports = Report;

