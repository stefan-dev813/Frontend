const { Router } = require("express");
const authController = require("../../controllers/User/authController");

const router = Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.put("/forgotPassword", authController.forgotPassword);
router.put("/socialAuth", authController.socialAuth);
router.put("/googleAuth", authController.googleAuth);
router.put("/facebookAuth", authController.facebookAuth);
router.post("/checkUserEmail", authController.checkUserEmail);
router.post("/checkUserAppleKey", authController.checkUserAppleKey);
router.post("/appleAuth", authController.appleAuth);
module.exports = router;
