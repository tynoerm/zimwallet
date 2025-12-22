// ======================
// Import Dependencies
// ======================
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

dotenv.config();

// ======================
// Initialize Express
// ======================
const app = express();
const PORT = process.env.PORT || 10000;

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Ensure uploads directory exists
// ======================
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
app.use("/uploads", express.static(uploadDir));

// ======================
// MySQL Connection Pool (FINAL FIX)
// ======================
let db = null;

async function connectDB() {
  try {
    console.log("🔌 Connecting to MySQL @ 109.75.161.2");

    db = mysql.createPool({
      host: "109.75.161.2",              // ✅ CORRECT HOST
      user: "bluebabyco_bluebaby",
      password: "Bluebaby@2026!",
      database: "bluebabyco_agility_finance",
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 30000,
    });

    await db.query("SELECT 1");
    console.log("✅ MySQL connected successfully");

  } catch (err) {
    console.error("❌ MySQL connection error:", err.message);
  }
}

connectDB();

// ======================
// Attach DB to Requests
// ======================
app.use((req, res, next) => {
  if (!db) {
    return res.status(503).json({
      success: false,
      message: "Database not connected",
    });
  }
  req.db = db;
  next();
});

// ======================
// Import Routes
// ======================
import LoginRoute from "./Routes/LoginRoute.js";
import LoanRoute from "./Routes/LoanRoute.js";
import LoanstatusRoute from "./Routes/LoanstatusRoute.js";
import PaymentRoutes from "./Routes/PaymentRoutes.js";

app.use("/api/users", LoginRoute);
app.use("/api/loans", LoanRoute);
app.use("/api/getstatusloans", LoanstatusRoute);
app.use("/api/loanstobepaid", PaymentRoutes);

// ======================
// Health + DB Test
// ======================
app.get("/", (req, res) => {
  res.send("✅ BlueBaby API running");
});

app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT DATABASE() AS db");
    res.json({ success: true, database: rows[0].db });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// Start Server
// ======================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
