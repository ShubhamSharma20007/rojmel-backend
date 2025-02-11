const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Replaces bodyParser.json()

// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.use(express.static(path.join(__dirname, 'public'))); // Set the public directory

// Middleware for rate-limiting (to prevent abuse)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: "Too many requests, please try again later."
});
app.use(limiter);

// Routes
app.use('/api/v1', routes);

// MongoDB Connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('MongoDB connected');
  } catch (err) {
    console.log('MongoDB connection error:', err);
    process.exit(1); // Exit process with failure
  }
};

connectDB();

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));