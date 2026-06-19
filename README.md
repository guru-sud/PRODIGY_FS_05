# Social Media Platform 🌐

A full-stack social media web application built with Node.js, Express, and MongoDB.

**TrackCode:** FS | Task 05 | Prodigy InfoTech

## Features
- ✅ User Registration & Login (JWT Authentication)
- ✅ Create Posts with images and tags
- ✅ Like posts
- ✅ Comment on posts
- ✅ Delete your own posts
- ✅ Protected routes (auth middleware)
- ✅ Password hashing with bcryptjs

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- EJS (templating)
- JWT (authentication)
- Multer (image uploads)
- bcryptjs (password hashing)

## How to Run
```bash
npm install
node server.js
```
Open http://localhost:3000

## Environment Variables (.env)
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/social_media
JWT_SECRET=your_secret_key
```