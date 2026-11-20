const express = require('express');
const mongoose = require('mongoose');
const User = require("./User");
const Orders = require("./Orders");
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const dotenv = require("dotenv");
const path = require('path');

dotenv.config();
const app = express();

// CORS configuration to allow all origins
app.use(cors());
app.use(express.json());

// ========== Database Connection ==========
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
    
    // Seed admin user on startup
    await seedAdminUser();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err.message);
    setTimeout(() => {
      console.log("🔄 Retrying database connection...");
      connectDB();
    }, 5000);
  }
};

connectDB();

// ========== Utility Functions ==========
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePassword = (password) => {
  if (password.length < 6) return false;
  return true;
};

function getDateAndTime() {
  let date = new Date();
  let options = {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  let currentDate = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  let istTime = date.toLocaleTimeString('en-IN', options);
  return currentDate + " " + istTime;
}

// ========== Seed Admin User ==========
const seedAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      console.log("ℹ️ ADMIN_EMAIL / ADMIN_PASSWORD not set; skipping admin seed");
      return;
    }
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({ 
        email: adminEmail,
        password: hashedPassword,
        isAdmin: true
      });
      console.log("✅ Admin user created:", adminEmail);
    }
  } catch (error) {
    console.error("Seed admin error:", error.message);
  }
};

// ========== Health Check ==========
app.get('/', async (req, res) => {
  res.json({ 
    message: "🍕 Fizza API is running", 
    status: "ok",
    timestamp: new Date().toISOString()
  });
});

// ========== REGISTER ENDPOINT ==========
app.post('/register', async (req, res) => {
  try {
    const { Email, Password, ConfirmPassword } = req.body;
    
    // Validation
    if (!Email || !Password || !ConfirmPassword) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    if (!validateEmail(Email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }
    
    if (!validatePassword(Password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }
    
    if (Password !== ConfirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }
    
    // Check if user already exists
    const normalizedEmail = String(Email).toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'Email already registered' 
      });
    }
    
    // Hash password and create user
    const hashedPassword = await bcrypt.hash(Password, 10);
    const user = await User.create({ 
      email: normalizedEmail,
      password: hashedPassword,
      isAdmin: false
    });
    
    console.log(`✅ New user registered: ${Email}`);
    res.status(201).json({ 
      message: 'User registered successfully',
      userId: user._id,
      email: user.email
    });
    
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// ========== LOGIN ENDPOINT ==========
app.post('/login', async (req, res) => {
  try {
    const { Email, Password } = req.body;
    
    // Validation
    if (!Email || !Password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }
    
    // Find user
    const normalizedEmail = String(Email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Compare passwords
    const isPasswordValid = await bcrypt.compare(Password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { Email: user.email, userId: user._id, isAdmin: user.isAdmin || false }, 
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log(`✅ User logged in: ${Email}`);
    res.status(200).json({ 
      token, 
      id: user._id,
      email: user.email,
      isAdmin: user.isAdmin || false
    });
    
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

// ========== GET USER ORDERS ==========
app.get('/orders/:usrId', async (req, res) => {
  try {
    const { usrId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(usrId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const orders = await Orders.find({ UserId: usrId }).sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return res.status(404).json({ 
        error: 'No orders found',
        orders: []
      });
    }
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get orders error:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ========== GET SINGLE ORDER ==========
app.get('/order/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const order = await Orders.findOne({ _id: orderId });
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error('Get order error:', error.message);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// ========== GET ALL ORDERS (ADMIN) ==========
app.get('/admin/orders', async (req, res) => {
  try {
    const orders = await Orders.find().sort({ createdAt: -1 });
    
    if (orders.length === 0) {
      return res.status(200).json({ 
        message: 'No orders found',
        orders: []
      });
    }
    
    res.status(200).json(orders);
  } catch (error) {
    console.error('Get all orders error:', error.message);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ========== UPDATE ORDER STATUS (ADMIN) ==========
app.post('/admin/order/update', async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId || !status) {
      return res.status(400).json({ error: 'Order ID and status are required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    
    const validStatuses = ['Order Placed', 'Preparing', 'Ready for Pickup', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid order status' });
    }
    
    const order = await Orders.findByIdAndUpdate(
      orderId,
      { Status: status },
      { new: true }
    );
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    console.log(`✅ Order ${orderId} status updated to ${status}`);
    res.status(200).json({ 
      message: 'Order updated successfully',
      order 
    });
    
  } catch (error) {
    console.error('Update order error:', error.message);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ========== CREATE ORDER (FROM CART) ==========
app.post('/cart/checkout', async (req, res) => {
  try {
    const { userId, Address, Phone, items } = req.body;
    
    // Validation
    if (!userId || !Address || !Phone || !items || items.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    // Calculate total amount
    const totalAmount = items.reduce((total, item) => {
      const price = parseInt(item.price?.replace('₹', '').replace(',', '') || 0);
      return total + (price * (item.quantity || 1));
    }, 0);
    
    if (totalAmount <= 0) {
      return res.status(400).json({ error: 'Invalid cart total' });
    }
    
    // Create order
    const order = await Orders.create({
      UserId: userId,
      Address,
      Phone,
      Ordered_Items: items,
      Ordered_Time: getDateAndTime(),
      Status: "Order Placed",
      Total_Amount: totalAmount.toString()
    });
    
    console.log(`✅ New order placed: ${order._id}`);
    res.status(201).json({ 
      message: 'Order placed successfully',
      orderId: order._id,
      order
    });
    
  } catch (error) {
    console.error('Checkout error:', error.message);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// ========== Error handling middleware ==========
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ========== 404 handler ==========
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ========== Start Server ==========
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 App is listening on port ${PORT}`);
  console.log(`📍 API: http://localhost:${PORT}`);
});
