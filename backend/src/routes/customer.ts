import { Router } from 'express';
import { getCustomers, getCustomerById, createCustomer, updateCustomer, addFollowUpNotes } from '../controllers/customerController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Everyone can view, but only Sales/Admin/Accounts can add/edit.
router.get('/', authenticateToken, getCustomers);
router.get('/:id', authenticateToken, getCustomerById);
router.post('/', authenticateToken, requireRole(['Admin', 'Sales']), createCustomer);
router.put('/:id', authenticateToken, requireRole(['Admin', 'Sales']), updateCustomer);
router.post('/:id/notes', authenticateToken, requireRole(['Admin', 'Sales']), addFollowUpNotes);

export default router;
