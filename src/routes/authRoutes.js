const express = require('express');
const router = express.Router();
const User = require('../models/User');
const twilio = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

router.post('/register', async (req, res) => {
  console.log('Request headers:', JSON.stringify(req.headers, null, 2));
  console.log('Raw body:', req.body);
  console.log('Body type:', typeof req.body);
  const { username, phoneNumber, name, email, password, bankAccount, verified } = req.body || {};
  console.log('Destructured username:', username);
  console.log('Destructured body:', { username, phoneNumber, name, email, password, bankAccount, verified });
  if (!username) {
    return res.status(400).json({ message: 'username is required' });
  }
  if (!phoneNumber) {
    return res.status(400).json({ message: 'phoneNumber is required' });
  }
  if (!name) {
    return res.status(400).json({ message: 'name is required' });
  }
  if (!email) {
    return res.status(400).json({ message: 'email is required' });
  }
  if (!password) {
    return res.status(400).json({ message: 'password is required' });
  }

  try {
    let user = await User.findOne({ $or: [{ phoneNumber }, { email }, { username }] });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({ username, phoneNumber, name, email, password, bankAccount, verified });
    await user.save();

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await twilio.messages.create({
      body: `Your OTP is ${otp}`,
      from: process.env.TWILIO_PHONE,
      to: phoneNumber
    });

    res.status(201).json({ message: 'User registered, OTP sent' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;