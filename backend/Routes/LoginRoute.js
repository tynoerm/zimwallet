import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

// ======================
// Phone Normalizer
// ======================
function normalizePhone(phone) {
  let p = phone.trim();

  // Remove spaces
  p = p.replace(/\s+/g, "");

  // If starts with 0 -> remove it
  if (p.startsWith("0")) {
    p = p.substring(1);
  }

  // If starts with 263 -> add +
  if (p.startsWith("263")) {
    p = "+" + p;
  }

  // If already correct
  if (!p.startsWith("+263")) {
    p = "+263" + p;
  }

  return p;
}

// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    if (!req.db) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password required" });
    }

    phone = normalizePhone(phone);

    const [existing] = await req.db.query(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await req.db.query(
      `INSERT INTO users 
      (phone, password, username, email, first_name, last_name, role)
      VALUES (?, ?, ?, '', '', '', 'client')`,
      [phone, hashedPassword, phone]
    );

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (error) {
    console.error("SIGNUP ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    if (!req.db) {
      return res.status(503).json({ success: false, message: "Database not connected" });
    }

    let { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ success: false, message: "Phone and password required" });
    }

    phone = normalizePhone(phone);

    const [rows] = await req.db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    res.json({
      success: true,
      message: "Login successful",
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
