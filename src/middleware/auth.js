const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Authentication middleware
exports.isAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'Please log in to access this page');
    res.redirect('/auth/login');
};

// Admin middleware
exports.isAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
        return next();
    }
    req.flash('error', 'You do not have permission to access this page');
    res.redirect('/');
};

// Redirect if authenticated
exports.redirectIfAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
        if (req.user.isAdmin) {
            return res.redirect('/admin');
        }
        return res.redirect('/dashboard');
    }
    next();
};

// API authentication middleware
exports.apiAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.session.token;
    
    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = exports; 