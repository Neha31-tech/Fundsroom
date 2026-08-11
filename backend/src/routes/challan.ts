import { Router } from 'express';
import { getChallans, getChallanById, createChallan, updateChallanStatus } from '../controllers/challanController';
import { exportChallanPDF } from '../controllers/pdfController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getChallans);
router.get('/:id', authenticateToken, getChallanById);
router.get('/:id/pdf', authenticateToken, exportChallanPDF);
router.post('/', authenticateToken, requireRole(['Admin', 'Sales']), createChallan);
router.patch('/:id/status', authenticateToken, requireRole(['Admin', 'Sales', 'Warehouse']), updateChallanStatus);

export default router;
