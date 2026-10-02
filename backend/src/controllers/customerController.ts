import { Response } from 'express';
import { query } from '../db';
import { AuthRequest } from '../middleware/auth';

export const getCustomers = async (req: AuthRequest, res: Response) => {
  const { search, type, status, limit = 10, offset = 0 } = req.query;

  try {
    let sql = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];
    let count = 1;

    if (search) {
      sql += ` AND (name ILIKE $${count} OR business_name ILIKE $${count} OR email ILIKE $${count} OR mobile ILIKE $${count})`;
      params.push(`%${search}%`);
      count++;
    }

    if (type) {
      sql += ` AND type = $${count}`;
      params.push(type);
      count++;
    }

    if (status) {
      sql += ` AND status = $${count}`;
      params.push(status);
      count++;
    }

    // Get total count
    const totalRes = await query(sql.replace('SELECT *', 'SELECT COUNT(*)'), params);
    const total = parseInt(totalRes.rows[0].count);

    sql += ` ORDER BY name ASC LIMIT $${count} OFFSET $${count + 1}`;
    params.push(parseInt(limit as string));
    params.push(parseInt(offset as string));

    const result = await query(sql, params);

    return res.json({
      customers: result.rows,
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

export const getCustomerById = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  try {
    const customerRes = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (customerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const followUpsRes = await query(
      `SELECT f.*, u.username as created_by_user 
       FROM follow_ups f 
       LEFT JOIN users u ON f.created_by = u.id 
       WHERE f.customer_id = $1 
       ORDER BY f.created_at DESC`,
      [id]
    );

    return res.json({
      customer: customerRes.rows[0],
      followUps: followUpsRes.rows,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const createCustomer = async (req: AuthRequest, res: Response) => {
  const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = req.body;

  if (!name || !mobile || !email || !business_name || !type || !address || !status) {
    return res.status(400).json({ error: 'All fields except GST number, follow-up date and notes are required.' });
  }

  try {
    const result = await query(
      `INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [name, mobile, email, business_name, gst_number || null, type, address, status, follow_up_date || null, notes || '']
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCustomer = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes } = req.body;

  if (!name || !mobile || !email || !business_name || !type || !address || !status) {
    return res.status(400).json({ error: 'All fields except GST number and notes are required.' });
  }

  try {
    const checkRes = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const result = await query(
      `UPDATE customers 
       SET name = $1, mobile = $2, email = $3, business_name = $4, gst_number = $5, type = $6, address = $7, status = $8, follow_up_date = $9, notes = $10
       WHERE id = $11 RETURNING *`,
      [name, mobile, email, business_name, gst_number || null, type, address, status, follow_up_date || null, notes || '', id]
    );

    return res.json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

export const addFollowUpNotes = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { notes } = req.body;

  if (!notes) {
    return res.status(400).json({ error: 'Follow-up notes cannot be empty.' });
  }

  try {
    const checkRes = await query('SELECT * FROM customers WHERE id = $1', [id]);
    if (checkRes.rows.length === 0) {
      return res.status(404).json({ error: 'Customer not found.' });
    }

    const result = await query(
      `INSERT INTO follow_ups (customer_id, notes, created_by)
       VALUES ($1, $2, $3) RETURNING *`,
      [id, notes, req.user?.id]
    );

    // Also update main notes on customer & update last activity
    await query(
      `UPDATE customers SET notes = CONCAT(notes, E'\nFollow-up: ', $1::text) WHERE id = $2`,
      [notes, id]
    );

    return res.status(201).json(result.rows[0]);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
