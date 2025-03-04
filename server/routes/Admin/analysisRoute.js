const { Router } = require("express");
const controller = require("../../controllers/Admin/analysisController");

const router = Router();

router.get("/getAnalysis", controller.getAnalysis);

module.exports = router;
