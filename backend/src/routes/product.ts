import { Router } from 'express';
import { getProducts, getProductById, createProduct, updateProduct, adjustStock } from '../controllers/productController';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', authenticateToken, getProducts);
router.get('/:id', authenticateToken, getProductById);
router.post('/', authenticateToken, requireRole(['Admin', 'Warehouse']), createProduct);
router.put('/:id', authenticateToken, requireRole(['Admin', 'Warehouse']), updateProduct);
router.post('/:id/adjust', authenticateToken, requireRole(['Admin', 'Warehouse']), adjustStock);

export default router;
