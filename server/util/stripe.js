const stripe = require("stripe")(process.env.STRIPE_SECRET);
const UserSubscription = require("../models/User/userSubscription");
const User = require("../models/User/User");
const PartnerSubscription = require("../models/Partner/partnerSubscription");
const Partner = require("../models/Partner/Partner");
const Bundle = require("../models/User/bundle");
const { calculateExpiryDate } = require("./calculateExpiryDate");
module.exports.createCheckoutLink = (price, metadata = {}) => {
  return new Promise(async (resolve, reject) => {
    try {
      console.log(price, metadata);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: metadata.planName,
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: process.env.BC_URI + `?type=SUCCESS`,
        cancel_url: process.env.BC_URI + `?type=FAIL`,
        currency: "eur",
        customer_email: metadata.email,

        metadata,
      });

      resolve(session.url);
    } catch (error) {
      console.log(error);
      reject(error.message);
    }
  });
};



module.exports.listenWebhook = async (event) => {
  console.log(event.data.object.metadata, "event.data.object.metadata");
  if (event.type === "checkout.session.completed") {
    const metaData = event.data.object.metadata;

    if (metaData.purchaseType === "BUNDLE") {
      await Bundle.findOneAndUpdate(
        { userId: metaData.userId },
        { $inc: { pendingInvitation: Number(metaData.totalInvitations) } },
        { new: true, upsert: true }
      );
    }
    if (metaData.purchaseType === "SUBSCRIPTION") {
      if (metaData.userType === "USER") {
        const expireAt = calculateExpiryDate(metaData.month);
        await UserSubscription.updateMany(
          { userId: metaData.userId },
          { isActive: false }
        );
        await UserSubscription.create({
          userId: metaData.userId,
          expireAt,
          isActive: true,
          subscriptionId: metaData.subscriptionId,
        });
        await User.findByIdAndUpdate(
          { _id: metaData.userId },
          { isPremium: true },
          { new: true }
        );
        return;
      }
      if (metaData.userType === "PARTNER") {
        const expireAt = calculateExpiryDate(metaData.month);
        await PartnerSubscription.updateMany(
          { partnerId: metaData.userId },
          { isActive: false }
        );
        await PartnerSubscription.create({
          partnerId: metaData.userId,
          expireAt,
          isActive: true,
          subscriptionId: metaData.subscriptionId,
        });
        await Partner.findByIdAndUpdate(
          { _id: metaData.userId },
          { isPremium: true },
          { new: true }
        );
        return;
      }
    }
  }
};
