const cron = require("node-cron");
const User = require("../models/User/User");
const Partner = require("../models/Partner/Partner");
const UserSubscription = require("../models/User/userSubscription");
const PartnerSubscription = require("../models/Partner/partnerSubscription");

// Schedule the cron job to run every day at a specific time (e.g., midnight)
cron.schedule("0 0 * * *", async () => {
  console.log("*******RUNNING CRON TO DESTROY SUBSCRIPTION*********");
  try {
    const currentDate = new Date();

    const expiredSubscriptions = await UserSubscription.find({
      expireAt: { $lte: currentDate },
      isActive: true,
      deleted: false,
    });
    const expiredPartnerSubscriptions = await PartnerSubscription.find({
      expireAt: { $lte: currentDate },
      isActive: true,
      deleted: false,
    });
    const userIds = expiredSubscriptions.map(
      (subscription) => subscription.userId
    );
    const partnerIds = expiredPartnerSubscriptions.map(
      (subscription) => subscription.userId
    );
    await User.updateMany(
      { _id: { $in: userIds } },
      { $set: { isPremium: false } }
    );
    await Partner.updateMany(
      { _id: { $in: partnerIds } },
      { $set: { isPremium: false } }
    );

    await UserSubscription.updateMany(
      { expireAt: { $lte: currentDate } },
      { isActive: false }
    );
    await PartnerSubscription.updateMany(
      { expireAt: { $lte: currentDate } },
      { isActive: false }
    );
  } catch (error) {
    console.error("Error deleting expired subscriptions:", error);
  }
});
