const { Router } = require("express");
const utilController = require("../../controllers/Common/utilController");

const router = Router();

router.post("/uploadFile", utilController.uploadFile);
router.post("/sendOtp", utilController.sendOtp);
router.get("/getOtp", utilController.getOtp);
router.post("/verifyOtp", utilController.verifyOtp);
router.get("/getPresignedUrl", utilController.generateSignerUrl);
module.exports = router;
