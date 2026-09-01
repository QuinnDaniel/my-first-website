require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

// Email Transporter Configuration using Environment Variables
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// 1. Send OTP & Email Notification Endpoint
app.post('/api/send-otp', async (req, res) => {
  const { email, phone, fullName, role } = req.body;
  const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

  try {
    // Notify Admin of Registration Attempt
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `GODMAN Registration Attempt: ${fullName}`,
      text: `New User Registration:\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nRole: ${role}\nOTP Sent: ${generatedOtp}`
    });

    res.status(200).json({ success: true, message: 'OTP dispatched', otp: generatedOtp });
  } catch (err) {
    console.error('OTP Mail Error:', err);
    res.status(500).json({ success: false, message: 'Failed to dispatch verification' });
  }
});

// 2. Order Notification & Booking Code Endpoint
app.post('/api/create-order', async (req, res) => {
  const { buyerEmail, buyerPhone, items, totalAmount, vendorId } = req.body;
  const bookingCode = `GM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

  try {
    await transporter.sendMail({
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `NEW ORDER RECIEVED [${bookingCode}]`,
      html: `
        <h3>New Order Placed on GODMAN Marketplace</h3>
        <p><strong>Booking Code:</strong> ${bookingCode}</p>
        <p><strong>Customer:</strong> ${buyerEmail} (${buyerPhone})</p>
        <p><strong>Total Amount (15% Cut Retained):</strong> ₦${totalAmount}</p>
      `
    });

    res.status(200).json({ success: true, bookingCode });
  } catch (err) {
    console.error('Order Mail Error:', err);
    res.status(500).json({ success: false, message: 'Order notification failed' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`GODMAN Server running on port ${PORT}`));