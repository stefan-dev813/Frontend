const { Router } = require("express");
const businessController = require("../../controllers/Partner/businessController");

const router = Router();

router.post("/createBusiness", businessController.createBusiness);
router.put("/updateBusiness", businessController.updateBusiness);
router.get("/getBusiness", businessController.getBusiness);

module.exports = router;
