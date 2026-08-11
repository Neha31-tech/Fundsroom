"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretfundstromkey12345';
const login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required.' });
    }
    try {
        const userRes = await (0, db_1.query)('SELECT * FROM users WHERE LOWER(username) = LOWER($1)', [username]);
        if (userRes.rows.length === 0) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const user = userRes.rows[0];
        const isPasswordValid = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid username or password.' });
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
            },
        });
    }
    catch (error) {
        return res.status(500).json({ error: error.message });
    }
};
exports.login = login;
const me = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Not authenticated.' });
    }
    return res.json({ user: req.user });
};
exports.me = me;
