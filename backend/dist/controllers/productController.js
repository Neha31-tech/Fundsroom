"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adjustStock = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const db_1 = require("../db");
const getProducts = async (req, res) => {
    const { search, category, limit = 10, offset = 0 } = req.query;
    try {
        let sql = 'SELECT * FROM products WHERE 1=1';
        const params = [];
        let count = 1;
        if (search) {
            sql += ` AND (name ILIKE $${count} OR sku ILIKE $${count})`;
            params.push(`%${search}%`);
            count++;
        }
        if (category) {
            sql += ` AND category = $${count}`;
            params.push(category);
            count++;
        }
        const totalRes = await (0, db_1.query)(sql.replace('SELECT *', 'SELECT COUNT(*)'), params);
        const total = parseInt(totalRes.rows[0].count);
        sql += ` ORDER BY name ASC LIMIT $${count} OFFSET $${count + 1}`;
        params.push(parseInt(limit));
        params.push(parseInt(offset));
        const result = await (0, db_1.query)(sql, params);
        return res.json({
            products: result.rows,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    const { id } = req.params;
    try {
        const productRes = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [id]);
        if (productRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const movementsRes = await (0, db_1.query)(`SELECT m.*, u.username as created_by_user 
       FROM stock_movements m 
       LEFT JOIN users u ON m.created_by = u.id 
       WHERE m.product_id = $1 
       ORDER BY m.created_at DESC`, [id]);
        return res.json({
            product: productRes.rows[0],
            movements: movementsRes.rows,
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    const { name, sku, category, unit_price, current_stock, min_stock_alert, location } = req.body;
    if (!name || !sku || !category || unit_price === undefined || current_stock === undefined || min_stock_alert === undefined || !location) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // SKU check
        const skuCheck = await client.query('SELECT id FROM products WHERE sku = $1', [sku]);
        if (skuCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Product with this SKU already exists.' });
        }
        const prodResult = await client.query(`INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`, [name, sku, category, unit_price, current_stock, min_stock_alert, location]);
        const newProduct = prodResult.rows[0];
        // Log initial stock movement if stock > 0
        if (current_stock > 0) {
            await client.query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
         VALUES ($1, $2, 'IN', 'Initial stock entry on product creation', $3)`, [newProduct.id, current_stock, req.user?.id]);
        }
        await client.query('COMMIT');
        return res.status(201).json(newProduct);
    }
    catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: error.message });
    }
    finally {
        client.release();
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, sku, category, unit_price, min_stock_alert, location } = req.body;
    if (!name || !sku || !category || unit_price === undefined || min_stock_alert === undefined || !location) {
        return res.status(400).json({ error: 'All fields except stock are required.' });
    }
    try {
        const checkRes = await (0, db_1.query)('SELECT * FROM products WHERE id = $1', [id]);
        if (checkRes.rows.length === 0) {
            return res.status(404).json({ error: 'Product not found.' });
        }
        const skuCheck = await (0, db_1.query)('SELECT id FROM products WHERE sku = $1 AND id <> $2', [sku, id]);
        if (skuCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Product with this SKU already exists.' });
        }
        const result = await (0, db_1.query)(`UPDATE products 
       SET name = $1, sku = $2, category = $3, unit_price = $4, min_stock_alert = $5, location = $6
       WHERE id = $7 RETURNING *`, [name, sku, category, unit_price, min_stock_alert, location, id]);
        return res.json(result.rows[0]);
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.updateProduct = updateProduct;
const adjustStock = async (req, res) => {
    const { id } = req.params;
    const { quantity, movement_type, reason } = req.body; // movement_type: IN or OUT
    if (quantity === undefined || !movement_type || !reason) {
        return res.status(400).json({ error: 'Quantity, movement type (IN/OUT), and reason are required.' });
    }
    if (quantity <= 0) {
        return res.status(400).json({ error: 'Quantity must be a positive integer.' });
    }
    if (!['IN', 'OUT'].includes(movement_type)) {
        return res.status(400).json({ error: 'Invalid movement type. Must be IN or OUT.' });
    }
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Lock product row to prevent concurrency issues
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [id]);
        if (prodRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Product not found.' });
        }
        const product = prodRes.rows[0];
        let newStock = product.current_stock;
        if (movement_type === 'IN') {
            newStock += quantity;
        }
        else {
            if (newStock < quantity) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: `Insufficient stock. Current stock is ${newStock}, requested reduction is ${quantity}.` });
            }
            newStock -= quantity;
        }
        // Update product stock
        const updatedProdRes = await client.query('UPDATE products SET current_stock = $1 WHERE id = $2 RETURNING *', [newStock, id]);
        // Insert stock movement log
        await client.query(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)`, [id, quantity, movement_type, reason, req.user?.id]);
        await client.query('COMMIT');
        return res.json(updatedProdRes.rows[0]);
    }
    catch (error) {
        await client.query('ROLLBACK');
        return res.status(500).json({ error: error.message });
    }
    finally {
        client.release();
    }
};
exports.adjustStock = adjustStock;
