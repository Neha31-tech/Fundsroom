"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Everyone can view, but only Sales/Admin/Accounts can add/edit.
router.get('/', auth_1.authenticateToken, customerController_1.getCustomers);
router.get('/:id', auth_1.authenticateToken, customerController_1.getCustomerById);
router.post('/', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Sales']), customerController_1.createCustomer);
router.put('/:id', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Sales']), customerController_1.updateCustomer);
router.post('/:id/notes', auth_1.authenticateToken, (0, auth_1.requireRole)(['Admin', 'Sales']), customerController_1.addFollowUpNotes);
exports.default = router;
