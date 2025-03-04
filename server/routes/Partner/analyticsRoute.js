const { Router } = require("express");
const controller = require("../../controllers/Partner/analyticsController");

const router = Router();

router.get(
  "/getDailyAnalytics",
  controller.getDailyAnalytics
);
router.get(
  "/getDashboardAnalytics",
  controller.getDashboardAnalytics
);



module.exports = router;
