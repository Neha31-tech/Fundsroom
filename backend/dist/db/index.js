"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.query = exports.initDb = exports.pool = void 0;
const pg_1 = require("pg");
const cloudflare_workers_1 = require("cloudflare:workers");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const initDb = (connectionString) => {
    if (exports.pool)
        return exports.pool;
    // Cloudflare Hyperdrive
    const hyperdriveConnection = connectionString || cloudflare_workers_1.env.HYPERDRIVE?.connectionString;
    if (hyperdriveConnection) {
        exports.pool = new pg_1.Pool({
            connectionString: hyperdriveConnection,
            ssl: {
                rejectUnauthorized: false,
            },
        });
    }
    else {
        // Local development
        exports.pool = new pg_1.Pool({
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_DATABASE,
            password: process.env.DB_PASSWORD,
            port: parseInt(process.env.DB_PORT || '5432'),
            ssl: {
                rejectUnauthorized: false,
            },
        });
    }
    return exports.pool;
};
exports.initDb = initDb;
const query = (text, params) => {
    if (!exports.pool) {
        (0, exports.initDb)();
    }
    return exports.pool.query(text, params);
};
exports.query = query;
