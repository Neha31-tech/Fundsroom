import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import customerRoutes from './routes/customer';
import productRoutes from './routes/product';
import challanRoutes from './routes/challan';
import { runSchemaAndSeed } from './db/schema';
import { query } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/challans', challanRoutes);

// Dashboard KPI Endpoint
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const customerCount = await query('SELECT count(*) FROM customers');
    const productCount = await query('SELECT count(*) FROM products');
    const lowStockCount = await query('SELECT count(*) FROM products WHERE current_stock <= min_stock_alert');
    const activeChallanCount = await query("SELECT count(*) FROM challans WHERE status = 'Confirmed'");
    const totalSalesQty = await query("SELECT sum(total_quantity) FROM challans WHERE status = 'Confirmed'");
    
    // Get recent stock movements
    const movements = await query(
      `SELECT m.*, p.name as product_name, p.sku as product_sku, u.username as user_name 
       FROM stock_movements m
       LEFT JOIN products p ON m.product_id = p.id
       LEFT JOIN users u ON m.created_by = u.id
       ORDER BY m.created_at DESC LIMIT 5`
    );

    return res.json({
      customers: parseInt(customerCount.rows[0].count),
      products: parseInt(productCount.rows[0].count),
      lowStock: parseInt(lowStockCount.rows[0].count),
      confirmedChallans: parseInt(activeChallanCount.rows[0].count),
      totalSalesQuantity: parseInt(totalSalesQty.rows[0].sum || '0'),
      recentMovements: movements.rows
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
});

// Run DB setup, seed data & Start Server
const startServer = async () => {
  await runSchemaAndSeed();
  app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
  });
};

startServer();
