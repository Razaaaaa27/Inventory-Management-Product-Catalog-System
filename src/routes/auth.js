const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const { redirectIfAuthenticated } = require('../middleware/auth');

// Login page
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', {
        title: 'Login'
    });
});

// Login process
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) {
            return next(err);
        }
        if (!user) {
            req.flash('error', info.message);
            return res.redirect('/auth/login');
        }
        req.logIn(user, (err) => {
            if (err) {
                return next(err);
            }
            // Redirect based on user role
            if (user.isAdmin) {
                return res.redirect('/admin');
            }
            return res.redirect('/dashboard');
        });
    })(req, res, next);
});

// Register page
router.get('/register', redirectIfAuthenticated, (req, res) => {
    res.render('auth/register', {
        title: 'Register'
    });
});

// Register process
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            req.flash('error', 'Email is already registered');
            return res.redirect('/auth/register');
        }

        // Create new user
        user = new User({
            name,
            email: email.toLowerCase(),
            password,
            isActive: true
        });

        await user.save();

        req.flash('success', 'You are now registered and can log in');
        res.redirect('/auth/login');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error', 'An error occurred during registration');
        res.redirect('/auth/register');
    }
});

// Logout process
router.post('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.redirect('/dashboard');
        }
        req.flash('success', 'You have been logged out successfully');
        res.redirect('/');
    });
});

// Create initial admin user (development only)
router.get('/setup-admin', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).send('Not found');
    }

    try {
        // Check if admin already exists
        const adminExists = await User.findOne({ email: 'admin@example.com' });
        if (adminExists) {
            return res.send('Admin user already exists');
        }

        // Create admin user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        const admin = new User({
            name: 'Admin',
            email: 'admin@example.com',
            password: hashedPassword,
            isAdmin: true,
            isActive: true
        });

        await admin.save();
        res.send('Admin user created successfully. Email: admin@example.com, Password: admin123');
    } catch (error) {
        console.error('Admin setup error:', error);
        res.status(500).send('Error creating admin user');
    }
});

module.exports = router; 