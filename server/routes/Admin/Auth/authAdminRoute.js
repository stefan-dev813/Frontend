const { Router } = require("express");
const authController = require("../../../controllers/Admin/adminAuthController");

const router = Router();

router.post("/register", authController.register);
router.post("/loginAdmin", authController.loginAdmin);
router.put("/forgotPassword", authController.forgotPassword);

module.exports = router;
