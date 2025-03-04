const { Router } = require("express");
const partnerController = require("../../controllers/Admin/partnerController");
const adsController = require("../../controllers/Admin/adsController");

const router = Router();

//analytics
router.get("/getAdvtertisementStats", adsController.getAdvtertisementStats);
//Internal Partner Ads
router.post("/createAds", adsController.createAds);
router.put("/updateAds", adsController.updateAds);
router.get("/getAllAds", adsController.getAllAds);
router.get("/getSingleAds", adsController.getSingleAds);

//External Ads
router.post("/createExternalAds", adsController.createExternalAds);
router.get("/getAllExternalAds", adsController.getAllExternalAds);
router.put("/updateExternalAds", adsController.updateExternalAds);
router.get("/getSingleExternalAds", adsController.getSingleExternalAds);

//Partner
router.get("/getAllPartners", partnerController.getAllPartners);
router.get("/getMeetingDetails", partnerController.getMeetingDetails);
router.get("/getSinglePartner", partnerController.getSinglePartner);
router.put("/updatePartner", partnerController.updatePartner);
router.put("/updateProfile", partnerController.updateProfile);
router.get("/getAllPartnerStamps/:id", partnerController.getAllPatnerStamps);

module.exports = router;
