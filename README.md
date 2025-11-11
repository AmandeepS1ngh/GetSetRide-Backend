# GetSetRide Backend API

Backend authentication API for the GetSetRide car rental platform using Node.js, Express, and MongoDB.

## Features

- ✅ User registration and authentication
- ✅ JWT-based authorization
- ✅ Password hashing with bcrypt
- ✅ MongoDB integration
- ✅ Input validation
- ✅ Error handling middleware
- ✅ CORS enabled for frontend

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication tokens
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

## Setup Instructions

### 1. Install MongoDB

**macOS (using Homebrew):**
```bash
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community
```

**Or use MongoDB Atlas (Cloud):**
- Sign up at [mongodb.com/atlas](https://www.mongodb.com/atlas)
- Create a free cluster
- Get your connection string

### 2. Install Dependencies

```bash
cd backend
npm install
```

### 3. Environment Variables

The `.env` file is already created with default values. Update if needed:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/getsetride
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-12345
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

**For MongoDB Atlas, update MONGODB_URI:**
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/getsetride
```

### 4. Run the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

#### 1. Register User
```
POST /api/auth/signup
Content-Type: application/json

{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "confirmPassword": "password123"
}

Response:
{
  "success": true,
  "message": "User registered successfully",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "joinDate": "2025-11-07T..."
  }
}
```

#### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123",
  "rememberMe": true
}

Response:
{
  "success": true,
  "message": "Login successful",
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "joinDate": "2025-11-07T..."
  }
}
```

#### 3. Get Current User
```
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "success": true,
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "phone": null,
    "profileImage": "",
    "joinDate": "2025-11-07T..."
  }
}
```

#### 4. Logout User
```
POST /api/auth/logout
Authorization: Bearer <token>

Response:
{
  "success": true,
  "message": "Logged out successfully"
}
```

#### 5. Health Check
```
GET /health

Response:
{
  "status": "OK",
  "message": "Server is running"
}
```

## Testing with cURL

### Register a new user:
```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "confirmPassword": "password123"
  }'
```

### Login:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Get current user (replace TOKEN with actual token):
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer TOKEN"
```

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── database.js       # MongoDB connection
│   │   └── index.js          # Configuration settings
│   ├── controllers/
│   │   └── authController.js # Authentication logic
│   ├── middleware/
│   │   ├── auth.js           # JWT authentication
│   │   ├── errorHandler.js   # Global error handler
│   │   └── validation.js     # Input validation
│   ├── models/
│   │   └── User.js           # User schema
│   ├── routes/
│   │   └── auth.js           # Auth routes
│   ├── app.js                # Express app setup
│   └── server.js             # Server entry point
├── .env                      # Environment variables
├── .gitignore
└── package.json
```

## User Schema

```javascript
{
  fullName: String,
  email: String (unique),
  password: String (hashed),
  role: String (user/host/admin),
  phone: String,
  isVerified: Boolean,
  profileImage: String,
  joinDate: Date,
  timestamps: true
}
```

## Security Features

- Passwords are hashed using bcrypt
- JWT tokens for secure authentication
- Input validation on all endpoints
- Protected routes require valid JWT token
- CORS enabled for specific frontend origin
- Environment variables for sensitive data

## Error Handling

All errors return a consistent format:
```json
{
  "success": false,
  "message": "Error description"
}
```

Common error codes:
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

## Next Steps

To extend the backend, you can add:
- Password reset functionality
- Email verification
- User profile management
- Car listings CRUD operations
- Booking system
- Image upload
- Payment integration

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `brew services list`
- Check connection string in `.env`
- For Atlas, ensure IP whitelist is configured

### Port Already in Use
- Change `PORT` in `.env`
- Or kill the process: `lsof -ti:5000 | xargs kill -9`

### CORS Errors
- Verify `FRONTEND_URL` in `.env` matches your frontend URL
- Check browser console for specific CORS error

## License

ISC
