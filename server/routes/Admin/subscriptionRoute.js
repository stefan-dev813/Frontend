const { Router } = require("express");
const subscriptionController = require("../../controllers/Admin/subscriptionController");

const router = Router();

router.post("/createSubscription", subscriptionController.createSubscription);
router.put("/updateSubscription", subscriptionController.updateSubscription);
router.get("/getAllSubscription", subscriptionController.getAllSubscription);
router.get("/getAllPremiumUsers", subscriptionController.getAllPremiumUsers);
router.get(
  "/getSingleSubscription",
  subscriptionController.getSingleSubscription
);

module.exports = router;
