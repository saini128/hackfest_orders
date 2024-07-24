const express = require('express');
const mongoose = require('mongoose');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config(); // Load environment variables from .env file

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define schemas
const orderSchema = new mongoose.Schema({
  seller: String,
  buyer: String,
  credits: Number,
  timestamp: String,
  certificate_hash: String
});

const landSchema = new mongoose.Schema({
  land_hash: String,
  credits_sold: Number
});

const Order = mongoose.model('Order', orderSchema);
const Land = mongoose.model('Land', landSchema);

const app = express();
app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Welcome to the Green Credit Trading Platform API');
});

app.post('/create-order', async (req, res) => {
  try {
    const { seller, buyer, credits } = req.body;

    if (!seller || !buyer || !credits) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '');
    const certificate_hash = crypto.randomBytes(16).toString('hex');

    // Save the order to the orders collection
    const order = new Order({
      seller,
      buyer,
      credits,
      timestamp,
      certificate_hash
    });

    await order.save();

    // Update the credits_sold in the registered_lands collection
    await Land.findOneAndUpdate(
      { land_hash: seller },
      { $inc: { credits_sold: credits } },
      { new: true, upsert: true }
    );

    res.status(200).json({ certificate_hash });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
