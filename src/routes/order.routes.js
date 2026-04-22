const express = require("express");
const validate = require("../middleware/validate");
const { create, updateStatus, updatePaymentStatus } = require("../validators/order.validator");
const ctrl = require("../controllers/order.controller");

const router = express.Router();

router.post("/", validate(create), ctrl.create);
router.get("/", ctrl.list);
router.get("/:id", ctrl.getById);
router.post("/:id/confirm", ctrl.confirm);
router.post("/:id/cancel", ctrl.cancel);
router.patch("/:id/status", validate(updateStatus), ctrl.updateStatus);
router.patch("/:id/payment-status", validate(updatePaymentStatus), ctrl.updatePaymentStatus);

module.exports = router;
