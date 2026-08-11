"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const auth_1 = __importDefault(require("./routes/auth"));
const customer_1 = __importDefault(require("./routes/customer"));
const product_1 = __importDefault(require("./routes/product"));
const challan_1 = __importDefault(require("./routes/challan"));
const schema_1 = require("./db/schema");
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/customers', customer_1.default);
app.use('/api/products', product_1.default);
app.use('/api/challans', challan_1.default);
// Dashboard KPI Endpoint
app.get('/api/dashboard/stats', async (req, res) => {
    try {
        const customerCount = await (0, db_1.query)('SELECT count(*) FROM customers');
        const productCount = await (0, db_1.query)('SELECT count(*) FROM products');
        const lowStockCount = await (0, db_1.query)('SELECT count(*) FROM products WHERE current_stock <= min_stock_alert');
        const activeChallanCount = await (0, db_1.query)("SELECT count(*) FROM challans WHERE status = 'Confirmed'");
        const totalSalesQty = await (0, db_1.query)("SELECT sum(total_quantity) FROM challans WHERE status = 'Confirmed'");
        // Get recent stock movements
        const movements = await (0, db_1.query)(`SELECT m.*, p.name as product_name, p.sku as product_sku, u.username as user_name 
       FROM stock_movements m
       LEFT JOIN products p ON m.product_id = p.id
       LEFT JOIN users u ON m.created_by = u.id
       ORDER BY m.created_at DESC LIMIT 5`);
        return res.json({
            customers: parseInt(customerCount.rows[0].count),
            products: parseInt(productCount.rows[0].count),
            lowStock: parseInt(lowStockCount.rows[0].count),
            confirmedChallans: parseInt(activeChallanCount.rows[0].count),
            totalSalesQuantity: parseInt(totalSalesQty.rows[0].sum || '0'),
            recentMovements: movements.rows
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
});
// Run DB setup, seed data & Start Server
const startServer = async () => {
    await (0, schema_1.runSchemaAndSeed)();
    app.listen(PORT, () => {
        console.log(`Backend server is running on http://localhost:${PORT}`);
    });
};
startServer();
