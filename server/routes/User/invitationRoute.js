const { Router } = require("express");
const invitationController = require("../../controllers/User/invitationController");
const { checkPermission } = require("../../middleware/checkPermission");
const { checkGuestAccess } = require("../../middleware/checkGuestAccess");
const router = Router();
router.get("/getAllPlaces",checkPermission(["USER"]), invitationController.getAllPlaces);
router.post(
  "/getBusinessUnderRadius",checkGuestAccess(),
  invitationController.getBusinessUnderRadius
);
router.get("/getAllRequests",checkPermission(["USER"]), invitationController.getAllRequests);
router.get("/getInvitationById",checkPermission(["USER"]), invitationController.getInvitationById);
router.get("/getInvitationsRequests",checkPermission(["USER"]), invitationController.getInvitationsRequests);
router.post("/inviteUser",checkPermission(["USER"]), invitationController.inviteUser);
router.put("/updateInvitation",checkPermission(["USER"]), invitationController.updateInvitation);
module.exports = router;