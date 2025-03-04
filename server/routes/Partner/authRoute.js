const { Router } = require("express");
const authController = require("../../controllers/Partner/authController");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/forgotPassword", authController.forgotPassword);
router.post("/checkUserEmail", authController.checkUserEmail);

module.exports = router;
