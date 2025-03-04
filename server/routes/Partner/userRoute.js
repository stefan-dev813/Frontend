const { Router } = require("express");
const userController = require("../../controllers/Partner/userController");

const router = Router();

router.get("/getUser", userController.getUser);
router.get("/getPaymentDetails", userController.getPaymentDetails);
router.put("/updateUser", userController.updateUser);
router.put("/updateEmail", userController.updateEmail);
router.put("/updatePaymentDetails", userController.updatePaymentDetails);
router.put("/updatePassword", userController.updatePassword);

module.exports = router;
