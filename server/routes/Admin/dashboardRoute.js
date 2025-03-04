const { Router } = require("express");
const dashboardController = require("../../controllers/Admin/dashboardController");

const router = Router();

router.get(
  "/getPartnerDashboardData",
  dashboardController.getPartnerDashboardData
);
router.get("/getUserDashboardData", dashboardController.getUserrDashboardData);
module.exports = router;
