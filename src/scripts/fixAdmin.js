require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const fixAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Delete existing admin
        await User.deleteOne({ email: 'admin@example.com' });
        console.log('Deleted existing admin user');

        // Create new admin user with correct properties
        const adminUser = new User({
            email: 'admin@example.com',
            password: 'admin123',
            name: 'Admin',
            isAdmin: true,
            isActive: true
        });

        await adminUser.save();
        console.log('Created new admin user with correct properties');

        // Verify the new admin user
        const verifyAdmin = await User.findOne({ email: 'admin@example.com' });
        console.log('Verified admin user:', {
            email: verifyAdmin.email,
            name: verifyAdmin.name,
            isAdmin: verifyAdmin.isAdmin,
            isActive: verifyAdmin.isActive
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
};

fixAdmin(); 