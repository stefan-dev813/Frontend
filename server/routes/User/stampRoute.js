const { Router } = require("express");
const stampController = require("../../controllers/User/stampController");

const router = Router();

router.post("/createStamp", stampController.createStamp);
router.get("/getAllUserStamps", stampController.getAllUserStamps);

module.exports = router;
