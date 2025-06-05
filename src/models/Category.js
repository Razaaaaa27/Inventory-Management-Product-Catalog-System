const mongoose = require('mongoose');
const slugify = require('slugify');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate slug before saving
categorySchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.slug = slugify(this.name, {
      lower: true,
      strict: true
    });
  }
  next();
});

// Update slug when name is updated
categorySchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate();
  if (update.name) {
    update.slug = slugify(update.name, {
      lower: true,
      strict: true
    });
  }
  next();
});

// Add index for better search performance
categorySchema.index({ name: 'text' });

module.exports = mongoose.model('Category', categorySchema); 