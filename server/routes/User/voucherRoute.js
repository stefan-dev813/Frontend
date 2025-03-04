const { Router } = require("express");
const Controller = require("../../controllers/User/voucherController");

const router = Router();

router.get("/checkVoucherDetails", Controller.checkVoucherDetails);


module.exports = router;
