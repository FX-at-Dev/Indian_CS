# Indian Civic Sense 🚦

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.19+-brightgreen.svg)](https://www.mongodb.com/)

A crowdsourced civic issue reporting and resolution system developed as part of Smart India Hackathon (SIH). This platform empowers citizens to report civic problems like potholes, broken streetlights, and other infrastructure issues with photo evidence and GPS location, while enabling government officials to track and resolve these issues efficiently.

## 🌟 Features

### For Citizens
- **📍 Location-Based Reporting**: Pin exact locations on an interactive map using Leaflet.js
- **📷 Photo Evidence**: Upload images to document civic issues
- **🏆 Community Leaderboard**: Earn recognition for contributing to civic improvements
- **📊 Issue Gallery**: Browse all reported issues with filtering options
- **🔔 Real-time Updates**: Get instant notifications when issues are resolved (via Socket.io)
- **🔐 Anonymous or Authenticated Reporting**: Report issues with or without login

### For Government Officials
- **✅ Issue Resolution Tracking**: Mark issues as resolved with proof photos and notes
- **📈 KPI Dashboard**: View statistics on resolved vs active issues by city
- **👥 Role-Based Access**: Separate interfaces for citizens, government officials, and admins
- **🗺️ Geographic Analysis**: Track issues by city and location

### Technical Features
- **Real-time Communication**: WebSocket integration for live updates
- **RESTful API**: Well-structured backend with Express.js
- **MongoDB Integration**: Modern NoSQL database with migration support from MySQL
- **JWT Authentication**: Secure token-based authentication system
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (v8.0 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/FX-at-Dev/Indian_CS.git
cd Indian_CS
```

2. **Install frontend dependencies**
```bash
npm install
```

3. **Install backend dependencies**
```bash
cd backend
npm install
```

4. **Set up environment variables**

Create a `.env` file in the `backend` directory:

```env
PORT=10000
MONGO_URI=mongodb://127.0.0.1:27017/civic_db
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
```

5. **Start MongoDB**

Make sure MongoDB is running on your system:
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

6. **Start the backend server**
```bash
cd backend
npm start
```

For development with auto-reload:
```bash
npm run dev
```

7. **Open the frontend**

Open [index.html](index.html) in your browser or use a local server:
```bash
# Using Python
python -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080
```

Visit `http://localhost:8080` in your browser.

If you are using the deployed site, open [https://indiancs.netlify.app/](https://indiancs.netlify.app/) and make sure the backend is reachable at [https://indian-cs.onrender.com](https://indian-cs.onrender.com).

## 📖 Usage

### Reporting a Civic Issue

1. Navigate to the **Report** page or click "Report a Civic Issue" on the homepage
2. Click on the map to select the exact location
3. Fill in the form with:
   - Title (e.g., "Deep pothole near Sector 18")
   - Description with details
   - Severity level (Low, Medium, Severe)
   - City name
   - Upload a photo (optional but recommended)
4. Submit the report

### Viewing Reports

- Visit the **Gallery** page to see all reported issues
- Click on any report card to view full details including the map location
- Filter by city or severity if needed

### Leaderboard

- Check the **Leaderboard** page to see top contributors
- Points are awarded based on report activity and issue resolution

### For Government Officials

1. Register an account with government credentials
2. Log in to access admin features
3. View issues and mark them as "Closed" with:
   - Resolution photo (proof of work completed)
   - Resolution notes
4. Access the KPI dashboard at `/api/reports/kpis` to view statistics

## 🏗️ Project Structure

```
Indian_CS/
├── index.html              # Homepage
├── upload.html             # Report submission page
├── gallery.html            # View all reports
├── leaderboard.html        # Community leaderboard
├── login.html              # Authentication
├── register.html           # User registration
├── contact.html            # Contact page
├── assets/
│   ├── css/
│   │   └── style.css       # Application styles
│   ├── js/
│   │   ├── app.js          # Frontend logic
│   │   └── leaderboard.js  # Leaderboard functionality
│   └── image/              # Static images
└── backend/
    ├── server.js           # Express server entry point
    ├── controllers/
    │   └── auth.controller.js
    ├── models/
    │   ├── reportModel.js  # Report data model
    │   └── userModel.js    # User data model
    ├── routes/
    │   ├── auth.routes.js  # Authentication endpoints
    │   ├── report.routes.js # Report CRUD operations
    │   └── leaderboard.js  # Leaderboard endpoints
    ├── middleware/
    │   └── errorHandler.js
    ├── db/
    │   ├── mongo.js        # MongoDB connection
    │   └── pool.js         # Database pool (if needed)
    └── scripts/
        ├── createAdmin.js  # Create admin user
        └── migrate_mysql_to_mongo.js  # Database migration
```

## 🔧 API Endpoints

### Authentication
_Registration is currently not exposed by the backend routes._
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify an existing token

### Reports
- `GET /api/reports` - Fetch all reports
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get single report
- `PATCH /api/reports/:id/close` - Mark report as closed (government/admin only)
- `GET /api/reports/kpis` - Get KPI statistics

### Leaderboard
- `GET /api/leaderboard` - Get leaderboard data

## 🛠️ Database Migration

If you're migrating from MySQL to MongoDB, see the [migration guide](backend/README-migration.md).

Quick migration:
```bash
cd backend
npm run migrate -- --dry-run  # Preview migration
npm run migrate                # Execute migration
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and structure
- Write clear commit messages
- Test your changes thoroughly before submitting
- Update documentation for any new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Maintainers

- **FX-at-Dev** - Project Lead & Core Developer

## 🆘 Support

If you encounter any issues or have questions:

1. Check the existing [issues](https://github.com/FX-at-Dev/Indian_CS/issues)
2. Create a new issue with:
   - Clear description of the problem
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

## 🙏 Acknowledgments

- Developed for **Smart India Hackathon (SIH)**
- Problem Statement: Crowdsourced Civic Issue Reporting and Resolution System
- Built with [Leaflet.js](https://leafletjs.com/) for interactive maps
- Powered by [MongoDB](https://www.mongodb.com/), [Express.js](https://expressjs.com/), and [Socket.io](https://socket.io/)

---

**Made with ❤️ for better civic infrastructure in India**
