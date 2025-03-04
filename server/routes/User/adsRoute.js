const { Router } = require("express");
const controller = require("../../controllers/User/userAdController");

const router = Router();

router.get("/getAllActiveAds", controller.getAllAds);

module.exports = router;
