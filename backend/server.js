// ======================
// Import Dependencies
// ======================
import express from "express";
import mysql from "mysql2/promise";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load environment variables (still useful if you move later)
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
  console.log("➡️ Headers:", req.headers);
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
// MySQL Connection Pool (AMENDED)
// ======================
let db;

try {
  db = mysql.createPool({
    host: "localhost", // change if hosting provides a different host
    user: "bluebabyco_bluebaby",
    password: "Bluebaby@2026!",
    database: "bluebabyco_agility_finance", // ✅ ACTIVE DATABASE
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  // Test connection immediately
  await db.query("SELECT 1");
  console.log("✅ Connected to MySQL Database (via Pool)");

} catch (err) {
  console.error("❌ MySQL connection error:", err.message);
  process.exit(1);
}

// ======================
// Attach DB Pool to Every Request
// ======================
app.use((req, res, next) => {
  req.db = db;
  next();
});

// ======================
// Optional Query Logger Helper
// ======================
const logQuery = async (query, params = []) => {
  console.log("🧠 Executing Query:", query);
  if (params.length) console.log("➡️ Params:", params);

  try {
    const [results] = await db.query(query, params);
    console.log("✅ Query Result:", results);
    return results;
  } catch (error) {
    console.error("❌ Query Error:", error.message);
    throw error;
  }
};

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
// Default Route
// ======================
app.get("/", (req, res) => {
  res.send("✅ Node.js backend running with MySQL and file uploads!");
});

// ======================
// Error Handling Middleware
// ======================
app.use((err, req, res, next) => {
  console.error("🔥 Uncaught Server Error:");
  console.error(err.stack || err);
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
