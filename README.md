# Link Presentasi  : https://youtu.be/t3B6lbqkaBs
# Link PPT  : https://drive.google.com/file/d/1I_dlJe1MnFhjT8VoFvCXYvhAzpSHqyX2/view?usp=sharing

# Inventory Management System

A comprehensive web application for inventory management with public product catalog and admin dashboard.

## Features

### Public Area
- Product catalog viewing
- Landing page with featured products
- Responsive design for all devices

### Admin Dashboard
- Secure authentication system
- Complete CRUD operations for inventory
- Stock management
- Product categories management

## Technology Stack

- **Backend**: Express.js (Node.js)
- **Database**: MongoDB Atlas
- **Template Engine**: EJS
- **Authentication**: JWT & Session based
- **Frontend**: HTML5, CSS3, JavaScript
- **CSS Framework**: Bootstrap 5

## Installation Guide

### Prerequisites
1. Node.js (v14 or higher)
2. MongoDB Atlas account
3. Git

### Setup Steps

1. Clone the repository:
```bash
git clone [repository-url]
cd inventory-management-system
```

2. Install dependencies:
```bash
npm install
```

3. Environment Setup:
   - Create a `.env` file in the root directory
   - Add the following configurations:
```env
PORT=3000
MONGODB_URI=your_mongodb_atlas_uri
JWT_SECRET=your_jwt_secret
SESSION_SECRET=your_session_secret
```

4. MongoDB Atlas Setup:
   - Create a MongoDB Atlas account at https://www.mongodb.com/cloud/atlas
   - Create a new cluster
   - Get your connection string from MongoDB Atlas
   - Replace `your_mongodb_atlas_uri` in `.env` with your connection string
   - Make sure to replace `<password>` in the connection string with your database user password

5. Start the application:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## Usage Guide

### Public Access
- Visit `http://localhost:3000` to access the public area
- Browse products in the catalog
- View product details

### Admin Access
- Visit `http://localhost:3000/admin` to access the admin login
- Default admin credentials:
  - Email: admin@example.com
  - Password: admin123
  (Change these credentials after first login)

### Admin Features
1. Product Management
   - Add new products
   - Update existing products
   - Delete products
   - Manage stock levels

2. Category Management
   - Create product categories
   - Edit categories
   - Delete categories

## Project Structure
```
inventory-management-system/
├── src/
│   ├── app.js              # Application entry point
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Custom middleware
│   ├── models/            # Database models
│   ├── routes/            # Route definitions
│   └── views/             # EJS templates
├── public/                # Static files
├── .env                   # Environment variables
├── package.json           # Project dependencies
└── README.md             # Project documentation
```

## Security Features
- JWT-based authentication
- Session management
- Password hashing
- Protected admin routes
- CORS protection
- Input validation

## Contributing
[Your contribution guidelines here]

## License
[Your license information here] 


