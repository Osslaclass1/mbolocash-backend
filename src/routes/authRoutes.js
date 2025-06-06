const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { generateOTP } = require('../utils/otp');

// Middleware for input validation
const validateRegister = (req, res, next) => {
  const { username, phoneNumber, name, email, password, bankAccount, verified } = req.body;
  if (!username || !phoneNumber || !name || !email || !password || !bankAccount) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  if (!/^\+?[1-9]\d{9,14}$/.test(phoneNumber)) {
    return res.status(400).json({ message: 'Invalid phone number format' });
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ message: 'Invalid email format' });
  }
  req.body.verified = verified || false;
  next();
};

// Register route
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { username, phoneNumber, name, email, password, bankAccount, verified } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = generateOTP();

    const user = new User({
      username,
      phoneNumber,
      name,
      email,
      password: hashedPassword,
      bankAccount,
      verified,
      otp,
      otpExpires: Date.now() + 10 * 60 * 1000,
    });

    await user.save();

    console.log(`OTP for ${email}: ${otp}`);

    res.status(201).json({ message: 'User registered, OTP sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

module.exports = router;