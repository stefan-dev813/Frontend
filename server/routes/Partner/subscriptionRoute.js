const { Router } = require("express");
const controller = require("../../controllers/Partner/partnerSubscription");

const router = Router();

router.get(
  "/getPartnerSubscriptionPaymentLink/:subscriptionId",
  controller.getPartnerSubscriptionPaymentLink
);
router.get("/getPartnerSubscriptionPlans", controller.getAllSubscriptionPlans);
router.put("/cancelSubscription", controller.cancelSubscription);
module.exports = router;
