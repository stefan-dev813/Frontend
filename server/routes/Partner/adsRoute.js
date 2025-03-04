const { Router } = require("express");
const adsController = require("../../controllers/Partner/adsController");
const {
  CheckPartnerPermission,
} = require("../../middleware/checkPartnerPermission");
const { checkGuestAccess } = require("../../middleware/checkGuestAccess");

const router = Router();

router.post(
  "/createAds",
  CheckPartnerPermission(["PARTNER"]),
  adsController.createAds
);
router.post(
  "/createExternalAds",
  checkGuestAccess(),
  adsController.createExternalAds
);
router.put(
  "/updateAds",
  CheckPartnerPermission(["PARTNER"]),
  adsController.updateAds
);
router.get(
  "/getAds",
  CheckPartnerPermission(["PARTNER"]),
  adsController.getAds
);
router.get(
  "/getAllAds",
  CheckPartnerPermission(["PARTNER"]),
  adsController.getAllAds
);
module.exports = router;
