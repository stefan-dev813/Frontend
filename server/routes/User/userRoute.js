const { Router } = require("express");
const userController = require("../../controllers/User/userController");

const router = Router();

router.get("/getUser", userController.getUser);
router.post("/getSpecificUsers", userController.getSpecificUsers);
router.get("/getUserById", userController.getUserById);
router.post("/getUserUnderRadius", userController.getUsersUnderRadius);
router.put("/updateUser", userController.updateUser);
router.put("/updateBusinessRating", userController.updateBusinessRating);
router.put("/updatePassword", userController.updatePassword);
router.post("/createHelpCenter", userController.createHelpCenter);
router.post("/feedback/:invitationId", userController.createFeedback);
router.post("/report", userController.reportUser);
router.get("/getReportedUserById", userController.getReportedUserById);
router.post("/updateAnalytics", userController.updateAnalytics);

module.exports = router;
