// src/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const auth = require('../middleware/auth');

router.post('/send', auth, async (req, res) => {
  const { recipientPhone, amount } = req.body;
  try {
    const sender = await User.findById(req.user.id);
    const recipient = await User.findOne({ phoneNumber: recipientPhone });
    if (!recipient) return res.status(404).json({ message: 'Recipient not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method_types: ['card'],
      description: `MboloCash transfer from ${sender.phoneNumber} to ${recipientPhone}`
    });

    const transaction = new Transaction({
      sender: req.user.id,
      recipientPhone,
      amount,
      status: 'completed'
    });
    await transaction.save();

    await twilio.messages.create({
      body: `You received $${amount} from ${sender.phoneNumber} via MboloCash`,
      from: process.env.TWILIO_PHONE,
      to: recipientPhone
    });

    res.json({ message: 'Transaction successful', transaction });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;