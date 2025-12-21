import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ======================
// Multer Config
// ======================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ======================
// GET all loans by user
// ======================
// GET all loans (no filter)
// ======================
router.get("/", async (req, res) => {
  try {
    const [rows] = await req.db.query(
      `SELECT id, loan_number, customer_id, amount, interest_rate, term_months, status
       FROM loans`
    );

    return res.json(rows);
  } catch (error) {
    console.error("Error fetching loans:", error);
    return res.status(500).json({ message: "Error fetching loans", error });
  }
});


// ======================
// POST new loan
// ======================
router.post("/", upload.single("selfieImage"), async (req, res) => {
  try {
    const {
      loan_number,
      customer_id,
      amount,
      interest_rate,
      term_months,
      purpose,
      status,
      created_by,
      notes,
    } = req.body;

    const selfieImage = req.file ? req.file.filename : null;

    await req.db.query(
      `INSERT INTO loans
      (loan_number, customer_id, amount, interest_rate, term_months, purpose, status, created_by, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        loan_number,
        customer_id,
        amount,
        interest_rate,
        term_months,
        purpose,
        status || "pending",
        created_by,
        notes || selfieImage,
      ]
    );

    res.json({ success: true, message: "Loan submitted successfully", loan_number });
  } catch (err) {
    console.error("Error creating loan:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;
