// ======================
// Import Dependencies
// ======================
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// ======================
// Load environment variables
// ======================
dotenv.config();

// ======================
// Initialize Express
// ======================
const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Middleware
// ======================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// GLOBAL REQUEST & RESPONSE LOGGER
// ======================
app.use((req, res, next) => {
  console.log("========================================");
  console.log("📥 Incoming Request:");
  console.log(`➡️ Method: ${req.method}`);
  console.log(`➡️ URL: ${req.originalUrl}`);
  console.log("➡️ Body:", req.body);

  const oldSend = res.send;
  res.send = function (data) {
    console.log("📤 Response Sent:");
    try {
      console.log(JSON.parse(data));
    } catch {
      console.log(data);
    }
    console.log("========================================\n");
    oldSend.apply(res, arguments);
  };

  next();
});

// ======================
// Ensure uploads directory exists
// ======================
const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Serve uploaded files statically
app.use("/uploads", express.static(uploadDir));

// ======================
// MySQL Connection Pool (RENDER SAFE)
// ======================
let db = null;

async function connectDB() {
  try {
    db = mysql.createPool({
      host: "mysql.bluebaby.co.uk", // ✅ CORRECT FOR RENDER
      user: "bluebabyco_bluebaby",
      password: "Bluebaby@2026!",
      database: "bluebabyco_agility_finance",
      port: 3306,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 20000,
    });

    await db.query("SELECT 1");
    console.log("✅ Connected to MySQL Database (Remote)");

  } catch (err) {
    console.error("❌ MySQL connection failed:", err.message);
    // ❗ DO NOT exit on Render
  }
}

connectDB();

// ======================
// Attach DB to Requests (Safe)
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

// ======================
// Use Routes
// ======================
app.use("/api/users", LoginRoute);
app.use("/api/loans", LoanRoute);
app.use("/api/getstatusloans", LoanstatusRoute);
app.use("/api/loanstobepaid", PaymentRoutes);

// ======================
// Health Check Route
// ======================
app.get("/", (req, res) => {
  res.send("✅ BlueBaby API running with MySQL");
});

// ======================
// DB Test Route (IMPORTANT)
// ======================
app.get("/db-test", async (req, res) => {
  try {
    const [rows] = await req.db.query("SELECT DATABASE() AS db");
    res.json({ success: true, database: rows[0].db });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ======================
// Error Handling Middleware
// ======================
app.use((err, req, res, next) => {
  console.error("🔥 Server Error:", err.stack || err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
});

// ======================
// Start Server
// ======================
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
