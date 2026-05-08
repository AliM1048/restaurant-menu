# 🍽️ Resto Menu

A full-stack restaurant menu application built for a modern dining experience.

The project includes:
- **Frontend:** React + Vite user interface for browsing menu items, filtering by category, adding items to cart, viewing specials, and checking out.
- **Backend:** Node.js + Express API with MongoDB for menu data, categories, reviews, admin authentication, and secure CRUD operations.

---

## Key Features

- Responsive menu browsing with category filters and search
- Dish detail modal with flavor profile and allergen badges
- Animated UI using Framer Motion and custom particle background
- Shopping cart drawer with QR order sharing and PDF receipt
- Customer reviews and review submission
- JWT-secured admin panel for menu management
- Security middleware: Helmet, CORS, rate limiting, and request sanitization

---

## Technology Stack

- Frontend: React, Vite, React Router, Framer Motion, Axios
- Backend: Node.js, Express, MongoDB, jsonwebtoken, bcryptjs
- Other: Helmet, CORS, express-rate-limit, multer, GridFS storage

---

## Repository Layout

```
resto_menu/
├── backend/             # API server and database seed scripts
│   ├── db/              # MongoDB connection helper
│   ├── middleware/      # auth and security middleware
│   ├── routes/          # API route handlers
│   └── seed/            # sample data loader
├── frontend/            # React/Vite user interface
│   ├── public/
│   ├── src/
│   └── vite.config.js
├── README.md            # project overview and setup instructions
└── package.json         # optional root package metadata
```

---

## Prerequisites

- Node.js v18 or later
- MongoDB running locally or accessible via connection string

---

## Setup Instructions

### 1. Backend

```bash
cd backend
npm install
npm run seed
npm start
```

The backend server starts on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend app runs on `http://localhost:5173` by default.

---

## Environment Variables

Create a `.env` file inside `backend/` with the following values:

```env
MONGODB_URI=mongodb://localhost:27017/resto-menu
JWT_SECRET=your_jwt_secret_here
PORT=5000
```

Update the values as needed for your environment.

---

## Admin Access

Open the admin login page at:

`http://localhost:5173/admin/login`

Default credentials used by the app seed data:

- Username: `admin`
- Password: `admin123`

> If your backend seed or auth logic differs, update credentials accordingly.

---

## Running the Project on GitHub

1. Commit all files to your repository.
2. Push to GitHub using your preferred branch.
3. Add a clear project description and tags in the repository settings.
4. Optionally enable GitHub Pages or Vercel for frontend deployment.

---

## Useful Commands

### Backend
- `npm install`
- `npm run seed`
- `npm start`

### Frontend
- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

---

## Notes

- The frontend and backend are separate projects, so install dependencies in both folders.
- Use the backend `.env` file to configure database and JWT secrets.
- Ensure MongoDB is running before starting the backend server.
