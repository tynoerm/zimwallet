import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

const normalizePhone = (phone = "") => {
  if (phone.startsWith("+")) return phone.replace("+", "");
  if (phone.startsWith("0")) return "263" + phone.slice(1);
  return phone;
};


// ======================
// SIGNUP
// ======================
router.post("/signup", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
const password = req.body.password;


    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password required",
      });
    }

    const [existing] = await req.db.query(
      "SELECT id FROM users WHERE phone = ?",
      [phone]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Phone already registered",
      });
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

// ======================
// LOGIN
// ======================
router.post("/login", async (req, res) => {
  try {
    const phone = normalizePhone(req.body.phone);
const password = req.body.password;


    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: "Phone and password required",
      });
    }

    const [rows] = await req.db.query(
      "SELECT * FROM users WHERE phone = ?",
      [phone]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
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
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

export default router;
