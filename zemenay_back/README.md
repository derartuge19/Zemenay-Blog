# Zemenay Backend

Backend service for Zemenay blog application built with NestJS and Supabase.

## Features

- 🔐 JWT Authentication
- 👥 User Management
- 🚀 RESTful API
- 📝 Swagger Documentation
- 🔄 Database operations using `apply` pattern
- 🔒 Role-based Access Control

## Prerequisites

- Node.js (v18 or later)
- npm (v9 or later)
- Supabase account

## Setup

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd zemenay_back
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```

4. Update the following environment variables in `.env`:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=1d
   
   # App
   PORT=3000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

## Database Setup

1. Create the following tables in your Supabase database:

   ```sql
   -- Users table
   create table users (
     id uuid references auth.users on delete cascade not null primary key,
     email text unique not null,
     name text,
     role text not null default 'user',
     created_at timestamp with time zone default timezone('utc'::text, now()) not null,
     updated_at timestamp with time zone default timezone('utc'::text, now()) not null
   );
   
   -- Enable Row Level Security
   alter table users enable row level security;
   
   -- Create policies for users table
   create policy "Users can view their own profile"
     on users for select
     using (auth.uid() = id);
   
   create policy "Admins can manage all users"
     on users for all
     using (auth.jwt() ->> 'role' = 'admin');
   ```

2. Set up authentication triggers in Supabase SQL editor:

   ```sql
   -- This trigger automatically creates a user entry when a new user signs up via Supabase Auth.
   create or replace function public.handle_new_user()
   returns trigger as $$
   begin
     insert into public.users (id, email, name, role)
     values (new.id, new.email, new.raw_user_meta_data->>'name', 'user');
     return new;
   end;
   $$ language plpgsql security definer;
   
   -- Trigger the function every time a user is created
   create or replace trigger on_auth_user_created
     after insert on auth.users
     for each row execute procedure public.handle_new_user();
   ```

## Running the App

```bash
# Development
$ npm run start:dev

# Production mode
$ npm run build
$ npm run start:prod
```

## API Documentation

Once the application is running, you can access the Swagger documentation at:

```
http://localhost:3000/api
```

## Authentication

1. Register a new user:
   ```
   POST /auth/register
   {
     "email": "user@example.com",
     "password": "password123",
     "name": "John Doe"
   }
   ```

2. Login:
   ```
   POST /auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

3. Use the returned JWT token in subsequent requests:
   ```
   Authorization: Bearer <token>
   ```

## Project Structure

```
src/
├── auth/                  # Authentication logic
│   ├── decorators/        # Custom decorators
│   ├── guards/            # Authentication guards
│   ├── strategies/        # Passport strategies
│   ├── auth.controller.ts # Auth endpoints
│   └── auth.service.ts    # Auth business logic
├── users/                 # User management
│   ├── dto/               # Data transfer objects
│   ├── users.controller.ts
│   └── users.service.ts
├── database/              # Database module
│   ├── database.module.ts
│   └── database.service.ts
├── app.module.ts          # Root module
└── main.ts                # Application entry point
```

## Testing

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

## License

This project is licensed under the MIT License.
