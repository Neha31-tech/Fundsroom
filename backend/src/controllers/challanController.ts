import { Response } from 'express';
import { query, pool } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getChallans = async (req: AuthRequest, res: Response) => {
  const { search, status, limit = 10, offset = 0 } = req.query;

  try {
    let sql = `
      SELECT ch.*, c.name as customer_name, c.business_name as customer_business, u.username as created_by_user 
      FROM challans ch 
      LEFT JOIN customers c ON ch.customer_id = c.id 
      LEFT JOIN users u ON ch.created_by = u.id 
      WHERE 1=1
    `;
    const params: any[] = [];
    let count = 1;

    if (search) {
      sql += ` AND (ch.challan_number ILIKE $${count} OR c.name ILIKE $${count} OR c.business_name ILIKE $${count})`;
      params.push(`%${search}%`);
      count++;
    }

    if (status) {
      sql += ` AND ch.status = $${count}`;
      params.push(status);
      count++;
    }

    const countSql = `SELECT COUNT(*) FROM (${sql}) as temp`;
    const totalRes = await query(countSql, params);
    const total = parseInt(totalRes.rows[0].count);

    sql += ` ORDER BY ch.created_at DESC LIMIT $${count} OFFSET $${count + 1}`;
    params.push(parseInt(limit as string));
    params.push(parseInt(offset as string));

    const result = await query(sql, params);

    return res.json({
      challans: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const getChallanById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const result = await query(
      `SELECT ch.*, c.name as customer_name, c.business_name as customer_business, c.mobile as customer_mobile, c.email as customer_email, c.address as customer_address, c.gst_number as customer_gst, u.username as created_by_user 
       FROM challans ch 
       LEFT JOIN customers c ON ch.customer_id = c.id 
       LEFT JOIN users u ON ch.created_by = u.id 
       WHERE ch.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Challan not found.' });
    }

    return res.json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createChallan = async (req: AuthRequest, res: Response) => {
  const { customer_id, products, status } = req.body; // status: Draft or Confirmed

  if (!customer_id || !products || !Array.isArray(products) || products.length === 0 || !status) {
    return res.status(400).json({ error: 'Customer, products array (non-empty), and status (Draft/Confirmed) are required.' });
  }

  if (!['Draft', 'Confirmed'].includes(status)) {
    return res.status(400).json({ error: 'New challan status must be Draft or Confirmed.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Check if Customer exists
    const custCheck = await client.query('SELECT name, business_name FROM customers WHERE id = $1', [customer_id]);
    if (custCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Customer not found.' });
    }

    // Generate automatic challan number
    const countRes = await client.query('SELECT count(*) FROM challans');
    const challanNum = `CH-${new Date().getFullYear()}-${(parseInt(countRes.rows[0].count) + 1).toString().padStart(5, '0')}`;

    const snapShotProducts: any[] = [];
    let totalQty = 0;

    // 2. Validate products and stock
    for (const item of products) {
      const { product_id, quantity } = item;
      if (!product_id || quantity === undefined || quantity <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Invalid product item format or invalid quantity.' });
      }

      // Lock product row to prevent concurrent race conditions
      const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [product_id]);
      if (prodRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Product with ID ${product_id} not found.` });
      }

      const dbProduct = prodRes.rows[0];

      // Safe stock check
      if (status === 'Confirmed' && dbProduct.current_stock < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: `Insufficient stock for product '${dbProduct.name}' (SKU: ${dbProduct.sku}). Available: ${dbProduct.current_stock}, Requested: ${quantity}`
        });
      }

      // Store snap details
      snapShotProducts.push({
        product_id: dbProduct.id,
        name: dbProduct.name,
        sku: dbProduct.sku,
        category: dbProduct.category,
        unit_price: dbProduct.unit_price,
        quantity,
      });

      totalQty += quantity;

      // 3. Deduct stock if Confirmed
      if (status === 'Confirmed') {
        const newStock = dbProduct.current_stock - quantity;
        await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, product_id]);

        // Log Stock Movement
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [product_id, quantity, `Dispatched via Challan ${challanNum}`, req.user?.id]
        );
      }
    }

    // 4. Save Challan
    const challanResult = await client.query(
      `INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by, product_snapshot)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [challanNum, customer_id, status, totalQty, req.user?.id, JSON.stringify(snapShotProducts)]
    );

    await client.query('COMMIT');
    return res.status(201).json(challanResult.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateChallanStatus = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { status } = req.body; // Confirmed or Cancelled

  if (!status || !['Confirmed', 'Cancelled'].includes(status)) {
    return res.status(400).json({ error: 'Status must be Confirmed or Cancelled.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Lock challan row
    const challanRes = await client.query('SELECT * FROM challans WHERE id = $1 FOR UPDATE', [id]);
    if (challanRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Challan not found.' });
    }

    const challan = challanRes.rows[0];

    if (challan.status === 'Cancelled') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Challan is already Cancelled.' });
    }

    // If changing confirmed to cancelled, restore stock
    if (challan.status === 'Confirmed' && status === 'Cancelled') {
      const snapshot = challan.product_snapshot || [];
      for (const item of snapshot) {
        // Lock product row to prevent concurrency issues
        await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        
        // Restore stock
        await client.query(
          'UPDATE products SET current_stock = current_stock + $1 WHERE id = $2',
          [item.quantity, item.product_id]
        );

        // Log Stock Movement IN
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'IN', $3, $4)`,
          [item.product_id, item.quantity, `Restored via Challan ${challan.challan_number} Cancellation`, req.user?.id]
        );
      }
    }

    const snapshot = challan.product_snapshot;

    if (challan.status === 'Draft' && status === 'Confirmed') {
      // Re-verify stocks and deduct
      for (const item of snapshot) {
        const prodRes = await client.query('SELECT * FROM products WHERE id = $1 FOR UPDATE', [item.product_id]);
        if (prodRes.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(404).json({ error: `Product ${item.name} not found.` });
        }

        const dbProduct = prodRes.rows[0];
        if (dbProduct.current_stock < item.quantity) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: `Insufficient stock for product '${dbProduct.name}' (SKU: ${dbProduct.sku}). Available: ${dbProduct.current_stock}, Required: ${item.quantity}`
          });
        }

        // Deduct
        const newStock = dbProduct.current_stock - item.quantity;
        await client.query('UPDATE products SET current_stock = $1 WHERE id = $2', [newStock, item.product_id]);

        // Log Stock Movement OUT
        await client.query(
          `INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'OUT', $3, $4)`,
          [item.product_id, item.quantity, `Dispatched via Challan ${challan.challan_number} (Confirmed from Draft)`, req.user?.id]
        );
      }
    }

    const updatedChallan = await client.query(
      'UPDATE challans SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );

    await client.query('COMMIT');
    return res.json(updatedChallan.rows[0]);
  } catch (error: any) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};
