const express = require('express');
const router = express.Router();
const { isAuthenticated, isAdmin } = require('../middleware/auth');
const Product = require('../models/Product');
const Category = require('../models/Category');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
fs.mkdir(uploadDir, { recursive: true }).catch(console.error);

// Multer configuration for file uploads
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
        return cb(null, true);
    }
    cb(new Error('Only image files (jpg, jpeg, png, gif) are allowed!'), false);
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Apply authentication and admin middleware to all routes
router.use(isAuthenticated, isAdmin);

// Set admin layout for all routes
router.use((req, res, next) => {
    res.locals.layout = 'layouts/admin';
    res.locals.path = req.path;
    next();
});

// Admin dashboard
router.get('/', async (req, res) => {
    try {
        // Get dashboard statistics
        const [totalProducts, totalCategories, lowStockItems, recentProducts] = await Promise.all([
            Product.countDocuments(),
            Category.countDocuments(),
            Product.countDocuments({ stock: { $lte: 5 }}),
            Product.find()
                .populate('category')
                .sort({ createdAt: -1 })
                .limit(5)
        ]);

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalProducts,
                totalCategories,
                lowStockItems
            },
            recentProducts,
            path: req.path
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        req.flash('error', 'Failed to load dashboard data');
        res.redirect('/');
    }
});

// Products routes
router.get('/products', async (req, res) => {
    try {
        let query = {};
        
        // Handle search
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: 'i' };
        }
        
        // Handle filters
        if (req.query.filter === 'low-stock') {
            query.stock = { $lte: 5 };
        }

        const products = await Product.find(query)
            .populate('category')
            .sort({ createdAt: -1 });
        
        res.render('admin/products/index', {
            title: 'Manage Products',
            products,
            req
        });
    } catch (error) {
        console.error('Products list error:', error);
        req.flash('error', 'Failed to load products');
        res.redirect('/admin');
    }
});

// Add new product form
router.get('/products/new', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.render('admin/products/form', {
            title: 'Add New Product',
            product: {},
            categories,
            path: req.path
        });
    } catch (error) {
        console.error('New product form error:', error);
        req.flash('error', 'Failed to load product form');
        res.redirect('/admin/products');
    }
});

// Add product
router.post('/products', upload.single('image'), async (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            category: req.body.category || null,
            isActive: req.body.isActive === 'on'
        };

        if (req.file) {
            productData.image = '/uploads/' + req.file.filename;
        }

        const product = await Product.create(productData);
        req.flash('success', 'Product added successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Add product error:', error);
        req.flash('error', 'Failed to add product: ' + error.message);
        res.redirect('/admin/products/new');
    }
});

// Edit product form
router.get('/products/:id/edit', async (req, res) => {
    try {
        const [product, categories] = await Promise.all([
            Product.findById(req.params.id).populate('category'),
            Category.find().sort({ name: 1 })
        ]);

        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        res.render('admin/products/form', {
            title: 'Edit Product',
            product,
            categories,
            path: req.path
        });
    } catch (error) {
        console.error('Edit product form error:', error);
        req.flash('error', 'Failed to load product');
        res.redirect('/admin/products');
    }
});

// Update product
router.put('/products/:id', upload.single('image'), async (req, res) => {
    try {
        const productData = {
            name: req.body.name,
            description: req.body.description,
            price: parseFloat(req.body.price),
            stock: parseInt(req.body.stock),
            category: req.body.category || null,
            isActive: req.body.isActive === 'on'
        };

        const product = await Product.findById(req.params.id);
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/admin/products');
        }

        // Handle image update
        if (req.file) {
            // Delete old image if exists
            if (product.image) {
                const oldImagePath = path.join(uploadDir, path.basename(product.image));
                await fs.unlink(oldImagePath).catch(() => {});
            }
            productData.image = '/uploads/' + req.file.filename;
        } else if (req.body.removeImage === 'on' && product.image) {
            // Remove image if checkbox is checked
            const imagePath = path.join(uploadDir, path.basename(product.image));
            await fs.unlink(imagePath).catch(() => {});
            productData.image = null;
        }

        await Product.findByIdAndUpdate(req.params.id, productData);
        req.flash('success', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Update product error:', error);
        req.flash('error', 'Failed to update product: ' + error.message);
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
});

// Delete product
router.delete('/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Product not found' 
            });
        }

        // Delete product image if exists
        if (product.image) {
            const imagePath = path.join(uploadDir, path.basename(product.image));
            await fs.unlink(imagePath).catch(() => {});
        }

        await product.deleteOne();
        
        return res.status(200).json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Delete product error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete product'
        });
    }
});

// Categories routes
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.render('admin/categories/index', {
            title: 'Manage Categories',
            categories,
            path: req.path
        });
    } catch (error) {
        console.error('Categories list error:', error);
        req.flash('error', 'Failed to load categories');
        res.redirect('/admin');
    }
});

// Add new category form
router.get('/categories/new', (req, res) => {
    res.render('admin/categories/form', {
        title: 'Add New Category',
        category: {},
        path: req.path
    });
});

// Add category
router.post('/categories', async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
            description: req.body.description,
            isActive: req.body.isActive === 'on',
            slug: req.body.name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '')
        };

        await Category.create(categoryData);
        req.flash('success', 'Category added successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Add category error:', error);
        req.flash('error', 'Failed to add category: ' + error.message);
        res.redirect('/admin/categories/new');
    }
});

// Edit category form
router.get('/categories/:id/edit', async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) {
            req.flash('error', 'Category not found');
            return res.redirect('/admin/categories');
        }
        
        res.render('admin/categories/form', {
            title: 'Edit Category',
            category,
            path: req.path
        });
    } catch (error) {
        console.error('Edit category form error:', error);
        req.flash('error', 'Failed to load category');
        res.redirect('/admin/categories');
    }
});

// Update category
router.put('/categories/:id', async (req, res) => {
    try {
        const categoryData = {
            name: req.body.name,
            description: req.body.description,
            isActive: req.body.isActive === 'on'
        };

        await Category.findByIdAndUpdate(req.params.id, categoryData);
        req.flash('success', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Update category error:', error);
        req.flash('error', 'Failed to update category: ' + error.message);
        res.redirect(`/admin/categories/${req.params.id}/edit`);
    }
});

// Delete category
router.delete('/categories/:id', async (req, res) => {
    try {
        // Check if category has products
        const productCount = await Product.countDocuments({ category: req.params.id });
        if (productCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete category that has products'
            });
        }

        const result = await Category.findByIdAndDelete(req.params.id);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Category not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Category deleted successfully'
        });
    } catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to delete category'
        });
    }
});

// Error handling middleware for multer
router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        req.flash('error', `Upload error: ${err.message}`);
        return res.redirect('back');
    } else if (err) {
        req.flash('error', err.message);
        return res.redirect('back');
    }
    next();
});

module.exports = router; 