const { Router } = require("express");
const voucherController = require("../../controllers/Admin/voucherController");

const router = Router();

router.post("/createVoucher", voucherController.createVoucher);
router.get("/getAllVoucher", voucherController.getAllVoucher);
router.get("/getSingleVoucher", voucherController.getSingleVoucher);
router.put("/updateVoucher", voucherController.updateVoucher);

module.exports = router;
