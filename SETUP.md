# Zemenay Frontend-Backend Integration Setup

This guide will help you connect your Next.js frontend with your NestJS backend.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Step 1: Environment Setup

### Backend Environment
Create a `.env` file in the `zemenay_back` directory:

```bash
# Backend Environment Variables
PORT=3001
FRONTEND_URL=http://localhost:3000

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Supabase Configuration
SUPABASE_URL=https://hhaqtqlhiihlicadimkc.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### Frontend Environment
Create a `.env.local` file in the `zemenay_front` directory:

```bash
# Frontend Environment Variables
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001

# Supabase Configuration (if still needed for some features)
NEXT_PUBLIC_SUPABASE_URL=https://hhaqtqlhiihlicadimkc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoYXF0cWxoaWlobGljYWRpbWtjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1NTY2NjUsImV4cCI6MjA3MDEzMjY2NX0.WpXROJQSDKxyzRilyUbmUnlSLxzW9orQn4Nllk3t3Hw
```

## Step 2: Install Dependencies

### Backend
```bash
cd zemenay_back
npm install
```

### Frontend
```bash
cd zemenay_front
npm install
```

## Step 3: Supabase Setup

1. **Get your Supabase credentials**:
   - Go to your Supabase project dashboard
   - Navigate to Settings > API
   - Copy your Project URL and anon key
   - For the service role key, copy it from the same page (keep this secret!)

2. **Update environment files**:
   - Replace `your-service-role-key-here` in the backend `.env` file with your actual service role key
   - Make sure the Supabase URL and anon key match your project

3. **Verify your tables exist**:
   - Make sure you have the following tables in your Supabase database:
     - `users`
     - `posts`
     - `tags`
     - `post_tags` (if you want to link posts and tags)

## Step 4: Start the Applications

### Terminal 1 - Backend
```bash
cd zemenay_back
npm run start:dev
```

The backend will start on `http://localhost:3001`

### Terminal 2 - Frontend
```bash
cd zemenay_front
npm run dev
```

The frontend will start on `http://localhost:3000`

## Step 5: Verify Integration

1. **Backend API**: Visit `http://localhost:3001/api` to see the Swagger documentation
2. **Frontend**: Visit `http://localhost:3000` to see your application
3. **Test API**: Try creating a post through the frontend admin panel

## Troubleshooting

### Common Issues

1. **CORS Errors**: Make sure the backend CORS configuration includes `http://localhost:3000`
2. **Port Conflicts**: The backend runs on port 3001, frontend on 3000
3. **Database Connection**: Ensure your database is running and accessible
4. **Environment Variables**: Make sure all environment variables are set correctly

### Debug Steps

1. Check browser console for frontend errors
2. Check terminal for backend errors
3. Verify API endpoints are working using the Swagger docs
4. Test Supabase connection by checking the backend logs
5. Verify your Supabase credentials are correct

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile

### Posts
- `GET /posts` - Get all posts
- `GET /posts/:id` - Get post by ID
- `GET /posts/slug/:slug` - Get post by slug
- `POST /posts` - Create new post
- `PUT /posts/:id` - Update post
- `DELETE /posts/:id` - Delete post

### Tags
- `GET /tags` - Get all tags
- `POST /tags` - Create new tag
- `PUT /tags/:id` - Update tag
- `DELETE /tags/:id` - Delete tag

## Next Steps

1. Implement user authentication in the frontend
2. Add proper error handling
3. Implement the post-tag relationship
4. Add image upload functionality
5. Implement search and filtering

## VS Code Integration

To work efficiently with both projects in VS Code:

1. Open the root folder in VS Code
2. Use the integrated terminal to run both applications
3. Set up debugging configurations for both frontend and backend
4. Use the built-in Git features for version control 