const express = require('express');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});