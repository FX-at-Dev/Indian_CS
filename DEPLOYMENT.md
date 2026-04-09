# Deployment Guide

## Overview
This application has two parts:
- **Frontend**: Static HTML/CSS/JS files (deployed on Netlify)
- **Backend**: Express.js + MongoDB server (needs separate hosting)

---

## 🚀 Frontend Deployment (Netlify)

### Option 1: Deploy via GitHub
1. Push your code to GitHub
2. Go to [Netlify](https://app.netlify.com/)
3. Click "Add new site" → "Import an existing project"
4. Connect your GitHub repository
5. Configure build settings:
   - **Build command**: (leave empty)
   - **Publish directory**: `.` (root directory)
6. Click "Deploy site"

### Option 2: Deploy via Netlify CLI
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy from project root
netlify deploy --prod
```

### Option 3: Drag & Drop
1. Go to [Netlify](https://app.netlify.com/)
2. Drag your project folder (excluding `backend` folder)
3. Site will be deployed instantly

---

## 🖥️ Backend Deployment Options

Your backend needs to be hosted on a platform that supports Node.js servers:

### Recommended: Render.com (Free tier available)
1. Go to [Render.com](https://render.com/)
2. Create a new Web Service
3. Connect your GitHub repository
4. Configure:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add your MongoDB connection string and other env vars
5. Deploy

### Alternative: Railway.app (Free tier available)
1. Go to [Railway.app](https://railway.app/)
2. Create new project from GitHub repo
3. Add environment variables
4. Deploy automatically

### Alternative: Heroku
1. Install Heroku CLI
2. Run from backend folder:
```bash
cd backend
heroku login
heroku create your-app-name
git subtree push --prefix backend heroku main
```

---

## ⚙️ Configuration After Deployment

### 1. Update API Redirect Target
After deploying your backend, keep frontend API calls on `/api` and update redirect targets:

**File: `netlify.toml`** (line 11)
```toml
to = "https://indian-cs.onrender.com/api/:splat"
```

**File: `_redirects`** (line 5)
```
/api/*  https://indian-cs.onrender.com/api/:splat  200
```

**File: `assets/js/config.js`**
```javascript
window.APP_CONFIG = {
   API_BASE: window.location.hostname === "localhost"
      ? "http://localhost:10000/api"
      : "/api",
};
```

In production, `/api` will be routed by Netlify to your backend using `netlify.toml` or `_redirects`.

### 2. Update CORS Origins in Backend .env
Set frontend origins in `backend/.env`:
```javascript
CORS_ORIGINS="https://indiancs.netlify.app,http://localhost:8080"
```

### 3. Set Environment Variables
Use `backend/.env.example` as the source of truth, then add matching values on your backend hosting platform:
- `MONGODB_URI` or `MONGO_URI`
- `JWT_SECRET`
- `PORT` (usually set automatically)
- `CORS_ORIGINS`
- Any other variables from your `.env` file

---

## 📝 Important Notes

1. **Don't commit `.env` files** - Add them to `.gitignore`
2. **MongoDB Atlas** - Make sure your MongoDB connection allows connections from anywhere (0.0.0.0/0) or add your hosting provider's IPs
3. **Update API calls** - Make sure all frontend API calls use the config.js file
4. **Test locally first** - Ensure everything works before deploying

---

## 🔍 Troubleshooting

### Frontend can't reach backend
- Check CORS settings in backend
- Verify backend URL in `netlify.toml` and `_redirects`
- Check browser console for errors

### Backend deployment fails
- Verify all dependencies are in `package.json`
- Check environment variables are set
- Review deployment logs

### Database connection errors
- Whitelist hosting provider IPs in MongoDB Atlas
- Verify MongoDB connection string is correct
- Check network access settings in MongoDB Atlas

---

## 📧 Support
For issues, check deployment logs on your hosting platforms.
