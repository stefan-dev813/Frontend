const { Router } = require("express");
const adminUserController = require("../../../controllers/Admin/adminUserController");

const router = Router();

router.put("/forgotPassword", adminUserController.forgotPassword);
router.get("/getUser", adminUserController.getUser);
router.get("/getUserById", adminUserController.getUserById);
router.get("/getAllSubAdmins", adminUserController.getAllSubAdmins);
router.put("/updateUser", adminUserController.updateUser);

module.exports = router;
