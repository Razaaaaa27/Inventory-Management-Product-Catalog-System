const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order');
const User = require('../models/User');
const Wishlist = require('../models/Wishlist');

// Apply authentication middleware to all user routes
router.use(isAuthenticated);

// User dashboard
router.get('/', async (req, res) => {
    try {
        // Get user's recent activity or relevant data
        const products = await Product.find({ isActive: true })
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(5);

        res.render('user/dashboard', {
            title: 'Dashboard',
            products,
            path: req.path
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        req.flash('error', 'Failed to load dashboard');
        res.redirect('/');
    }
});

// Orders list
router.get('/orders', async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .sort({ createdAt: -1 });

        res.render('user/orders', {
            title: 'My Orders',
            orders,
            path: req.path
        });
    } catch (error) {
        console.error('Orders list error:', error);
        req.flash('error', 'Failed to load orders');
        res.redirect('/dashboard');
    }
});

// Order details
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findOne({
            _id: req.params.id,
            user: req.user._id
        }).populate('items.product');

        if (!order) {
            req.flash('error', 'Order not found');
            return res.redirect('/dashboard/orders');
        }

        res.render('user/order-detail', {
            title: 'Order Details',
            order,
            path: req.path
        });
    } catch (error) {
        console.error('Order detail error:', error);
        req.flash('error', 'Failed to load order details');
        res.redirect('/dashboard/orders');
    }
});

// Wishlist
router.get('/wishlist', async (req, res) => {
    try {
        const wishlist = await Wishlist.findOne({ user: req.user._id })
            .populate({
                path: 'products',
                populate: { path: 'category' }
            });

        res.render('user/wishlist', {
            title: 'My Wishlist',
            products: wishlist ? wishlist.products : [],
            path: req.path
        });
    } catch (error) {
        console.error('Wishlist error:', error);
        req.flash('error', 'Failed to load wishlist');
        res.redirect('/dashboard');
    }
});

// Add to wishlist
router.post('/wishlist/add', async (req, res) => {
    try {
        const { productId } = req.body;
        
        let wishlist = await Wishlist.findOne({ user: req.user._id });
        
        if (!wishlist) {
            wishlist = new Wishlist({
                user: req.user._id,
                products: [productId]
            });
        } else if (!wishlist.products.includes(productId)) {
            wishlist.products.push(productId);
        }
        
        await wishlist.save();
        req.flash('success', 'Product added to wishlist');
        res.redirect('back');
    } catch (error) {
        console.error('Add to wishlist error:', error);
        req.flash('error', 'Failed to add product to wishlist');
        res.redirect('back');
    }
});

// Remove from wishlist
router.post('/wishlist/remove', async (req, res) => {
    try {
        const { productId } = req.body;
        
        await Wishlist.findOneAndUpdate(
            { user: req.user._id },
            { $pull: { products: productId } }
        );
        
        req.flash('success', 'Product removed from wishlist');
        res.redirect('/dashboard/wishlist');
    } catch (error) {
        console.error('Remove from wishlist error:', error);
        req.flash('error', 'Failed to remove product from wishlist');
        res.redirect('/dashboard/wishlist');
    }
});

// User profile
router.get('/profile', (req, res) => {
    res.render('user/profile', {
        title: 'My Profile',
        user: req.user
    });
});

// Update profile
router.post('/profile', async (req, res) => {
    try {
        const { name, email } = req.body;
        
        // Update user
        await User.findByIdAndUpdate(req.user.id, {
            name,
            email
        });

        req.flash('success', 'Profile updated successfully');
        res.redirect('/dashboard/profile');
    } catch (error) {
        console.error('Profile update error:', error);
        req.flash('error', 'Error updating profile');
        res.redirect('/dashboard/profile');
    }
});

module.exports = router; 