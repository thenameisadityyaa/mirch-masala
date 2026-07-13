# Mirch Masala

A modern, full-stack restaurant web application for **The New Mirch Masala**, Gunupur, Odisha — built as a MERN stack project to modernize their digital presence.

## Features

- **Full Menu** — 42+ dishes across 8 categories with veg/non-veg indicators
- **Online Ordering** — Place orders directly from the menu
- **Live Order Tracking** — Real-time order status updates
- **User Authentication** — Secure register/login with JWT
- **Order History Dashboard** — View all past orders per user
- **Responsive Design** — Fully mobile-first, works on all screen sizes
- **Smooth Scrolling** — Powered by Lenis for a premium feel

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React (Vite), Framer Motion, Lenis  |
| Backend   | Node.js, Express.js                 |
| Auth      | JSON Web Tokens (JWT), bcrypt       |
| Database  | In-memory (MongoDB-ready)           |
| Styling   | Vanilla CSS (mobile-first)          |

## Project Structure

```
mirch-masala/
├── frontend/          # React + Vite app
│   └── src/
│       ├── components/   # Navbar, Home, Auth, Dashboard, Tracker, FAQ, Footer, Testimonials
│       ├── data/         # menuItems.js — full menu data
│       └── App.jsx       # Root with Lenis + routing
└── backend/           # Express REST API
    └── server.js      # Auth + Order endpoints
```

## Getting Started

### Backend
```bash
cd backend
npm install
node server.js
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The app runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Environment Variables

Create a `.env` file in `backend/`:
```
JWT_SECRET=your_secret_key_here
PORT=5000
```

## License

MIT
