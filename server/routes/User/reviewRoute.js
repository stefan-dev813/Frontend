const { Router } = require("express");
const controller = require("../../controllers/User/reviewController");

const router = Router();

router.post("/addReviews", controller.addReviews);

module.exports = router;
