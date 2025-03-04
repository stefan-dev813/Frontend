const { Router } = require("express");
const notificationController = require("../../controllers/Common/notificationController");
const { checkToken } = require("../../middleware/checkToken");

const router = Router();

router.post(
  "/createNotifications",
  checkToken,
  notificationController.createNotifications
);
router.post(
  "/sendNotification",
  checkToken,
  notificationController.sendNotification
);

router.put("/updateNotification", notificationController.updateNotification);
router.get("/getAllNotifications", notificationController.getAllNotificationsForPartner);
router.get("/getNotificationbyId", notificationController.getNotificationbyId);
router.get("/getAllNotificationForAdmin", notificationController.getAllNotificationForAdmin);
router.get("/getAllUserNotifications/:userId", notificationController.getAllUserNotifications);
module.exports = router;
