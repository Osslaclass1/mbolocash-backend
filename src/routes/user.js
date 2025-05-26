// src/routes/user.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Register
router.post('/register', async (req, res) => {
  const { phoneNumber, name, email, password } = req.body;
  try {
    let user = await User.findOne({ phoneNumber });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({
      phoneNumber,
      name,
      email,
      password: await bcrypt.hash(password, 10)
    });
    await user.save();

    // Send OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000);
    await twilio.messages.create({
      body: `Your MboloCash OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });

    res.status(201).json({ message: 'User registered, OTP sent' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { phoneNumber, password } = req.body;
  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;