require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const checkAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const adminUser = await User.findOne({ email: 'admin@example.com' });
        if (adminUser) {
            console.log('Admin user found:');
            console.log({
                email: adminUser.email,
                name: adminUser.name,
                isAdmin: adminUser.isAdmin,
                isActive: adminUser.isActive
            });
        } else {
            console.log('Admin user not found');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkAdmin(); 