const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function(passport) {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password'
    }, async (email, password, done) => {
        try {
            // Find user by email
            const user = await User.findOne({ email: email.toLowerCase() });
            
            // Check if user exists
            if (!user) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Check if user is active
            if (!user.isActive) {
                return done(null, false, { message: 'Your account has been deactivated' });
            }

            // Validate password
            const isMatch = await user.validatePassword(password);
            if (!isMatch) {
                return done(null, false, { message: 'Invalid email or password' });
            }

            // Log successful login
            console.log('User logged in:', {
                id: user._id,
                email: user.email,
                isAdmin: user.isAdmin
            });

            return done(null, user);
        } catch (error) {
            console.error('Login error:', error);
            return done(error);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
}; 