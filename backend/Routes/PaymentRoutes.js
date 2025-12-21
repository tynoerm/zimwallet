import express from 'express';
import { Paynow } from 'paynow';

const router = express.Router();

// ✅ Format phone number helper
function formatPhoneNumber(phone) {
  let p = phone.toString().trim();
  if (p.startsWith('0')) p = '+263' + p.slice(1);
  if (!p.startsWith('+263')) p = '+263' + p;
  return p;
}

// ✅ Paynow credentials
const paynow = new Paynow(
  'YOUR_PAYNOW_INTEGRATION_ID',      // replace with your ID
  'YOUR_PAYNOW_INTEGRATION_KEY'      // replace with your KEY
);

paynow.resultUrl = 'http://192.168.1.228:5000/api/paynow/status'; // webhook
paynow.returnUrl = 'http://192.168.1.228:5000/payment-success';   // redirect after payment

// =====================
// Initiate Payment
// =====================

router.post('/initiate', async (req, res) => {
  try {
    const { amount, email, phone, loanId, userId } = req.body;

    if (!amount || !email || !phone || !loanId || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create PayNow payment
    const payment = paynow.createPayment(`Loan-${loanId}`, email);
    payment.add(`Loan repayment for ${loanId}`, amount);

    const response = await paynow.send(payment);

    if (response.success) {
      return res.json({
        redirectUrl: response.redirectUrl,
        pollUrl: response.pollUrl
      });
    } else {
      return res.status(400).json({ error: 'Failed to initialize PayNow' });
    }
  } catch (err) {
    console.error('PayNow initiate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// Handle PayNow status callback
// =====================
router.post('/status', async (req, res) => {
  try {
    const data = req.body;
    console.log('PayNow Callback Data:', data);

    // TODO: Update your loan/payment record in DB based on `data`
    // e.g., mark loan as "Paid"

    res.status(200).json({ message: 'Status received' });
  } catch (err) {
    console.error('PayNow status error:', err);
    res.status(500).json({ error: 'Status handler failed' });
  }
});

// =====================
// Poll Payment Status
// =====================
router.get('/payments/status', async (req, res) => {
  const { pollUrl } = req.query;
  if (!pollUrl) return res.status(400).json({ success: false, message: 'pollUrl required' });

  try {
    const status = await paynow.pollTransaction(pollUrl);

    // TODO: Update transaction record in your DB
    // Example: await db.query('UPDATE transactions SET status = ? WHERE poll_url = ?', [status.status, pollUrl]);

    res.json(status);
  } catch (err) {
    console.error('Poll error:', err);
    res.status(500).json({ success: false, message: 'Error polling status' });
  }
});

export default router;
