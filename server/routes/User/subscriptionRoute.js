const { Router } = require("express");
const controller = require("../../controllers/User/userSubscription");

const router = Router();

router.post(
  "/createUserSubscription/:subscriptionId",
  controller.createUserSubscription
);
router.get("/getUserSubscriptionPlans", controller.getAllSubscriptionPlans);
router.put("/updatePurchasedBundle", controller.updatePurchasedBundle);
// router.post("/createSubscription", controller.createSubscription);
module.exports = router;
