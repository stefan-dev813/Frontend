const { Router } = require("express");
const customerController = require("../../controllers/Admin/customerController");

const router = Router();

router.get("/getAllUsers", customerController.getAllUsers);
router.get("/getSingleUser", customerController.getSingleUser);
router.put("/updateCustomer", customerController.updateCustomer);
router.get('/findFeedbackforuser/:id', customerController.findAllFeedbackById);
router.get('/findAllFeedbacks', customerController.findAllFeedback);
router.delete('/deletePermanently', customerController.deletePermanently);

module.exports = router;
