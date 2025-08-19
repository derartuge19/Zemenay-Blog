# 🚀 Quick Start Guide - Zemenay Blog with Authentication

## ✅ What We've Built

1. **Landing Page** (`/`) - Clean homepage with login/signup buttons
2. **Login Page** (`/login`) - Beautiful login form with demo credentials
3. **Signup Page** (`/signup`) - User registration form
4. **Admin Dashboard** (`/admin`) - Protected admin area with role checking
5. **Authentication System** - JWT-based auth with role management

## 🎯 How It Works

### **For Visitors:**
- Visit the homepage → See "Login" and "Sign Up" buttons
- Click "View Blog" to see public blog posts
- Can't access admin features without login

### **For Users:**
- Sign up for an account
- Login with credentials
- If admin role → Access admin dashboard
- If regular user → Limited access

### **For Admins:**
- Login with admin credentials
- Access full admin dashboard
- Create, edit, and manage posts
- Manage users and settings

## 🔧 Setup Steps

### **1. Environment Files**

**Backend** (`zemenay_back/.env`):
```bash
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
SUPABASE_URL=https://hhaqtqlhiihlicadimkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here
CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`zemenay_front/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

### **2. Start Applications**

```bash
# Terminal 1 - Backend
cd zemenay_back
npm run start:dev

# Terminal 2 - Frontend
cd zemenay_front
npm run dev
```

### **3. Test the Setup**

```bash
# Test backend connection and create admin user
node test-backend.js
```

### **4. Access the Application**

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Signup**: http://localhost:3000/signup
- **Admin**: http://localhost:3000/admin

## 👤 Demo Credentials

**Admin User:**
- Email: `admin@example.com`
- Password: `password123`

## 🔐 Authentication Flow

1. **User visits homepage** → Sees login/signup buttons
2. **User clicks login** → Redirected to `/login`
3. **User enters credentials** → Backend validates and returns JWT
4. **If admin role** → Redirected to `/admin` dashboard
5. **If regular user** → Limited access (can be customized)

## 🛡️ Security Features

- **JWT Authentication** - Secure token-based auth
- **Role-based Access** - Admin vs regular user permissions
- **Protected Routes** - Admin dashboard requires authentication
- **Automatic Redirects** - Unauthenticated users redirected to login

## 🎨 UI Features

- **Consistent Theme** - Emerald green color scheme throughout
- **Responsive Design** - Works on mobile and desktop
- **Loading States** - Smooth loading animations
- **Error Handling** - User-friendly error messages
- **Toast Notifications** - Success/error feedback

## 🚀 Next Steps

1. **Create your environment files** (see above)
2. **Start both applications**
3. **Test the backend connection**
4. **Try logging in with demo credentials**
5. **Create your first blog post!**

## 🔧 Troubleshooting

**"Login failed" error:**
- Check that backend is running on port 3001
- Verify environment variables are set correctly
- Check browser console for detailed errors

**"Access Denied" in admin:**
- User doesn't have admin role
- Create admin user or update user role in database

**Environment variable issues:**
- Make sure `.env.local` file exists in frontend
- Restart frontend after creating environment file

## 📞 Need Help?

1. Check browser console for errors
2. Check backend terminal for server errors
3. Verify all environment variables are set
4. Make sure both applications are running

---

**🎉 You're all set! The authentication system is now working with a clean, professional UI.** 