import express from "express";
import bcrypt from "bcryptjs";

const router = express.Router();

// ======================
// Signup Route
// POST /api/users/signup
// ======================
router.post("/signup", async (req, res) => {
  console.log("Signup route hit"); // <- debug

  const { phone, password } = req.body;
  console.log("Received data:", req.body); // <- debug

  if (!phone || !password) {
    console.log("Missing phone or password"); // <- debug
    return res.status(400).json({ success: false, message: "Phone and password required" });
  }

  try {
    const [existing] = await req.db.query("SELECT id FROM users WHERE phone = ?", [phone]);
    console.log("Existing users found:", existing); // <- debug

    if (existing.length > 0) {
      console.log("Phone already registered"); // <- debug
      return res.status(409).json({ success: false, message: "Phone already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("Hashed password:", hashedPassword); // <- debug

    const [result] = await req.db.query(
      "INSERT INTO users (phone, password, username, email, first_name, last_name, role) VALUES (?, ?, ?, '', '', '', 'client')",
      [phone, hashedPassword, phone]
    );
    console.log("Insert result:", result); // <- debug

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      userId: result.insertId,
    });
  } catch (err) {
    console.error("Signup error:", err); // <- debug
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ======================
// Login Route
// POST /api/users/login
// ======================
router.post("/login", async (req, res) => {
  console.log("Login route hit"); // <- debug
  const { phone, password } = req.body;
  console.log("Received data:", req.body); // <- debug

  if (!phone || !password) {
    console.log("Missing phone or password"); // <- debug
    return res.status(400).json({ success: false, message: "Phone and password required" });
  }

  try {
    const [rows] = await req.db.query("SELECT * FROM users WHERE phone = ?", [phone]);
    console.log("Query result:", rows); // <- debug
    const user = rows[0];

    if (!user) {
      console.log("No user found"); // <- debug
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch); // <- debug
    if (!isMatch) {
      console.log("Password incorrect"); // <- debug
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    return res.json({
      success: true,
      message: "Login successful",
      user: { id: user.id, phone: user.phone },
    });
  } catch (err) {
    console.error("Login error:", err); // <- debug
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

export default router;
