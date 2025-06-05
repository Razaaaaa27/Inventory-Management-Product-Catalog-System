const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');

// Home page
router.get('/', async (req, res) => {
    try {
        // Get featured products
        const featuredProducts = await Product.find({ isActive: true })
            .populate('category')
            .sort({ createdAt: -1 })
            .limit(6);

        res.render('home', {
            title: 'Welcome',
            featuredProducts
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.render('home', {
            title: 'Welcome',
            featuredProducts: []
        });
    }
});

// Product catalog
router.get('/products', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 12;
    const skip = (page - 1) * limit;

    // Build query
    const query = { isActive: true };
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Get sort option
    let sortOption = {};
    switch (req.query.sort) {
      case 'price-asc':
        sortOption = { price: 1 };
        break;
      case 'price-desc':
        sortOption = { price: -1 };
        break;
      case 'name-asc':
        sortOption = { name: 1 };
        break;
      default:
        sortOption = { createdAt: -1 }; // newest first
        break;
    }

    // Get category if specified
    let selectedCategory = null;
    if (req.query.category) {
      selectedCategory = await Category.findById(req.query.category);
      if (!selectedCategory) {
        return res.redirect('/products');
      }
    }

    // Get products
    const products = await Product.find(query)
      .populate('category')
      .skip(skip)
      .limit(limit)
      .sort(sortOption);

    const total = await Product.countDocuments(query);
    const totalPages = Math.ceil(total / limit);

    // Get all categories
    const categories = await Category.find({ isActive: true });

    res.render('public/products', {
      title: selectedCategory ? selectedCategory.name : 'Product Catalog',
      products,
      categories,
      category: selectedCategory,
      currentPage: page,
      totalPages,
      sort: req.query.sort || 'newest',
      query: req.query
    });
  } catch (error) {
    console.error('Products page error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Single product page
router.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category');

    if (!product || !product.isActive) {
      return res.status(404).render('404', {
        title: '404 - Product Not Found',
        query: req.query
      });
    }

    const relatedProducts = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true
    })
    .limit(4);

    const categories = await Category.find({ isActive: true });

    res.render('public/product-detail', {
      title: product.name,
      product,
      relatedProducts,
      categories,
      query: req.query
    });
  } catch (error) {
    console.error('Product detail error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Category page
router.get('/category/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ 
      slug: req.params.slug,
      isActive: true
    });

    if (!category) {
      return res.status(404).render('404', {
        title: '404 - Category Not Found',
        query: req.query
      });
    }

    const products = await Product.find({
      category: category._id,
      isActive: true
    }).populate('category');

    const categories = await Category.find({ isActive: true });

    res.render('public/category', {
      title: category.name,
      category,
      products,
      categories,
      query: req.query
    });
  } catch (error) {
    console.error('Category page error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Search products
router.get('/search', async (req, res) => {
  try {
    const searchQuery = req.query.q;
    if (!searchQuery) {
      return res.redirect('/products');
    }

    const query = {
      isActive: true,
      $or: [
        { name: { $regex: searchQuery, $options: 'i' } },
        { description: { $regex: searchQuery, $options: 'i' } }
      ]
    };

    if (req.query.category) {
      query.category = req.query.category;
    }

    const products = await Product.find(query).populate('category');
    const categories = await Category.find({ isActive: true });

    res.render('public/search', {
      title: `Search Results for "${searchQuery}"`,
      products,
      categories,
      searchQuery,
      query: req.query
    });
  } catch (error) {
    console.error('Search error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

// Categories page
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    
    res.render('public/categories', {
      title: 'Categories',
      categories,
      query: req.query
    });
  } catch (error) {
    console.error('Categories page error:', error);
    res.render('error', { 
      title: 'Error',
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error : {}
    });
  }
});

module.exports = router; 