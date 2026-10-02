"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSchemaAndSeed = void 0;
const index_1 = require("./index");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('Admin', 'Sales', 'Warehouse', 'Accounts'))
);

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  mobile VARCHAR(50) NOT NULL,
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  gst_number VARCHAR(100),
  type VARCHAR(50) NOT NULL CHECK (type IN ('Retail', 'Wholesale', 'Distributor')),
  address TEXT NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('Lead', 'Active', 'Inactive')),
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  notes TEXT NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100) UNIQUE NOT NULL,
  category VARCHAR(100) NOT NULL,
  unit_price DECIMAL(12, 2) NOT NULL,
  current_stock INT NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_stock_alert INT NOT NULL DEFAULT 10,
  location VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL,
  movement_type VARCHAR(10) NOT NULL CHECK (movement_type IN ('IN', 'OUT')),
  reason VARCHAR(255) NOT NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS challans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  challan_number VARCHAR(100) UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  status VARCHAR(50) NOT NULL CHECK (status IN ('Draft', 'Confirmed', 'Cancelled')),
  total_quantity INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  product_snapshot JSONB NOT NULL
);
`;
const runSchemaAndSeed = async () => {
    try {
        console.log('Running schema creation...');
        await (0, index_1.query)(schema);
        console.log('Schema created/verified successfully.');
        // 1. Seed Roles
        const usersToSeed = [
            { username: 'admin', role: 'Admin', pass: 'Admin' },
            { username: 'sales', role: 'Sales', pass: 'Sales' },
            { username: 'warehouse', role: 'Warehouse', pass: 'Warehouse' },
            { username: 'accounts', role: 'Accounts', pass: 'Accounts' },
        ];
        for (const u of usersToSeed) {
            const existRes = await (0, index_1.query)('SELECT id FROM users WHERE username = $1', [u.username]);
            const hash = await bcryptjs_1.default.hash(u.pass, 10);
            if (existRes.rows.length === 0) {
                await (0, index_1.query)('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)', [u.username, hash, u.role]);
                console.log(`Seeded user ${u.username}`);
            }
            else {
                await (0, index_1.query)('UPDATE users SET password_hash = $1 WHERE username = $2', [hash, u.username]);
                console.log(`Updated password for user ${u.username}`);
            }
        }
        const defaultUserRes = await (0, index_1.query)("SELECT id FROM users WHERE username = 'admin' LIMIT 1");
        const adminUserId = defaultUserRes.rows[0]?.id;
        // 2. Seed 15 Realistic South Indian Customers
        const custRes = await (0, index_1.query)('SELECT count(*) FROM customers');
        if (parseInt(custRes.rows[0].count) === 0) {
            console.log('Seeding 15 South Indian customers...');
            await (0, index_1.query)(`INSERT INTO customers (name, mobile, email, business_name, gst_number, type, address, status, follow_up_date, notes) VALUES
        ('Karthik Venkatraman', '9840123456', 'karthik@kovaitextiles.com', 'Kovai Heritage Textiles', '33AAAFK1234F1Z1', 'Wholesale', '102, Cross Cut Road, Gandhipuram, Coimbatore, Tamil Nadu', 'Active', '2026-08-25', 'Requires premium cotton audio display box.'),
        ('Srinivas Murthy', '9448056789', 'srinivas@srimurthy.in', 'Sri Murthy & Sons Enterprises', '29AABCS5678C2Z2', 'Distributor', '45, Avenue Road, Chickpet, Bangalore, Karnataka', 'Active', '2026-08-22', 'Regular distributor for Bangalore Rural region.'),
        ('Ananya Reddy', '9177098765', 'ananya@reddyagro.com', 'Reddy Agro Trading Corp', '36AACCR9876R3Z3', 'Wholesale', 'D.No. 4-12, Guntur Road, Vijayawada, Andhra Pradesh', 'Active', '2026-08-18', 'Agro-electronics dealer.'),
        ('Pranav Nair', '9847043210', 'pranav@malabardist.com', 'Malabar Trading & Distributors', '32AAACM4321D4Z4', 'Distributor', 'KP Vallon Road, Kadavanthra, Kochi, Kerala', 'Active', '2026-08-20', 'Kerala state level accessories dealer.'),
        ('Rajeshwari Hegde', '9481234567', 'rajeshwari@hegdeelectronics.com', 'Hegde Digital Systems', '29AADCH1234S5Z5', 'Retail', 'Maruti Galli, Belgaum, Karnataka', 'Lead', '2026-08-14', 'Interested in premium Smart Wearables series.'),
        ('Nishanth Rao', '8008123456', 'nishanth@secunderabadtraders.com', 'Secunderabad Logistics & Spares', '36AAACS4321L6Z6', 'Wholesale', 'RP Road, Secunderabad, Telangana', 'Active', '2026-08-30', 'Bulk order dispatcher.'),
        ('Meera Krishnan', '9447012345', 'meera@krishnatraders.com', 'Krishna retail chain', '32AAACK1234K7Z7', 'Retail', 'MG Road, Trivandrum, Kerala', 'Active', '2026-08-19', 'Multiple outlets delivery pipeline.'),
        ('Harish Naidu', '9908123456', 'harish@vizagelectricals.com', 'Vizag Digital Solutions', '37AAACN5678A8Z8', 'Wholesale', 'Dwarka Nagar, Visakhapatnam, Andhra Pradesh', 'Lead', '2026-08-12', 'Requested quotation for charger blocks.'),
        ('Vijay Raghavan', '9841098765', 'vijay@chennaiaudio.in', 'Chennai Audio Hub', '33AAACV9876H9Z9', 'Retail', 'Pondy Bazaar, T.Nagar, Chennai, Tamil Nadu', 'Inactive', null, 'Dormant account.'),
        ('Divya Shekar', '9980123456', 'divya@shekarretail.com', 'Shekar Lifestyle Goods', '29AAACS1122S1ZA', 'Retail', 'Jayanagar 4th Block, Bangalore, Karnataka', 'Active', '2026-08-28', 'Regular retail customer.'),
        ('Subramanian Iyer', '9845012345', 'subbu@iyerlogistics.com', 'Iyer Cargo & Trading', '33AAACI5566T1ZB', 'Distributor', 'East Veli Street, Madurai, Tamil Nadu', 'Active', '2026-08-26', 'Distributes smart products in Madurai.'),
        ('Venkat Prabhu', '8885012345', 'prabhu@hyderabadwear.com', 'Hyderabad Wearhouse Retailers', '36AAACP9988W1ZC', 'Retail', 'Ameerpet, Hyderabad, Telangana', 'Active', '2026-08-27', 'Boutique wearables retailer.'),
        ('Remya Pillai', '9446012345', 'remya@pillaienterprises.com', 'Pillai & Co Distributors', '32AAACP3344D1ZD', 'Distributor', 'YMCA Road, Kozhikode, Kerala', 'Active', '2026-08-21', 'Kozhikode district logistics pipeline.'),
        ('Suresh Goud', '9177112233', 'suresh@goudtraders.com', 'Goud Trading & Stores', '36AAACG4455S1ZE', 'Wholesale', 'Nizamabad Highway, Telangana', 'Lead', '2026-08-15', 'Checking minimum stock alert quotes.'),
        ('Kiran Mai', '9908223344', 'kiran@andhradigitals.com', 'Andhra Digital Mart', '37AAACK7788M1ZF', 'Retail', 'Eluru Road, Vijayawada, Andhra Pradesh', 'Active', '2026-08-29', 'New retail franchise.')`);
            console.log('15 South Indian Customers seeded.');
        }
        // 3. Seed 20 Different Products in Catalog
        const prodRes = await (0, index_1.query)('SELECT count(*) FROM products');
        if (parseInt(prodRes.rows[0].count) === 0) {
            console.log('Seeding 20 different products...');
            await (0, index_1.query)(`INSERT INTO products (name, sku, category, unit_price, current_stock, min_stock_alert, location) VALUES
        ('Wireless Earbuds Pro', 'EAR-PRO-001', 'Audio', 1499.00, 48, 20, 'Warehouse A - Bin 3'),
        ('Smart Watch Active', 'WAT-ACT-002', 'Wearables', 2999.00, 45, 15, 'Warehouse A - Bin 7'),
        ('Bluetooth Speaker Pulse', 'SPK-PUL-003', 'Audio', 2499.00, 35, 10, 'Warehouse B - Bin 2'),
        ('Super Charger Fast 65W', 'CHG-FST-004', 'Accessories', 999.00, 49, 50, 'Warehouse B - Bin 5'),
        ('Noise Cancel Headphone X', 'AUD-ANC-005', 'Audio', 4999.00, 40, 10, 'Warehouse A - Bin 1'),
        ('Fitness Band Slim', 'WAT-FIT-006', 'Wearables', 1499.00, 42, 25, 'Warehouse A - Bin 9'),
        ('True Wireless Pods Lite', 'EAR-LIT-007', 'Audio', 899.00, 45, 30, 'Warehouse A - Bin 4'),
        ('Powerbank Extreme 20K', 'ACC-PBK-008', 'Accessories', 1999.00, 38, 20, 'Warehouse B - Bin 8'),
        ('OTG Adapter Dual Pack', 'ACC-OTG-009', 'Accessories', 199.00, 49, 40, 'Warehouse B - Bin 12'),
        ('Gaming Headset SoundBlast', 'AUD-GAM-010', 'Audio', 3499.00, 41, 15, 'Warehouse A - Bin 2'),
        ('Premium Smartwatch Luxe', 'WAT-LUX-011', 'Wearables', 7999.00, 35, 8, 'Warehouse A - Bin 8'),
        ('Magnetic Phone Stand', 'ACC-MND-012', 'Accessories', 499.00, 42, 15, 'Warehouse B - Bin 14'),
        ('Soundbar Cinema Plus', 'SPK-BAR-013', 'Audio', 8999.00, 30, 5, 'Warehouse B - Bin 1'),
        ('Braided USB-C Cable 2M', 'ACC-CBL-014', 'Accessories', 299.00, 48, 50, 'Warehouse B - Bin 6'),
        ('Rugged Smart Watch Adventure', 'WAT-ADV-015', 'Wearables', 4500.00, 45, 12, 'Warehouse A - Bin 10'),
        ('Waterproof Shower Speaker', 'SPK-WTR-016', 'Audio', 1299.00, 39, 15, 'Warehouse B - Bin 3'),
        ('Wireless Charging Pad 15W', 'ACC-WLS-017', 'Accessories', 1199.00, 44, 20, 'Warehouse B - Bin 9'),
        ('Kids Digital Smartband', 'WAT-KID-018', 'Wearables', 999.00, 41, 15, 'Warehouse A - Bin 11'),
        ('Car Charger Dual Port QC3', 'ACC-CAR-019', 'Accessories', 399.00, 46, 25, 'Warehouse B - Bin 10'),
        ('Studio Reference Monitor Pair', 'AUD-MON-020', 'Audio', 14999.00, 25, 5, 'Warehouse A - Bin 5')`);
            // Seed initial stock-in logs for products
            const seededProds = await (0, index_1.query)('SELECT id, current_stock FROM products');
            for (const prod of seededProds.rows) {
                await (0, index_1.query)(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
           VALUES ($1, $2, 'IN', 'Initial warehouse stock onboarding load', $3)`, [prod.id, prod.current_stock, adminUserId]);
            }
            console.log('20 Products and initial stock onboard movements seeded.');
        }
        // 4. Seed 15 Sales Challans (confirmed challans should safely reduce stock)
        const challanCheck = await (0, index_1.query)('SELECT count(*) FROM challans');
        if (parseInt(challanCheck.rows[0].count) === 0) {
            console.log('Seeding 15 sales challans...');
            const customersList = await (0, index_1.query)('SELECT id, name, business_name FROM customers');
            const productsList = await (0, index_1.query)('SELECT id, name, sku, category, unit_price, current_stock FROM products');
            // Define 15 mock orders with different customers & products
            const mockOrders = [
                { customerIdx: 0, items: [{ prodIdx: 0, qty: 2 }, { prodIdx: 3, qty: 5 }], status: 'Confirmed' },
                { customerIdx: 1, items: [{ prodIdx: 1, qty: 3 }, { prodIdx: 5, qty: 4 }], status: 'Confirmed' },
                { customerIdx: 2, items: [{ prodIdx: 2, qty: 4 }, { prodIdx: 6, qty: 5 }], status: 'Confirmed' },
                { customerIdx: 3, items: [{ prodIdx: 3, qty: 5 }, { prodIdx: 7, qty: 3 }], status: 'Confirmed' },
                { customerIdx: 4, items: [{ prodIdx: 4, qty: 2 }], status: 'Draft' },
                { customerIdx: 5, items: [{ prodIdx: 8, qty: 4 }, { prodIdx: 13, qty: 3 }], status: 'Confirmed' },
                { customerIdx: 6, items: [{ prodIdx: 10, qty: 2 }, { prodIdx: 14, qty: 3 }], status: 'Confirmed' },
                { customerIdx: 7, items: [{ prodIdx: 12, qty: 2 }, { prodIdx: 19, qty: 1 }], status: 'Confirmed' },
                { customerIdx: 8, items: [{ prodIdx: 15, qty: 5 }], status: 'Draft' },
                { customerIdx: 9, items: [{ prodIdx: 16, qty: 4 }, { prodIdx: 18, qty: 3 }], status: 'Confirmed' },
                { customerIdx: 10, items: [{ prodIdx: 1, qty: 5 }, { prodIdx: 10, qty: 2 }], status: 'Confirmed' },
                { customerIdx: 11, items: [{ prodIdx: 5, qty: 5 }, { prodIdx: 17, qty: 4 }], status: 'Confirmed' },
                { customerIdx: 12, items: [{ prodIdx: 7, qty: 3 }, { prodIdx: 9, qty: 2 }], status: 'Confirmed' },
                { customerIdx: 13, items: [{ prodIdx: 11, qty: 4 }], status: 'Draft' },
                { customerIdx: 14, items: [{ prodIdx: 0, qty: 5 }, { prodIdx: 2, qty: 3 }], status: 'Confirmed' }
            ];
            let challanIdx = 1;
            for (const order of mockOrders) {
                const dbCustomer = customersList.rows[order.customerIdx];
                const challanNum = `CH-2026-${challanIdx.toString().padStart(5, '0')}`;
                const snapShotItems = [];
                let totalQty = 0;
                for (const item of order.items) {
                    const dbProd = productsList.rows[item.prodIdx];
                    snapShotItems.push({
                        product_id: dbProd.id,
                        name: dbProd.name,
                        sku: dbProd.sku,
                        category: dbProd.category,
                        unit_price: dbProd.unit_price,
                        quantity: item.qty
                    });
                    totalQty += item.qty;
                    // Deduct from stock if Confirmed
                    if (order.status === 'Confirmed') {
                        await (0, index_1.query)(`UPDATE products SET current_stock = current_stock - $1 WHERE id = $2`, [item.qty, dbProd.id]);
                        // Log OUT stock movement
                        await (0, index_1.query)(`INSERT INTO stock_movements (product_id, quantity, movement_type, reason, created_by)
               VALUES ($1, $2, 'OUT', $3, $4)`, [dbProd.id, item.qty, `Dispatched via Challan ${challanNum}`, adminUserId]);
                    }
                }
                // Save Challan
                await (0, index_1.query)(`INSERT INTO challans (challan_number, customer_id, status, total_quantity, created_by, product_snapshot)
           VALUES ($1, $2, $3, $4, $5, $6)`, [challanNum, dbCustomer.id, order.status, totalQty, adminUserId, JSON.stringify(snapShotItems)]);
                challanIdx++;
            }
            console.log('15 Sales Challans seeded successfully.');
        }
    }
    catch (error) {
        console.error('Error migrating/seeding database:', error);
    }
};
exports.runSchemaAndSeed = runSchemaAndSeed;
