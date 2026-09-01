const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// In-Memory Storage
const users = [];
const otpStore = {}; 

// Email Transporter Config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'quinndaniel100@gmail.com',
    pass: process.env.GMAIL_PASS || 'algbhelfhsfrifmr'
  }
});

// ROUTE 1: Send OTP
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp;

  const mailOptions = {
    from: '"GODMAN Fashion" <quinndaniel100@gmail.com>',
    to: email,
    subject: 'Your GODMAN Verification Code (OTP)',
    html: `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #fff; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d4af37; text-align: center;">GODMAN</h2>
        <p>Your single-use verification code is:</p>
        <h1 style="color: #d4af37; text-align: center; letter-spacing: 4px;">${otp}</h1>
        <p style="font-size: 0.8rem; color: #888;">If you did not request this, please ignore this email.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'Failed to deliver OTP.' });
  }
});

// ROUTE 2: Register User & Notify Admin
app.post('/api/register', async (req, res) => {
  const { fullName, brandName, email, phone, address, role, nin, otp } = req.body;

  if (otp && otpStore[email] !== otp) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP.' });
  }
  if (otp) delete otpStore[email];

  const vendorId = role === 'vendor' ? `GM-VND-${Math.floor(10000 + Math.random() * 90000)}` : null;
  const newUser = { id: Date.now(), fullName, brandName, email, phone, address, role, nin, vendorId, createdAt: new Date() };
  
  users.push(newUser);

  const adminMailOptions = {
    from: '"GODMAN System" <quinndaniel100@gmail.com>',
    to: 'quinndaniel100@gmail.com',
    subject: `🚨 New ${role.toUpperCase()} Registration: ${fullName}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f4;">
        <h2 style="color: #333;">New Account Registered on GODMAN Platform</h2>
        <ul>
          <li><strong>Role:</strong> ${role.toUpperCase()}</li>
          <li><strong>Name:</strong> ${fullName}</li>
          <li><strong>Brand/Display Name:</strong> ${brandName}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Address:</strong> ${address}</li>
          ${vendorId ? `<li><strong>Vendor ID:</strong> ${vendorId}</li>` : ''}
          ${nin ? `<li><strong>NIN:</strong> ${nin}</li>` : ''}
        </ul>
      </div>
    `
  };

  try {
    await transporter.sendMail(adminMailOptions);
  } catch (err) {
    console.error('Admin notification failed:', err);
  }

  res.json({ success: true, user: newUser });
});

// ROUTE 3: User Login
app.post('/api/login', (req, res) => {
  const { email } = req.body;
  const user = users.find((u) => u.email === email);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User profile not found.' });
  }
  res.json({ success: true, user });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));