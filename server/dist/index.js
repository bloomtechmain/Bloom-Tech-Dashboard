"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = __importDefault(require("./db"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.get('/', (req, res) => {
    res.send('BloomAudit Backend (TS v1) is running!');
});
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
app.get('/db-test', async (req, res) => {
    try {
        const result = await db_1.default.query('SELECT NOW()');
        res.json({
            success: true,
            message: 'Database connection established.',
            data: result.rows[0]
        });
    }
    catch (err) {
        console.error('DB Connection Error:', err.message);
        res.status(500).json({
            success: false,
            error: 'Failed to connect to the database.'
        });
    }
});
app.listen(PORT, () => {
    console.log(`🚀 Server navigating at http://localhost:${PORT}`);
});
